import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { SettingsProvider } from './frontend/SettingsContext';
import { ProjectProvider } from './frontend/ProjectContext';
import { AuthProvider } from './contexts/AuthContext';
import { RouterProvider, useRouter } from './contexts/RouterContext';
import HomeScreen from './frontend/HomeScreen';
import CanvasScreen from './frontend/CanvasScreen';
import ResearchHomeScreen from './frontend/research/ResearchHomeScreen';
import { ResearchProjectProvider } from './frontend/ResearchProjectContext';
import AuthGate from './frontend/auth/AuthGate';

// v2 entry point. Providers: Auth > Settings > Project > ResearchProject > Router > ViewSwitch.
function ViewSwitch() {
  const { view } = useRouter();
  if (view === 'canvas')   return <CanvasScreen />;
  if (view === 'research') return <ResearchHomeScreen />;
  return <HomeScreen />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <AuthGate>
        <SettingsProvider>
          <ProjectProvider>
            <ResearchProjectProvider>
              <RouterProvider>
                <ViewSwitch />
              </RouterProvider>
            </ResearchProjectProvider>
          </ProjectProvider>
        </SettingsProvider>
      </AuthGate>
    </AuthProvider>
  </React.StrictMode>
);
