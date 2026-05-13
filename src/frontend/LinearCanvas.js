import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Save, AlertCircle, FileText, CheckCircle2, GripVertical, Network, Activity, CheckCircle, Circle, Type, Mic, Edit3, MessageSquare, Zap, Clock, BookOpen, ArrowRight, Wand2, Target, Flag, ChevronLeft, ChevronRight, BrainCircuit, Volume2, LifeBuoy, Shield, Maximize2, Minimize2, Eye, HardDrive, Code, Loader2 } from 'lucide-react';
import { ACCENT_GLOW } from '../theme/tokens';
import { speakSystemMessage } from '../services/MessagingHub';
import { getPersonaResponse } from '../services/PersonaEngine';
import { elevateRigour as rewriteElevateRigour, synthesise as rewriteSynthesise, applyLogicMode as rewriteApplyLogicMode } from '../services/RewriteService';
import { generateAuthenticityPDF, getEventCount } from '../services/ExportService';
import { saveBlockSnapshot, getBlockHistory } from '../services/IndexedDBService';
import ZenTools from './ZenTools';
import { useProject } from './ProjectContext';
import SupportBridge from './SupportBridge';
import AccessibilityVault from './AccessibilityVault';
import DevInsightsPanel from './DevInsightsPanel';
import BionicText from './BionicText';
import { useSettings } from './SettingsContext';

// Sprint 5.3: Haptic Status. Fires a double-pulse on mobile/haptic-capable
// hardware when a section reaches 100% health. Deaf-Blind users feel essay
// growth without relying on screen or sound.
const SECTION_HEALTH_TARGET = 200; // words; mirrors SectionHealth component default

// Sprint 5.3: inject once, global within the Authoring Cockpit (role=main).
// Applies the WCAG 2.1 AA focus ring to every interactive element during
// keyboard or eye-tracker navigation. Never fires on mouse clicks (:focus-visible).
let cockpitCSSInjected = false;
function injectCockpitCSS() {
  if (cockpitCSSInjected || typeof document === 'undefined') return;
  const el = document.createElement('style');
  el.textContent = `
[role="main"] button:focus-visible,
[role="main"] [role="button"]:focus-visible {
  outline: 3px solid #f4f4f5;
  outline-offset: 2px;
}`.trim();
  document.head.appendChild(el);
  cockpitCSSInjected = true;
}

function triggerHapticPulse() {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([100, 50, 100]);
  }
}

const ASSESSMENT_INSTRUCTIONS = [
  { id: 'inst1', label: 'Analyse Methodologies', detail: 'Critically compare the primary sources.', template: 'Start by comparing the methodologies to the primary literature...', dwTarget: 'dw2' },
  { id: 'inst2', label: 'Identify Gap', detail: 'Highlight what remains unknown in the field.', template: 'This highlights a significant gap in our understanding of...', dwTarget: 'dw3' },
  { id: 'inst3', label: 'Synthesise Findings', detail: 'Combine evidence to support thesis.', template: 'By synthesising these findings, it becomes evident that...', dwTarget: 'dw1' },
  // Sprint 5.2: Inclusive Sovereignty. Easy Read rewrites selected text into
  // Level 1 English: short sentences, active verbs, zero academic jargon.
  // Supports users with intellectual or processing disabilities.
  { id: 'easy_read', label: 'Clarify Logic', detail: 'Plain English. Short sentences. No jargon.', template: 'The key point is...', dwTarget: 'dw1' },
  // Sprint 5.3: Faded Scaffold. Returns the first two-thirds of the passage
  // as polished prose, then replaces the final two sentences with [STEM] prompts
  // the student must complete. Reduces blank-page paralysis for neurodivergent users.
  { id: 'faded_scaffold', label: 'Faded Scaffold', detail: 'Gives you a start. You finish the last two sentences.', template: 'Building on the evidence above...', dwTarget: 'dw2' },
  // Sprint 8.1: Rubric Alignment. Checks the section against the HD criteria
  // extracted from the marking rubric. Returns a numbered review, not a rewrite.
  { id: 'align_to_rubric', label: 'Align to Rubric', detail: 'Check this section against the High Distinction criteria.', template: 'Against the HD criteria...', dwTarget: 'dw3' },
  // Sprint 8.2: Universal View. Returns the passage simultaneously rendered in
  // three cognitive registers: academic, plain-language, and action-step.
  { id: 'universal_view', label: 'Universal View', detail: 'See this as academic text, plain English, and action steps.', template: 'Viewing through three lenses...', dwTarget: 'dw1' },
  // Sprint 8.1 Sovereign Translator. EASL Bridge strips institutional jargon
  // from uploaded task instructions and rebuilds them in plain, actionable language.
  { id: 'easl_bridge', label: 'Translate Instructions', detail: 'Convert task instructions into plain language.', template: 'Plain-language version...', dwTarget: 'dw2' },
  // Friction-to-Action. Converts dense bureaucratic text into numbered steps
  // with bolded action verbs and a Definition of Done line at the end.
  { id: 'friction_to_action', label: 'Action Steps', detail: 'Break this into numbered steps with clear verbs.', template: '1. Read the brief...', dwTarget: 'dw3' },
];

const MOCK_TYPOS = ['teh', 'recieve', 'thier', 'definitly', 'cool', 'stuff', 'things'];

// Sprint 7.2: Grounding Audit. Renders [G] superscript pins next to
// AI-assisted sentences. Each pin shows a tooltip with the source PDF
// filename and verbatim snippet used for grounding. JetBrains Mono 9px
// per the Visual Law requirement.
function renderGroundingPin(citations) {
  if (!citations || citations.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2 mb-1" aria-label="Grounding citations for AI-assisted passage">
      {citations.map((c, i) => (
        <div key={i} className="relative group/gpin inline-flex items-center">
          <span
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', fontWeight: 700 }}
            className="text-zinc-400 border border-zinc-700 px-1.5 py-0.5 rounded cursor-help select-none hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
            aria-label={`Grounding citation ${i + 1}: ${c.source}. Snippet: ${c.snippet}`}
            tabIndex={0}
          >
            [G{i + 1}]
          </span>
          {/* Tooltip: appears on hover and on keyboard focus */}
          <div
            className="absolute bottom-full left-0 mb-2 z-50 min-w-[240px] max-w-[320px] bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-2xl
                       pointer-events-none opacity-0 group-hover/gpin:opacity-100 group-hover/gpin:pointer-events-auto transition-opacity duration-150"
            role="tooltip"
          >
            <p
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
              className="text-zinc-400 uppercase tracking-widest font-bold mb-1"
            >
              Source: {c.source}
            </p>
            <p className="text-zinc-300 text-[10px] leading-relaxed italic">
              &ldquo;{c.snippet}&rdquo;
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToneHUD({ content, onRigorDrop, isTyping, isStressed }) {
  const wordCount = (content.match(/\S+/g) || []).length;
  const longWords = (content.match(/\b\w{8,}\b/g) || []).length;
  const rigor = Math.min(Math.max((longWords / (wordCount || 1)) * 300, 20), 98);
  
  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const uniqueWords = new Set(words).size;
  const semanticDensity = Math.min(Math.max((uniqueWords / (words.length || 1)) * 150, 10), 95);

  const [hasLocked, setHasLocked] = useState(false);
  const isLocked = rigor > 85;
  const isDensityWarning = wordCount > 50 && semanticDensity < 40;

  useEffect(() => {
    if (wordCount > 10 && rigor < 50) {
      onRigorDrop();
    }
  }, [rigor, wordCount]);

  useEffect(() => {
    if (isDensityWarning && isTyping) {
      speakSystemMessage("We've hit a word-count bottleneck. Let's look for filler words together.", "Semantic density low.");
    }
  }, [isDensityWarning]);

  useEffect(() => {
    if (isLocked && !hasLocked) {
      setHasLocked(true);
      speakSystemMessage("Strong logic. That anchors your methodology perfectly.", "Rigour locked. Excellent structure.");
    }
  }, [isLocked, hasLocked]);

  return (
    <div className={`mt-6 flex items-center gap-8 border-t border-zinc-800/50 pt-4 w-full transition-all duration-300 ${isTyping ? 'opacity-100 shadow-[0_-10px_20px_rgba(16,185,129,0.05)]' : 'opacity-50'}`}>
      <div className="flex items-center gap-2 shrink-0 relative">
        <Activity size={14} className={`transition-all duration-300 ${isTyping ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)] scale-110' : 'text-emerald-500'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Vibe Meter</span>
        {isTyping && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500/30 animate-ping"></div>}
      </div>
      <div className="flex-1 max-w-[200px]">
        <div className="flex justify-between mb-1 items-center">
          <span className="text-[9px] font-black uppercase text-zinc-400">Academic Rigor</span>
          <div className="flex items-center gap-1">
            {isLocked && <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-1 rounded animate-pulse">Locked</span>}
            <span className={`text-[9px] font-black ${isLocked ? 'text-emerald-400 shadow-glow-emerald' : 'text-emerald-500'}`}>{Math.round(rigor)}%</span>
          </div>
        </div>
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500${isStressed ? ' animate-pulse' : ''}`}
            style={{
              width: `${rigor}%`,
              background: isStressed ? '#ef4444' : isLocked ? ACCENT_GLOW : '#10b981',
              boxShadow: isStressed
                ? '0 0 10px rgba(239,68,68,0.8)'
                : isLocked ? `0 0 10px ${ACCENT_GLOW}cc` : 'none'
            }}
          ></div>
        </div>
      </div>
      <div className="flex-1 max-w-[200px]">
        <div className="flex justify-between mb-1 items-center">
          <span className="text-[9px] font-black uppercase text-zinc-400">Semantic Density</span>
          <span className={`text-[9px] font-black ${isDensityWarning ? 'text-amber-500' : 'text-blue-500'}`}>{Math.round(semanticDensity)}%</span>
        </div>
        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-500 ${isDensityWarning ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${semanticDensity}%` }}></div>
        </div>
      </div>
      <div className="ml-auto">
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">
          <Network size={12} /> Branch Version
        </button>
      </div>
    </div>
  );
}

const SectionHealth = ({ content, target = 200 }) => {
  const wordCount = (content.match(/\S+/g) || []).length;
  const percentage = Math.min((wordCount / target) * 100, 100);
  const strokeDasharray = 113; 
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;
  
  return (
    <div className="absolute top-8 right-8 flex items-center justify-center group/health cursor-help">
      <svg width="40" height="40" className="transform -rotate-90">
        <circle cx="20" cy="20" r="18" fill="transparent" stroke="#27272a" strokeWidth="3" />
        <circle 
          cx="20" cy="20" r="18" 
          fill="transparent" 
          stroke="#10b981" 
          strokeWidth="3" 
          strokeDasharray={strokeDasharray} 
          strokeDashoffset={strokeDashoffset} 
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-[9px] font-black text-emerald-500">{wordCount}</span>
      <div className="absolute top-12 right-0 opacity-0 group-hover/health:opacity-100 transition-opacity bg-black border border-zinc-800 p-2 rounded text-[10px] whitespace-nowrap z-50">
        Section Health: {wordCount} / {target} words
      </div>
    </div>
  );
};

function SectionHistory({ blockId, currentContent, isActive, onRevert }) {
  const [history, setHistory] = useState([]);
  const [sliderVal, setSliderVal] = useState(0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const scrubTimer = useRef(null);

  useEffect(() => {
    getBlockHistory(blockId).then(data => {
      setHistory(data);
      if (data.length > 0) setSliderVal(data.length - 1);
    });
  }, [blockId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentContent && (history.length === 0 || history[history.length - 1].content !== currentContent)) {
        saveBlockSnapshot(blockId, currentContent).then(() => {
          getBlockHistory(blockId).then(data => {
            setHistory(data);
            setSliderVal(data.length - 1);
          });
        });
      }
    }, 15000); 
    return () => clearTimeout(timer);
  }, [currentContent, history, blockId]);

  const handleSliderChange = (e) => {
    setSliderVal(Number(e.target.value));
    setIsScrubbing(true);
    if (scrubTimer.current) clearTimeout(scrubTimer.current);
    scrubTimer.current = setTimeout(() => setIsScrubbing(false), 2000);
  };

  const handleSliderHover = () => {
    if (history[sliderVal]) {
      const minsAgo = Math.max(1, Math.round((Date.now() - history[sliderVal].timestamp) / 60000));
      speakSystemMessage(`${minsAgo} minutes ago.`);
    }
  };

  if (!isActive || history.length < 2) return null;

  const historicalText = history[sliderVal]?.content || '';
  const currentWords = currentContent.split(' ');
  const historyWords = historicalText.split(' ');

  return (
    <>
      {isScrubbing && sliderVal < history.length - 1 && (
        <div className="absolute inset-0 pointer-events-none p-10 -mx-10 z-20">
          <div className="mt-14 w-full h-[200px] text-2xl leading-loose font-medium opacity-90 transition-opacity duration-300">
            {historyWords.map((word, i) => {
              const isDifferent = currentWords[i] !== word;
              return (
                <span key={i} className={`transition-colors duration-500 ${isDifferent ? 'text-emerald-400 bg-emerald-500/10 rounded px-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'text-zinc-400'}`}>
                  {word}{' '}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 border-t border-zinc-800/50 pt-4 flex items-center gap-4 animate-fade-in relative z-30">
        <Clock size={14} className="text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Neural Rewind</span>
        <input 
          type="range" 
          min="0" 
          max={Math.max(0, history.length - 1)} 
          value={sliderVal}
          onChange={handleSliderChange}
          onMouseEnter={() => setTimeout(handleSliderHover, 1000)}
          className="flex-1 accent-emerald-500 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer"
        />
        {sliderVal < history.length - 1 && (
          <button 
            onClick={() => onRevert(historicalText)}
            className="text-[10px] font-black uppercase text-emerald-500 hover:text-emerald-400"
          >
            Restore
          </button>
        )}
      </div>
    </>
  );
}

const DEFAULT_LINEAR_SECTIONS = [
  { id: 'intro', title: 'Introduction', content: '', neuralTemplate: '' },
  { id: 'body_1', title: 'Main Body Paragraph 1', content: '', neuralTemplate: '' },
  { id: 'body_2', title: 'Main Body Paragraph 2', content: '', neuralTemplate: '' },
  { id: 'conclusion', title: 'Conclusion', content: '', neuralTemplate: '' }
];

const linearStorageKey = (courseId) => `simplifii_linear_canvas_${courseId || 'default'}`;

// Best-effort partial recovery: keep what parses cleanly, drop malformed sections.
function recoverSections(raw) {
  if (!raw) return DEFAULT_LINEAR_SECTIONS;
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return DEFAULT_LINEAR_SECTIONS; }
  if (!Array.isArray(parsed)) return DEFAULT_LINEAR_SECTIONS;
  const cleaned = parsed
    .filter(s => s && typeof s === 'object' && typeof s.id === 'string' && typeof s.title === 'string')
    .map(s => ({
      id: s.id,
      title: s.title,
      content: typeof s.content === 'string' ? s.content : '',
      neuralTemplate: typeof s.neuralTemplate === 'string' ? s.neuralTemplate : ''
    }));
  return cleaned.length > 0 ? cleaned : DEFAULT_LINEAR_SECTIONS;
}

export default function LinearCanvas({
  extractionData, profile, courseId, onAddGhostAsset,
  isZenMode, setIsZenMode, isLeftCollapsed, setIsLeftCollapsed, isRightCollapsed, setIsRightCollapsed
}) {
  injectCockpitCSS();
  const { activeCourse, switchSprint } = useProject();
  const activeSprintTitle = activeCourse?.activeAssessmentTitle || null;
  const [sections, setSections] = useState(() => {
    try { return recoverSections(localStorage.getItem(linearStorageKey(courseId))); }
    catch { return DEFAULT_LINEAR_SECTIONS; }
  });

  useEffect(() => {
    const key = linearStorageKey(courseId);
    const t = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(sections)); }
      catch { /* quota exceeded or storage unavailable */ }
    }, 500);
    return () => clearTimeout(t);
  }, [sections, courseId]);
  const [activeSectionId, setActiveSectionId] = useState('intro');
  const [bloomedSectionId, setBloomedSectionId] = useState(null);
  const [activeLogicMode, setActiveLogicMode] = useState(null);
  const [rewritingSectionId, setRewritingSectionId] = useState(null);
  const [isDyslexic, setIsDyslexic] = useState(profile?.processingStyles?.includes('Visual Scaffolding') || false);
  const [isLiteralMode, setIsLiteralMode] = useState(profile?.processingStyles?.includes('Audio-Augmented') || false);
  const [viewMode, setViewMode] = useState('academic'); // 'academic' or 'presentation'
  const [isProofing, setIsProofing] = useState(false);
  const [checklist, setChecklist] = useState(extractionData?.doneWhenChecklist || []);
  // Sync checklist when extractionData arrives or changes after mount.
  // useState above only reads on first render; a fresh handshake that
  // populates extractionData after mount needs this effect to push the
  // new doneWhenChecklist into state. Guard: only seed when the new
  // list is non-empty and has more items than the current one, so a
  // student's checked-off progress is not clobbered by a stale empty
  // re-render.
  useEffect(() => {
    const incoming = extractionData?.doneWhenChecklist;
    if (Array.isArray(incoming) && incoming.length > 0) {
      setChecklist(prev => incoming.length > prev.length ? incoming : prev);
    }
  }, [extractionData]);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [ghostAssets, setGhostAssets] = useState({});
  const [justCheckedId, setJustCheckedId] = useState(null);
  const [processingDropSectionId, setProcessingDropSectionId] = useState(null);
  const processingDropTimerRef = useRef(null);
  
  const containerRef = useRef(null);
  const [mappedBlocks, setMappedBlocks] = useState([]); 
  const [lineCoordsArray, setLineCoordsArray] = useState([]);
  const [hoverThread, setHoverThread] = useState(null); 
  const [semanticGaps, setSemanticGaps] = useState([]);
  
  const [showSupportBridge, setShowSupportBridge] = useState(false);
  const [showAccessibilityVault, setShowAccessibilityVault] = useState(false);
  const [showSosPulse, setShowSosPulse] = useState(false);
  const { fontScale, lineSpacing, isBionicActive, bionicIntensity, isDriveAttached, persona, gritLevel, scaffoldingLevel, isLiteralMode: steeringLiteralMode, isStressed } = useSettings();
  const [showDevInsights, setShowDevInsights] = useState(false);
  // Sprint 7.1: event count drives the Export Proof button pulse state.
  const [hotEventCount, setHotEventCount] = useState(0);
  // Sprint 7.2: Grounding Audit. Maps section IDs to their citation arrays.
  // Populated whenever Synthesise or Elevate Rigour returns provenance metadata.
  const [sectionCitations, setSectionCitations] = useState({});
  // Sprint 8.1: Topic Picker. Stores the student's selected topic/prompt.
  // Injected into every AI prompt as FOCUS TOPIC so the model stays on-brief.
  const [selectedTopic, setSelectedTopic] = useState(null);
  useEffect(() => {
    getEventCount().then(setHotEventCount).catch(() => {});
  }, []);

  // Sprint 8.1 Sovereign Translator: Context Isolation Guard. When a new
  // ingest run fires purgeTransientContext() in useIngestion, it dispatches
  // simplifii:purge-context. Reset selectedTopic here so the Topic Picker
  // starts clean for the incoming course.
  useEffect(() => {
    const handler = () => setSelectedTopic(null);
    window.addEventListener('simplifii:purge-context', handler);
    return () => window.removeEventListener('simplifii:purge-context', handler);
  }, []);

  const [showSuccessPulse, setShowSuccessPulse] = useState(false);
  const lastPulseCount = useRef(0);
  // Tracks which section IDs have already fired a haptic completion pulse so
  // the pulse fires exactly once per section reaching SECTION_HEALTH_TARGET.
  const hapticFiredRef = useRef(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const handleToggleViewMode = () => setViewMode(prev => prev === 'academic' ? 'presentation' : 'academic');
    const handleToggleDevInsights = () => setShowDevInsights(prev => !prev);
    
    window.addEventListener('toggle-view-mode', handleToggleViewMode);
    window.addEventListener('toggle-dev-insights', handleToggleDevInsights);
    
    return () => {
      window.removeEventListener('toggle-view-mode', handleToggleViewMode);
      window.removeEventListener('toggle-dev-insights', handleToggleDevInsights);
    };
  }, []);

  // Procedural Roadmap tracking
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const roadmapStages = [
    { label: 'Stage A: Foundation', targetRatio: 0 },
    { label: 'Stage B: Core Build', targetRatio: 0.33 },
    { label: 'Stage C: Polish', targetRatio: 0.66 },
    { label: 'Stage D: Proof', targetRatio: 1.0 }
  ];

  // Cognitive Burnout & Telemetry tracking
  const keystrokeCount = useRef(0);
  const backspaceCount = useRef(0);
  const [hasBurnoutWarned, setHasBurnoutWarned] = useState(false);
  const [hasRigorWarned, setHasRigorWarned] = useState(false);

  // Initial Whisperer State
  const [hasWhisperedStart, setHasWhisperedStart] = useState(false);

  const isUni = profile?.level === 'mres' || profile?.level === 'phd' || profile?.level === 'undergrad';

  const avatarSpeak = (normalMsg, literalMsg) => {
    if (isZenMode) return; // Suppress in Zen Mode
    speakSystemMessage(isLiteralMode && literalMsg ? literalMsg : normalMsg);
  };

  const [activeWordIndex, setActiveWordIndex] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechUtterance = useRef(null);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const handleReadToMe = (content) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setActiveWordIndex(-1);
      return;
    }

    if (!window.speechSynthesis) return;

    // Use Web Speech API
    const utterance = new SpeechSynthesisUtterance(content);
    // Find a good natural voice
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Siri')) || voices[0];
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    let wordIndexCounter = 0;
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setActiveWordIndex(wordIndexCounter++);
      }
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setActiveWordIndex(-1);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setActiveWordIndex(-1);
    };

    speechUtterance.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const [showConfetti, setShowConfetti] = useState(false);
  const handleMarkFinal = (section) => {
    const wordCount = (section.content.match(/\S+/g) || []).length;
    const isStrenuous = keystrokeCount.current > (wordCount * 3) || keystrokeCount.current > 500;
    
    if (isStrenuous) {
      setShowConfetti(true);
      speakSystemMessage("You did the heavy lifting there. That's a major milestone done.", "Strenuous Victory!");
      setTimeout(() => setShowConfetti(false), 5000); // 5 seconds of confetti
    }
    
    // Check off related checklist items visually
    setChecklist(prev => prev.map(c => ({...c, checked: true})));
    setJustCheckedId(checklist[0]?.id);
    setTimeout(() => setJustCheckedId(null), 1500);
  };

  // Setup Confetti UI (simple DOM implementation)
  const renderConfetti = () => {
    if (!showConfetti) return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden flex justify-center items-start">
        {Array.from({ length: 50 }).map((_, i) => (
          <div 
            key={i} 
            className="w-3 h-6 absolute animate-confetti-fall"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `-20px`,
              backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 4)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          ></div>
        ))}
      </div>
    );
  };

  const handleSimplifyLogic = (section) => {
    const mirrorDraft = {
      id: Date.now().toString(),
      source: "Mirror-Draft Tool",
      author: "Precision Scaffolder",
      year: "Now",
      text: "Notice how removing 'actually' and 'basically' makes the methodology feel more rigorous? Why do you think the second version is more persuasive for the marker of your unit?",
      mentorNotes: "How does removing the filler words change the impact of your argument? Try to apply this logic to the next sentence.",
      isPrimary: true
    };

    setGhostAssets(prev => ({
      ...prev,
      [section.id]: [mirrorDraft, ...(prev[section.id] || [])]
    }));

    setSemanticGaps(prev => [...prev, section.id]);
    speakSystemMessage("Mirror draft generated in your Ghost Layer. Review the reflection question.", "Precision Scaffolding active.");
  };

  // Academic Augmentation. Routes through RewriteService so the cockpit can
  // swap providers (local-mock today, Ollama next) without touching consumers.
  // The avatar pulses faster while reasoning via reasoning-start/end events
  // dispatched by RewriteService.
  const handleElevateRigour = async (section) => {
    const trimmed = (section.content || '').trim();
    if (!trimmed) {
      speakSystemMessage("Write something first, then I can elevate the rigour.", "No content yet.");
      return;
    }
    setRewritingSectionId(section.id);
    try {
      const sourceName = extractionData?.courseName || activeCourse?.name || 'Course Material';
      const hdCriteria = activeCourse?.activeAssessmentBrief?.hdCriteria || extractionData?.hdCriteria || [];
      const result = await rewriteElevateRigour(trimmed, { level: profile?.level, persona, logicMode: activeLogicMode, sourceName, selectedTopic, hdCriteria, steering: { gritLevel, scaffoldingLevel, isLiteralMode: steeringLiteralMode } });
      handleContentChange(section.id, result.text);
      if (result.groundingCitations?.length > 0) {
        setSectionCitations(prev => ({ ...prev, [section.id]: result.groundingCitations }));
      }
      // Deep work signal: elevating rigour is concentrated cognitive effort.
      window.dispatchEvent(new CustomEvent('simplifii:playtime-granted', { detail: { minutes: 5, reason: 'deep_work_elevate_rigour' } }));
      speakSystemMessage(getPersonaResponse(persona, 'elevate_rigour'), "Rigour preview applied.");
    } catch (err) {
      speakSystemMessage(`Rewrite failed: ${err.message}`, "Rewrite error.");
    } finally {
      setRewritingSectionId(null);
    }
  };

  const handleSynthesise = async (section) => {
    const trimmed = (section.content || '').trim();
    if (!trimmed) {
      speakSystemMessage("Add at least one source insight before synthesising.", "Nothing to synthesise yet.");
      return;
    }
    setRewritingSectionId(section.id);
    try {
      const sourceName = extractionData?.courseName || activeCourse?.name || 'Course Material';
      const hdCriteria = activeCourse?.activeAssessmentBrief?.hdCriteria || extractionData?.hdCriteria || [];
      const result = await rewriteSynthesise(trimmed, { level: profile?.level, persona, sourceName, selectedTopic, hdCriteria, steering: { gritLevel, scaffoldingLevel, isLiteralMode: steeringLiteralMode } });
      handleContentChange(section.id, result.text);
      if (result.groundingCitations?.length > 0) {
        setSectionCitations(prev => ({ ...prev, [section.id]: result.groundingCitations }));
      }
      speakSystemMessage(getPersonaResponse(persona, 'synthesise'), "Synthesis preview applied.");
    } catch (err) {
      speakSystemMessage(`Rewrite failed: ${err.message}`, "Rewrite error.");
    } finally {
      setRewritingSectionId(null);
    }
  };

  const handleApplyLogicMode = async (section) => {
    if (!activeLogicMode) {
      speakSystemMessage("Pick a logic block first, then apply it to this section.", "No logic mode set.");
      return;
    }
    const trimmed = (section.content || '').trim();
    if (!trimmed) {
      speakSystemMessage("Write something first to apply this logic frame.", "No content yet.");
      return;
    }
    setRewritingSectionId(section.id);
    try {
      const hdCriteria = activeCourse?.activeAssessmentBrief?.hdCriteria || extractionData?.hdCriteria || [];
      const reframed = await rewriteApplyLogicMode(trimmed, activeLogicMode, { level: profile?.level, persona, selectedTopic, hdCriteria, steering: { gritLevel, scaffoldingLevel, isLiteralMode: steeringLiteralMode } });
      handleContentChange(section.id, reframed);
      speakSystemMessage(getPersonaResponse(persona, 'logic_mode'), "Logic frame applied.");
    } catch (err) {
      speakSystemMessage(`Rewrite failed: ${err.message}`, "Rewrite error.");
    } finally {
      setRewritingSectionId(null);
    }
  };

  const handleLogicBlockClick = (inst) => {
    setActiveLogicMode(inst.id);
    const personaMsg = getPersonaResponse(persona, 'logic_mode');
    speakSystemMessage(`${personaMsg} ${inst.label} focus active.`, `${inst.label} mode active.`);
  };

  const renderDensityScanner = (content) => {
    if (!content) return null;
    let html = content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const fillers = ['in order to', 'due to the fact that', 'it is important to note that', 'for the purpose of', 'with regards to', 'as a matter of fact', 'actually', 'basically', 'really', 'very'];
    
    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      html = html.replace(regex, match => `<span class="border-b-2 border-amber-500/50 group/filler relative cursor-help text-transparent">${match}<span class="absolute hidden group-hover/filler:flex text-xs bg-black text-amber-500 border border-amber-500/30 p-2 rounded-xl -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-50">You've used ${match.split(' ').length} words. Can you express this in fewer?</span></span>`);
    });

    return <div dangerouslySetInnerHTML={{ __html: html }} className="whitespace-pre-wrap" />;
  };
  useEffect(() => {
    if (!hasWhisperedStart && !isZenMode && extractionData?.temporalMap?.weightings) {
      const weights = extractionData.temporalMap.weightings;
      const highestId = Object.keys(weights).reduce((a, b) => weights[a] > weights[b] ? a : b);
      const section = sections.find(s => s.id === highestId);
      if (section) {
        setTimeout(() => {
          avatarSpeak(
            `Based on the rubric's ${weights[highestId]}% weighting for ${section.title}, I recommend we start here.`,
            `The ${section.title} is worth ${weights[highestId]}% of the grade. Start writing this section now.`
          );
          setActiveSectionId(highestId);
        }, 1500);
        setHasWhisperedStart(true);
      }
    }
  }, [extractionData, hasWhisperedStart, sections, isZenMode, isLiteralMode]);

  // Stage progression. Two ratios drive it:
  //   wordRatio: total drafted words / activeAssessmentBrief.wordCountGoal,
  //              if a goal is set on the focused sprint
  //   checklistRatio: existing completed / total
  // The higher of the two advances the stage. So the student sees Stage A
  // light up at 33 percent of the goal, Stage B at 66 percent, Stage C at
  // 100 percent, and Stage D when every DoD item is ticked. With no
  // active sprint the original checklist-only logic applies.
  const totalWords = useMemo(() => {
    return sections.reduce((sum, s) => sum + (s?.content || '').trim().split(/\s+/).filter(Boolean).length, 0);
  }, [sections]);
  const sprintGoal = activeCourse?.activeAssessmentBrief?.wordCountGoal || 0;
  useEffect(() => {
    let stageRatio = 0;
    if (checklist.length > 0) {
      const completed = checklist.filter(c => c.checked).length;
      stageRatio = Math.max(stageRatio, completed / checklist.length);
    }
    if (sprintGoal > 0) {
      stageRatio = Math.max(stageRatio, totalWords / sprintGoal);
    }
    if (stageRatio === 0) return;

    let newStage = 0;
    if (stageRatio >= 1.0) newStage = 3;
    else if (stageRatio >= 0.66) newStage = 2;
    else if (stageRatio >= 0.33) newStage = 1;

    // Sprint 8.3: cap advancement to one stage per tick. Previously a large
    // word-count jump (e.g. paste or batch checklist check) could skip from
    // Stage A directly to Stage C, missing the Stage B announcement entirely.
    if (newStage > currentStageIndex) {
      const nextStage = Math.min(newStage, currentStageIndex + 1);
      setCurrentStageIndex(nextStage);
      avatarSpeak(`Excellent. Advancing to ${roadmapStages[nextStage].label}.`, `Progress saved. Stage ${nextStage + 1} initiated.`);
      keystrokeCount.current = 0;
    }
  }, [checklist, totalWords, sprintGoal, isZenMode, isLiteralMode, currentStageIndex]);

  const updateLineCoords = () => {
    if (!containerRef.current || isZenMode || isLeftCollapsed || isRightCollapsed) {
      setLineCoordsArray([]);
      setHoverThread(null);
      return;
    }
    const newCoords = [];
    const cRect = containerRef.current.getBoundingClientRect();
    
    mappedBlocks.forEach(mapping => {
      const sectionEl = document.getElementById(`section-${mapping.sectionId}`);
      const blockEl = document.getElementById(`block-${mapping.blockId}`);
      if (sectionEl && blockEl) {
        const sRect = sectionEl.getBoundingClientRect();
        const bRect = blockEl.getBoundingClientRect();
        newCoords.push({
          id: `${mapping.sectionId}-${mapping.blockId}`,
          startX: bRect.right - cRect.left,
          startY: bRect.top + (bRect.height / 2) - cRect.top,
          endX: sRect.left - cRect.left,
          endY: sRect.top + 60 - cRect.top
        });
      }
    });
    setLineCoordsArray(newCoords);

    if (hoveredBlockId) {
      const block = ASSESSMENT_INSTRUCTIONS.find(b => b.id === hoveredBlockId);
      if (block) {
        const blockEl = document.getElementById(`block-${block.id}`);
        const dwEl = document.getElementById(`dw-${block.dwTarget}`);
        if (blockEl && dwEl) {
          const bRect = blockEl.getBoundingClientRect();
          const dwRect = dwEl.getBoundingClientRect();
          setHoverThread({
            startX: bRect.right - cRect.left,
            startY: bRect.top + (bRect.height / 2) - cRect.top,
            endX: dwRect.left - cRect.left,
            endY: dwRect.top + (dwRect.height / 2) - cRect.top
          });
        }
      }
    } else {
      setHoverThread(null);
    }

    // Connective Tissue Mapping
    const gaps = [];
    if (sections[0].content.toLowerCase().includes('atp') && sections[1].content === '') {
      const el1 = document.getElementById(`section-intro`);
      const el2 = document.getElementById(`section-body_1`);
      if (el1 && el2) {
        const r1 = el1.getBoundingClientRect();
        const r2 = el2.getBoundingClientRect();
        gaps.push({
          id: 'gap-1',
          msg: "Introduction names a key concept that Methodology does not yet ground. Bridge them?",
          startX: r1.left - cRect.left - 20,
          startY: r1.bottom - cRect.top,
          endX: r2.left - cRect.left - 20,
          endY: r2.top - cRect.top
        });
      }
    }
    setSemanticGaps(gaps);
  };

  const hiddenTimeRef = useRef(0);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTimeRef.current = Date.now();
      } else {
        if (hiddenTimeRef.current > 0) {
          const driftSeconds = (Date.now() - hiddenTimeRef.current) / 1000;
          if (driftSeconds > 120 && !isZenMode) {
            avatarSpeak("I've kept your place. Ready to bridge that insight?", "Welcome back. Re-engaging cognitive flow.");
          }
        }
        hiddenTimeRef.current = 0;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isZenMode]);

  useEffect(() => {
    updateLineCoords();
    window.addEventListener('resize', updateLineCoords);
    const interval = setInterval(updateLineCoords, 500);
    return () => {
      window.removeEventListener('resize', updateLineCoords);
      clearInterval(interval);
    };
  }, [mappedBlocks, activeSectionId, hoveredBlockId, checklist, isZenMode, isLeftCollapsed, isRightCollapsed]);

  const handleKeyDown = (e) => {
    if (e.key.length === 1 || e.key === 'Backspace') {
      keystrokeCount.current += 1;
      
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 500);
      
      // Telemetry Engine: Fragmented Thinking Detection
      if (e.key === 'Backspace') {
        backspaceCount.current += 1;
        if (backspaceCount.current > 50 && !showSosPulse && !isZenMode) {
          setShowSosPulse(true);
          avatarSpeak(
            "I'm noticing a lot of friction. I've prepared a brief extension request in the Support Bridge, or we can pivot to a Voice Note.",
            "High fragmentation detected. Click SOS for self-advocacy scripts or use Voice input."
          );
          backspaceCount.current = 0;
        }
      }

      if (!isZenMode) {
        if (keystrokeCount.current > 400 && !hasBurnoutWarned) {
          avatarSpeak(
            "You've been typing heavily without hitting a new milestone. Would you like to do a quick Brain Dump to clarify your thoughts?",
            "High keystroke volume detected without checklist progress. Stop and review your goals."
          );
          setHasBurnoutWarned(true);
        } else if (keystrokeCount.current > 600) {
          avatarSpeak(
            "Your heavy thinking is peaking. Let's take a 2-minute brain break to prevent burnout.",
            "Cognitive load critical. Pause typing for 2 minutes."
          );
          keystrokeCount.current = 0; 
        }
      }
    }
  };

  const handleContentChange = (id, newContent) => {
    const updatedSections = sections.map(s => s.id === id ? { ...s, content: newContent } : s);
    setSections(updatedSections);
    
    const fullText = updatedSections.map(s => s.content).join(' ').toLowerCase();
    
    // Dopamine Success Loop logic (100 words)
    const currentWordCount = fullText.split(/\s+/).filter(w => w.length > 0).length;
    if (currentWordCount - lastPulseCount.current >= 100) {
      lastPulseCount.current = currentWordCount;
      setShowSuccessPulse(true);
      setTimeout(() => setShowSuccessPulse(false), 2000);
    }

    // Haptic Status (Sprint 5.3): fire a tactile pulse once per section that
    // reaches 100% Section Health. Supports Deaf-Blind users on haptic hardware.
    const changedSection = updatedSections.find(s => s.id === id);
    const sectionWordCount = (changedSection?.content.match(/\S+/g) || []).length;
    if (sectionWordCount >= SECTION_HEALTH_TARGET && !hapticFiredRef.current.has(id)) {
      hapticFiredRef.current.add(id);
      triggerHapticPulse();
      // Simultaneous ACCENT_GLOW visual pulse (co-signals progress to sighted users
      // and provides redundancy for Deaf-Blind users on non-haptic hardware).
      setShowSuccessPulse(true);
      setTimeout(() => setShowSuccessPulse(false), 2000);
    }
    
    setChecklist(prev => prev.map(item => {
      const newlyChecked = !item.checked && fullText.includes(item.triggerWord.toLowerCase());
      if (newlyChecked) {
        setJustCheckedId(item.id);
        setTimeout(() => setJustCheckedId(null), 2000);
        avatarSpeak("Excellent. That criteria is satisfied.", "Criteria met. Proceed to next item.");
      }
      return {
        ...item,
        checked: item.checked || newlyChecked
      };
    }));
  };

  const getDynamicTemplate = (blockId, data) => {
    const defaultConcept = 'the core topic';
    const concepts = data?.rubricCriteria?.length > 0 ? data.rubricCriteria[0].substring(0, 30) : defaultConcept;
    
    switch (blockId) {
      case 'inst1': return `Since your brief mentions '${concepts}', start by comparing [Source A] to the data in [Source B]...`;
      case 'inst2': return `Identify the critical gap regarding ${concepts} in the literature...`;
      case 'inst3': return `Synthesise the findings on ${concepts} to form a cohesive conclusion...`;
      default: return 'Start writing here...';
    }
  };

  const handleDrop = (e, sectionId) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (dataStr) {
        const inst = JSON.parse(dataStr);
        const dynamicTemplate = getDynamicTemplate(inst.id, extractionData);
        setSections(sections.map(s => s.id === sectionId ? { ...s, neuralTemplate: dynamicTemplate } : s));
        setMappedBlocks(prev => {
          const filtered = prev.filter(m => m.blockId !== inst.id);
          return [...filtered, { sectionId: sectionId, blockId: inst.id }];
        });
      }
    } catch (err) {}

    const textData = e.dataTransfer.getData('text/plain');
    if (textData && !e.dataTransfer.getData('application/json')) {
      const isPrimary = Math.random() > 0.5; // Mock analysis
      const newAsset = {
        id: Date.now().toString(),
        blockId: sectionId,
        source: textData.substring(0, 50) + '...',
        text: `Extracted Insight: The primary data indicates a strong correlation in ${textData.substring(0, 20)}...`,
        author: 'Smith et al.',
        year: '2026',
        isPrimary: isPrimary,
        mentorNotes: isPrimary
          ? "This is a Primary source because it presents an original empirical study, identifiable by its 'Methods' and 'Results' sections."
          : "This is a Secondary source. It is a literature review summarising other studies, rather than providing original experimental data."
      };
      setGhostAssets(prev => ({ ...prev, [sectionId]: [...(prev[sectionId] || []), newAsset] }));
      if (onAddGhostAsset) onAddGhostAsset(newAsset);
      setProcessingDropSectionId(sectionId);
      if (processingDropTimerRef.current) clearTimeout(processingDropTimerRef.current);
      processingDropTimerRef.current = setTimeout(() => setProcessingDropSectionId(null), 1800);
      avatarSpeak("Asset extracted and embedded into the Ghost Layer.", "Source parsed. Metadata generated.");
    }
  };

  const handleBridgeAsset = (sectionId, asset) => {
    const section = sections.find(s => s.id === sectionId);
    const bridgeText = ` As supported by recent findings, "${asset.text.replace('Extracted Insight: ', '')}" (${asset.author}, ${asset.year}). `;
    handleContentChange(sectionId, section.content + bridgeText);
    avatarSpeak("Semantically bridged asset into your draft with auto-citation.", "Citation inserted.");
  };

  const handleRigorDrop = () => {
    if (!hasRigorWarned && !isZenMode) {
      avatarSpeak("Your academic tone is dropping. Shall I elevate the rigour of this paragraph?", "Rigor below threshold. Suggest running Elevate tool.");
      setHasRigorWarned(true);
    }
  };

  const getPriorityBadge = (sectionId) => {
    if (!extractionData?.temporalMap?.weightings) return null;
    const weight = extractionData.temporalMap.weightings[sectionId] || 0;
    
    if (weight >= 40) return { label: 'High Priority', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' };
    if (weight >= 20) return { label: 'Med Priority', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Low Priority', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' };
  };

  const leftSidebarClass = isZenMode ? 'w-0 opacity-0 px-0' : isLeftCollapsed ? 'w-16 px-2' : 'w-72 p-6';
  const rightSidebarClass = isZenMode ? 'w-0 opacity-0 px-0' : isRightCollapsed ? 'w-16 px-2' : 'w-80 p-6';

  // Sprint 8.2: Pareto Milestone Filter. In normal mode, strip checklist items
  // that match low-value patterns (lecture attendance, lab sessions, tutorial
  // readings) so only submission-bearing milestones surface. Zen Mode keeps
  // only the top 2 items regardless. The filter is cosmetic only: checked state
  // and sprint tracking still run against the full checklist array.
  const PARETO_NOISE_RE = /\blecture|lab session|tutorial|weekly reading|workshop attendance\b/i;
  const paretoChecklist = checklist.filter(item => !PARETO_NOISE_RE.test(item.text));
  const visibleChecklist = isZenMode ? paretoChecklist.slice(0, 2) : paretoChecklist;

  return (
    <div role="main" className={`flex-1 flex bg-[#030303] text-white overflow-hidden relative ${isDyslexic ? 'font-[Comic_Sans_MS,sans-serif] tracking-wider leading-[2.5]' : 'font-sans'} transition-all`} ref={containerRef}>
      {renderConfetti()}
      {/* Dopamine Success Loop Overlay */}
      <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ease-out shadow-[inset_0_0_150px_rgba(16,185,129,0.3)] ${showSuccessPulse ? 'opacity-100' : 'opacity-0'}`}></div>

      {isZenMode && <ZenTools onClose={() => setIsZenMode(false)} />}

      {showSupportBridge && <SupportBridge onClose={() => { setShowSupportBridge(false); setShowSosPulse(false); }} isLiteralMode={isLiteralMode} />}
      {showAccessibilityVault && <AccessibilityVault onClose={() => setShowAccessibilityVault(false)} />}
      {showDevInsights && <DevInsightsPanel onClose={() => setShowDevInsights(false)} />}

      {/* Removed Top Navbar items per Stealth Dev Mode */}

      {/* SVG Mapping Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-60">
        {lineCoordsArray.map(coords => (
          <path 
            key={coords.id}
            d={`M ${coords.startX} ${coords.startY} C ${coords.startX + 150} ${coords.startY}, ${coords.endX - 150} ${coords.endY}, ${coords.endX} ${coords.endY}`} 
            fill="none" 
            stroke="#10B981" 
            strokeWidth="3" 
            strokeDasharray="6,6" 
            className="animate-pulse"
          />
        ))}
        {hoverThread && (
          <path 
            d={`M ${hoverThread.startX} ${hoverThread.startY} C ${hoverThread.startX + 100} ${hoverThread.startY}, ${hoverThread.endX - 100} ${hoverThread.endY}, ${hoverThread.endX} ${hoverThread.endY}`} 
            fill="none" 
            stroke="#3B82F6" 
            strokeWidth="2" 
            strokeDasharray="4,4" 
            className="animate-pulse opacity-80"
          />
        )}
        {semanticGaps.map(gap => (
          <path 
            key={gap.id}
            d={`M ${gap.startX} ${gap.startY} L ${gap.endX} ${gap.endY}`} 
            fill="none" 
            stroke="#F59E0B" 
            strokeWidth="2" 
            strokeDasharray="4,4" 
            className="animate-pulse opacity-80"
          />
        ))}
      </svg>

      {/* Semantic Gap Prompts */}
      {semanticGaps.map(gap => (
        <div key={`prompt-${gap.id}`} className="absolute z-50 bg-amber-500/10 border border-amber-500 text-amber-500 p-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer hover:bg-amber-500/20 transition-colors" style={{ left: gap.startX + 10, top: gap.startY + (gap.endY - gap.startY)/2 }}>
          <Network size={12} /> {gap.msg}
        </div>
      ))}

      {/* Logic Blocks Sidebar (Left) */}
      <aside className={`${leftSidebarClass} border-r border-zinc-900 bg-black flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-10 pt-20 relative overflow-hidden`}>
        {!isZenMode && (
          <button 
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className="absolute -right-3 top-24 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:border-emerald-500 transition-all"
          >
            {isLeftCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {isLeftCollapsed && !isZenMode ? (
          <div className="flex flex-col items-center mt-5 space-y-8 pt-6">
            <Network size={20} className="text-emerald-500" />
            <GripVertical size={20} className="text-zinc-600" />
          </div>
        ) : !isZenMode && (
          <>
            <div className="flex items-center gap-3 mb-10 text-emerald-500 whitespace-nowrap">
              <Network size={24} className="shrink-0" />
              <h3 className="font-black tracking-widest uppercase text-sm">Logic Blocks</h3>
            </div>
            <div className="space-y-6 flex-1 whitespace-nowrap">
              {ASSESSMENT_INSTRUCTIONS.map(inst => {
                const isActiveMode = activeLogicMode === inst.id;
                return (
                  <div
                    id={`block-${inst.id}`}
                    key={inst.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Logic Block: ${inst.label}. ${inst.detail}`}
                    aria-pressed={isActiveMode}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/json', JSON.stringify(inst))}
                    onClick={() => handleLogicBlockClick(inst)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogicBlockClick(inst); } }}
                    onMouseEnter={() => setHoveredBlockId(inst.id)}
                    onMouseLeave={() => setHoveredBlockId(null)}
                    className={`p-5 rounded-2xl cursor-pointer hover:border-emerald-500 transition-all group relative z-10 max-w-full border ${isActiveMode ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : 'bg-[#0A0A0A] border-zinc-800'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-black uppercase tracking-widest truncate pr-2 ${isActiveMode ? 'text-emerald-400' : 'text-zinc-300 group-hover:text-emerald-400'}`}>{inst.label}</span>
                      <GripVertical size={16} className={`shrink-0 ${isActiveMode ? 'text-emerald-400' : 'text-zinc-700 group-hover:text-emerald-500'}`} />
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium whitespace-normal">{inst.detail}</p>
                    {isActiveMode && (
                      <p className="mt-3 text-[9px] uppercase tracking-widest font-black text-emerald-400">Logic mode active. Drag to apply, or write in this frame.</p>
                    )}
                  </div>
                );
              })}
              
              <div 
                draggable 
                onDragStart={(e) => e.dataTransfer.setData('text/plain', 'https://pubmed.ncbi.nlm.nih.gov/mock_asset')}
                className="mt-12 p-4 border border-dashed border-blue-500/50 rounded-xl bg-blue-500/5 cursor-grab group relative z-10 max-w-full"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-2 truncate">Drag Research URL</p>
                <p className="text-xs text-zinc-400 whitespace-normal">Drag me into a block to test the Ghost Drawer.</p>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Canvas */}
      <main className={`flex-1 overflow-y-auto ${isZenMode ? 'px-32' : 'px-16'} pt-24 relative scroll-smooth z-10 custom-scrollbar flex flex-col items-center transition-all duration-500 ease-out`}>
        
        {viewMode === 'presentation' ? (
          <div className="w-full max-w-5xl pb-64 animate-fade-in text-center mt-10">
            <div className="inline-block bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-12">
              Teleprompter Active: Speak Naturally
            </div>
            {sections.map(s => s.content.trim() && (
              <div key={s.id} className="mb-20 text-left">
                <h2 className="text-sm font-black text-indigo-500 uppercase tracking-widest mb-8 border-b border-zinc-800 pb-4">{s.title}</h2>
                <ul className="space-y-8">
                  {s.content.split('.').filter(sentence => sentence.trim().length > 5).map((sentence, i) => (
                    <li key={i} className="text-4xl leading-tight font-medium text-zinc-200 flex gap-6 items-start">
                      <span className="text-indigo-500 shrink-0 select-none opacity-30 mt-2">&bull;</span>
                      {sentence.trim()}.
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Universal Timeline (Procedural Roadmap) */}
            <div className="w-full max-w-4xl mb-16 relative transition-opacity duration-500">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-900 -translate-y-1/2 z-0"></div>
          <div className="flex justify-between items-center relative z-10">
            {roadmapStages.map((stage, idx) => {
              const isActive = idx === currentStageIndex;
              const isPast = idx < currentStageIndex;
              return (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all duration-700 ${isActive ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)] scale-110' : isPast ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50' : 'bg-black border border-zinc-800 text-zinc-700'}`}>
                    {isPast ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-400' : isPast ? 'text-emerald-700' : 'text-zinc-600'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="max-w-4xl w-full pb-64 space-y-24">
          <div className="text-left mb-16">
            <h1 className="text-7xl font-black tracking-tighter mb-6 text-white">
              {extractionData?.unitCode || 'Universal OS'}
            </h1>
            <p className="text-2xl text-emerald-500 font-bold uppercase tracking-widest drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">Advanced Authoring Cockpit</p>
            {activeCourse?.schemaLocked && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/40 text-[9px] font-black uppercase tracking-widest text-amber-300">
                Schema Locked
              </div>
            )}
            {activeSprintTitle && (
              <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/40 shadow-[0_0_18px_rgba(16,185,129,0.3)]">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Active Sprint</span>
                <span className="text-sm font-bold text-white">{activeSprintTitle}</span>
                {sprintGoal > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300/80">
                    {totalWords} / {sprintGoal} words
                  </span>
                )}
                {activeCourse?.activeAssessmentBrief?.dueDate && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Due: {activeCourse.activeAssessmentBrief.dueDate}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => switchSprint(null)}
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-300 hover:text-white transition-all"
                  title="Return to the default canvas"
                >
                  Exit
                </button>
              </div>
            )}
          </div>

          {/* Sprint 8.1: Topic Picker. Shown in Foundation stage when the
              Primary Syllabus contains a topic/prompt menu. Once selected,
              the topic injects into all future AI prompts as FOCUS TOPIC. */}
          {currentStageIndex === 0 && (() => {
            const topics = activeCourse?.activeAssessmentBrief?.availableTopics
              || extractionData?.availableTopics
              || [];
            if (topics.length === 0) return null;
            return (
              <div className="w-full max-w-4xl mb-10 p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60">
                <p
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
                  className="text-zinc-500 uppercase tracking-widest font-bold mb-3"
                >
                  Foundation: Select Your Topic
                </p>
                {selectedTopic ? (
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-sm font-bold">{selectedTopic}</span>
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-200 transition-colors"
                      aria-label="Clear selected topic"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topics.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedTopic(topic);
                          speakSystemMessage(`Topic locked: ${topic}. All AI assistance will now focus on this prompt.`, 'Topic selected.');
                        }}
                        className="px-3 py-2 rounded-xl border border-zinc-700 text-zinc-300 text-xs font-medium hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-all text-left"
                        aria-label={`Select topic: ${topic}`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {sections.map((section) => {
            const isActive = activeSectionId === section.id;
            const isBloomed = bloomedSectionId === section.id;
            const isDimmed = bloomedSectionId && !isBloomed;
            const blockAssets = ghostAssets[section.id] || [];
            const priorityBadge = getPriorityBadge(section.id);

            // Dynamic Font Engine styles
            const fontSizeClass = fontScale === 'xl' ? 'text-4xl' : fontScale === 'large' ? 'text-3xl' : 'text-2xl';
            const leadingClass = lineSpacing === 'loose' ? 'leading-loose' : lineSpacing === 'relaxed' ? 'leading-relaxed' : 'leading-normal';

            return (
              <div key={section.id} className={`relative flex gap-8 transition-all duration-700 ${isBloomed ? 'fixed inset-0 m-auto w-[90vw] h-[90vh] z-[800] bg-[#0A0A0A] border border-emerald-500/50 shadow-[0_0_100px_rgba(0,0,0,0.9)] rounded-[2rem] p-16' : isDimmed ? 'opacity-10 blur-xl bg-white/5 backdrop-blur-3xl pointer-events-none' : ''}`}>
                {processingDropSectionId === section.id && (
                  <div className="absolute inset-0 z-[900] rounded-[2rem] pointer-events-none border-2 border-emerald-400/70 shadow-[0_0_40px_rgba(16,185,129,0.5)] animate-pulse flex items-start justify-center pt-6">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-black uppercase tracking-widest">
                      Mapping to Knowledge Graph
                    </span>
                  </div>
                )}
                <section
                  id={`section-${section.id}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, section.id)}
                  className={`flex-1 group transition-all duration-700 relative p-10 rounded-[2rem] ${isActive && !isBloomed ? 'opacity-100 bg-[#0A0A0A] border border-zinc-800 shadow-2xl' : !isBloomed ? 'opacity-40 hover:opacity-100 border border-transparent bg-zinc-900/10' : ''}`}
                  onFocus={() => setActiveSectionId(section.id)}
                  onClick={() => {
                    if (!isActive && !bloomedSectionId) setActiveSectionId(section.id);
                  }}
                >
                  <SectionHealth content={section.content} target={200} />

                  <div className="flex items-center gap-6 mb-8 justify-between">
                    <div className="flex items-center gap-6">
                      <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-6 transition-colors ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`}>
                        <span className={`w-12 h-px ${isActive ? 'bg-emerald-500' : 'bg-zinc-800'} block`}></span>
                        {section.title}
                      </h3>
                      
                      {/* Priority HUD Badge */}
                      {priorityBadge && (
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${priorityBadge.color}`}>
                          {priorityBadge.label}
                        </span>
                      )}
                    </div>
                    
                    {/* Bloom Toggle */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isBloomed) setBloomedSectionId(null);
                        else {
                          setActiveSectionId(section.id);
                          setBloomedSectionId(section.id);
                        }
                      }}
                      className={`p-2 rounded-full border transition-all ${isBloomed ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:text-white hover:border-emerald-500'}`}
                    >
                      {isBloomed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                  </div>
                  
                  <div className="relative z-30">
                    <textarea
                      value={section.content}
                      onChange={(e) => handleContentChange(section.id, e.target.value)}
                      onKeyDown={handleKeyDown}
                      spellCheck={false}
                      placeholder={`Draft ${section.title.toLowerCase()}...`}
                      className={`w-full ${isBloomed ? 'h-[50vh]' : 'min-h-[200px]'} bg-transparent border-none outline-none resize-none ${fontSizeClass} ${leadingClass} font-medium relative z-30 transition-all duration-300 ${isActive ? (isBionicActive ? 'text-transparent caret-emerald-500' : 'text-zinc-200') : 'text-zinc-500'} placeholder-zinc-800 custom-scrollbar`}
                    />
                    
                    {/* Density Scanner Overlay */}
                    {isActive && section.content && (
                      <div className={`absolute top-0 left-0 w-full h-full pointer-events-auto z-20 ${fontSizeClass} ${leadingClass} text-transparent overflow-hidden`}>
                        {renderDensityScanner(section.content)}
                      </div>
                    )}
                    
                    {/* Bionic Reading Overlay */}
                    {isBionicActive && isActive && section.content && (
                      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none z-20 ${fontSizeClass} ${leadingClass} text-zinc-200 overflow-hidden`}>
                        <BionicText text={section.content} intensity={bionicIntensity} activeWordIndex={activeWordIndex} />
                      </div>
                    )}
                    
                    {/* Neural Proofing Glow Overlay */}
                    {isProofing && isActive && (
                      <div className="absolute inset-0 pointer-events-none p-0 z-20">
                        <div className="w-full h-full text-2xl leading-loose font-medium">
                          {section.content.split(' ').map((word, i) => {
                            const isTypo = MOCK_TYPOS.includes(word.toLowerCase().replace(/[^a-z]/g, ''));
                            return (
                              <span key={i} className={isTypo ? 'text-transparent bg-purple-500/20 rounded shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'text-transparent'}>
                                {word}{' '}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {section.content === '' && section.neuralTemplate && (
                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-10">
                        <span className="text-2xl leading-loose font-medium text-emerald-500/40 italic animate-pulse">
                          {section.neuralTemplate}
                        </span>
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <div className={`mt-6 flex flex-col gap-6 border-t border-zinc-800/50 pt-6 animate-fade-in relative z-40 w-full ${isBloomed ? 'absolute bottom-10 left-10 right-10 w-[calc(100%-100px)] bg-[#0A0A0A] pb-6' : ''}`}>
                      
                      {/* Adaptive Quick Actions */}
                      <div className="flex flex-wrap items-center gap-3 w-full">
                        {/* Screen reader live region: announces AI rewrite progress. */}
                        <span aria-live="polite" aria-atomic="true" className="sr-only">
                          {rewritingSectionId === section.id ? 'Neural processing initiated. Academic rigour increasing.' : ''}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mr-2 flex items-center gap-1 shrink-0">
                          <Zap size={12} /> {isUni ? 'Academic Tools' : 'Clear Tools'}
                        </span>
                        <button
                          onClick={() => handleSynthesise(section)}
                          disabled={rewritingSectionId === section.id}
                          aria-label="Synthesise: combine evidence into a unified academic paragraph"
                          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 text-zinc-400 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
                        >
                          {rewritingSectionId === section.id && <Loader2 size={12} className="animate-spin" />}
                          {isUni ? 'Synthesise' : 'Summarise'}
                        </button>
                        <button
                          onClick={() => handleElevateRigour(section)}
                          disabled={rewritingSectionId === section.id}
                          aria-label="Elevate Rigour: rewrite passage to academic register"
                          className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 text-zinc-400 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
                        >
                          {rewritingSectionId === section.id && <Loader2 size={12} className="animate-spin" />}
                          {isUni ? 'Elevate Rigour' : 'Improve Clarity'}
                        </button>
                        {activeLogicMode && (
                          <button
                            onClick={() => handleApplyLogicMode(section)}
                            disabled={rewritingSectionId === section.id}
                            className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500 hover:text-black text-emerald-400 text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-wait flex items-center gap-2"
                            title="Apply the active Logic Block frame to this section"
                          >
                            {rewritingSectionId === section.id && <Loader2 size={12} className="animate-spin" />}
                            Apply Logic Mode
                          </button>
                        )}
                        <button onClick={() => avatarSpeak("AI Declaration Exported. You may attach it to your submission.", "AI Usage Declaration saved.")} className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-indigo-500 hover:text-indigo-400 text-zinc-400 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2">
                          <Shield size={12} /> AI Declaration
                        </button>
                        {/* Sprint 7.1: Export Proof button. Pulses emerald when the
                            History of Thought log exceeds 50 events, signalling that
                            there is enough evidence to generate a meaningful report. */}
                        <button
                          title="Generate cryptographic proof of intellectual ownership."
                          aria-label="Export Proof: generate cryptographic proof of intellectual ownership"
                          onClick={async () => {
                            try {
                              const filename = await generateAuthenticityPDF();
                              avatarSpeak(`Authenticity Report exported as ${filename}. Attach it to your submission.`, 'Proof generated.');
                              setHotEventCount(c => c + 1);
                            } catch (err) {
                              avatarSpeak('The vault is locked. Unlock it first to generate the Authenticity Report.', 'Vault locked.');
                            }
                          }}
                          className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2
                            ${hotEventCount > 50
                              ? 'bg-emerald-500/10 border-zinc-50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse hover:bg-emerald-500 hover:text-black'
                              : 'bg-zinc-900 border-zinc-50/30 text-zinc-400 hover:border-zinc-50 hover:text-zinc-200'
                            }`}
                        >
                          <Shield size={12} /> Export Proof
                        </button>
                        <button 
                          onClick={() => setIsProofing(!isProofing)}
                          className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isProofing ? 'bg-purple-500/10 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-zinc-900 border-zinc-700 hover:border-purple-500 hover:text-purple-400 text-zinc-400'}`}
                        >
                          <Wand2 size={12} /> Neural Proof
                        </button>
                        <button 
                          onClick={() => handleMarkFinal(section)}
                          className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${!section.content ? 'opacity-50 cursor-not-allowed bg-transparent border-zinc-800 text-zinc-600' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white shadow-[0_0_15px_rgba(16,185,129,0.1)]'}`}
                        >
                          <CheckCircle size={14} /> Mark Final
                        </button>
                        <button 
                          onClick={() => handleReadToMe(section.content)}
                          className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isSpeaking ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-transparent border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}`}
                        >
                          <Volume2 size={14} /> {isSpeaking ? 'Stop Reading' : 'Read to Me'}
                        </button>
                        <button 
                          onClick={() => handleSimplifyLogic(section)}
                          className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all bg-transparent border-blue-500/30 text-blue-500 hover:bg-blue-500 hover:text-white shadow-[0_0_15px_rgba(59,130,246,0.1)]`}
                        >
                          <Zap size={14} /> Simplify Logic
                        </button>
                      </div>

                      {renderGroundingPin(sectionCitations[section.id])}
                      <ToneHUD content={section.content} onRigorDrop={handleRigorDrop} isTyping={isTyping} isStressed={isStressed} />
                      <SectionHistory 
                        blockId={section.id} 
                        currentContent={section.content} 
                        isActive={isActive} 
                        onRevert={(text) => handleContentChange(section.id, text)} 
                      />
                    </div>
                  )}
                </section>

                {/* Smart-Source Architecture: Retractable Ghost Rail */}
                <div className={`shrink-0 transition-all duration-500 ease-out group/rail flex ${blockAssets.length > 0 && !isZenMode ? 'w-4 hover:w-72 opacity-100' : 'w-0 opacity-0 pointer-events-none hidden'}`}>
                  {blockAssets.length > 0 && (
                    <>
                      {/* The Thin Neon Rail */}
                      <div className="w-1 bg-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)] h-full rounded-full transition-all group-hover/rail:opacity-0 mr-4 cursor-help"></div>
                      
                      {/* The Expanded Drawer */}
                      <div 
                        className="bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl h-full backdrop-blur-xl absolute right-0 w-72 overflow-y-auto opacity-0 group-hover/rail:opacity-100 transition-opacity z-50 pointer-events-none group-hover/rail:pointer-events-auto"
                        onScroll={() => { keystrokeCount.current += 0.5; }}
                      >
                        <div className="flex items-center gap-2 mb-4 text-blue-500">
                          <BookOpen size={16} />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Ghost Layer</h4>
                        </div>
                        <div className="space-y-4">
                        {blockAssets.map(asset => (
                          <div key={asset.id} className="p-4 bg-black border border-zinc-800 rounded-xl group/asset relative">
                            {/* Primary/Secondary AI Mentor Badge */}
                            <div className="absolute -top-2 -right-2 bg-zinc-900 border border-zinc-700 rounded-full p-1.5 cursor-help group/tooltip z-50">
                              <BrainCircuit size={12} className={asset.isPrimary ? "text-emerald-500" : "text-amber-500"} />
                              <div className="absolute right-0 top-6 w-48 bg-black border border-zinc-700 p-3 rounded-xl shadow-xl opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-zinc-400 flex items-center gap-2">
                                  {asset.isPrimary ? "Primary Source" : "Secondary Source"}
                                  <Volume2 size={10} className="text-blue-500" />
                                </p>
                                <p className="text-xs text-zinc-300 leading-relaxed whitespace-normal">{asset.mentorNotes}</p>
                              </div>
                            </div>

                            <p className="text-[10px] text-zinc-500 mb-2 truncate">{asset.source}</p>
                            <p className="text-xs font-bold text-zinc-300 mb-1">{asset.author} ({asset.year})</p>
                            <p className="text-xs text-zinc-400 leading-relaxed italic border-l-2 border-blue-500 pl-3 mb-4 line-clamp-4">
                              "{asset.text}"
                            </p>
                            <button 
                              onClick={() => handleBridgeAsset(section.id, asset)}
                              className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all opacity-0 group-hover/asset:opacity-100"
                            >
                              Bridge to Draft <ArrowRight size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}
</main>
      
      {/* Done When Right Sidebar. We render even when the checklist is
          empty AFTER a handshake (extractionData is set), so the student
          gets explicit feedback that the syllabus parsed but no
          assessments were detected, rather than a silently missing
          panel. Pre-handshake the panel stays hidden to keep the
          empty cockpit clean. */}
      {(visibleChecklist.length > 0 || extractionData) && (
        <aside className={`${rightSidebarClass} border-l border-zinc-900 bg-black/80 backdrop-blur-md flex flex-col shrink-0 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] z-10 pt-24 relative overflow-y-auto custom-scrollbar overflow-x-hidden`}>
          {!isZenMode && (
            <button 
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="absolute -left-3 top-24 z-50 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:border-emerald-500 transition-all"
            >
              {isRightCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          )}

          {isRightCollapsed && !isZenMode ? (
            <div className="flex flex-col items-center mt-5 space-y-8">
              <CheckCircle2 size={20} className="text-blue-500" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-8 text-blue-500 whitespace-nowrap">
                <CheckCircle2 size={20} className="shrink-0" />
                <h3 className="font-black tracking-widest uppercase text-xs">Definition of Done</h3>
              </div>
              
              {visibleChecklist.length === 0 && extractionData && (
                <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs leading-relaxed font-medium whitespace-normal">
                  <p className="font-black uppercase tracking-widest text-[10px] mb-2 text-amber-400">No assessments detected</p>
                  <p>The syllabus parsed but the extractor could not find an Assessment, Task, or named exam in the text. Check the browser console for the extraction summary, then try a more complete brief or rubric.</p>
                </div>
              )}
              <div className="space-y-4 whitespace-nowrap">
                {visibleChecklist.map(item => {
                  const isPulsing = justCheckedId === item.id;
                  const isActiveSprint = activeSprintTitle === item.text;
                  return (
                    <div
                      id={`dw-${item.id}`}
                      key={item.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 max-w-full group/checklist relative ${isPulsing ? 'bg-emerald-500 border-emerald-400 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.6)]' : isActiveSprint ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.35)]' : item.checked ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80'}`}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          switchSprint(isActiveSprint ? null : item.text);
                        }}
                        className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${isActiveSprint ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-emerald-500 hover:text-black opacity-0 group-hover/checklist:opacity-100'}`}
                        title={isActiveSprint ? 'Return to default sprint' : 'Focus this assessment as the active sprint'}
                      >
                        {isActiveSprint ? 'Active' : 'Focus'}
                      </button>
                      <div
                        onClick={() => {
                          const newChecked = !item.checked;
                          setChecklist(prev => prev.map(c => c.id === item.id ? { ...c, checked: newChecked } : c));
                          if (newChecked) {
                            setJustCheckedId(item.id);
                            setTimeout(() => setJustCheckedId(null), 1500);
                          }
                        }}
                        className="cursor-pointer"
                      >
                      <div className="flex gap-3">
                        <div className="mt-0.5 shrink-0 transition-transform duration-300 group-active/checklist:scale-90">
                          {item.checked ? <CheckCircle size={16} className={isPulsing ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-emerald-500'} /> : <Circle size={16} className="text-zinc-600 group-hover/checklist:text-zinc-400" />}
                        </div>
                        <p className={`text-sm font-medium leading-snug whitespace-normal transition-colors ${isPulsing ? 'text-white font-black' : item.checked ? 'text-emerald-400' : 'text-zinc-400'}`}>
                          {item.text}
                        </p>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </aside>
      )}

    </div>
  );
}
