'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// Reusable Toggle Switch Component
const Toggle = ({ checked, onChange, label, description }: { checked: boolean, onChange: (val: boolean) => void, label: string, description: string }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
    <button 
      onClick={() => onChange(!checked)}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        backgroundColor: checked ? 'var(--text-main)' : 'var(--border-main)',
        border: 'none',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        marginTop: '2px',
        transition: 'background-color 0.2s'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: checked ? '22px' : '2px',
        width: '20px',
        height: '20px',
        backgroundColor: 'var(--bg-color)',
        borderRadius: '50%',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
      }} />
    </button>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.95rem' }}>{label}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>{description}</span>
    </div>
  </div>
);

export default function SettingsPage() {
  const [deviceId, setDeviceId] = useState('loading...');
  const [proactiveEmpathy, setProactiveEmpathy] = useState(true);
  const [longTermMemory, setLongTermMemory] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const handleDangerAction = async (action: string) => {
    if (!confirm('Are you sure you want to perform this action?')) return;
    
    setIsDeleting(action);
    try {
      const res = await fetch('/api/settings/danger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action })
      });
      
      if (!res.ok) throw new Error('Failed to perform action');
      
      if (action === 'delete_account') {
        localStorage.removeItem('tomo_device_id');
        window.location.href = '/';
      } else {
        alert('Action completed successfully.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred.');
    } finally {
      setIsDeleting(null);
    }
  };
  
  useEffect(() => {
    const initAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const id = session?.user?.id;
      
      if (!id) {
        window.location.href = '/login';
        return;
      }
      setDeviceId(id);
    };
    initAuth();

    const pe = localStorage.getItem('tomo_proactive_empathy') !== 'false';
    const ltm = localStorage.getItem('tomo_long_term_memory') !== 'false';
    setProactiveEmpathy(pe);
    setLongTermMemory(ltm);
  }, []);

  const handleTogglePE = (val: boolean) => {
    setProactiveEmpathy(val);
    localStorage.setItem('tomo_proactive_empathy', val.toString());
  };

  const handleToggleLTM = (val: boolean) => {
    setLongTermMemory(val);
    localStorage.setItem('tomo_long_term_memory', val.toString());
  };

  const Separator = () => (
    <hr style={{ border: 'none', borderTop: '1px solid var(--border-main)', margin: '2rem 0' }} />
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)', fontFamily: 'var(--font-sans)', padding: '3rem 2rem', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.5rem',
            fontFamily: 'serif',
            fontStyle: 'italic'
          }}>
            t
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '500' }}>{deviceId}</span>
        </div>

        <Separator />

        {/* Preferences */}
        <section>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>preferences</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>manage your AI companion settings</p>

          <Toggle 
            checked={proactiveEmpathy} 
            onChange={handleTogglePE}
            label="proactive empathy" 
            description="allows tomo to reach out when you hesitate or delete long drafts. required for the dynamic check-in feature." 
          />
          <Toggle 
            checked={longTermMemory} 
            onChange={handleToggleLTM}
            label="long-term memory" 
            description="helps tomo remember past conversations and build context for future sessions using background summaries." 
          />
        </section>

        <Separator />

        {/* Usage Analytics */}
        <section>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>usage analytics</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>how much you've used tomo</p>

          <div style={{ 
            border: '1px solid var(--border-main)', 
            borderRadius: '12px', 
            padding: '1.5rem',
            backgroundColor: 'var(--bg-surface)' 
          }}>
            <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', backgroundColor: 'var(--border-subtle)', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              free
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              <span>text usage</span>
              <span>28%</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--border-main)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '28%', height: '100%', backgroundColor: '#F59E0B' }} />
            </div>
          </div>
          
          <button style={{ 
            marginTop: '1.5rem',
            padding: '0.5rem 1.25rem', 
            backgroundColor: '#FBBF24', 
            color: '#78350F', 
            border: 'none', 
            borderRadius: '6px', 
            fontWeight: '600',
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}>
            upgrade
          </button>
        </section>

        <Separator />

        {/* Danger Zone */}
        <section>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>danger zone</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>be careful with these settings</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
            
            <div>
              <button 
                onClick={() => handleDangerAction('forget_memories')}
                disabled={isDeleting !== null}
                style={{ 
                background: 'transparent', 
                border: '1px solid var(--border-main)', 
                color: 'var(--text-main)', 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: isDeleting !== null ? 'not-allowed' : 'pointer',
                opacity: isDeleting !== null ? 0.5 : 1,
                marginBottom: '0.5rem'
              }}>
                {isDeleting === 'forget_memories' ? 'forgetting...' : 'forget memories'}
              </button>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', maxWidth: '400px' }}>
                memory is currently active. withdrawing this will clear past session summaries, insights, and data that depend on background processing.
              </p>
            </div>

            <div>
              <button 
                onClick={() => handleDangerAction('reset_history')}
                disabled={isDeleting !== null}
                style={{ 
                background: 'transparent', 
                border: '1px solid var(--border-main)', 
                color: 'var(--text-main)', 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: isDeleting !== null ? 'not-allowed' : 'pointer',
                opacity: isDeleting !== null ? 0.5 : 1,
                marginBottom: '0.5rem'
              }}>
                {isDeleting === 'reset_history' ? 'resetting...' : 'reset chat history'}
              </button>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', maxWidth: '400px' }}>
                this will reset all of your previous conversations and you start from a clean slate. tomo will not remember what you've talked about earlier.
              </p>
            </div>

            <div>
              <button 
                onClick={() => handleDangerAction('delete_account')}
                disabled={isDeleting !== null}
                style={{ 
                backgroundColor: 'var(--crisis-bg)', 
                border: '1px solid var(--crisis-border)', 
                color: 'var(--crisis-text)', 
                padding: '0.5rem 1rem', 
                borderRadius: '6px', 
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: isDeleting !== null ? 'not-allowed' : 'pointer',
                opacity: isDeleting !== null ? 0.5 : 1,
                marginBottom: '0.5rem'
              }}>
                {isDeleting === 'delete_account' ? 'deleting...' : 'delete account'}
              </button>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', maxWidth: '400px' }}>
                this will completely delete your local device ID and everything related to it. be careful, it cannot be undone.
              </p>
            </div>

          </div>
        </section>
        
        {/* Bottom spacer */}
        <div style={{ height: '4rem' }} />
      </div>
    </div>
  );
}
