import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function TaskCard() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks').then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, []);

  const addTask = async () => {
    if (!newTask.trim()) return;
    const { data } = await api.post('/tasks', { title: newTask, priority });
    setTasks([data, ...tasks]);
    setNewTask('');
  };

  const toggleTask = async (id) => {
    const { data } = await api.put(`/tasks/${id}/toggle`);
    setTasks(tasks.map(t => t._id === id ? data : t));
  };

  const deleteTask = async (id) => {
    await api.delete(`/tasks/${id}`);
    setTasks(tasks.filter(t => t._id !== id));
  };

  const pending = tasks.filter(t => !t.completed).length;

  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <p className="section-title" style={{ marginBottom: 0 }}>✅ Tasks</p>
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{pending} pending</span>
      </div>

      {/* Add task */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Add a task..."
          style={{
            flex: 1, padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontFamily: 'var(--font-body)',
            outline: 'none'
          }}
        />
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          style={{ padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '12px' }}
        >
          <option value="low">Low</option>
          <option value="medium">Med</option>
          <option value="high">High</option>
        </select>
        <button onClick={addTask} className="btn btn-primary" style={{ padding: '8px 16px' }}>+</button>
      </div>

      {loading ? <div className="loading-spinner">Loading...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '280px', overflowY: 'auto' }}>
          {tasks.map(task => (
            <div key={task._id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
              opacity: task.completed ? 0.5 : 1,
              transition: 'opacity 0.2s'
            }}>
              <button
                onClick={() => toggleTask(task._id)}
                style={{
                  width: '18px', height: '18px', flexShrink: 0,
                  borderRadius: '50%',
                  border: `2px solid ${task.completed ? 'var(--green)' : 'var(--border)'}`,
                  background: task.completed ? 'var(--green)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '10px'
                }}
              >{task.completed ? '✓' : ''}</button>
              <span style={{
                flex: 1, fontSize: '13px', color: 'var(--text-primary)',
                textDecoration: task.completed ? 'line-through' : 'none'
              }}>{task.title}</span>
              <span className={`badge badge-${task.priority}`}>{task.priority}</span>
              <button
                onClick={() => deleteTask(task._id)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '0 4px' }}
              >×</button>
            </div>
          ))}
          {!tasks.length && <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>No tasks yet. Add one above!</p>}
        </div>
      )}
    </div>
  );
}
