import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import WeatherCard from '../components/WeatherCard';
import EmailCard from '../components/EmailCard';
import TaskCard from '../components/TaskCard';
import NewsCard from '../components/NewsCard';
import GithubCard from '../components/GithubCard';
import AIBriefing from '../components/AIBriefing';
import AIChat from '../components/AIChat';
import SettingsModal from '../components/SettingsModal';

export default function DashboardPage() {
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const grid = {
    display: 'grid',
    gap: '20px',
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto'
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar onSettingsOpen={() => setSettingsOpen(true)} />

      <div style={grid}>
        {/* Row 1: Weather + Tasks + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <WeatherCard city={user?.city} />
          <TaskCard />
          <EmailCard />
        </div>

        {/* Row 2: GitHub + News */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <GithubCard />
          <NewsCard />
        </div>

        {/* Row 3: AI Briefing */}
        <AIBriefing />

        {/* Row 4: AI Chat */}
        <AIChat />
      </div>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
