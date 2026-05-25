import React, { useEffect, useState } from 'react';
import api from '../utils/api';

const weatherIcons = {
  '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '⛅',
  '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌦️',
  '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️', '50d': '🌫️'
};

export default function WeatherCard({ city }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/weather?city=${city || 'Hyderabad'}`)
      .then(r => setWeather(r.data))
      .catch(() => setError('Failed to load weather'))
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) return <div className="card loading-spinner">Loading weather...</div>;
  if (error) return <div className="card" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{error}</div>;

  const icon = weatherIcons[weather.icon] || '🌡️';

  return (
    <div className="card fade-in" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
      <p className="section-title">Weather</p>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '42px', lineHeight: 1 }}>{icon}</div>
          <div style={{ fontSize: '36px', fontFamily: 'var(--font-display)', marginTop: '8px' }}>
            {weather.temperature}°<span style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>C</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', textTransform: 'capitalize' }}>
            {weather.description}
          </div>
          <div style={{ color: 'var(--accent-light)', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
            {weather.city}, {weather.country}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--text-muted)' }}>
          <div>Feels {weather.feels_like}°C</div>
          <div>Humidity {weather.humidity}%</div>
          <div>Wind {weather.wind_speed} m/s</div>
        </div>
      </div>

      {/* Forecast */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
        {weather.forecast?.map((f, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '11px' }}>
            <div style={{ color: 'var(--text-muted)' }}>{new Date(f.time).getHours()}:00</div>
            <div style={{ fontSize: '16px', margin: '4px 0' }}>{weatherIcons[f.icon] || '🌡️'}</div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{f.temp}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
