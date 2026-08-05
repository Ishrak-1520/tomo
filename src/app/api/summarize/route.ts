import { NextResponse } from 'next/server';
import { supabaseAdmin, createClient } from '@/lib/supabase/server';
import { generateCompletion, ChatMessage } from '@/lib/llm/client';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // 1. Fetch the session and its messages
    const { data: session } = await supabaseAdmin
      .from('sessions')
      .select('id, summary')
      .eq('id', sessionId)
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.summary) {
      // Already summarized
      return NextResponse.json({ summary: session.summary });
    }

    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!messages || messages.length < 3) {
      return NextResponse.json({ message: 'Session too short to summarize' });
    }

    // 2. Ask LLM to summarize and analyze mood
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    
    const prompt = `
You are an AI assistant tasked with analyzing a conversation between a User and a Mental Health Companion (Tomo).
You must output a raw JSON object (do not wrap in markdown tags like \`\`\`json) with exactly this structure:
{
  "summary": "A very brief, empathetic 1-2 sentence recap of what the user discussed. Do not use clinical language. Example: Discussed feeling overwhelmed with final exams and practiced a grounding exercise.",
  "mood_scores": {
    "happiness": <number 0-100>,
    "surprise": <number 0-100>,
    "sadness": <number 0-100>,
    "anger": <number 0-100>,
    "fear": <number 0-100>,
    "disgust": <number 0-100>
  }
}

Analyze the user's emotions throughout the transcript and score each metric out of 100 based on how strongly they expressed it.

Transcript:
${transcript}
`;

    const jsonString = await generateCompletion([{ role: 'system', content: prompt }], 0.3);

    if (!jsonString) {
      throw new Error('Failed to generate summary');
    }

    // Attempt to parse JSON safely
    let parsed;
    try {
      const cleanStr = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanStr);
    } catch (e) {
      console.error("Failed to parse LLM JSON output:", jsonString);
      throw new Error('Failed to parse mood metrics');
    }

    const { summary, mood_scores } = parsed;

    // 3. Save summary and mood scores back to session
    // NOTE: This will fail if the user has not run the SQL script to add mood_scores column
    await supabaseAdmin
      .from('sessions')
      .update({ summary, mood_scores, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    return NextResponse.json({ summary, mood_scores });
  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
