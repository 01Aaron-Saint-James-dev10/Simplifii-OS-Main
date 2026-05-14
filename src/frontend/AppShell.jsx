import React from 'react';
import { SettingsProvider } from './SettingsContext';
import { ProjectProvider } from './ProjectContext';
import { RouterProvider, useRouter } from '../contexts/RouterContext';
import { ResearchProjectProvider } from './ResearchProjectContext';
import HomeScreen from './HomeScreen';
import CanvasScreen from './CanvasScreen';
import ResearchHomeScreen from './research/ResearchHomeScreen';

/**
 * AppShell: the authenticated application.
 * Wraps Settings > Project > ResearchProject > Router > ViewSwitch.
 * Mounted under /app/* by the top-level route config.
 */
function ViewSwitch() {
  const { view } = useRouter();
  if (view === 'canvas')   return <CanvasScreen />;
  if (view === 'research') return <ResearchHomeScreen />;
  return <HomeScreen />;
}

export default function AppShell() {
  return (
    <SettingsProvider>
      <ProjectProvider>
        <ResearchProjectProvider>
          <RouterProvider>
            <ViewSwitch />
          </RouterProvider>
        </ResearchProjectProvider>
      </ProjectProvider>
    </SettingsProvider>
  );
}
