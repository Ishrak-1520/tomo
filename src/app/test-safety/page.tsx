'use client';

import { useState } from 'react';

export default function TestSafetyPage() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/test-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to run test' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>Safety Pipeline Test Harness (Stage 1)</h1>
      <p>Enter phrases from your private adversarial test set to verify Layer 1 and Layer 2.</p>
      
      <form onSubmit={handleTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter a test message (English, Bangla, or Banglish)..."
          rows={4}
          style={{ padding: '0.5rem', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '0.75rem', background: '#171717', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {loading ? 'Testing...' : 'Test Pipeline'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
          <h2>Result</h2>
          <div style={{ 
            padding: '0.5rem', 
            background: result.isRisk ? '#ffebee' : '#e8f5e9',
            color: result.isRisk ? '#c62828' : '#2e7d32',
            fontWeight: 'bold',
            marginBottom: '1rem',
            borderRadius: '4px'
          }}>
            Overall Assessment: {result.isRisk ? 'RISK DETECTED' : 'SAFE'}
          </div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#333' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
