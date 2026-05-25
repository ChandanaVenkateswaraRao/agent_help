import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onSettingsOpen }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px', height: '32px',
          background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px'
        }}>⚡</div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '14px', color: 'var(--text-primary)' }}>
          AI Dashboard
        </span>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={onSettingsOpen} className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '13px' }}>
          ⚙️ Settings
        </button>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <img
              src={user?.picture || `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`}
              alt="Avatar"
              style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid var(--border-hover)' }}
            />
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user?.name?.split(' ')[0]}</span>
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '48px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px',
              minWidth: '160px',
              boxShadow: 'var(--shadow)'
            }}>
              <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                {user?.email}
              </div>
              <button
                onClick={logout}
                style={{ width: '100%', padding: '8px 12px', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', textAlign: 'left', fontSize: '13px', borderRadius: '4px' }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
