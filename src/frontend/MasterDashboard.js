import React, { useState, useRef, useEffect } from 'react';
import { Brain, RefreshCw, Sparkles, CheckCircle2, Layout, FileText, Download, Target, AlertTriangle, Shield, ChevronLeft, ChevronRight, Eye, HardDrive, Trash2, FlaskConical, BookOpen, MousePointer2, Plus, Circle } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import { useInstitution } from './InstitutionalContext';
import TaskCard from './TaskCard';
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
import { fetchLMSData } from '../backend/LMSConnector';
import { mapToWorkspace, deriveRoadmapFromAssessments, extractDeepCourseData, mergeExtractionData } from '../services/BriefService';
import { processDocumentWithGCP } from '../services/DocumentAIService';
import { fetchGroundingPdfs, listGroundingPdfs } from '../utils/GroundingLoader';
import { nameCourse, pingOllama, getProviderName, extractAssessmentBriefs, REASONING_START_EVENT, REASONING_END_EVENT } from '../services/RewriteService';
import { reconcile as reconcileBriefs } from '../services/SovereignReconciler';
import { jsPDF } from 'jspdf';
import FloatingResourceCard from './FloatingResourceCard';
import ResourceIngestor from './ResourceIngestor';
import { simulateIncomingWebhook, speakSystemMessage, markSpeechUnlocked } from '../services/MessagingHub';
import { auditProjectContext } from '../services/VerificationService';
import { saveGhostAsset, getAllGhostAssets } from '../services/IndexedDBService';
import IdleNudge from './IdleNudge';
import SteeringDrawer from './SteeringDrawer';
import HomeschoolDashboard from '../streams/homeschool/Dashboard';
import PrimaryDashboard from '../streams/primary/Dashboard';
import SecondaryDashboard from '../streams/secondary/Dashboard';
import TafeDashboard from '../streams/tafe/Dashboard';

const STREAM_DASHBOARDS = {
  primary: PrimaryDashboard,
  secondary: SecondaryDashboard,
  tafe: TafeDashboard,
  homeschool: HomeschoolDashboard
};

/**
 * CoursePillar - Stage 03: Calm Dashboard Card
 * High-contrast, single-tier course tile. No nested cards.
 * Every interactive element carries a visible focus ring.
 */
function CoursePillar({ course, id, isActive, onClick }) {
  const tier = course.extractionData?.academicTier || 'General';

  const tierMeta = (() => {
    switch (tier) {
      case 'Lab':       return { icon: <FlaskConical size={22} className="text-emerald-600" />, label: 'Lab' };
      case 'Research':  return { icon: <BookOpen size={22} className="text-emerald-600" />,     label: 'Research' };
      case 'Practical': return { icon: <Layout size={22} className="text-emerald-600" />,       label: 'Practical' };
      default:          return { icon: <Brain size={22} className="text-emerald-600" />,        label: 'General' };
    }
  })();

  const unitCode = course.extractionData?.unitCode || id.split('_')[1]?.toUpperCase() || 'UNKN101';

  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`relative text-left bg-white border-2 ${isActive ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-zinc-200 hover:border-zinc-400'} rounded-lg p-6 transition-all flex flex-col h-52 justify-between focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer shadow-sm hover:shadow-md`}
    >
      <div>
        <div className="mb-3 inline-flex items-center gap-2 bg-zinc-100 px-3 py-2 rounded-md">
          {tierMeta.icon}
          <span className="text-xs font-bold text-zinc-500 uppercase">{tierMeta.label}</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-1">{unitCode}</p>
        <h2 className="text-lg font-bold text-zinc-900 leading-snug">{course.name}</h2>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
        <span className="text-xs font-medium text-zinc-400">
          {isActive ? 'Currently active' : 'Select to open'}
        </span>
        {isActive && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
            <CheckCircle2 size={14} /> Active
          </span>
        )}
      </div>
    </button>
  );
}

/**
 * AddCourseTile - Stage 03: Dashed placeholder for adding a new course.
 */
function AddCourseTile({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white border-2 border-dashed border-zinc-300 hover:border-emerald-500 rounded-lg p-6 transition-all flex flex-col h-52 items-center justify-center gap-3 focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer hover:bg-emerald-50/50"
    >
      <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
        <Plus size={24} className="text-zinc-400" />
      </div>
      <span className="text-sm font-bold text-zinc-500">Add a course</span>
      <span className="text-xs text-zinc-400">Upload a syllabus to get started</span>
    </button>
  );
}

/**
 * PillarGallery - Stage 03: Calm Dashboard Course Selection
 * Clean grid, maximum six tiles (five courses + one add tile).
 * High-contrast light theme, keyboard-first tab order.
 */
function PillarGallery({ courses, activeCourseId, onSelect, onAddCourse }) {
  const entries = Object.entries(courses).slice(0, 5);
  const totalCourses = Object.keys(courses).length;

  return (
    <div className="flex-1 bg-zinc-50 p-8 md:p-12 overflow-y-auto font-sans">
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">Your Courses</h1>
          <p className="text-sm text-zinc-500">
            {totalCourses} {totalCourses === 1 ? 'course' : 'courses'} loaded
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {entries.map(([id, course]) => (
          <CoursePillar
            key={id}
            id={id}
            course={course}
            isActive={id === activeCourseId}
            onClick={onSelect}
          />
        ))}
        {entries.length < 5 && <AddCourseTile onClick={onAddCourse} />}
      </div>

      {totalCourses > 5 && (
        <p className="max-w-5xl mx-auto mt-6 text-sm text-zinc-400">
          Showing 5 of {totalCourses} courses. Use the sidebar switcher to access the rest.
        </p>
      )}
    </div>
  );
}

/**
 * AuthoringCockpit - Stage 04: Active Task View
 * Calm Dashboard centre column. Left sidebar collapsed by default.
 * Shows a 5-step Pareto workflow for the active assessment with a
 * pinned weight badge. Light theme, focus rings on every control.
 */
function AuthoringCockpit({ activeCourse, activeTask, onEnterCanvas, onBackToGallery }) {
  const courseName = activeCourse?.name || 'Untitled Course';
  const totalWeight = activeCourse?.roadmap?.totalWeight || '25%';
  const paretoSteps = activeCourse?.roadmap?.paretoSteps;
  const taskTitle = activeTask?.task || courseName;

  const steps = paretoSteps && paretoSteps.length > 0
    ? paretoSteps.slice(0, 5)
    : [
        { rank: 1, label: 'Analyse the brief and identify key requirements', weight: '5%' },
        { rank: 2, label: 'Research and gather primary sources', weight: '5%' },
        { rank: 3, label: 'Organise your structure and build an outline', weight: '5%' },
        { rank: 4, label: 'Synthesise evidence into draft sections', weight: '5%' },
        { rank: 5, label: 'Review, refine, and finalise for submission', weight: '5%' },
      ];

  return (
    <div className="flex-1 bg-zinc-50 overflow-y-auto font-sans">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Back navigation */}
        <button
          type="button"
          onClick={onBackToGallery}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 mb-8 transition-colors focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none rounded-md px-2 py-1"
        >
          <ChevronLeft size={16} />
          <span>All courses</span>
        </button>

        {/* Task header with weight badge */}
        <header className="relative mb-8">
          <div className="absolute top-0 right-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-md">
              <Target size={14} />
              <span>{totalWeight} Weight</span>
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400 mb-1">{courseName}</p>
          <h1 className="text-2xl font-bold text-zinc-900 pr-36 leading-snug">{taskTitle}</h1>
        </header>

        <hr className="border-zinc-200 mb-8" />

        {/* Pareto steps */}
        <section aria-label="Pareto steps for this assessment">
          <h2 className="text-sm font-bold text-zinc-900 mb-1">Pareto Steps</h2>
          <p className="text-sm text-zinc-500 mb-6">
            Prioritise the steps that carry the most marks. Complete them in order.
          </p>

          <ol className="space-y-3">
            {steps.map((step, i) => {
              const isCurrent = i === 0;
              return (
                <li key={step.rank || i}>
                  <div
                    className={`w-full text-left bg-white border ${isCurrent ? 'border-emerald-300' : 'border-zinc-200'} rounded-lg px-5 py-4 flex items-start gap-4`}
                  >
                    <span
                      className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}
                      aria-hidden="true"
                    >
                      {step.rank || i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isCurrent ? 'text-zinc-900' : 'text-zinc-700'}`}>
                        {step.label}
                      </p>
                      {step.weight && (
                        <p className="text-xs text-zinc-400 mt-1">
                          <span className="sr-only">Step weight: </span>{step.weight}
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md flex-shrink-0">
                        <Circle size={8} className="fill-emerald-500 text-emerald-500" />
                        Current step
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Enter canvas action */}
        <div className="mt-10">
          <button
            type="button"
            onClick={onEnterCanvas}
            className="w-full py-4 bg-zinc-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-all focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none shadow-md flex items-center justify-center gap-2"
          >
            <FileText size={16} />
            <span>Open Authoring Canvas</span>
          </button>
        </div>

        {/* Zero-disclosure footer */}
        <div className="mt-8 flex items-center gap-2 text-zinc-400 justify-center">
          <Shield size={14} />
          <span className="text-xs font-medium">Local processing only. No data leaves this device.</span>
        </div>
      </div>
    </div>
  );
}

export default function MasterDashboard() {
  const {
    mode, setMode,
    overlayTint, isRulerActive, isBionicActive,
    isZenMode, setIsZenMode,
    isLeftCollapsed, setIsLeftCollapsed,
    isRightCollapsed, setIsRightCollapsed,
    isLiteralMode, setIsLiteralMode
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
  // Grounding folder ingestion. Pulls every PDF committed to
  // src/grounding/active/, runs each through DocumentAIService, then
  // hands the aggregated extraction to handleSprintCreation. The
  // resulting course lands as a Shadow State draft in milliseconds
  // and the LLM extraction firms it up in the background.
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState('');
  const groundingCount = listGroundingPdfs().length;
  // Vault state: open the unlock modal once on first load if the vault
  // is locked AND the student has not chosen Ghost Mode. After the
  // student unlocks or skips, the modal stays dismissed for the
  // session.
  const [vaultDismissed, setVaultDismissed] = useState(() => isVaultGhostMode() || isVaultUnlocked());
  const [ghostMode, setGhostMode] = useState(() => isVaultGhostMode());
  // Inline course editor state. Replaces the legacy window.prompt() flow so
  // the cockpit no longer breaks the AURA Pulse with a native popup.
  // Used now only for the Edit (rename) action; new courses come in via
  // the syllabus modal so the OS names them itself.
  const [courseEditMode, setCourseEditMode] = useState(null); // 'rename' | null
  const [courseEditValue, setCourseEditValue] = useState('');
  const courseEditInputRef = useRef(null);
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'gallery' | 'cockpit'

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

  // Smart Handshake. Atomic create-and-fill so course name, tasks,
  // extraction data, blocks, and roadmap all land in a single new course
  // in one transition. No data leaks into the previous active course.
  //
  // Flow:
  //   1. Build all derived state synchronously: blocks, tasks, roadmap.
  //   2. Dispatch reasoning-start so the AURA dot pulses faster while
  //      we wait for Ollama to canonicalise the course name.
  //   3. await nameCourse(rawText). 8 second timeout inside RewriteService;
  //      regex fallback if Ollama is unreachable.
  //   4. addCourseWithData(name, payload). Single setCourses transition.
  //   5. Speak the success greeting through the same channel the
  //      Academic Tools use, so the student hears 'Course X identified.
  //      Your semester is now mapped.'
  // Reconcile a list of candidate briefs onto canonical assessments
  // and build the standard derived state (titles, doneWhenChecklist,
  // roadmap). Used by both the shadow draft path (regex-only) and the
  // confirmed path (regex unioned with Ollama).
  const buildDerived = (candidateBriefs) => {
    const reconciledBriefs = reconcileBriefs(candidateBriefs);
    const assessmentTitles = reconciledBriefs.map(b => b.weight ? `${b.title} (${b.weight})` : b.title);
    const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').slice(0, 40) || 'item';
    const doneWhenChecklist = assessmentTitles.slice(0, 12).map((entry, i) => ({
      id: `assess_${i}_${slugify(entry)}`,
      text: entry,
      checked: false,
      triggerWord: entry.split(/\s+/).slice(0, 3).join(' ').toLowerCase()
    }));
    const derivedRoadmap = deriveRoadmapFromAssessments(assessmentTitles);
    return { reconciledBriefs, assessmentTitles, doneWhenChecklist, derivedRoadmap };
  };

  // Split aggregated ingest data by unit code prefix so each course
  // code gets its own cockpit entry. Detects codes like BABS1201,
  // MATH1131, etc. from sourceFiles. Files without a code go into the
  // fallback group keyed by the profile unit code.
  const handleGroupedIngest = async (data) => {
    const files = data.sourceFiles || [];
    if (files.length === 0) return handleSprintCreation(data);

    // Sovereign Logic: Detect Unit Codes (e.g., BABS1201, LAWS1001)
    const codeRegex = /\b([A-Z]{3,4}\d{4})\b/;
    const groups = {};
    for (const name of files) {
      const match = name.match(codeRegex);
      const code = match ? match[1] : (data.unitCode || 'General');
      if (!groups[code]) groups[code] = [];
      groups[code].push(name);
    }

    const codes = Object.keys(groups);
    if (codes.length <= 1) return handleSprintCreation(data);

    // Multi-course ingestion: Initialise distinct Course Pillars
    for (const code of codes) {
      const subset = { ...data, unitCode: code, sourceFiles: groups[code] };
      await handleSprintCreation(subset);
    }
    
    setViewMode('gallery');
  };

  const handleSprintCreation = async (data) => {
    // Shadow State pattern. Cold-load the cockpit instantly with a
    // regex-only "Draft Roadmap" so the student never stares at a
    // spinner; the heavy LLM passes (extractAssessmentBriefs, nameCourse)
    // run in the background and upgrade the same course in place when
    // they settle. Loading anxiety breaks executive function. The
    // shadow flag on extractionData lets downstream UI mark the data
    // as DRAFT until ground truth lands.
    const regexTitles = Array.isArray(data.assessmentTitles) ? data.assessmentTitles.slice() : [];
    const regexCandidateBriefs = regexTitles
      .map(t => String(t || '').trim())
      .filter(t => t.length >= 4)
      .map(t => {
        const stem = t.replace(/\s*\(\d+%\)\s*$/, '').trim();
        const weightMatch = t.match(/\((\d+%)\)/);
        return { title: stem, weight: weightMatch ? weightMatch[1] : '', wordCountGoal: 0, dueDate: '', source: 'brief' };
      });

    const draft = buildDerived(regexCandidateBriefs);
    const draftFirst = draft.assessmentTitles[0];
    const draftTaskName = draftFirst || data.unitCode || 'Course Brief';
    const draftTask = { course: data.unitCode || 'Extracted', task: draftTaskName, level: data.level, rawText: data.rawText };
    const generatedBlocks = mapToWorkspace(data.rawText || '', data.level || 'Tertiary');
    const draftName = data.unitCode || 'New Course';

    setInstitutionalData({
      learningOutcomes: data.learningOutcomes || [],
      referencingStyle: data.referencingStyle || 'Harvard',
      rubricCriteria: data.rubricCriteria || []
    });

    const draftPayload = {
      tasks: [draftTask],
      activeTask: draftTask,
      extractionData: { ...data, assessmentTitles: draft.assessmentTitles, assessmentBriefs: draft.reconciledBriefs, doneWhenChecklist: draft.doneWhenChecklist, shadow: true },
      project: { blocks: generatedBlocks }
    };
    if (draft.derivedRoadmap) draftPayload.roadmap = draft.derivedRoadmap;

    const courseId = addCourseWithData(draftName, draftPayload);

    speakSystemMessage(
      draft.assessmentTitles.length > 0
        ? `Draft roadmap ready. ${draft.assessmentTitles.length} pillars detected. Refining in the background.`
        : 'Draft cockpit ready. Refining the syllabus in the background.',
      `${draftName} draft ready.`
    );

    // Background: run Ollama extraction and nameCourse in parallel,
    // then upgrade the course in place. The student keeps interacting
    // with the draft state during this window. If both LLM calls fail
    // the draft remains as-is; no destructive overwrite.
    if (data?.rawText && data.rawText.trim().length > 200 && getProviderName() === 'ollama') {
      window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
      const briefsPromise = extractAssessmentBriefs(data.rawText)
        .catch(err => { if (typeof console !== 'undefined') console.warn('[handleSprintCreation] Ollama extraction error:', err.message); return []; });
      const namePromise = nameCourse(data.rawText)
        .catch(err => { if (typeof console !== 'undefined') console.warn('[handleSprintCreation] nameCourse failed:', err.message); return null; });

      try {
        const [llmBriefs, derivedName] = await Promise.all([briefsPromise, namePromise]);
        const candidateBriefs = [
          ...llmBriefs.map(b => ({ ...b, source: b.source || 'outline' })),
          ...regexCandidateBriefs
        ];
        const confirmed = buildDerived(candidateBriefs);
        const conflictCount = confirmed.reconciledBriefs.reduce((n, b) => n + ((b.reconciled?.conflicts?.length) || 0), 0);
        if (typeof console !== 'undefined') {
          console.info('[handleSprintCreation] confirmed extraction:', confirmed.reconciledBriefs.length, 'canonical assessments (', conflictCount, 'conflicts resolved)');
        }
        const confirmedFirst = confirmed.assessmentTitles[0];
        const confirmedTask = { course: data.unitCode || 'Extracted', task: confirmedFirst || draftTaskName, level: data.level, rawText: data.rawText };
        upgradeCourseExtraction(courseId, {
          name: derivedName && derivedName !== 'New Course' ? derivedName : undefined,
          tasks: [confirmedTask],
          activeTask: confirmedTask,
          extractionData: {
            assessmentTitles: confirmed.assessmentTitles,
            assessmentBriefs: confirmed.reconciledBriefs,
            doneWhenChecklist: confirmed.doneWhenChecklist,
            shadow: false
          },
          roadmap: confirmed.derivedRoadmap || undefined
        });
        const greetingName = derivedName && derivedName !== 'New Course' ? derivedName : (data.unitCode || 'this course');
        const count = confirmed.assessmentTitles.length;
        let greeting;
        const hasParetoLitReview = confirmed.derivedRoadmap?.paretoSteps &&
          confirmed.assessmentTitles.some(t => /literature review/i.test(t));
        if (hasParetoLitReview) {
          greeting = `I've grounded your ${greetingName} Literature Review. We have 25 marks on the line\u2014should we start with Step 1 (Locking your Topic)?`;
        } else if (count === 0) {
          greeting = `Course ${greetingName} confirmed. No assessments detected. Drop a fuller syllabus to unlock the roadmap.`;
        } else if (count === 1) {
          greeting = `Course ${greetingName} confirmed. One pillar mapped.`;
        } else {
          greeting = `Course ${greetingName} confirmed. ${count} pillars mapped.`;
        }
        speakSystemMessage(greeting, `${greetingName} confirmed.`);
      } finally {
        window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      }
    } else {
      // No LLM available: clear the shadow flag so the draft is
      // treated as final. The student gets the same regex roadmap
      // without a perpetual DRAFT badge.
      upgradeCourseExtraction(courseId, { extractionData: { shadow: false } });
    }
    return courseId;
  };

  // Mirror UniversalOnboarding.classifyFile so the bundled PDFs feed
  // the extractor in Outline → Brief → Rubric order. The merged rawText
  // then opens with the canonical assessment table; Ollama's first
  // window picks it up and the regex pre-extraction sees outline
  // weightings before brief sub-component weightings.
  const classifyGroundingFile = (file) => {
    const n = (file.name || '').toLowerCase();
    if (/outline|course[ _-]?info|co[_-]/i.test(n)) return 0;
    if (/brief|assess|task|instruction/i.test(n)) return 1;
    if (/rubric|criteria|marking/i.test(n)) return 2;
    return 3;
  };

  // Ingest every PDF currently committed to /src/grounding/active/.
  // Triggered by the cockpit top-nav button. Groups files by unit code
  // (e.g. BABS1201, BABS1202) BEFORE extraction so each course code
  // gets its own cockpit entry with only its own documents. Files
  // without a recognisable code fall into a fallback group keyed by the
  // profile course name.
  const handleIngestGrounding = async () => {
    if (ingesting) return;
    setIngesting(true);
    setIngestStatus('Locating grounding folder...');
    window.dispatchEvent(new CustomEvent(REASONING_START_EVENT));
    try {
      const files = (await fetchGroundingPdfs()).sort((a, b) => classifyGroundingFile(a) - classifyGroundingFile(b));
      if (files.length === 0) {
        setIngestStatus('Nothing in /src/grounding/active/.');
        if (typeof console !== 'undefined') console.warn('[handleIngestGrounding] no PDFs returned by GroundingLoader');
        return;
      }

      // Group files by unit code before extraction
      const codeRegex = /\b([A-Z]{3,4}\d{4})\b/;
      const fileGroups = {};
      for (const file of files) {
        const match = (file.name || '').match(codeRegex);
        const code = match ? match[1] : (profile.courseName || 'Unknown');
        if (!fileGroups[code]) fileGroups[code] = [];
        fileGroups[code].push(file);
      }

      // Sort codes so BABS1201 is processed last and becomes the
      // active course (addCourseWithData sets activeCourseId on each
      // call; last one wins).
      const codes = Object.keys(fileGroups).sort((a, b) => {
        if (a === 'BABS1201') return 1;
        if (b === 'BABS1201') return -1;
        return a.localeCompare(b);
      });

      if (typeof console !== 'undefined') console.info('[handleIngestGrounding] detected', codes.length, 'unit groups:', codes.join(', '));

      for (const code of codes) {
        const groupFiles = fileGroups[code];
        let aggregated = {
          unitCode: code,
          level: profile.level,
          theme: 'General',
          sourceFiles: groupFiles.map(f => f.name)
        };
        for (let i = 0; i < groupFiles.length; i++) {
          const file = groupFiles[i];
          setIngestStatus(`Scanning ${code}: ${file.name}`);
          if (typeof console !== 'undefined') console.info('[handleIngestGrounding] processing', file.name, 'group=', code, 'class=', classifyGroundingFile(file));
          try {
            const text = await processDocumentWithGCP(file, 'mock_jwt_token_xyz123');
            const deepData = extractDeepCourseData(text);
            aggregated = mergeExtractionData(aggregated, { ...deepData, rawText: text });
          } catch (err) {
            if (typeof console !== 'undefined') console.warn('[handleIngestGrounding] skipped', file.name, err && err.message);
          }
        }
        setIngestStatus(`Creating ${code} cockpit...`);
        await handleSprintCreation(aggregated);
      }

      setIngestStatus(`Ingested ${files.length} file${files.length === 1 ? '' : 's'} across ${codes.length} course${codes.length === 1 ? '' : 's'}.`);
    } catch (err) {
      if (typeof console !== 'undefined') console.error('[handleIngestGrounding] failed', err);
      setIngestStatus(`Ingestion failed: ${err && err.message ? err.message : 'unknown error'}`);
    } finally {
      window.dispatchEvent(new CustomEvent(REASONING_END_EVENT));
      setIngesting(false);
      // Clear the status line after a few seconds so the nav does not
      // stay cluttered. The Shadow State pill keeps the user informed
      // while the LLM confirmation pass finishes.
      setTimeout(() => setIngestStatus(''), 6000);
    }
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
    speakSystemMessage('Audio test. AURA is online, sovereign, and listening.');
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
    <div className={`h-screen w-full bg-stone-50 text-zinc-900 flex flex-col font-sans overflow-hidden transition-colors duration-1000 ${getOverlayColor()} ${isZenMode ? 'zen-mode-active' : ''}`}>
      {/* Top Navigation Bar */}
      <div className={`h-[70px] shrink-0 flex items-center justify-between px-8 border-b border-zinc-800 bg-black/80 backdrop-blur-md relative z-[1200] transition-all duration-700 ${isZenMode ? '-translate-y-full' : 'translate-y-0'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setViewMode('gallery')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors">
              <Brain size={18} className="text-indigo-400" />
            </div>
            <span className="font-black tracking-widest uppercase text-sm bg-gradient-to-r from-indigo-400 to-indigo-600 text-transparent bg-clip-text">
              Simplifii
            </span>
          </button>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="text-[12px] font-bold text-zinc-500 tracking-[0.2em] uppercase">
            Sovereign OS
          </span>
          <div className="ml-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
            Zero Disclosure
          </div>
          <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-black uppercase tracking-widest transition-all bg-emerald-500/10 border-emerald-500/50 text-emerald-400 cursor-help" title="Sovereign Engine Active">
            <HardDrive size={10} /> Sovereign
          </div>
          {/* Shadow State pill. Surfaces while the cockpit is showing
              regex-derived draft data and the LLM Confirmed Truth pass
              is still in flight. Disappears the moment the upgrade
              lands or the no-LLM fallback clears the shadow flag. */}
          {activeCourse?.extractionData?.shadow && (
            <div className="ml-2 flex items-center gap-2 px-3 py-1 rounded-full border text-[12px] font-black uppercase tracking-widest bg-amber-500/10 border-amber-500/40 text-amber-300 cursor-help" title="Draft roadmap from regex. Refining via Ollama; the cockpit will swap to confirmed truth automatically.">
              <RefreshCw size={10} className="animate-spin" /> Draft  ·  refining
            </div>
          )}
        </div>

        <div className="flex items-center gap-5 relative z-[1300]">
          {/* NOT VERIFIED badge: appears when the student opted into
              Ghost Mode (skipped the vault). Visible signal that
              History of Thought is NOT capturing this session. */}
          {ghostMode && (
            <button
              type="button"
              onClick={() => { setGhostMode(false); setVaultDismissed(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-black uppercase tracking-widest transition-all cursor-pointer bg-rose-500/10 border-rose-500/40 text-rose-300 hover:bg-rose-500/20"
              title="Ghost Mode: no events recorded. Click to unlock the vault."
            >
              <Shield size={11} /> NOT VERIFIED
            </button>
          )}
          {/* Scaffolder overlay: tiered support engine (Primary / Secondary
              / Tertiary). Re-renders the active assessment as a quest,
              checklist, or skeleton timeline depending on the learner's
              profile.level. */}
          {/* Peripheral toolbar. data-focus-locked dims these buttons
              during an active FocusSession so the only visible action
              surface is the cockpit + AURA + SOS. Setting the attribute
              on each button (rather than a wrapping div) keeps the
              flexbox layout untouched. */}
          <button
            data-focus-locked="true"
            onClick={() => setShowScaffolder(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer bg-transparent border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            title="Open Sovereign Scaffolder (tiered support overlay)"
          >
            <Sparkles size={14} /> Scaffolder
          </button>
          {/* Steering Drawer trigger. Persona / Scaffolding / Grit / LOD
              dials live inside the drawer; this button is the only way
              in. Stays unlocked during focus sessions because the
              student may need to dial the OS down without ending the
              sprint. */}
          <button
            onClick={() => setShowSteering(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer bg-transparent border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            title="Open Steering Drawer (Persona, Scaffolding, Grit, LOD)"
          >
            <Sparkles size={14} /> Steering
          </button>
          {/* Ingest Grounding Folder. Bridges the gap between the PDFs
              committed to /src/grounding/active/ and the running
              cockpit. Disabled when the folder is empty (require.context
              returned zero files) and while an ingestion is in flight.
              Stays unlocked during focus sessions; rare but useful if
              new grounding files arrive mid-sprint. */}
          {groundingCount > 0 && (
            <button
              onClick={handleIngestGrounding}
              disabled={ingesting}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${ingesting ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 cursor-wait' : 'bg-transparent border-amber-500/40 text-amber-400 hover:bg-amber-500/10'} disabled:cursor-wait`}
              title={ingesting ? (ingestStatus || 'Scanning grounding folder...') : `Ingest ${groundingCount} PDF${groundingCount === 1 ? '' : 's'} from /src/grounding/active/ into the cockpit.`}
            >
              {ingesting
                ? <RefreshCw size={14} className="animate-spin" />
                : <FileText size={14} />}
              {ingesting ? 'Scanning...' : 'Ingest Grounding'}
            </button>
          )}
          {/* Studio toggle: switch between classic LinearCanvas and the
              tri-column SimplifiiStudio (NotebookLM-style) layout */}
          <button
            data-focus-locked="true"
            onClick={() => setShowStudio(v => !v)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${showStudio ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-transparent border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'}`}
            title={showStudio ? 'Switch to Classic Cockpit' : 'Switch to Studio (tri-column)'}
          >
            <Sparkles size={14} /> {showStudio ? 'Classic' : 'Studio'}
          </button>
          {/* View as Speech Button */}
          <button
            data-focus-locked="true"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-view-mode'))}
            className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 cursor-pointer"
          >
            <Sparkles size={14} /> View as Speech
          </button>
          {/* UDL Overrides Button */}
          <button
            data-focus-locked="true"
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-accessibility'))}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${isBionicActive || overlayTint !== 'none' || isRulerActive ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' : 'bg-transparent border-zinc-700 text-zinc-400'} hover:text-white hover:border-zinc-500`}
          >
            <Sparkles size={14} /> UDL Overrides
          </button>

          {/* Literal Mode Toggle */}
          <button
            data-focus-locked="true"
            type="button"
            role="switch"
            aria-checked={isLiteralMode}
            aria-label="Toggle Literal Mode"
            onClick={() => setIsLiteralMode(prev => !prev)}
            className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800 cursor-pointer hover:border-zinc-600 transition-colors"
          >
            <span className="text-[12px] font-bold uppercase tracking-widest text-zinc-500">Literal Mode</span>
            <span className={`w-10 h-5 rounded-full relative transition-colors ${isLiteralMode ? 'bg-indigo-500' : 'bg-zinc-700'}`}>
              <span className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${isLiteralMode ? 'translate-x-6' : 'translate-x-1'}`}></span>
            </span>
          </button>

          <button
            onClick={() => setShowSupportBridge(true)}
            className="flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white shadow-glow-rose cursor-pointer"
          >
            <AlertTriangle size={14} /> SOS
          </button>
        </div>
      </div>

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
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
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
          <div className="relative w-full max-w-5xl m-8 bg-zinc-950 border border-emerald-500/30 rounded-3xl shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden flex flex-col">
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

      {/* Global Sprints Sidebar (Left). data-focus-locked dims and
          click-protects the rail when an ExecutiveSpine FocusSession
          is active (CSS rule: simplifii-studio.css). The active task
          column stays unlocked. */}
      <aside data-focus-locked="true" className={`${leftSidebarClass} border-r border-zinc-800/50 bg-black/40 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-10 relative overflow-hidden pt-44`}>
        {!isZenMode && (
          <button 
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className="absolute -right-3 top-24 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:border-emerald-500 transition-all"
          >
            {isLeftCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        <div className={`flex items-center gap-2 mb-10 mt-5 transition-opacity ${isLeftCollapsed ? 'opacity-0 h-0 overflow-hidden mb-0 mt-0' : 'opacity-100'}`}>
          <div className="bg-emerald-500 p-1.5 rounded-lg shadow-glow-emerald"><Brain size={20} className="text-black" /></div>
          <span className="font-black text-lg tracking-tighter whitespace-nowrap">SIMPLIFII-OS</span>
        </div>

        {isLeftCollapsed && !isZenMode && (
          <div className="flex flex-col items-center mt-5 space-y-8">
            <div className="bg-emerald-500 p-1.5 rounded-lg shadow-glow-emerald"><Brain size={20} className="text-black" /></div>
            <Layout size={20} className="text-zinc-600" />
            <Target size={20} className="text-zinc-600" />
          </div>
        )}
        
        {!isLeftCollapsed && (
          <>
            {activeCourse?.roadmap?.paretoSteps && (
              <div className="mb-4 px-2 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <p className="text-[12px] font-black uppercase tracking-widest text-emerald-400 text-center">Total Assessment Weight: {activeCourse.roadmap.totalWeight || '25%'}</p>
              </div>
            )}
            {/* Course Switcher: pick the active course; data scopes follow. */}
            <div className="mb-6">
              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-2 px-2">Active Course</p>
              <select
                value={activeCourseId}
                onChange={(e) => setActiveCourseId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 outline-none cursor-pointer"
              >
                {Object.entries(courses).map(([id, c]) => (
                  <option key={id} value={id}>{c.name || '(unnamed)'}</option>
                ))}
              </select>
              {courseEditMode ? (
                <div className="mt-2 flex gap-2">
                  <input
                    ref={courseEditInputRef}
                    value={courseEditValue}
                    onChange={(e) => setCourseEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); commitCourseEdit(); }
                      if (e.key === 'Escape') { e.preventDefault(); cancelCourseEdit(); }
                    }}
                    placeholder={courseEditMode === 'add' ? 'New course name' : 'Course name'}
                    className="flex-1 bg-black/60 border border-emerald-500/40 rounded-lg px-3 py-2 text-xs font-bold text-white placeholder-zinc-600 focus:border-emerald-500 outline-none"
                  />
                  <button
                    onClick={commitCourseEdit}
                    className="text-[12px] font-black text-black bg-emerald-500 hover:bg-emerald-400 uppercase tracking-widest py-2 px-3 rounded-lg transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelCourseEdit}
                    className="text-[12px] font-black text-zinc-500 hover:text-white uppercase tracking-widest border border-zinc-800 hover:border-zinc-600 py-2 px-3 rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setShowAddCourseModal(true)}
                  className="flex-1 text-[12px] font-black text-emerald-400 hover:text-black hover:bg-emerald-500 uppercase tracking-widest border border-emerald-500/30 hover:border-emerald-500 py-2 rounded-lg transition-all"
                  title="Drop a syllabus PDF; the OS names the course itself"
                >
                  + Add Course
                </button>
                <button
                  onClick={() => { setCourseEditValue(courses[activeCourseId]?.name || ''); setCourseEditMode('rename'); }}
                  className="text-[12px] font-black text-zinc-500 hover:text-white uppercase tracking-widest border border-zinc-800 hover:border-zinc-600 py-2 px-3 rounded-lg transition-all"
                  title="Rename active course"
                >
                  Edit
                </button>
                <button
                  onClick={() => setPendingDeleteCourseId(activeCourseId)}
                  disabled={Object.keys(courses).length <= 1}
                  className="text-[12px] font-black text-zinc-500 hover:text-rose-400 uppercase tracking-widest border border-zinc-800 hover:border-rose-500 py-2 px-3 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-zinc-500 disabled:hover:border-zinc-800"
                  title={Object.keys(courses).length <= 1 ? 'Cannot delete the only course' : 'Delete active course'}
                  aria-label="Delete active course"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              )}
            </div>

            {!isBooting && (activeCourse.roadmap.currentTask || activeCourse.roadmap.nextAssessment || activeCourse.roadmap.finalMilestone) && (
              <>
                <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2 whitespace-nowrap">Semester Roadmap</p>

                {activeCourse.roadmap.paretoSteps ? (
                  <div className="mb-8 bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-4 shadow-[0_0_30px_rgba(16,185,129,0.08)]">
                    <p className="text-[12px] font-black uppercase tracking-widest text-emerald-400 mb-4">Pareto Micro-Steps</p>
                    <div className="border-l border-emerald-500/30 ml-1 space-y-4">
                      {activeCourse.roadmap.paretoSteps.map((step, i) => (
                        <div key={i} className={`relative pl-5 group ${i > 0 ? 'opacity-60 hover:opacity-100' : ''} transition-opacity cursor-pointer`}>
                          <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-zinc-700 border border-zinc-600'}`}></div>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-[12px] font-black uppercase ${i === 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>Step {step.rank}</p>
                            <span className="text-[12px] font-bold text-zinc-600">{step.weight}</span>
                          </div>
                          <p className={`text-xs font-bold ${i === 0 ? 'text-white' : 'text-zinc-300'}`}>{step.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 px-2 border-l border-zinc-800 ml-2 space-y-4 relative">
                    {activeCourse.roadmap.currentTask && (
                      <div className="relative pl-4 group">
                        <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <p className="text-[12px] font-black uppercase text-emerald-400">Current Task</p>
                        <p className="text-xs text-white font-bold">{activeCourse.roadmap.currentTask}</p>
                      </div>
                    )}
                    {activeCourse.roadmap.nextAssessment && (
                      <div className="relative pl-4 group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600"></div>
                        <p className="text-[12px] font-black uppercase text-zinc-500">Next Assessment</p>
                        <p className="text-xs text-zinc-300 font-bold">{activeCourse.roadmap.nextAssessment}</p>
                      </div>
                    )}
                    {activeCourse.roadmap.finalMilestone && (
                      <div className="relative pl-4 group opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-zinc-700 border border-zinc-600"></div>
                        <p className="text-[12px] font-black uppercase text-zinc-500">Final Milestone</p>
                        <p className="text-xs text-zinc-300 font-bold">{activeCourse.roadmap.finalMilestone}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {!(activeCourse?.roadmap?.paretoSteps) && (
              <>
                <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-4 px-2 whitespace-nowrap">Active Context</p>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {isBooting || tasks.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 px-4 mt-10">
                      <Brain size={32} className="mx-auto mb-4 text-zinc-600" />
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">No Active Context</p>
                    </div>
                  ) : tasks.length > 5 ? (
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4">
                      <p className="text-[12px] font-black uppercase text-emerald-400 tracking-widest mb-2">Neural Summary</p>
                      <p className="text-xs text-zinc-400 font-bold mb-3">{tasks.length} tasks detected. Showing top 5 milestones.</p>
                      {tasks.slice(0, 5).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-zinc-800/50 last:border-0">
                          <span className="text-[12px] font-black text-zinc-600 w-5">{i + 1}.</span>
                          <p className="text-xs text-white font-bold truncate">{t.task}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    tasks.map((t, i) => (
                      <TaskCard key={i} task={t} onStart={() => {}} isActive={activeTask?.task === t.task} />
                    ))
                  )}
                </div>
              </>
            )}

            {!isBooting && tasks.length > 0 && (
              <div className="mt-auto shrink-0 flex flex-col gap-4 pt-4 border-t border-zinc-800/50">
                <div className="bg-black border border-zinc-800 p-3 rounded-xl flex items-start gap-3">
                  <Shield size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-black uppercase text-white tracking-widest mb-1">Zero-Disclosure Data</p>
                    <p className="text-[12px] text-zinc-500 leading-relaxed whitespace-normal font-bold">Your cognitive telemetry is visible only to you and is never shared with your university.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={simulateVoiceNote} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-xs py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] truncate">
                    Simulate Voice 🎙️
                  </button>
                  <button onClick={generatePremiumPDF} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-[12px] py-3 rounded-xl transition-all truncate">
                    Export Proof
                  </button>
                </div>
              </div>
            )}
            
            {isBooting && (
              <div className="mt-auto shrink-0 pt-4 border-t border-zinc-800/50">
                <div className="bg-black border border-zinc-800 p-3 rounded-xl flex items-start gap-3">
                  <Shield size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[12px] font-black uppercase text-white tracking-widest mb-1">Zero-Disclosure OS</p>
                    <p className="text-[12px] text-zinc-500 leading-relaxed whitespace-normal font-bold">Student-first architecture. Waiting for handshake to unlock context.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </aside>

      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>

      {/* Global Archive Sidebar (Right) */}
      {currentStage === 5 && (
        <aside className={`${rightSidebarClass} bg-black/80 backdrop-blur-xl border-l border-zinc-900 flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-50 relative overflow-hidden`}>
          {!isZenMode && (
            <button 
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="absolute -left-3 top-24 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:border-blue-500 transition-all"
            >
              {isRightCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          )}

          {isRightCollapsed && !isZenMode ? (
            <div className="flex flex-col items-center mt-5 space-y-8 pt-6">
              <Shield size={20} className="text-blue-500" />
            </div>
          ) : !isZenMode && (
            <>
              <div className="p-5 flex items-center gap-3 text-blue-500 whitespace-nowrap pt-8">
                <Shield size={24} className="shrink-0" />
                <h3 className="font-black tracking-widest uppercase text-sm">Cognitive Archive</h3>
              </div>
              <div
                className="flex-1 overflow-y-auto px-6 pb-6 whitespace-nowrap custom-scrollbar"
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-1', 'ring-blue-500/40'); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove('ring-1', 'ring-blue-500/40'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('ring-1', 'ring-blue-500/40');
                  const textData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
                  if (!textData) return;
                  const isUrl = /^https?:\/\//.test(textData);
                  const newAsset = {
                    id: Date.now().toString(),
                    blockId: 'archive',
                    source: isUrl ? new URL(textData).hostname : textData.slice(0, 50),
                    text: isUrl ? `Extracted Insight from ${new URL(textData).hostname}: pending semantic mapping.` : textData,
                    author: 'Manual capture',
                    year: new Date().getFullYear().toString(),
                    isPrimary: false
                  };
                  handleAddGhostAsset(newAsset);
                }}
              >
                {(() => {
                  const courseAssets = globalGhostAssets.filter(a => a.courseId === activeCourseId);
                  if (courseAssets.length === 0) {
                    return (
                      <div className="text-zinc-500 text-xs font-bold mt-10 px-2">
                        <p>No embedded assets for this course yet.</p>
                        <p className="mt-2 font-medium normal-case text-[11px] leading-relaxed text-zinc-600">Drag a research URL or text snippet directly here, or drop it on a section in the Canvas. Assets stay scoped to the active course.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-4">
                      {courseAssets.map(asset => (
                        <div key={asset.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl max-w-full">
                          <p className="text-[12px] font-black uppercase text-emerald-400 mb-2 truncate">{asset.blockId === 'archive' ? `Source: ${asset.source}` : `Block: ${asset.blockId}`}</p>
                          <p className="text-xs text-zinc-300 whitespace-normal line-clamp-3">{asset.text}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </aside>
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
