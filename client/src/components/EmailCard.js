import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function EmailCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/email')
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load emails'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="card loading-spinner">Summarizing emails with AI...</div>;

  if (error) return (
    <div className="card">
      <p className="section-title">📧 Email Summary</p>
      <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔐</div>
        {error}
        <br />
        <span style={{ fontSize: '12px' }}>Connect Gmail via Google login to enable this feature.</span>
      </div>
    </div>
  );

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p className="section-title" style={{ marginBottom: 0 }}>📧 Email Summary</p>
        {data?.unreadCount > 0 && (
          <span style={{ background: 'var(--red)', color: 'white', borderRadius: '12px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>
            {data.unreadCount} unread
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data?.emails?.map(email => (
          <div key={email.id} style={{
            padding: '12px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${email.priority === 'high' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email.sender?.replace(/<.*>/, '').trim()}
              </span>
              <span className={`badge badge-${email.priority}`}>{email.priority}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '6px' }}>
              {email.summary}
            </p>
            {email.actionRequired && (
              <span style={{ fontSize: '11px', color: 'var(--yellow)', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                Action: {email.actionLabel}
              </span>
            )}
          </div>
        ))}
        {(!data?.emails?.length) && (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No emails found</p>
        )}
      </div>
    </div>
  );
}
