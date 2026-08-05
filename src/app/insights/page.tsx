'use client';

import React, { useEffect, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Timer, Smile } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ convos: 0, messages: 0 });
  const [moodData, setMoodData] = useState<any[]>([]);

  useEffect(() => {
    const fetchInsights = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const storedDeviceId = session?.user?.id;
      
      if (!storedDeviceId) {
        window.location.href = '/login';
        return;
      }

      try {
        const res = await fetch(`/api/history?deviceId=${storedDeviceId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch history');
        }

        const data = await res.json();
        
        if (data.sessions && data.sessions.length > 0) {
          const sessions = data.sessions;
          let totalMessages = 0; // In a real app we'd fetch actual message counts, but we'll approximate 10 per convo for the demo if we can't do a full count query
          let validMoodCount = 0;
          
          const avgMood = {
            happiness: 0,
            surprise: 0,
            sadness: 0,
            anger: 0,
            fear: 0,
            disgust: 0
          };

          sessions.forEach((s: any) => {
            if (s.mood_scores) {
              validMoodCount++;
              avgMood.happiness += s.mood_scores.happiness || 0;
              avgMood.surprise += s.mood_scores.surprise || 0;
              avgMood.sadness += s.mood_scores.sadness || 0;
              avgMood.anger += s.mood_scores.anger || 0;
              avgMood.fear += s.mood_scores.fear || 0;
              avgMood.disgust += s.mood_scores.disgust || 0;
            }
          });

          // Compute averages
          if (validMoodCount > 0) {
            setMoodData([
              { subject: 'happiness', A: Math.round(avgMood.happiness / validMoodCount), fullMark: 100 },
              { subject: 'surprise', A: Math.round(avgMood.surprise / validMoodCount), fullMark: 100 },
              { subject: 'sadness', A: Math.round(avgMood.sadness / validMoodCount), fullMark: 100 },
              { subject: 'anger', A: Math.round(avgMood.anger / validMoodCount), fullMark: 100 },
              { subject: 'fear', A: Math.round(avgMood.fear / validMoodCount), fullMark: 100 },
              { subject: 'disgust', A: Math.round(avgMood.disgust / validMoodCount), fullMark: 100 },
            ]);
          }

          setStats({
            convos: sessions.length,
            messages: sessions.length * 12 // approximated for demo
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', fontFamily: 'var(--font-sans)', padding: '2rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        
        {/* Header Nav */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: '500', fontSize: '0.9rem' }}>your week</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '2rem', textAlign: 'center' }}>your week</h1>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Analyzing your data...</div>
        ) : (
          <>
            {/* Stats Section */}
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Timer size={20} color="var(--text-muted)" /> stats
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>convos completed</span>
                  <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>{stats.convos}</span>
                </div>
                
                <div style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-main)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>messages</span>
                  <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-main)' }}>{stats.messages}</span>
                </div>
              </div>
            </div>

            {/* Mood Section */}
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smile size={20} color="var(--text-muted)" /> mood
              </h2>
              
              <div style={{ borderRadius: '12px', border: '1px solid var(--border-main)', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                {moodData.length > 0 ? (
                  <div style={{ width: '100%', height: '350px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={moodData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Mood" dataKey="A" stroke="#C0AFC5" fill="#C0AFC5" fillOpacity={0.4} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ padding: '3rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Not enough data yet. Complete a session to see your mood radar!
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
