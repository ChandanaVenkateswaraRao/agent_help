import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function NewsCard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tech');

  const fetchNews = async (type) => {
    setLoading(true);
    try {
      const endpoint = type === 'ai' ? '/news/ai' : '/news?category=technology';
      const { data } = await api.get(endpoint);
      setArticles(data.articles || []);
    } catch { setArticles([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(tab); }, [tab]);

  return (
    <div className="card fade-in" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p className="section-title" style={{ marginBottom: 0 }}>📰 Tech News</p>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['tech', 'ai'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                background: tab === t ? 'var(--accent)' : 'var(--bg-secondary)',
                color: tab === t ? 'white' : 'var(--text-secondary)'
              }}
            >{t === 'ai' ? '🤖 AI' : '💻 Tech'}</button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading-spinner">Loading news...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '340px', overflowY: 'auto' }}>
          {articles.map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', gap: '12px', padding: '10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-secondary)', transition: 'background 0.2s ease'
              }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                onMouseOut={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              >
                {a.image && (
                  <img src={a.image} alt="" style={{ width: '60px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                )}
                <div>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '4px' }}>
                    {a.title?.length > 90 ? a.title.substring(0, 90) + '...' : a.title}
                  </p>
                  <span style={{ fontSize: '11px', color: 'var(--accent-light)' }}>{a.source}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
