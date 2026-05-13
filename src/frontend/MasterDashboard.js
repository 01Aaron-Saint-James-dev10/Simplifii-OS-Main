import React, { useState, useRef, useEffect } from 'react';
import { Brain, RefreshCw, Eye } from 'lucide-react';
import { SURFACE_BASE, BORDER_RADIUS, SURFACE_CARD_SOLID, WHITE_TINT_FAINT, COLOUR_WARN_GLASS_STRONG, COLOUR_WARN_BORDER_HEAVY, ACCENT_BORDER_STRONG, ACCENT_GLASS_STRONG } from '../theme/tokens';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import { useInstitution } from './InstitutionalContext';
import AccessibilityVault from './AccessibilityVault';
import ConfirmDialog from './ConfirmDialog';
import AskAura from './AskAura';
import AuraLayer from './AuraLayer';
import SimplifiiStudio from './SimplifiiStudio';
import Scaffolder from './Scaffolder';
import HistoryVaultUnlock, { isVaultGhostMode } from './HistoryVaultUnlock';
import { isUnlocked as isVaultUnlocked } from '../core/HistoryOfThought';
import { StartIgnition, IdentityGate, TemporalBaseline, CourseDefinition, Grounding } from './UniversalOnboarding';
import LinearCanvas from './LinearCanvas';
import MathsStepEditor from './MathsStepEditor';
import AIAvatar from './AIAvatar';
import SupportBridge from './SupportBridge';
import { jsPDF } from 'jspdf';
import { simulateIncomingWebhook, speakSystemMessage, markSpeechUnlocked } from '../services/MessagingHub';
import { pingOllama, getProviderName, REASONING_START_EVENT, REASONING_END_EVENT } from '../services/RewriteService';
import { saveGhostAsset, getAllGhostAssets } from '../services/IndexedDBService';
import { useIngestion } from './hooks/useIngestion';
import IdleNudge from './IdleNudge';
import SteeringDrawer from './SteeringDrawer';
import HomeschoolDashboard from '../streams/homeschool/Dashboard';
import PrimaryDashboard from '../streams/primary/Dashboard';
import SecondaryDashboard from '../streams/secondary/Dashboard';
import TafeDashboard from '../streams/tafe/Dashboard';
import PillarGallery from './PillarGallery';
import AuthoringCockpit from './AuthoringCockpit';
import DashboardNav from './DashboardNav';
import SemesterSidebar from './SemesterSidebar';
import CognitiveArchive from './CognitiveArchive';
import { useCognitiveTelemetry } from '../services/CognitiveTelemetry';
import SmViewer from './SmViewer';

const STREAM_DASHBOARDS = {
  primary: PrimaryDashboard,
  secondary: SecondaryDashboard,
  tafe: TafeDashboard,
  homeschool: HomeschoolDashboard
};


export default function MasterDashboard() {
  const {
    mode, setMode,
    overlayTint, isRulerActive, isBionicActive,
    isZenMode, setIsZenMode,
    isLeftCollapsed, setIsLeftCollapsed,
    isRightCollapsed, setIsRightCollapsed,
    isLiteralMode, setIsLiteralMode,
    persona
  } = useSettings();
  const {
    project, updateBlock, appendToBlock, receiveMessage, clearMessage, setBlocks, logEffort,
    profile, setProfile,
    tasks, setTasks,
    extractionData, setExtractionData,
    activeTask, setActiveTask,
    courses, activeCourse, activeCourseId, setActiveCourseId, addCourse, addCourseWithData, upgradeCourseExtraction, renameCourse, removeCourse,
    stream
  } = useProject();
  const { setInstitutionalData } = useInstitution();

  const [focusedBlockId, setFocusedBlockId] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [globalGhostAssets, setGlobalGhostAssets] = useState([]);
  const [showSupportBridge, setShowSupportBridge] = useState(false);
  const [showAccessibilityVault, setShowAccessibilityVault] = useState(false);
  const [pendingDeleteCourseId, setPendingDeleteCourseId] = useState(null);
  // Modal that re-launches the Grounding (PDF drop) screen from the
  // sidebar. The first onboarding pass uses Grounding inside stage 4;
  // after onboarding is complete StartIgnition jumps straight to canvas,
  // which previously left no path to ingest a second syllabus. Now the
  // '+ Add Course' button mounts Grounding in an overlay.
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  // Tri-column Studio toggle. When true, the post-onboarding canvas
  // renders the SimplifiiStudio layout (NotebookLM-style: nav rail,
  // sources, cockpit, AURA chat) instead of the classic LinearCanvas.
  // Persists to localStorage so the student's preferred view survives
  // reloads.
  const [showStudio, setShowStudio] = useState(() => {
    try { return localStorage.getItem('simplifii_view') === 'studio'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('simplifii_view', showStudio ? 'studio' : 'classic'); } catch { /* storage unavailable */ }
  }, [showStudio]);
  // Scaffolder overlay state. When open it renders fullscreen above
  // everything else (Classic AND Studio) until the student dismisses it.
  // Profile.level picks the default tier inside the overlay.
  const [showScaffolder, setShowScaffolder] = useState(false);
  // Steering Drawer: pull-out panel surfacing the four dials (Persona,
  // Scaffolding, Grit, LOD). Closed by default per the Compass Mode
  // rule in CLAUDE.md.
  const [showSteering, setShowSteering] = useState(false);
  const [showAuraLayer, setShowAuraLayer] = useState(false);
  const { handleGroupedIngest, handleIngestGrounding, ingesting, ingestStatus, groundingCount } = useIngestion({
    profile,
    activeCourseId,
    addCourseWithData,
    upgradeCourseExtraction,
    setInstitutionalData,
    onCoursesReady: () => setViewMode('gallery')
  });
  // Vault state: open the unlock modal once on first load if the vault
  // is locked AND the student has not chosen Ghost Mode. After the
  // student unlocks or skips, the modal stays dismissed for the
  // session.
  const [vaultDismissed, setVaultDismissed] = useState(() => isVaultGhostMode() || isVaultUnlocked());
  const [ghostMode, setGhostMode] = useState(() => isVaultGhostMode());

  // Shadow profiler: passive cognitive monitoring that builds the friction
  // profile in the background without asking the student anything.
  // Merges into ProjectContext only once isProfileReady flips true.
  const telemetry = useCognitiveTelemetry();
  useEffect(() => {
    if (!telemetry.isProfileReady) return;
    setProfile(prev => ({
      ...prev,
      cognitiveFrictionScore: telemetry.passiveFrictionEstimate,
      toolIntentTags: [...new Set([...(prev.toolIntentTags || []), ...telemetry.shadowTags])],
    }));
  }, [telemetry.passiveFrictionEstimate, telemetry.isProfileReady]);
  // Inline course editor state. Replaces the legacy window.prompt() flow so
  // the cockpit no longer breaks the AURA Pulse with a native popup.
  // Used now only for the Edit (rename) action; new courses come in via
  // the syllabus modal so the OS names them itself.
  const [courseEditMode, setCourseEditMode] = useState(null); // 'rename' | null
  const [courseEditValue, setCourseEditValue] = useState('');
  const courseEditInputRef = useRef(null);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'gallery' | 'cockpit' | 'sovereign'
  const [smContent, setSmContent] = useState(null);

  // On first mount: if courses already exist default to the gallery view so
  // the Semester Command Map is the landing surface rather than the empty canvas.
  const viewInitRef = useRef(false);
  useEffect(() => {
    if (viewInitRef.current) return;
    viewInitRef.current = true;
    if (Object.keys(courses).length > 0) {
      setViewMode('gallery');
    }
  }, [courses]);

  // Auto-collapse the left sidebar when entering the Authoring Cockpit
  // so the centre column gets full focus. Restore when leaving.
  const prevViewModeRef = useRef(viewMode);
  useEffect(() => {
    if (viewMode === 'cockpit' && prevViewModeRef.current !== 'cockpit') {
      setIsLeftCollapsed(true);
    }
    prevViewModeRef.current = viewMode;
  }, [viewMode, setIsLeftCollapsed]);

  useEffect(() => { if (courseEditMode && courseEditInputRef.current) courseEditInputRef.current.focus(); }, [courseEditMode]);
  const commitCourseEdit = () => {
    const name = courseEditValue.trim();
    if (!name) { setCourseEditMode(null); setCourseEditValue(''); return; }
    if (courseEditMode === 'add') {
      const id = addCourse(name);
      if (id) setActiveCourseId(id);
    } else if (courseEditMode === 'rename') {
      renameCourse(activeCourseId, name);
    }
    setCourseEditMode(null);
    setCourseEditValue('');
  };
  const cancelCourseEdit = () => { setCourseEditMode(null); setCourseEditValue(''); };

  useEffect(() => {
    const handleToggleAccessibility = () => setShowAccessibilityVault(prev => !prev);
    window.addEventListener('toggle-accessibility', handleToggleAccessibility);
    return () => window.removeEventListener('toggle-accessibility', handleToggleAccessibility);
  }, []);

  // Sovereign Format viewer. Fires when AuraHUD completes a .sm conversion
  // and writes the result to localStorage. Switches the main canvas to the
  // SmViewer three-tier layout so the student can interact with the
  // converted document immediately.
  useEffect(() => {
    const handleSmReady = () => {
      try {
        const content = localStorage.getItem('simplifii_last_sm');
        if (content) {
          setSmContent(content);
          setViewMode('sovereign');
        }
      } catch { /* storage unavailable */ }
    };
    window.addEventListener('sm-ready', handleSmReady);
    return () => window.removeEventListener('sm-ready', handleSmReady);
  }, []);

  // Metacognitive reflection on Zen Mode exit
  const prevZenModeRef = useRef(isZenMode);
  useEffect(() => {
    if (prevZenModeRef.current === true && isZenMode === false) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("You spent 80% of your time in high-rigour analysis today. Your focus peaked during the methodology block.");
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }
    prevZenModeRef.current = isZenMode;
  }, [isZenMode]);

  // Audio unlock. Chrome and Safari silently drop speechSynthesis calls
  // that fire before the page has received a user gesture. The boot pulse
  // and handshake greeting both fire on mount; without this listener they
  // get logged but never play. We listen for the very first pointer or
  // key event anywhere on the document, flip the gate in MessagingHub,
  // and the buffered utterances drain into the live queue.
  useEffect(() => {
    const unlock = () => markSpeechUnlocked();
    document.addEventListener('pointerdown', unlock, { once: true, capture: true });
    document.addEventListener('keydown', unlock, { once: true, capture: true });
    return () => {
      document.removeEventListener('pointerdown', unlock, { capture: true });
      document.removeEventListener('keydown', unlock, { capture: true });
    };
  }, []);

  // Hardwired Neural Link boot check. On mount, if the active provider is
  // Ollama, ping /api/tags to confirm the brain is reachable. On success
  // we trigger a 2 second emerald pulse on the AURA dot (via the existing
  // reasoning-start/end events) and speak a short confirmation so the
  // student knows the link is alive without needing the console.
  // Silent on failure: the rewrite calls themselves will surface a clear
  // error toast if the student tries to use them while Ollama is down.
  useEffect(() => {
    let cancelled = false;
    if (getProviderName() !== 'ollama') return;
    (async () => {
      const ok = await pingOllama();
      if (cancelled || !ok) return;
      window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
      setTimeout(() => {
        if (!cancelled) window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      }, 2000);
      try {
        speakSystemMessage('Neural Link active. Sovereign brain connected.', 'Neural Link active.');
      } catch { /* speech unavailable */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Cognitive Archive: per-course scoping. On first mount we run a one-time
  // backfill that tags any pre-CourseManager assets with the current active
  // course id so existing research does not vanish when we start filtering.
  // Migration flag lives in localStorage so the loop never repeats.
  useEffect(() => {
    let cancelled = false;
    getAllGhostAssets().then(async (assets) => {
      if (cancelled) return;
      const migrated = localStorage.getItem('simplifii_archive_migrated_v1') === 'true';
      if (!migrated) {
        const fallback = activeCourseId || 'course_default';
        const needs = (assets || []).filter(a => !a.courseId);
        for (const a of needs) {
          try { await saveGhostAsset({ ...a, courseId: fallback }); } catch { /* ignore */ }
        }
        try { localStorage.setItem('simplifii_archive_migrated_v1', 'true'); } catch { /* storage unavailable */ }
        if (needs.length > 0) {
          const refreshed = await getAllGhostAssets();
          if (!cancelled) setGlobalGhostAssets(refreshed);
          return;
        }
      }
      if (!cancelled) setGlobalGhostAssets(assets);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Cmd+F toggles Zen Mode globally; Shift+D dispatches the Dev Insights signal.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsZenMode(prev => !prev);
      }
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('toggle-dev-insights'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsZenMode]);

  const handleAddGhostAsset = (asset) => {
    const tagged = { ...asset, courseId: asset.courseId || activeCourseId };
    saveGhostAsset(tagged).then(() => {
      setGlobalGhostAssets(prev => [...prev, tagged]);
    });
  };

  const handleStageTransition = (nextStage, speechMessage) => {
    if (speechMessage && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(speechMessage);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
    setCurrentStage(nextStage);
  };


  const generatePremiumPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(7, 8, 13);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text(extractionData?.unitCode || 'Research Paper', 20, 30);
    
    // Add Bionic Export Badge
    if (isBionicActive) {
      doc.setTextColor(245, 158, 11); // Amber
      doc.setFontSize(10);
      doc.text("BIONIC READING FORMAT", 20, 40);
      doc.setTextColor(255, 255, 255);
    }
    
    let yPos = 50;
    
    // In a real implementation, we would parse words and use doc.setFont('helvetica', 'bold') 
    // for the first half of each word, but for this MVP we append a notice.
    
    doc.setFontSize(12);
    doc.text("Title: " + profile.courseName, 20, yPos);
    yPos += 20;

    tasks.forEach(task => {
      if (yPos > 270) {
        doc.addPage();
        doc.setFillColor(7, 8, 13);
        doc.rect(0, 0, 210, 297, 'F');
        yPos = 30;
      }
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text(task.title, 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      const lines = doc.splitTextToSize(task.description || '', 170);
      doc.text(lines, 20, yPos);
      yPos += (lines.length * 5) + 15;
    });

    const safeName = (profile.name || 'Student').replace(/[^A-Za-z0-9]+/g, '_');
    const safeCourse = (courses[activeCourseId]?.name || 'Course').replace(/[^A-Za-z0-9]+/g, '_');
    doc.save(`${safeName}_${safeCourse}_Export.pdf`);
    avatarSpeak("Premium PDF compiled. Your structural scaffolding is ready.", "PDF Exported.");
  };

  const simulateVoiceNote = () => {
    // Triple purpose:
    //   1. Speak a test phrase out loud so the student can verify the
    //      audio path is actually audible (voice picked, volume up,
    //      tab not muted). The phrase is a self-test so it sounds
    //      meaningful even when the LMS is empty.
    //   2. Simulate an incoming voice-note webhook so the cockpit
    //      exercises its inbox routing.
    //   3. Force a getVoices() call inside the user gesture in case
    //      Chrome was holding off on populating the list.
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.getVoices();
      }
    } catch { /* ignore */ }
    // Persona-aware greeting so the voice test reflects the active dial.
    const VOICE_GREET = {
      Hardcore:  'Audio test. AURA is online. Systems calibrated. Drop your files.',
      Executive: 'Audio test. AURA is online, sovereign, and calibrated. Your schedule is protected.',
      Socratic:  "Audio test. AURA is listening. Let's take this one step at a time together.",
    };
    speakSystemMessage(VOICE_GREET[persona] || 'Audio test. AURA is online, sovereign, and listening.');
    const payload = {
      type: 'voice',
      source: 'WhatsApp',
      timestamp: Date.now(),
      content: 'I was thinking about the literature review...'
    };
    simulateIncomingWebhook(payload, receiveMessage);
  };

  // Reading Ruler logic
  const [mouseY, setMouseY] = useState(0);
  useEffect(() => {
    if (!isRulerActive) return;
    const handleMouseMove = (e) => setMouseY(e.clientY);
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isRulerActive]);

  const renderContent = () => {
    switch (currentStage) {
      case 1:
        return <IdentityGate onComplete={() => handleStageTransition(2, `Welcome, ${profile.name}.`)} profile={profile} setProfile={setProfile} />;
      case 2:
        return <TemporalBaseline onComplete={() => handleStageTransition(3, `Deadline locked to ${profile.deadline}.`)} profile={profile} />;
      case 3:
        return <CourseDefinition onComplete={() => handleStageTransition(4, "Course defined. Initialize knowledge graph.")} profile={profile} setProfile={setProfile} />;
      case 4:
        return <Grounding onComplete={(data) => {
          handleGroupedIngest(data);
          handleStageTransition(5, "Extraction complete. Transitioning to Document Editor.");
        }} profile={profile} />;
      case 5:
      default:
        const activeCourseName = (courses[activeCourseId]?.name || '').toLowerCase();
        const isMaths = activeCourseName.includes('maths') || activeCourseName.includes('hsc');

        // Zen Empty State: If no courses and no tasks, force grounding initialisation
        if (Object.keys(courses).length === 0 || (tasks.length === 0 && !activeCourseId)) {
          return (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 font-mono">
              <div className="text-center animate-fade-in">
                <div className="mb-12 opacity-20">
                  <Brain size={80} className="text-zinc-500 mx-auto" />
                </div>
                <h2 className="text-2xl font-bold tracking-[0.4em] uppercase mb-8 text-zinc-800">Zen State</h2>
                <button
                  onClick={() => setShowAddCourseModal(true)}
                  className="px-12 py-5 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-[0.5em] rounded-sm transition-all shadow-glow-emerald"
                >
                  Initialise Grounding
                </button>
              </div>
            </div>
          );
        }

        // Sovereign Format viewer. Renders the Three-Tier Canvas for a
        // converted .sm document. Student can edit Tier 3 live; changes
        // are written back to localStorage so the session survives reload.
        if (viewMode === 'sovereign' && smContent) {
          return (
            <div className="flex-1 flex flex-col overflow-hidden animate-fade-in relative z-0">
              <div style={{
                padding: '5px 14px', background: SURFACE_CARD_SOLID,
                borderBottom: `1px solid ${WHITE_TINT_FAINT}`,
                display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              }}>
                <button
                  onClick={() => setViewMode('canvas')}
                  style={{
                    fontSize: 11, color: '#6B7280', background: 'none', border: 'none',
                    cursor: 'pointer', padding: '2px 6px', letterSpacing: 0.3,
                  }}
                >
                  Back to Canvas
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <SmViewer
                  smContent={smContent}
                  onEdit={(updated) => {
                    setSmContent(updated);
                    try { localStorage.setItem('simplifii_last_sm', updated); } catch { /* storage unavailable */ }
                  }}
                />
              </div>
            </div>
          );
        }

        // Pillar Gallery View (Stage 03)
        if (viewMode === 'gallery') {
          return (
            <PillarGallery
              courses={courses}
              activeCourseId={activeCourseId}
              onSelect={(id) => {
                setActiveCourseId(id);
                setViewMode('cockpit');
              }}
              onAddCourse={() => setShowAddCourseModal(true)}
            />
          );
        }

        // Authoring Cockpit View (Stage 04)
        if (viewMode === 'cockpit') {
          return (
            <AuthoringCockpit
              activeCourse={activeCourse}
              activeTask={activeTask}
              onEnterCanvas={() => setViewMode('canvas')}
              onBackToGallery={() => setViewMode('gallery')}
            />
          );
        }

        // Stream-based default landing. Non-tertiary streams (primary,
        // secondary, tafe, homeschool) render their own skeleton
        // dashboard unless the student has explicitly toggled into the
        // Studio cockpit. Tertiary keeps the existing studio/classic
        // canvas flow.
        const StreamDashboard = STREAM_DASHBOARDS[stream?.streamId];
        if (StreamDashboard && !showStudio && !isMaths) {
          return (
            <div className="flex-1 overflow-auto animate-fade-in relative z-0">
              <StreamDashboard />
            </div>
          );
        }
        if (showStudio && !isMaths) {
          return (
            <div className="flex-1 overflow-hidden animate-fade-in relative z-0">
              <SimplifiiStudio onExit={() => setShowStudio(false)} />
            </div>
          );
        }
        return (
          <div className="flex-1 flex overflow-hidden animate-fade-in relative z-0">
            {isMaths ? (
              <MathsStepEditor extractionData={extractionData} profile={profile} />
            ) : (
              <LinearCanvas
                key={activeCourseId}
                extractionData={extractionData}
                profile={profile}
                courseId={activeCourseId}
                onAddGhostAsset={handleAddGhostAsset}
                isZenMode={isZenMode}
                setIsZenMode={setIsZenMode}
                isLeftCollapsed={isLeftCollapsed}
                setIsLeftCollapsed={setIsLeftCollapsed}
                isRightCollapsed={isRightCollapsed}
                setIsRightCollapsed={setIsRightCollapsed}
              />
            )}
          </div>
        );
      case 0:
        return <StartIgnition onStart={() => {
          const hasActiveSession = tasks.length > 0 && extractionData;
          if (hasActiveSession) {
            handleStageTransition(5, "Resuming active session.");
          } else {
            handleStageTransition(1, "Initiating handshake.");
          }
        }} />;
    }
  };

  const leftSidebarClass = isZenMode ? 'w-0 opacity-0 px-0' : isLeftCollapsed ? 'w-16 px-2' : 'w-72 p-5';
  const rightSidebarClass = isZenMode ? 'w-0 opacity-0' : isRightCollapsed ? 'w-16' : 'w-72';

  const getOverlayColor = () => {
    if (overlayTint === 'mint') return 'bg-[#e6fdee]';
    if (overlayTint === 'cream') return 'bg-[#fdf5e6]';
    if (overlayTint === 'skyblue') return 'bg-[#e6f0fd]';
    return '';
  };

  const isBooting = currentStage === 0;

  return (
    <div className={`h-screen w-full text-zinc-200 flex flex-col font-sans overflow-hidden transition-colors duration-1000 ${getOverlayColor()} ${isZenMode ? 'zen-mode-active' : ''}`} style={{ background: SURFACE_BASE }}>
      <DashboardNav
        isZenMode={isZenMode}
        setViewMode={setViewMode}
        activeCourse={activeCourse}
        ingesting={ingesting}
        ingestStatus={ingestStatus}
        groundingCount={groundingCount}
        handleIngestGrounding={handleIngestGrounding}
        showStudio={showStudio}
        setShowStudio={setShowStudio}
        isBionicActive={isBionicActive}
        overlayTint={overlayTint}
        isRulerActive={isRulerActive}
        isLiteralMode={isLiteralMode}
        setIsLiteralMode={setIsLiteralMode}
        ghostMode={ghostMode}
        setGhostMode={setGhostMode}
        setVaultDismissed={setVaultDismissed}
        setShowSteering={setShowSteering}
        setShowScaffolder={setShowScaffolder}
        setShowSupportBridge={setShowSupportBridge}
      />

      {/* Restored Avatar: Fixed Anchor at top:100px (clears the z-1200 nav) */}
      <div className="fixed top-[100px] left-4 z-[1100] w-56 animate-fade-in pointer-events-none">
        <div className="pointer-events-auto">
          <AIAvatar 
             onClick={() => {
                if (isBooting) {
                   // This simulates the trigger for the pulsing guide effect in AIAvatar
                   window.dispatchEvent(new CustomEvent('trigger-onboarding-guide'));
                } else {
                   setShowSupportBridge(true);
                }
             }} 
             isLiteralMode={isLiteralMode} 
             isOnboardingMode={isBooting}
          />
        </div>
      </div>

      {showSupportBridge && <SupportBridge onClose={() => setShowSupportBridge(false)} isLiteralMode={isLiteralMode} />}
      {showAccessibilityVault && <AccessibilityVault onClose={() => setShowAccessibilityVault(false)} />}
      {!vaultDismissed && (
        <HistoryVaultUnlock
          onUnlocked={() => { setVaultDismissed(true); setGhostMode(false); }}
          onGhost={() => { setVaultDismissed(true); setGhostMode(true); }}
        />
      )}
      {/* Ingestion status banner. Surfaces the per-file progress so
          the student sees what is being parsed without hovering the
          button. Disappears when the status string is cleared. */}
      {ingestStatus && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 78,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            background: COLOUR_WARN_GLASS_STRONG,
            border: `1px solid ${COLOUR_WARN_BORDER_HEAVY}`,
            color: '#fcd34d',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {ingesting && <RefreshCw size={11} className="animate-spin" />}
          {ingestStatus}
        </div>
      )}
      <IdleNudge />
      <SteeringDrawer open={showSteering} onClose={() => setShowSteering(false)} />

      {showScaffolder && (
        <div className="fixed inset-0 z-[2000] overflow-y-auto" role="dialog" aria-modal="true" aria-label="Sovereign Scaffolder">
          <Scaffolder onClose={() => setShowScaffolder(false)} />
        </div>
      )}
      {showAddCourseModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-stretch justify-center animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddCourseModal(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Add a new course by uploading a syllabus"
        >
          <div className="relative w-full max-w-5xl m-8 overflow-hidden flex flex-col" style={{ background: SURFACE_BASE, border: `1px solid ${ACCENT_BORDER_STRONG}`, borderRadius: BORDER_RADIUS, boxShadow: `0 0 48px ${ACCENT_GLASS_STRONG}` }}>
            <button
              type="button"
              onClick={() => setShowAddCourseModal(false)}
              aria-label="Close add course"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500 hover:text-emerald-400 text-zinc-400 text-xl font-black flex items-center justify-center transition-all"
            >
              ×
            </button>
            <div className="flex-1 overflow-y-auto">
              <Grounding
                profile={profile}
                onComplete={(data) => {
                  setShowAddCourseModal(false);
                  handleGroupedIngest(data);
                }}
              />
            </div>
          </div>
        </div>
      )}
      {currentStage === 5 && !isZenMode && !showAuraLayer && <AskAura onOpen={() => setShowAuraLayer(true)} />}
      <AuraLayer open={showAuraLayer} onClose={() => setShowAuraLayer(false)} />
      <ConfirmDialog
        open={!!pendingDeleteCourseId}
        title="Delete Course"
        body={`Delete "${courses[pendingDeleteCourseId]?.name || 'this course'}"? This wipes its tasks, canvas, archive, and brief. This cannot be undone.`}
        confirmLabel="Delete Course"
        cancelLabel="Keep Course"
        destructive
        onConfirm={() => {
          if (pendingDeleteCourseId) removeCourse(pendingDeleteCourseId);
          setPendingDeleteCourseId(null);
        }}
        onCancel={() => setPendingDeleteCourseId(null)}
      />

      {/* Body row: sidebar + main + right archive share the height below the nav */}
      <div className="flex-1 flex overflow-hidden min-h-0">

      <SemesterSidebar
        isZenMode={isZenMode}
        leftSidebarClass={leftSidebarClass}
        isLeftCollapsed={isLeftCollapsed}
        setIsLeftCollapsed={setIsLeftCollapsed}
        activeCourse={activeCourse}
        activeCourseId={activeCourseId}
        setActiveCourseId={setActiveCourseId}
        courses={courses}
        courseEditMode={courseEditMode}
        setCourseEditMode={setCourseEditMode}
        courseEditValue={courseEditValue}
        setCourseEditValue={setCourseEditValue}
        courseEditInputRef={courseEditInputRef}
        commitCourseEdit={commitCourseEdit}
        cancelCourseEdit={cancelCourseEdit}
        isBooting={isBooting}
        tasks={tasks}
        activeTask={activeTask}
        setShowAddCourseModal={setShowAddCourseModal}
        setPendingDeleteCourseId={setPendingDeleteCourseId}
        simulateVoiceNote={simulateVoiceNote}
        generatePremiumPDF={generatePremiumPDF}
      />

      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>

      {currentStage === 5 && (
        <CognitiveArchive
          isZenMode={isZenMode}
          rightSidebarClass={rightSidebarClass}
          isRightCollapsed={isRightCollapsed}
          setIsRightCollapsed={setIsRightCollapsed}
          globalGhostAssets={globalGhostAssets}
          activeCourseId={activeCourseId}
          handleAddGhostAsset={handleAddGhostAsset}
        />
      )}
      </div>

      {/* Zen Mode Indicator */}
      {isZenMode && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 backdrop-blur rounded-full text-[12px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 animate-pulse z-50">
          <Eye size={12} /> Focus Mode Active (Cmd+F to exit)
        </div>
      )}
    </div>
  );
}
