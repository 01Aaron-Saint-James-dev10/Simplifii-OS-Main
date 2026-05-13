import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { SettingsProvider } from './frontend/SettingsContext';
import { ProjectProvider } from './frontend/ProjectContext';
import { AuthProvider } from './contexts/AuthContext';
import HomeScreen from './frontend/HomeScreen';

// v2 entry point. Providers nest in the same order as the deleted App.js:
// Auth (outermost) > Settings > Project > Screen.
// Once the 5-screen router is built, HomeScreen will be replaced by a
// router that mounts the correct screen based on auth + navigation state.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <ProjectProvider>
          <HomeScreen />
        </ProjectProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
