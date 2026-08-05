'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CrisisCard from '@/components/CrisisCard';
import { createClient } from '@/lib/supabase/client';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  showCrisisCard?: boolean;
};

import { X, ArrowUp } from 'lucide-react';

const TomoAvatar = () => (
  <div style={{
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#81988A', // Soft sage green
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '16px',
    fontFamily: 'serif',
    fontStyle: 'italic',
    flexShrink: 0
  }}>
    t
  </div>
);

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showManualCrisisCard, setShowManualCrisisCard] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [isGenZMode, setIsGenZMode] = useState(false);
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);
  
  const [deviceId, setDeviceId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Typing hesitation trackers
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deletedCharsRef = useRef(0);

  // Initialize identity and session on mount
  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        window.location.href = '/login';
        return;
      }
      setDeviceId(session.user.id);
    };
    initAuth();

    // Look for an active session ID in the URL hash or create a new one
    const hash = window.location.hash.replace('#', '');
    const currentSessionId = hash || uuidv4();
    if (!hash) {
      window.location.hash = currentSessionId;
    }
    setSessionId(currentSessionId);

    let ignore = false;
    // Fetch history for this session
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/history?sessionId=${currentSessionId}`);
        
        if (!res.ok) {
          console.error("API returned error status:", res.status);
          throw new Error('API returned an error');
        }
        
        const data = await res.json();
        if (ignore) return;

        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content
          })));
        } else {
          // Fetch dynamic welcome message
          try {
            const memoryEnabled = localStorage.getItem('tomo_long_term_memory') !== 'false';
            const welcomeRes = await fetch(`/api/chat/welcome?sessionId=${currentSessionId}&memoryEnabled=${memoryEnabled}`);
            const welcomeData = await welcomeRes.json();
            if (!ignore) {
              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: welcomeData.content || 'hi there. i am tomo. i am here to listen and support you. how are you feeling today?',
              }]);
            }
          } catch (e) {
            if (!ignore) {
              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: 'hi there. i am tomo. i am here to listen and support you. how are you feeling today?',
              }]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
        if (!ignore) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'hi there. i am tomo. i am here to listen and support you. how are you feeling today?',
          }]);
        }
      }
    };

    fetchHistory();
    return () => { ignore = true; };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, showManualCrisisCard]);

  const triggerProactiveCheckIn = async () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    deletedCharsRef.current = 0;
    
    // Let Tomo send a message without clearing the user's current drafted text
    setLoading(true);
    try {
      const response = await fetch('/api/chat/proactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          sessionId,
          isGenZMode,
          memoryEnabled: localStorage.getItem('tomo_long_term_memory') !== 'false',
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })).filter(m => m.role !== 'system'),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to get proactive response');

      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.content,
        showCrisisCard: data.showCrisisCard,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Proactive Chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const oldVal = input;
    
    // Detect deletions
    if (newVal.length < oldVal.length) {
      deletedCharsRef.current += (oldVal.length - newVal.length);
    }
    
    setInput(newVal);
    
    if (newVal.length > 0) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      // 30 second hesitation timer
      typingTimeoutRef.current = setTimeout(() => {
         const peEnabled = localStorage.getItem('tomo_proactive_empathy') !== 'false';
         if (peEnabled) triggerProactiveCheckIn();
      }, 30000);
      
      // 50 chars deletion threshold
      if (deletedCharsRef.current >= 50) {
         if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
         const peEnabled = localStorage.getItem('tomo_proactive_empathy') !== 'false';
         if (peEnabled) triggerProactiveCheckIn();
      }
    } else {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !deviceId || !sessionId) return;
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    deletedCharsRef.current = 0;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          sessionId,
          isGenZMode,
          memoryEnabled: localStorage.getItem('tomo_long_term_memory') !== 'false',
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })).filter(m => m.role !== 'system'),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content,
        showCrisisCard: data.showCrisisCard,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'system',
          content: 'i am having trouble connecting right now. please try again in a moment.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const confirmEndSession = async () => {
    setShowEndSessionModal(false);
    setLoading(true);
    try {
      // Explicitly trigger summary and mood generation
      await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      // Navigate to insights page
      window.location.href = '/insights';
    } catch (e) {
      console.error('Failed to summarize', e);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'var(--font-sans)', overflow: 'hidden' }}>
      
      {/* Custom Modal Overlay */}
      {showEndSessionModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.4)', 
          zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(2px)'
        }}>
          <div className="message-enter" style={{
            backgroundColor: 'var(--bg-surface)',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', fontSize: '1.25rem' }}>End this session?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Are you sure you want to end this session? You will be redirected to your insights page.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowEndSessionModal(false)}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmEndSession}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calm, flat header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 1.5rem', 
        backgroundColor: 'transparent',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Intentionally left blank to balance header if needed, sidebar handles logo */}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setIsGenZMode(!isGenZMode)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isGenZMode ? 'var(--accent-main)' : 'transparent',
              color: isGenZMode ? 'var(--text-inverse)' : 'var(--text-muted)',
              border: isGenZMode ? '1px solid var(--accent-main)' : '1px solid var(--border-main)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
          >
            {isGenZMode ? '✨ Gen Z Mode: ON' : 'Gen Z Mode: OFF'}
          </button>
          
          <button 
            onClick={() => setShowManualCrisisCard(!showManualCrisisCard)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-main)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.85rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)' }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            {showManualCrisisCard ? 'Close Help' : 'Help / SOS'}
          </button>
        </div>
      </header>

      {showManualCrisisCard && (
        <div className="message-enter" style={{ padding: '0 1.5rem', zIndex: 9, maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <CrisisCard />
        </div>
      )}

      {/* Main Chat Area */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: '2rem' }}></div> {/* Spacer to push content to bottom */}
        <div style={{ maxWidth: '750px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className="message-enter"
              style={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : (msg.role === 'system' ? 'center' : 'flex-start'),
                width: '100%',
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
                  <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                    <TomoAvatar />
                  </div>
                  <div style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bubble-ai)',
                    color: 'var(--text-main)',
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap',
                    maxWidth: '85%'
                  }}>
                    {msg.content}
                  </div>
                </div>
              )}

              {msg.role === 'user' && (
                <div style={{
                  maxWidth: '85%',
                  padding: '1rem 1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bubble-user)',
                  color: 'var(--text-main)',
                  fontSize: '1.1rem',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              )}

              {msg.role === 'system' && (
                <div style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  width: '100%'
                }}>
                  {msg.content}
                </div>
              )}
              
              {msg.showCrisisCard && (
                <div className="message-enter" style={{ marginTop: '1rem', width: '100%' }}>
                  <CrisisCard />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message-enter" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
              <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
                <TomoAvatar />
              </div>
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bubble-ai)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                display: 'flex',
                alignItems: 'center',
                height: '42px'
              }}>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: '20px' }} />
        </div>
      </main>

      {/* Input Area */}
      <footer style={{ padding: '0 1.5rem 2rem 1.5rem', backgroundColor: 'transparent', zIndex: 10 }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          
          {showDisclaimer && (
            <div style={{ 
              backgroundColor: 'var(--disclaimer-bg)', 
              padding: '0.6rem 1rem', 
              borderRadius: '8px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              border: '1px solid var(--border-main)'
            }}>
              <span>just a quick reminder that tomo is an ai companion here to listen, not a licensed therapist.</span>
              <button onClick={() => setShowDisclaimer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            border: '1px solid var(--border-main)', 
            borderRadius: '8px', 
            backgroundColor: 'var(--bg-surface)', 
            padding: '0.4rem 0.75rem',
          }}>
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="type your message..."
              disabled={loading}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                backgroundColor: 'transparent',
                padding: '0.5rem 0'
              }}
            />
            
            {input.trim() && (
              <button 
                type="button" 
                onClick={() => setInput('')} 
                style={{ 
                  background: 'none', border: 'none', color: 'var(--text-muted)', 
                  cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center',
                  marginRight: '0.5rem'
                }}
              >
                <X size={16} />
              </button>
            )}
            
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? 'var(--accent-main)' : 'var(--bg-surface-hover)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                color: input.trim() && !loading ? 'var(--text-inverse)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </form>

          {/* End Session Button positioned bottom left under text box */}
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.25rem' }}>
            <button 
              onClick={() => setShowEndSessionModal(true)}
              disabled={loading}
              title="End Session"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-main)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: loading ? 'wait' : 'pointer',
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
                backgroundColor: 'var(--bg-surface-hover)'
              }}
              onMouseOver={(e) => { if(!loading) { e.currentTarget.style.backgroundColor = 'var(--crisis-bg)'; e.currentTarget.style.color = 'var(--crisis-text)'; e.currentTarget.style.borderColor = 'var(--crisis-border)'; } }}
              onMouseOut={(e) => { if(!loading) { e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-main)'; } }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
