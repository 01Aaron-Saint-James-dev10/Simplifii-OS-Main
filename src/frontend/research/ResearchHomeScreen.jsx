/**
 * ResearchHomeScreen.jsx
 *
 * Bowser-OS Research Dashboard.
 * Layout: left rail (project tree) + main area (active project header,
 * metric cards, corpus snapshot, recent chapter, action buttons).
 *
 * Routes: navigateToChapter opens the canvas; back to home via navigateToHome.
 */

import React, { useState, useMemo } from 'react';
import usePomodoro from '../hooks/usePomodoro';
import PitStopOverlay from '../components/visuals/PitStopOverlay';
import { useResearchProject } from '../ResearchProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import ResearchLeftRail from './ResearchLeftRail';
import MetricCard from './MetricCard';
import MethodologyLogPanel from './MethodologyLogPanel';
import ReflexivityLogPanel from './ReflexivityLogPanel';
import SupervisorFeedbackPanel from './SupervisorFeedbackPanel';
import SynthesisPreview from './SynthesisPreview';
import ResearchIngestScreen from './ResearchIngestScreen';
import NeuralAvatar from '../components/visuals/NeuralAvatar';
import ProposalOnboarding from './ProposalOnboarding';
import {
  SURFACE_BASE,
  SURFACE_CARD,
  SURFACE_RAISED,
  TEXT_PRIMARY,
  TEXT_MUTED,
  TEXT_FAINT,
  FONT_SYSTEM,
  FONT_BODY,
  BORDER_RADIUS,
  ACCENT_PULSE,
  ACCENT_GLASS,
  ACCENT_GLASS_STRONG,
  ACCENT_BORDER,
  ACCENT_BORDER_STRONG,
  COLOUR_WARN,
  COLOUR_WARN_BORDER,
  COLOUR_WARN_GLASS,
} from '../../theme/tokens';

const AARON_ACTIVE_CHAPTER_ID = 'ch_5_findings_interviews';

export default function ResearchHomeScreen() {
  const {
    activeProject,
    phases,
    strands,
    chapters,
    methodologyLog,
    reflexivityLog,
    supervisorFeedback,
    seeding,
    needsOnboarding,
    applyDemoSeed,
    createProjectFromProposal,
  } = useResearchProject();
  const { user } = useAuth();
  const { navigateToCanvas, navigateToChapter, navigateHome } = useRouter();
  const isAaron = user?.email === 'aaronbugge@gmail.com';

  const [activeChapterId, setActiveChapterId] = useState(AARON_ACTIVE_CHAPTER_ID);
  const [panel, setPanel] = useState(null); // 'methodology' | 'reflexivity' | 'feedback' | 'synthesis' | 'ingest'
  const pomodoro = usePomodoro();

  const unaddressedFeedback = useMemo(
    () => supervisorFeedback.filter(f => f.status === 'unaddressed').length,
    [supervisorFeedback]
  );

  const activeChapter = useMemo(
    () => chapters.find(c => c.chapterId === activeChapterId) || chapters[0] || null,
    [chapters, activeChapterId]
  );

  const activePhase = useMemo(
    () => phases.find(p => p.status === 'active') || phases[0] || null,
    [phases]
  );

  const lastMethodologyDate = methodologyLog[0]?.date || null;
  const lastReflexivityDate = reflexivityLog[0]?.date || null;

  function handleSelectChapter(ch) {
    setActiveChapterId(ch.chapterId);
  }

  function handleResumeChapter() {
    if (!activeProject || !activeChapter) return;
    navigateToChapter(activeProject.projectId, activeChapter.chapterId);
  }

  if (seeding) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: SURFACE_BASE }}>
        <p style={{ fontFamily: FONT_SYSTEM, fontSize: 12, color: TEXT_FAINT, letterSpacing: '0.08em' }}>Setting up research workspace...</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <ProposalOnboarding
        onProjectCreated={createProjectFromProposal}
        onUseDemo={isAaron ? applyDemoSeed : undefined}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: SURFACE_BASE, overflow: 'hidden' }}>
      {/* Top nav */}
      <nav style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${SURFACE_RAISED}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NeuralAvatar size={28} />
          <button
            type="button"
            onClick={navigateHome}
            style={{ background: 'transparent', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 10, padding: '2px 0', letterSpacing: '0.04em' }}
            aria-label="Back to home"
          >
            Home
          </button>
          <span style={{ color: TEXT_FAINT, fontSize: 10 }}>/</span>
          <span style={{ fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE }}>
            Bowser-OS Research
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Pomodoro timer */}
          <button
            type="button"
            onClick={pomodoro.isRunning ? pomodoro.pause : pomodoro.start}
            aria-label={pomodoro.isRunning ? 'Pause focus sprint' : 'Start 25-minute focus sprint'}
            style={{ padding: '4px 10px', background: 'transparent', border: `1px solid ${pomodoro.isRunning ? ACCENT_BORDER_STRONG : SURFACE_RAISED}`, borderRadius: BORDER_RADIUS, fontFamily: 'monospace', fontSize: 11, color: pomodoro.isRunning ? ACCENT_PULSE : TEXT_MUTED, cursor: 'pointer', letterSpacing: '0.04em' }}
          >
            {pomodoro.label}
          </button>
          {pomodoro.timeLeft < 1500 && (
            <button type="button" onClick={pomodoro.reset} style={{ background: 'transparent', border: 'none', color: TEXT_FAINT, cursor: 'pointer', fontFamily: FONT_SYSTEM, fontSize: 9 }}>reset</button>
          )}
          <NavAction label="Ingest" onClick={() => setPanel('ingest')} />
          <NavAction label="Synthesis" onClick={() => setPanel('synthesis')} accent />
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left rail */}
        <ResearchLeftRail
          phases={phases}
          strands={strands}
          chapters={chapters}
          corpusCount={0}
          unverifiedCount={0}
          receiptScore={null}
          activeChapterId={activeChapterId}
          onSelectChapter={handleSelectChapter}
        />

        {/* Main area */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Project header */}
          {activeProject ? (
            <div>
              <h1 style={{ fontFamily: FONT_BODY, fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, margin: '0 0 2px', lineHeight: 1.3 }}>
                {activeProject.title}
              </h1>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, margin: 0, letterSpacing: '0.06em' }}>
                {activeProject.institution}{activeProject.supervisor ? ` (Supervisor: ${activeProject.supervisor})` : ''}
                {activePhase ? ` (${activePhase.title})` : ''}
              </p>
            </div>
          ) : (
            <p style={{ fontFamily: FONT_SYSTEM, fontSize: 12, color: TEXT_FAINT }}>No research project loaded.</p>
          )}

          {/* Metric cards */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <MetricCard
              label="Methodology Log"
              count={methodologyLog.length}
              subLabel={lastMethodologyDate ? `Last: ${lastMethodologyDate}` : 'No entries yet'}
              accent
              onClick={() => setPanel('methodology')}
            />
            <MetricCard
              label="Reflexivity Log"
              count={reflexivityLog.length}
              subLabel={lastReflexivityDate ? `Last: ${lastReflexivityDate}` : 'No entries yet'}
              onClick={() => setPanel('reflexivity')}
            />
            <MetricCard
              label="Supervisor Feedback"
              count={supervisorFeedback.length}
              subLabel={unaddressedFeedback > 0 ? `${unaddressedFeedback} unaddressed` : 'All addressed'}
              warn={unaddressedFeedback > 0}
              onClick={() => setPanel('feedback')}
            />
          </div>

          {/* Active chapter */}
          {activeChapter && (
            <div style={{ padding: '16px 18px', background: SURFACE_CARD, border: `1px solid ${ACCENT_BORDER}`, borderRadius: BORDER_RADIUS * 2 }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 8px' }}>
                Active Chapter
              </p>
              <h2 style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: TEXT_PRIMARY, margin: '0 0 4px' }}>
                {activeChapter.number ? `Chapter ${activeChapter.number}: ` : ''}{activeChapter.title.replace(/^Chapter \d+:\s*/i, '')}
              </h2>
              {activeChapter.summary && (
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: '0 0 14px', lineHeight: 1.6 }}>
                  {activeChapter.summary}
                </p>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleResumeChapter}
                  style={{ padding: '7px 16px', background: ACCENT_GLASS_STRONG, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS, fontFamily: FONT_SYSTEM, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: ACCENT_PULSE, cursor: 'pointer' }}
                >
                  Resume Chapter
                </button>
                <span style={{ fontFamily: FONT_SYSTEM, fontSize: 9, color: TEXT_FAINT, letterSpacing: '0.06em', textTransform: 'capitalize' }}>
                  {activeChapter.status?.replace('_', ' ') || 'not started'}
                </span>
              </div>
            </div>
          )}

          {/* Positionality / theoretical framework quick view */}
          {activeProject?.positionalityStatement && (
            <div style={{ padding: '14px 18px', background: SURFACE_CARD, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS * 2 }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 6px' }}>
                Positionality Statement
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: 0, lineHeight: 1.7 }}>
                {activeProject.positionalityStatement}
              </p>
            </div>
          )}

          {activeProject?.theoreticalFramework && (
            <div style={{ padding: '14px 18px', background: SURFACE_CARD, border: `1px solid ${SURFACE_RAISED}`, borderRadius: BORDER_RADIUS * 2 }}>
              <p style={{ fontFamily: FONT_SYSTEM, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: TEXT_FAINT, margin: '0 0 6px' }}>
                Theoretical Framework
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: TEXT_MUTED, margin: 0, lineHeight: 1.7 }}>
                {activeProject.theoreticalFramework}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Panels */}
      {panel === 'methodology'  && <MethodologyLogPanel    onClose={() => setPanel(null)} />}
      {panel === 'reflexivity'  && <ReflexivityLogPanel    onClose={() => setPanel(null)} />}
      {panel === 'feedback'     && <SupervisorFeedbackPanel onClose={() => setPanel(null)} />}
      {panel === 'synthesis'    && <SynthesisPreview        onClose={() => setPanel(null)} />}
      {panel === 'ingest'       && <ResearchIngestScreen    onClose={() => setPanel(null)} projectId={activeProject?.projectId} />}

      {/* Pit Stop overlay (fires when Pomodoro sprint completes) */}
      <PitStopOverlay isOpen={pomodoro.isPitStop} onDismiss={pomodoro.dismiss} />
    </div>
  );
}

function NavAction({ label, onClick, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        background: accent ? ACCENT_GLASS_STRONG : 'transparent',
        border: `1px solid ${accent ? ACCENT_BORDER_STRONG : SURFACE_RAISED}`,
        borderRadius: BORDER_RADIUS,
        fontFamily: FONT_SYSTEM,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: accent ? ACCENT_PULSE : TEXT_MUTED,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
