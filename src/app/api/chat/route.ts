import { NextResponse } from 'next/server';
import { runSafetyPipeline } from '@/lib/safety/pipeline';
import { SYSTEM_PROMPT } from '@/lib/llm/persona';
import { generateCompletion, ChatMessage } from '@/lib/llm/client';
import { supabaseAdmin, createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, sessionId, isGenZMode, memoryEnabled } = await req.json();
    const deviceId = user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }
    if (!deviceId || !sessionId) {
      return NextResponse.json({ error: 'deviceId and sessionId are required' }, { status: 400 });
    }

    const latestMessage = messages[messages.length - 1];
    
    if (latestMessage.role !== 'user') {
      return NextResponse.json({ error: 'Latest message must be from user' }, { status: 400 });
    }

    // 1. Ensure Session Exists in DB
    const { data: sessionExists } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', sessionId)
      .single();

    if (!sessionExists) {
      await supabaseAdmin.from('sessions').insert({
        id: sessionId,
        device_id: deviceId,
        title: 'New Conversation',
      });
    }

    // 2. Save User Message to DB
    await supabaseAdmin.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: latestMessage.content,
    });

    // 3. Run Safety Pipeline on the latest user message
    const safetyResult = await runSafetyPipeline(latestMessage.content);

    if (safetyResult.isRisk) {
      const crisisResponse = "I'm so sorry you're feeling this way. I want you to know that your life has value, and you don't have to carry this pain alone. Please, take a moment to reach out to the resources below. There are people who want to listen and support you through this.";
      
      // Save crisis response to DB
      await supabaseAdmin.from('messages').insert({
        session_id: sessionId,
        role: 'assistant',
        content: crisisResponse,
      });

      return NextResponse.json({
        content: crisisResponse,
        showCrisisCard: true,
        safetyResult
      });
    }

    // 4. Prepare messages for LLM
    let finalPrompt = SYSTEM_PROMPT;
    
    // Check if the conversation recently had a crisis response
    const crisisString = "I want you to know that your life has value, and you don't have to carry this pain alone";
    const hadRecentCrisis = messages.some(m => m.role === 'assistant' && m.content.includes(crisisString));
    
    if (hadRecentCrisis) {
      finalPrompt += "\n\nCRITICAL INSTRUCTION FOR THIS TURN: The user recently expressed severe crisis or self-harm thoughts. Even if their latest message minimizes it (e.g., 'im fine', 'nevermind'), YOU MUST NOT brush it off. Do not say 'no problem' or 'take care'. You must say something like 'I hear you, and I'm glad you're still here. It sounds like things are really heavy right now.' Keep the door open for support.";
    }

    // LONG TERM MEMORY INJECTION
    if (memoryEnabled !== false) {
      try {
        const { data: pastSessions } = await supabaseAdmin
          .from('sessions')
          .select('summary')
          .eq('device_id', deviceId)
          .not('summary', 'is', null)
          .neq('id', sessionId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (pastSessions && pastSessions.length > 0) {
          const summariesList = pastSessions.map(s => `- Past session: ${s.summary}`).join('\n');
          finalPrompt += `\n\nLONG-TERM MEMORY CONTEXT:\nThe user has spoken to you before. Here are the summaries of your past conversations with them:\n${summariesList}\nIf the user brings up these topics, you should remember them.`;
        }
      } catch (e) {
        console.error('Failed to fetch memory context', e);
      }
    }

    if (isGenZMode) {
      finalPrompt += "\n\nCRITICAL INSTRUCTION: The user has enabled 'Gen Z Mode'. You must adopt a highly casual, empathetic, and relatable Gen Z persona. Use modern slang naturally (e.g. valid, no cap, fr fr, vibes, bet, lowkey, highkey), keep your formatting very relaxed (mostly lowercase, minimal punctuation), and act like a close internet friend supporting them. Do not sound like a clinical therapist. Sound like a caring friend on Discord.";
    }

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: finalPrompt },
      ...messages
    ];

    // 5. Generate response from the companion persona
    let responseText = await generateCompletion(llmMessages, 0.7);

    // Programmatically strip out any stubborn em-dashes or en-dashes the LLM tries to use
    // \u2012-\u2015 covers figure dash, en dash, em dash, and horizontal bar.
    responseText = responseText.replace(/[\u2012-\u2015]/g, ', ').replace(/--/g, ', ').replace(/ - /g, ', ');

    if (!responseText) {
      throw new Error('LLM failed to generate a response');
    }

    // 6. Save Assistant Message to DB
    await supabaseAdmin.from('messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: responseText,
    });

    return NextResponse.json({
      content: responseText,
      showCrisisCard: false,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
