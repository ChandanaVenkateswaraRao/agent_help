import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';

const suggestions = [
  "What's the weather in Hyderabad?",
  "Show my pending tasks",
  "Show my last 10 emails",
  "Show job related emails",
  "Show my GitHub repos",
  "Write an email to someone@gmail.com about interview reschedule"
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AI assistant. I can answer questions, fetch weather, show tasks, emails, GitHub activity, and even write & send emails. How can I help?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null); // { to, subject, body }
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        messages: newMessages.slice(-12).map(m => ({ role: m.role, content: m.content }))
      });

      const assistantMsg = { role: 'assistant', content: data.reply, draft: data.draft || null };
      setMessages([...newMessages, assistantMsg]);

      // If backend returned a draft, store it
      if (data.draft) setPendingDraft(data.draft);

    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const confirmSend = async () => {
    if (!pendingDraft) return;
    setLoading(true);
    const confirmMsg = `send it to ${pendingDraft.to} with subject "${pendingDraft.subject}" and body: ${pendingDraft.body}`;

    // Build send_email tool call directly
    const newMessages = [...messages, { role: 'user', content: 'send it' }];
    setMessages(newMessages);

    try {
      const { data } = await api.post('/ai/chat', {
        messages: [
          ...newMessages.slice(-12).map(m => ({ role: m.role, content: m.content })),
          // Inject the send tool explicitly
          { role: 'user', content: JSON.stringify({ tool: 'send_email', to: pendingDraft.to, subject: pendingDraft.subject, body: pendingDraft.body }) }
        ]
      });
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
      setPendingDraft(null);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Failed to send email. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const discardDraft = () => {
    setPendingDraft(null);
    setMessages(prev => [...prev, { role: 'assistant', content: 'Draft discarded. Let me know if you want to make changes or write a new email.' }]);
  };

  const formatMessage = (content) => {
    // Bold **text**
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>');
  };

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
      <p className="section-title">💬 AI Assistant</p>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {m.role === 'assistant' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end'
              }}>🤖</div>
            )}
            <div>
              <div style={{
                maxWidth: '480px',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                lineHeight: 1.6
              }}
                dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }}
              />

              {/* Send/Discard buttons shown under draft message */}
              {m.role === 'assistant' && m.draft && pendingDraft && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginLeft: '4px' }}>
                  <button
                    onClick={confirmSend}
                    disabled={loading}
                    style={{
                      padding: '8px 20px', background: 'var(--green)', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer',
                      fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    📤 Send Email
                  </button>
                  <button
                    onClick={discardDraft}
                    style={{
                      padding: '8px 16px', background: 'transparent', color: 'var(--red)',
                      border: '1px solid var(--red)', borderRadius: '8px', cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    ✕ Discard
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>🤖</div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: '16px 16px 16px 4px', display: 'flex', gap: '4px', alignItems: 'center' }}>
              {[0, 1, 2].map(d => (
                <span key={d} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: `bounce 1s ${d * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => sendMessage(s)} style={{
              padding: '4px 12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: '20px', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer'
            }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >{s}</button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && sendMessage()}
          placeholder={pendingDraft ? 'Say "send it" or ask for changes...' : 'Ask me anything...'}
          disabled={loading}
          style={{
            flex: 1, padding: '10px 14px',
            background: 'var(--bg-secondary)', border: `1px solid ${pendingDraft ? 'var(--green)' : 'var(--border)'}`,
            borderRadius: '24px', color: 'var(--text-primary)',
            fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none'
          }}
        />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()} className="btn btn-primary" style={{ borderRadius: '24px', padding: '10px 20px' }}>
          Send
        </button>
      </div>

      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: scale(1); opacity: 0.5; } 40% { transform: scale(1.3); opacity: 1; } }`}</style>
    </div>
  );
}