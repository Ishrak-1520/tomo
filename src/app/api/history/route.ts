import { NextResponse } from 'next/server';
import { supabaseAdmin, createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const deviceId = user.id;
    const sessionId = searchParams.get('sessionId');

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    if (sessionId) {
      // Fetch messages for a specific session
      const { data: messages, error } = await supabaseAdmin
        .from('messages')
        .select('id, role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ messages });
    } else {
      // Fetch all sessions for this device
      const { data: sessions, error } = await supabaseAdmin
        .from('sessions')
        .select('id, title, summary, mood_scores, created_at, updated_at')
        .eq('device_id', deviceId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
