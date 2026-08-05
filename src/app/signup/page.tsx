'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName
        }
      }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    // Since we assume email confirmation is disabled per our plan:
    router.push('/chat');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', fontFamily: 'var(--font-sans)' }}>
      <button 
        onClick={() => router.push('/')}
        style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}
      >
        ← back to home
      </button>

      <div style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.5rem', marginBottom: '1rem' }}>t</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Create an account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Start your journey with Tomo</p>
        </div>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>First Name</label>
            <input 
              type="text" 
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
              placeholder="Your name"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-main)', backgroundColor: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !email || !password || !firstName}
            style={{ 
              marginTop: '1rem',
              width: '100%', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              backgroundColor: 'var(--accent-main)', 
              color: 'var(--text-inverse)', 
              border: 'none', 
              fontSize: '1rem', 
              fontWeight: '600', 
              cursor: (loading || !email || !password || !firstName) ? 'not-allowed' : 'pointer',
              opacity: (loading || !email || !password || !firstName) ? 0.7 : 1
            }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <a href="/login" style={{ color: 'var(--accent-main)', textDecoration: 'none', fontWeight: '600' }}>Log in</a>
        </p>
      </div>
    </div>
  );
}
