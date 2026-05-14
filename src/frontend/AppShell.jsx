import React, { useState, useEffect } from 'react';
import { SettingsProvider } from './SettingsContext';
import { ProjectProvider } from './ProjectContext';
import { RouterProvider, useRouter } from '../contexts/RouterContext';
import { ResearchProjectProvider } from './ResearchProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import HomeScreen from './HomeScreen';
import CanvasScreen from './CanvasScreen';
import AssessmentListScreen from './AssessmentListScreen';
import ResearchHomeScreen from './research/ResearchHomeScreen';
import FeedbackDashboard from './admin/FeedbackDashboard';
import FirstRunModal from './components/disclaimers/FirstRunModal';
import AiDisclaimerFooter from './components/disclaimers/AiDisclaimerFooter';
import FeedbackButton from './feedback/FeedbackButton';
import BetaBanner from './components/BetaBanner';
import { startSession, endSession } from '../core/StudyPatternTracker';
import {
  SURFACE_BASE, SURFACE_RAISED,
  TEXT_MUTED, FONT_BODY,
} from '../theme/tokens';

/**
 * AppShell: the authenticated application.
 * Wraps Settings > Project > ResearchProject > Router > ViewSwitch.
 * Also handles the first-run disclaimer modal and persistent AI footer badge.
 */
function ViewSwitch() {
  const { view } = useRouter();
  // Admin views: check URL params for Aaron-only routes
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === 'feedback') {
    return <FeedbackDashboard />;
  }
  if (view === 'canvas')      return <CanvasScreen />;
  if (view === 'assessments') return <AssessmentListScreen />;
  if (view === 'research')    return <ResearchHomeScreen />;
  return <HomeScreen />;
}

export default function AppShell() {
  const { user } = useAuth();
  const [disclaimerState, setDisclaimerState] = useState('loading'); // 'loading' | 'needed' | 'done'

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('acknowledged_disclaimers, onboarding_completed')
          .eq('id', user.id)
          .single();
        // If onboarding not completed, redirect to /onboarding
        if (data && !data.onboarding_completed) {
          window.location.replace('/onboarding');
          return;
        }
        if (data?.acknowledged_disclaimers) {
          setDisclaimerState('done');
        } else {
          setDisclaimerState('needed');
        }
      } catch {
        setDisclaimerState('needed');
      }
    })();
  }, [user]);

  // Study pattern tracking: start session on mount, end on unmount
  useEffect(() => {
    if (disclaimerState !== 'done') return;
    startSession();
    return () => endSession();
  }, [disclaimerState]);

  if (disclaimerState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: SURFACE_BASE }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED }}>Loading...</p>
      </div>
    );
  }

  if (disclaimerState === 'needed') {
    return <FirstRunModal onAcknowledged={() => setDisclaimerState('done')} />;
  }

  return (
    <SettingsProvider>
      <ProjectProvider>
        <ResearchProjectProvider>
          <RouterProvider>
            <div style={{ position: 'relative', minHeight: '100vh', background: SURFACE_BASE }}>
              <BetaBanner />
              <ViewSwitch />
              <FeedbackButton />
              <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 50, borderTop: `1px solid ${SURFACE_RAISED}`, borderLeft: `1px solid ${SURFACE_RAISED}`, background: SURFACE_BASE, borderTopLeftRadius: 4 }}>
                <AiDisclaimerFooter />
              </div>
            </div>
          </RouterProvider>
        </ResearchProjectProvider>
      </ProjectProvider>
    </SettingsProvider>
  );
}
