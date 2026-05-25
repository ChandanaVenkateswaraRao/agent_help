import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function GithubCard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(user?.githubUsername || '');
  const [inputVal, setInputVal] = useState(user?.githubUsername || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (username) fetchGitHub(username);
  }, [username]);

  const fetchGitHub = async (uname) => {
    setLoading(true); setError('');
    try {
      const { data: res } = await api.get(`/github/${uname}`);
      setData(res);
    } catch {
      setError('GitHub user not found or API error');
      setData(null);
    } finally { setLoading(false); }
  };

  return (
    <div className="card fade-in">
      <p className="section-title">🐙 GitHub Activity</p>

      {!username && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Enter GitHub username..."
            style={{
              flex: 1, padding: '8px 12px',
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)',
              fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none'
            }}
            onKeyDown={e => e.key === 'Enter' && setUsername(inputVal)}
          />
          <button onClick={() => setUsername(inputVal)} className="btn btn-primary" style={{ padding: '8px 16px' }}>Load</button>
        </div>
      )}

      {loading && <div className="loading-spinner">Fetching GitHub data...</div>}
      {error && <p style={{ color: 'var(--red)', fontSize: '13px' }}>{error}</p>}

      {data && (
        <>
          {/* Profile */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <img src={data.profile.avatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--border-hover)' }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: '15px' }}>{data.profile.name || data.profile.login}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{data.profile.bio}</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>⭐ {data.profile.public_repos} repos</span>
                <span>👥 {data.profile.followers} followers</span>
              </div>
            </div>
          </div>

          {/* Recent commits */}
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Commits</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
            {data.commits?.map((c, i) => (
              <div key={i} style={{ padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {c.message?.length > 60 ? c.message.substring(0, 60) + '...' : c.message}
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {c.repo.split('/')[1]} • {new Date(c.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>

          <button onClick={() => { setUsername(''); setData(null); setInputVal(''); }} style={{
            marginTop: '12px', background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px'
          }}>← Change user</button>
        </>
      )}
    </div>
  );
}
