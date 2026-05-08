import React, { useState, useEffect } from 'react';
import MasterDashboard from './frontend/MasterDashboard';
import LandingPage from './frontend/LandingPage';

import { SettingsProvider } from './frontend/SettingsContext';
import { ProjectProvider } from './frontend/ProjectContext';
import { InstitutionalProvider } from './frontend/InstitutionalContext';

function AppContent() {
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
