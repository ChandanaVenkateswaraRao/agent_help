import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function AIBriefing() {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ai/briefing')
      .then(r => setBriefing(r.data))
      .catch(() => setBriefing({ briefing: 'Could not generate briefing. Please check your API keys.', stats: {} }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="card fade-in" style={{
      background: 'linear-gradient(135deg, #1e1b4b 0%, #0f1629 60%, #0a0f1e 100%)',
      border: '1px solid rgba(99,102,241,0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Glow effect */}
      <div style={{
        position: 'absolute', top: '-30px', right: '-30px',
        width: '150px', height: '150px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '28px' }}>🤖</div>
        <div>
          <p className="section-title" style={{ marginBottom: '2px' }}>AI Daily Briefing</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Powered by GPT-3.5</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Generating your briefing...</div>
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.7, marginBottom: '16px' }}>
            {briefing?.briefing}
          </p>

          {briefing?.stats && (
            <div style={{ display: 'flex', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              {[
                { label: 'Pending Tasks', value: briefing.stats.pendingTasks, icon: '✅' },
                { label: 'Priority Emails', value: briefing.stats.highPriorityEmails, icon: '📧' },
                { label: 'Weather', value: briefing.stats.weather?.split(',')[0], icon: '🌡️' }
              ].map(stat => (
                <div key={stat.label} style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>{stat.icon} {stat.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{stat.value ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
