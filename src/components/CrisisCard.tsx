'use client';

export default function CrisisCard() {
  return (
    <div style={{
      marginTop: '1rem',
      marginBottom: '1rem',
      padding: '1.5rem',
      backgroundColor: 'var(--crisis-bg)', // soft red bg
      border: '1px solid var(--crisis-border)',
      borderRadius: '8px',
      color: 'var(--crisis-text)', // dark red text
      fontFamily: 'sans-serif'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
        You don't have to carry this alone. Help is available right now.
      </h3>
      
      <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.95rem', color: 'var(--crisis-text)' }}>
        Please consider reaching out to one of these free, confidential support services in Bangladesh. They are trained to listen and support you.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Kaan Pete Roi */}
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--crisis-border)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--crisis-text)' }}>Kaan Pete Roi (Emotional Support)</h4>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Bangladesh's dedicated volunteer-staffed emotional support helpline.
          </p>
          <a 
            href="tel:09612119911" 
            style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Call 09612-119911 (3PM - 3AM)
          </a>
        </div>

        {/* Mindspace */}
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--crisis-border)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--crisis-text)' }}>Mindspace / Vent Crisis Hotline</h4>
          <a 
            href="tel:09678678778" 
            style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Call 09678-678-778 (6PM - 6AM)
          </a>
        </div>

        {/* 999 */}
        <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--crisis-border)' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--crisis-text)' }}>National Emergency (999)</h4>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            For immediate physical danger or medical emergencies.
          </p>
          <a 
            href="tel:999" 
            style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#404040', color: '#fff', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}
          >
            Call 999
          </a>
        </div>

      </div>
    </div>
  );
}
