import React, { useState, useEffect } from 'react';
import MasterDashboard from './frontend/MasterDashboard';
import LandingPage from './frontend/LandingPage';
import Onboarding from './frontend/Onboarding';
import { SettingsProvider } from './frontend/SettingsContext';
import { ProjectProvider } from './frontend/ProjectContext';
import { InstitutionalProvider } from './frontend/InstitutionalContext';

const VIEW = { LANDING: 'landing', ONBOARDING: 'onboarding', DASHBOARD: 'dashboard' };

class ViewBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error('[Simplifii-OS view crash]', err); }
  render() {
    if (this.state.failed) {
      return (
        <div style={{ minHeight: '100vh', background: '#07080D', color: '#10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui', padding: 24, textAlign: 'center' }}>
          <div>
            <p style={{ fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12 }}>
              Cockpit recovered
            </p>
            <p style={{ color: '#a1a1aa', marginBottom: 16 }}>Something went sideways. Reload to continue.</p>
            <button onClick={() => window.location.reload()}
              style={{ padding: '12px 24px', background: '#10b981', color: '#000',
                fontWeight: 900, borderRadius: 12, border: 0, cursor: 'pointer' }}>
              Reload OS
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const isReturning = localStorage.getItem('simplifii_onboarding_complete') === 'true';
  const [currentView, setCurrentView] = useState(isReturning ? VIEW.DASHBOARD : VIEW.LANDING);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      localStorage.clear();
      window.history.replaceState({}, document.title, window.location.pathname);
      setCurrentView(VIEW.LANDING);
    }
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem('simplifii_onboarding_complete', 'true');
    setCurrentView(VIEW.DASHBOARD);
  };

  switch (currentView) {
    case VIEW.LANDING:
      return <LandingPage onGetStarted={() => setCurrentView(VIEW.ONBOARDING)} />;
    case VIEW.ONBOARDING:
      return <Onboarding onComplete={finishOnboarding} />;
    case VIEW.DASHBOARD:
      return <MasterDashboard />;
    default:
      return <LandingPage onGetStarted={() => setCurrentView(VIEW.ONBOARDING)} />;
  }
}

export default function App() {
  return (
    <ViewBoundary>
      <SettingsProvider>
        <ProjectProvider>
          <InstitutionalProvider>
            <AppContent />
          </InstitutionalProvider>
        </ProjectProvider>
      </SettingsProvider>
    </ViewBoundary>
  );
}
