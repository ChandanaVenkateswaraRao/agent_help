import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsModal({ onClose }) {
  const { user, fetchUser } = useAuth();
  const [form, setForm] = useState({ city: user?.city || 'Hyderabad', githubUsername: user?.githubUsername || '' });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/auth/settings', form);
      await fetchUser();
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onClose(); }, 1000);
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div className="card" style={{ width: '420px', padding: '32px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '16px' }}>Settings</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>City (for Weather)</label>
            <input
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Hyderabad"
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>GitHub Username</label>
            <input
              value={form.githubUsername}
              onChange={e => setForm({ ...form, githubUsername: e.target.value })}
              placeholder="e.g. torvalds"
              style={{
                width: '100%', padding: '10px 14px',
                background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
                fontSize: '14px', fontFamily: 'var(--font-body)', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}
        >
          {saving ? 'Saving...' : success ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
