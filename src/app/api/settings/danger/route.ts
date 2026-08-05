import { NextResponse } from 'next/server';
import { supabaseAdmin, createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await req.json();
    const deviceId = user.id;

    if (!deviceId || !action) {
      return NextResponse.json({ error: 'deviceId and action are required' }, { status: 400 });
    }

    if (action === 'forget_memories') {
      // Clear summaries and mood_scores for all sessions of this device
      const { error } = await supabaseAdmin
        .from('sessions')
        .update({ summary: null, mood_scores: null })
        .eq('device_id', deviceId);
        
      if (error) throw error;
      return NextResponse.json({ success: true, message: 'Memories forgotten' });
    } 
    
    if (action === 'reset_history') {
      // Find all sessions for this device
      const { data: sessions } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('device_id', deviceId);
        
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        
        // Delete all messages in these sessions
        const { error: msgsError } = await supabaseAdmin
          .from('messages')
          .delete()
          .in('session_id', sessionIds);
          
        if (msgsError) throw msgsError;
      }
      return NextResponse.json({ success: true, message: 'Chat history reset' });
    }
    
    if (action === 'delete_account') {
      // Delete all sessions for this device
      const { data: sessions } = await supabaseAdmin
        .from('sessions')
        .select('id')
        .eq('device_id', deviceId);
        
      if (sessions && sessions.length > 0) {
        const sessionIds = sessions.map(s => s.id);
        
        // Delete messages first
        await supabaseAdmin
          .from('messages')
          .delete()
          .in('session_id', sessionIds);
          
        // Delete sessions
        const { error } = await supabaseAdmin
          .from('sessions')
          .delete()
          .eq('device_id', deviceId);
          
        if (error) throw error;
      }
      return NextResponse.json({ success: true, message: 'Account deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Danger API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
