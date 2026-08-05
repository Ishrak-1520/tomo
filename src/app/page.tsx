'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessageCircle, Shield, Clock, Sun, Moon } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('tomo_theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const checkLogin = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push('/chat');
      }
    };
    checkLogin();
  }, [router]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('tomo_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  if (!mounted) return null;

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-color)', 
      color: 'var(--text-main)', 
      display: 'flex', 
      flexDirection: 'column',
      fontFamily: 'var(--font-sans)',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      {/* Header */}
      <header style={{ 
        padding: '1.5rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--border-main)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: '28px', 
            height: '28px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--accent-main)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#FFFFFF', 
            fontFamily: 'serif', 
            fontStyle: 'italic', 
            fontSize: '1rem',
            fontWeight: 'bold'
          }}>t</div>
          <span style={{ fontSize: '1.1rem', fontWeight: '500', letterSpacing: '-0.02em' }}>tomo</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          
          <button 
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button 
            onClick={() => router.push('/login')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              fontSize: '0.9rem',
              fontWeight: '500', 
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-main)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            Log in
          </button>
          <button 
            onClick={() => router.push('/signup')} 
            style={{ 
              backgroundColor: 'var(--text-main)', 
              color: 'var(--bg-color)', 
              border: 'none', 
              padding: '0.5rem 1rem', 
              borderRadius: '999px', 
              fontSize: '0.9rem',
              fontWeight: '500', 
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Sign up
          </button>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.3rem 0.75rem',
          borderRadius: '999px',
          border: '1px solid var(--border-main)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          fontWeight: '500',
          marginBottom: '2rem'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-main)' }}></span>
          Tomo is now in beta
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', 
          fontWeight: '600', 
          maxWidth: '800px', 
          lineHeight: '1.1', 
          marginBottom: '1.5rem', 
          letterSpacing: '-0.03em',
          color: 'var(--text-main)'
        }}>
          A quiet space for<br/>your loud thoughts.
        </h1>
        
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'var(--text-muted)', 
          maxWidth: '500px', 
          marginBottom: '3rem', 
          lineHeight: '1.6',
          fontWeight: '400'
        }}>
          Tomo is an AI companion designed to listen, reflect, and help you process your day without judgment.
        </p>
        
        <button 
          onClick={() => router.push('/signup')} 
          style={{ 
            backgroundColor: 'var(--accent-main)', 
            color: '#FFFFFF', 
            border: 'none', 
            padding: '0.8rem 1.8rem', 
            borderRadius: '999px', 
            fontSize: '1rem', 
            fontWeight: '500', 
            cursor: 'pointer', 
            marginBottom: '6rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px 0 rgba(129, 152, 138, 0.3)'
          }} 
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(129, 152, 138, 0.4)';
          }} 
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(129, 152, 138, 0.3)';
          }}
        >
          Start chatting
        </button>

        {/* Minimal Feature Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
          gap: '3rem', 
          maxWidth: '900px', 
          width: '100%', 
          textAlign: 'center',
          borderTop: '1px solid var(--border-main)',
          paddingTop: '4rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-main)', marginBottom: '1rem' }}><MessageCircle size={24} strokeWidth={1.5} /></div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>Always There</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '0.9rem' }}>Available 24/7. No appointments, no waiting rooms, just instant support.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-main)', marginBottom: '1rem' }}><Clock size={24} strokeWidth={1.5} /></div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>Deep Memory</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '0.9rem' }}>Tomo builds context over time, so you never have to repeat yourself.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ color: 'var(--accent-main)', marginBottom: '1rem' }}><Shield size={24} strokeWidth={1.5} /></div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: '500', color: 'var(--text-main)' }}>Private & Secure</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.5', fontSize: '0.9rem' }}>Your thoughts are yours. Erase your data completely at any time.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
