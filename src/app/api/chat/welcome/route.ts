import { NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/llm/persona';
import { generateCompletion, ChatMessage } from '@/lib/llm/client';
import { supabaseAdmin, createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const { searchParams } = new URL(req.url);
    const deviceId = user?.id;
    const sessionId = searchParams.get('sessionId');
    const isGenZMode = searchParams.get('isGenZMode') === 'true';
    const memoryEnabled = searchParams.get('memoryEnabled') !== 'false';

    const defaultGreeting = "hi there. i am tomo. i am here to listen and support you. how are you feeling today?";

    if (!deviceId) {
      return NextResponse.json({ content: defaultGreeting });
    }

    let pastSessions = [];
    if (memoryEnabled) {
      // Fetch past summaries
      const { data } = await supabaseAdmin
        .from('sessions')
        .select('summary, created_at')
        .eq('device_id', deviceId)
        .not('summary', 'is', null)
        .neq('id', sessionId || '')
        .order('created_at', { ascending: false })
        .limit(5);
        
      pastSessions = data || [];
    }

    if (!pastSessions || pastSessions.length === 0) {
      return NextResponse.json({ content: defaultGreeting });
    }

    const summariesList = pastSessions.map((s, i) => `- Past session: ${s.summary}`).join('\n');

    let finalPrompt = SYSTEM_PROMPT;
    if (isGenZMode) {
      finalPrompt += "\n\nCRITICAL INSTRUCTION: The user has enabled 'Gen Z Mode'. You must adopt a highly casual, empathetic, and relatable Gen Z persona. Use modern slang naturally, keep your formatting very relaxed, and act like a close internet friend supporting them.";
    }

    finalPrompt += `\n\nLONG-TERM MEMORY CONTEXT:
The user has spoken to you before. Here are the summaries of your past conversations with them:
${summariesList}

CRITICAL INSTRUCTION FOR THIS TURN: 
You are greeting the user for the very first time in a new chat session today. 
Write a warm, casual greeting (1-2 sentences max). 

IMPORTANT RULES FOR LONG-TERM MEMORY:
1. If the user was dealing with an ongoing stressful situation in their MOST RECENT session (like a challenging boss or work stress), you MUST gently check in on how they are doing with it today.
2. NEVER bring up severe trauma (e.g., suicidal thoughts, self-harm, abuse) from past sessions. Leave those in the past.
3. If there is nothing recent to check in on, just say "Hi! I'm here to listen. How are you feeling today?"`;

    const llmMessages: ChatMessage[] = [
      { role: 'system', content: finalPrompt }
    ];

    let responseText = await generateCompletion(llmMessages, 0.2);
    responseText = responseText.replace(/[\u2012-\u2015]/g, ', ').replace(/--/g, ', ').replace(/ - /g, ', ');

    if (!responseText) {
      return NextResponse.json({ content: defaultGreeting });
    }

    return NextResponse.json({ content: responseText });
  } catch (error) {
    console.error('Welcome API error:', error);
    return NextResponse.json({ content: "hi there. i am tomo. i am here to listen and support you. how are you feeling today?" });
  }
}
