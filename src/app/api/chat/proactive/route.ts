import { NextResponse } from 'next/server';
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

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }
    if (!deviceId || !sessionId) {
      return NextResponse.json({ error: 'deviceId and sessionId are required' }, { status: 400 });
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

    // 2. Prepare messages for LLM
    let finalPrompt = SYSTEM_PROMPT;

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
          finalPrompt += `\n\nLONG-TERM MEMORY CONTEXT:\nThe user has spoken to you before. Here are the summaries of your past conversations with them:\n${summariesList}\nIf you check in on them, you can draw from this context if appropriate.`;
        }
      } catch (e) {
        console.error('Failed to fetch memory context', e);
      }
    }
    
    if (isGenZMode) {
      finalPrompt += "\n\nCRITICAL INSTRUCTION: The user has enabled 'Gen Z Mode'. You must adopt a highly casual, empathetic, and relatable Gen Z persona. Use modern slang naturally, keep your formatting very relaxed, and act like a close internet friend supporting them.";
    }

    // Crucial proactive instruction
    finalPrompt += "\n\nCRITICAL INSTRUCTION FOR THIS TURN: The user has been typing for a long time but hasn't sent anything, or has been deleting their words heavily. They are hesitating. DO NOT mention that they are typing or taking a long time. Just send a very short, extremely gentle and empathetic check-in message (1-2 sentences max). Give them space and let them know you are here. Base the tone on the previous conversation context if any.";

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: finalPrompt },
      ...messages
    ];

    // 3. Generate proactive response
    let responseText = await generateCompletion(llmMessages, 0.7);
    // Apply formatting rules
    responseText = responseText.replace(/[\u2012-\u2015]/g, ', ').replace(/--/g, ', ').replace(/ - /g, ', ');

    if (!responseText) {
      throw new Error('LLM failed to generate a response');
    }

    // 4. Save Proactive Assistant Message to DB
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
    console.error('Proactive API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
