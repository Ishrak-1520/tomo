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

    const { messages, sessionId, isGenZMode, memoryEnabled, sessionMode, chatLanguage } = await req.json();
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
    
    // ONBOARDING CONTEXT INJECTION
    const metadata = user.user_metadata;
    if (metadata && metadata.onboarded) {
      finalPrompt += `\n\n=== USER CONTEXT (FROM ONBOARDING) ===\n`;
      if (metadata.name) finalPrompt += `- Name: ${metadata.name}\n`;
      if (metadata.identity) finalPrompt += `- Pronouns/Identity: ${metadata.identity}\n`;
      if (metadata.dob) {
        const age = new Date().getFullYear() - new Date(metadata.dob).getFullYear();
        finalPrompt += `- Age: ${age}\n`;
      }
      if (metadata.motherTongue) finalPrompt += `- Mother Tongue: ${metadata.motherTongue}\n`;
      if (metadata.mainLanguage) finalPrompt += `- Primary Language: ${metadata.mainLanguage}\n`;
      if (metadata.relationshipStatus) finalPrompt += `- Relationship Vibe: ${metadata.relationshipStatus}\n`;
      if (metadata.supportNeeded) finalPrompt += `- What's on their mind: ${metadata.supportNeeded}\n`;
      if (metadata.reasonForTomo) finalPrompt += `- How you should show up for them: ${metadata.reasonForTomo}\n`;
      if (metadata.faith) finalPrompt += `- Spiritual Grounding: ${metadata.faith}\n`;
      
      finalPrompt += `\nCRITICAL INSTRUCTION: You MUST use the above context to deeply personalize your responses. 
1. Always refer to them by their name occasionally to build intimacy.
2. Respect their pronouns/identity. 
3. Tailor your tone and advice to their age and relationship vibe. 
4. Keep their main struggles and goals in mind when they ask for advice.
5. DO NOT explicitly list out these facts like a robot (e.g. do not say "I know you are single and 25"). Let this context subtly flavor your entire personality and advice.`;

      const languageToUse = chatLanguage || metadata.mainLanguage;
      if (languageToUse) {
        finalPrompt += `\n\nCRITICAL LANGUAGE INSTRUCTION: The user's primary language is ${languageToUse}. You MUST converse with them entirely in ${languageToUse}. Do not default to English unless their primary language is English.`;
      }
    }
    
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

    if (sessionMode === 'guided') {
      finalPrompt += "\n\nCRITICAL SESSION MODE: The user has selected 'GUIDED' mode. Instead of just listening passively, you must take an active, structured approach. Your goal is to guide the user through a gentle reflection exercise. Start by acknowledging their feelings, then ask a single, deep probing question to help them unpack it. Guide them step-by-step. Do not overwhelm them with paragraphs; take it one step at a time.";
    } else {
      finalPrompt += "\n\nCRITICAL SESSION MODE: The user has selected 'CLASSIC' mode. You should act as a quiet, empathetic listener. Focus on validating their feelings, offering gentle support, and creating a safe space for them to yap or vent. Keep your responses thoughtful but unstructured.";
    }

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: finalPrompt },
      ...messages
    ];

    // 5. Generate response from the companion persona
    let responseText = await generateCompletion(llmMessages, 0.7);

    if (!responseText) {
      throw new Error('LLM failed to generate a response');
    }

    // Programmatically strip out any stubborn em-dashes or en-dashes the LLM tries to use
    // \u2012-\u2015 covers figure dash, en dash, em dash, and horizontal bar.
    responseText = responseText.replace(/[\u2012-\u2015]/g, ', ').replace(/--/g, ', ').replace(/ - /g, ', ');

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
