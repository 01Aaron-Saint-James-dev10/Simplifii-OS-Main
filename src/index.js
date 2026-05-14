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
      <SettingsProvider>
        <ProjectProvider>
          <ResearchProjectProvider>
            <RouterProvider>
              <ViewSwitch />
            </RouterProvider>
          </ResearchProjectProvider>
        </ProjectProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);
