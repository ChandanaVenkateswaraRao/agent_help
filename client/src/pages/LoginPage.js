import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none'
      }} />

      <div className="card fade-in" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '48px 40px' }}>
        {/* Logo */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '28px',
            boxShadow: '0 8px 32px rgba(99,102,241,0.3)'
          }}>⚡</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            AI Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
            Your intelligent productivity hub for IT professionals
          </p>
        </div>

        {/* Features */}
        {['AI Email Summarization', 'Daily Briefing', 'GitHub Tracking', 'Smart Task Manager'].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', textAlign: 'left' }}>
            <span style={{ color: 'var(--green)', fontSize: '14px' }}>✓</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{f}</span>
          </div>
        ))}

        <div style={{ marginTop: '32px', marginBottom: '16px' }}>
          <button
            onClick={loginWithGoogle}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              color: '#1f2937',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontFamily: 'var(--font-body)',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          Gmail access required for email summarization features
        </p>
      </div>
    </div>
  );
}
