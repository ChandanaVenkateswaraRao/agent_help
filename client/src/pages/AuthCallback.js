import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');
    if (token) {
      localStorage.setItem('token', token);
      fetchUser().then(() => navigate('/'));
    } else {
      navigate('/login?error=' + (error || 'unknown'));
    }
  }, []);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Space Mono, monospace', color:'#6366f1' }}>
      Authenticating...
    </div>
  );
}
