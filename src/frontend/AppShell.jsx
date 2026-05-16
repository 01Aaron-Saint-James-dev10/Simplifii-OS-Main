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
import AuraOrb from './components/AuraOrb';
import AuraChatOverlay from './components/AuraChatOverlay';
import FirstTimeTooltip from './components/FirstTimeTooltip';
import EnergyOrbs from './components/EnergyOrbs';
import CanvasSettingsOverlay from './components/CanvasSettingsOverlay';
import BetaBanner from './components/BetaBanner';
import MatrixRain from './components/MatrixRain';
import { startSession, endSession } from '../core/StudyPatternTracker';
import { unlockWithUserId } from '../core/HistoryOfThought';
import {
  SURFACE_BASE, SURFACE_RAISED,
  TEXT_MUTED, FONT_BODY,
} from '../theme/tokens';

/**
 * AppShell: the authenticated application.
 * Wraps Settings > Project > ResearchProject > Router > ViewSwitch.
 * Also handles the first-run disclaimer modal and persistent AI footer badge.
 */
const VIEW_LABELS = { home: 'Dashboard', canvas: 'Editor', assessments: 'Assessment list', research: 'Research workspace' };

// Hide the AI disclaimer footer on the canvas (it has its own BottomStrip)
function AiDisclaimerFixed() {
  const { view } = useRouter();
  if (view === 'canvas') return null;
  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 50, borderTop: `1px solid ${SURFACE_RAISED}`, borderLeft: `1px solid ${SURFACE_RAISED}`, background: SURFACE_BASE, borderTopLeftRadius: 4 }}>
      <AiDisclaimerFooter />
    </div>
  );
}

function ViewSwitch() {
  const { view } = useRouter();
  // Admin views: check URL params for Aaron-only routes
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === 'feedback') {
    return <FeedbackDashboard />;
  }
  const content = view === 'canvas' ? <CanvasScreen />
    : view === 'assessments' ? <AssessmentListScreen />
    : view === 'research' ? <ResearchHomeScreen />
    : <HomeScreen />;
  return (
    <>
      {/* Screen reader announces view changes */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
        {VIEW_LABELS[view] || 'Dashboard'} view loaded
      </div>
      {content}
    </>
  );
}

export default function AppShell() {
  const { user } = useAuth();
  const [disclaimerState, setDisclaimerState] = useState('loading'); // 'loading' | 'needed' | 'done'
  const [auraChatOpen, setAuraChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Listen for settings open event from dashboard
  useEffect(() => {
    const handler = () => setSettingsOpen(true);
    window.addEventListener('simplifii:open-settings', handler);
    return () => window.removeEventListener('simplifii:open-settings', handler);
  }, []);

  // AURA proactive greeting: auto-open chat when canvas is ready (first time per course)
  useEffect(() => {
    const handler = (e) => {
      const { courseId: cId } = e.detail || {};
      const key = `aura_greeted_${cId}`;
      if (sessionStorage.getItem(key)) return; // already greeted this session
      sessionStorage.setItem(key, 'true');
      setAuraChatOpen(true);
    };
    window.addEventListener('aura:canvas-ready', handler);
    return () => window.removeEventListener('aura:canvas-ready', handler);
  }, []);

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

  // Study pattern tracking + HistoryOfThought unlock on auth
  useEffect(() => {
    if (disclaimerState !== 'done') return;
    startSession();
    // Unlock HistoryOfThought vault so appendEvent calls succeed
    if (user?.id) {
      unlockWithUserId(user.id).then(() => {
        if (typeof console !== 'undefined') console.log('[HistoryOfThought] vault unlocked for', user.id);
      }).catch(() => { /* non-blocking: vault may already be unlocked */ });
    }
    return () => endSession();
  }, [disclaimerState, user]);

  if (disclaimerState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: SURFACE_BASE }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: TEXT_MUTED }}>Setting up your workspace...</p>
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
            <div style={{ position: 'relative', minHeight: '100vh' }}>
              <MatrixRain />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <BetaBanner />
                <ViewSwitch />
              </div>
              <EnergyOrbs userId={user?.id || 'anon'} />
              <FeedbackButton />
              <FirstTimeTooltip id="aura_orb" text="Tap me for help at any time. I am AURA, your study guide." position="left" delay={2000}>
                <AuraOrb onClick={() => setAuraChatOpen(prev => !prev)} auraState={auraChatOpen ? 'listening' : 'idle'} />
              </FirstTimeTooltip>
              <AuraChatOverlay open={auraChatOpen} onClose={() => setAuraChatOpen(false)} />
              {settingsOpen && <CanvasSettingsOverlay onClose={() => setSettingsOpen(false)} />}
              <AiDisclaimerFixed />
            </div>
          </RouterProvider>
        </ResearchProjectProvider>
      </ProjectProvider>
    </SettingsProvider>
  );
}
