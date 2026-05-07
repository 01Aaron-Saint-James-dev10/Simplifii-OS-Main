import React, { useState, useEffect } from 'react';
import MasterDashboard from './frontend/MasterDashboard';
import LandingPage from './frontend/LandingPage';
import Onboarding from './frontend/Onboarding';
import { SettingsProvider } from './frontend/SettingsContext';
import { ProjectProvider } from './frontend/ProjectContext';
import { InstitutionalProvider } from './frontend/InstitutionalContext';

function AppContent() {
  const isReturning = localStorage.getItem('simplifii_onboarding_complete') === 'true';
  const [currentView, setCurrentView] = useState(isReturning ? 'dashboard' : 'landing');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      localStorage.clear();
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.reload();
    }
  }, []);

  const finishOnboarding = () => {
    localStorage.setItem('simplifii_onboarding_complete', 'true');
    setCurrentView('dashboard');
  };

  if (currentView === 'landing') return <LandingPage onGetStarted={() => setCurrentView('onboarding')} />;
  if (currentView === 'onboarding') return <Onboarding onComplete={finishOnboarding} />;
  return <MasterDashboard />;
}

function App() { 
  return (
    <SettingsProvider>
      <ProjectProvider>
        <InstitutionalProvider>
          <AppContent />
        </InstitutionalProvider>
      </ProjectProvider>
    </SettingsProvider>
  ); 
}

export default App;
