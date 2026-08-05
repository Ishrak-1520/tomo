'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

type Session = {
  id: string;
  title: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const deviceId = session?.user?.id;
      
      if (!deviceId) {
        window.location.href = '/login';
        return;
      }

      try {
        const res = await fetch(`/api/history?deviceId=${deviceId}`);
        
        if (!res.ok) {
          console.error("History API returned status", res.status);
          setLoading(false);
          return;
        }

        const data = await res.json();
        
        if (data.sessions) {
          setSessions(data.sessions);
          
          // Trigger summarization for any sessions that don't have one
          data.sessions.forEach((s: Session) => {
            if (!s.summary) {
              fetch('/api/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: s.id })
              }).then(() => {
                // We don't necessarily need to refresh the UI immediately, 
                // it will show next time they visit, but it runs in background.
              }).catch(e => console.error(e));
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch sessions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
      <div style={{ padding: '2rem 2rem 0', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Your History</h1>
      </div>

      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading past conversations...</p>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No past conversations found.</p>
            <p>Once you start chatting with Tomo, your sessions will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessions.map((session) => (
              <div 
                key={session.id}
                style={{
                  padding: '1.5rem',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-main)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                    {new Date(session.created_at).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <Link 
                    href={`/chat#${session.id}`}
                    style={{
                      padding: '0.4rem 1rem',
                      backgroundColor: 'var(--text-main)',
                      color: 'var(--text-inverse)',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 500
                    }}
                  >
                    Resume
                  </Link>
                </div>
                
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {session.summary || 'Session in progress...'}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
