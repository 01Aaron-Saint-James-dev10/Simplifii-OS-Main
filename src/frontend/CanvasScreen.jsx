import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useProject } from './ProjectContext';
import { useSettings } from './SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { processDocumentWithGCP } from '../services/DocumentAIService';
import { classifyDocumentText } from './hooks/useIngestion';
import { detectSuspectedCitations } from '../services/CitationStyleService';
import { verifyFromSources } from '../services/CitationService';
import { useRouter } from '../contexts/RouterContext';
import { supabase } from '../lib/supabaseClient';
import CanvasNav from './components/CanvasNav';
import CanvasEditor from './components/CanvasEditor';
import SectionEditor from './components/SectionEditor';
import JokeOverlay from './components/JokeOverlay';
import DocumentClassifiedModal from './components/DocumentClassifiedModal';
import PanelRail from './components/PanelRail';
import BriefPanel from './components/BriefPanel';
import TutorPanel from './components/TutorPanel';
import PreviewPanel from './components/PreviewPanel';
import SourcesPanel from './components/SourcesPanel';
import PastQuestionsPanel from './components/PastQuestionsPanel';
import RepresentationsPanel from './components/RepresentationsPanel';
import ToolPanel from './components/ToolPanel';
import NextStepBanner from './components/NextStepBanner';
import CheckPanel from './components/CheckPanel';
import ProvenancePanel from './components/ProvenancePanel';
import BibliographyView from './components/BibliographyView';
import BottomStrip from './components/BottomStrip';
import ReentryOverlay from './components/ReentryOverlay';
import CanvasSettingsOverlay from './components/CanvasSettingsOverlay';
import NoBriefPrompt from './components/NoBriefPrompt';
import AffirmationBanner from './components/AffirmationBanner';
import AnnouncementBanner from './components/AnnouncementBanner';
import { getSensoryCSSVars, getSensoryProfile } from '../theme/sensoryProfiles';
import FidgetZone from './components/FidgetZone';
import QuestionCoach from './components/QuestionCoach';
import ExamTimer from './components/ExamTimer';
import ExamBreakOverlay from './components/ExamBreakOverlay';
import BodyDoublingLine from './components/BodyDoublingLine';
import { parseExamPaper, parseMarkingGuidelines } from '../services/ExamPaperParser';
import { startAmbient, stopAmbient } from './services/AmbientSound';
import { startIdleDetection, stopIdleDetection } from '../core/ExecutiveSpine';
import ReadingRuler from './components/ReadingRuler';
import WritingAnalysis from './components/WritingAnalysis';
import ComprehensionBreak from './components/ComprehensionBreak';
import PreWritePanel from './components/PreWritePanel';
import SocraticPanel from './components/SocraticPanel';
import DocLibrary from './components/DocLibrary';
import FirstLookCard from './components/FirstLookCard';
import { appendEvent } from '../core/HistoryOfThought';
import TaskPhaseBar from './components/TaskPhaseBar';
import { buildAssessmentKey, getCurrentPhaseId, setCurrentPhaseId } from '../core/TaskSequenceManager';
import './CanvasScreen.css';
import {
  COLOUR_WARN, COLOUR_WARN_TINT, COLOUR_WARN_BORDER,
  ACCENT_GLASS_SUBTLE, ACCENT_LINE_DIM,
  ACCENT_BORDER, ACCENT_PULSE, TEXT_MUTED, SHADOW_CARD,
} from '../theme/tokens';

/**
 * CanvasScreen (Screen 4)
 *
 * Orchestrator for the writing canvas.
 * Reads active course + assessment from RouterContext + ProjectContext.
 * Manages panel state (collapsed by default = focused mode).
 *
 * BottomStrip and ReentryOverlay are wired in Step 4.
 */

export default function CanvasScreen() {
  const { courseId, assessmentTitle, navigateToAssessments } = useRouter();
  const { courses, activeCourse, projectSources, upgradeCourseExtraction } = useProject();
  const { user } = useAuth();
  const { reducedMotion, isZenMode, theme, autismFirstEnabled, sensoryLevel, isLiteralMode, ambientPreference, examExtraTimePercent, setExamExtraTimePercent, examQuestionsPerBall } = useSettings();

  // Ambient sound: start/stop when preference changes
  useEffect(() => {
    if (autismFirstEnabled && ambientPreference && ambientPreference !== 'none') {
      startAmbient(ambientPreference);
    } else {
      stopAmbient();
    }
    return () => stopAmbient();
  }, [autismFirstEnabled, ambientPreference]);

  // Wire idle detection so AURA can nudge after 3 minutes of inactivity
  useEffect(() => {
    if (!courseId) return;
    startIdleDetection({ thresholdMs: 180_000 });
    return () => stopIdleDetection();
  }, [courseId]);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Supabase fallback: if localStorage has no course for this courseId,
  // fetch course + assessments from Supabase and rebuild extractionData.
  const [sbCourse, setSbCourse] = useState(null);
  useEffect(() => {
    if (courses?.[courseId] || !courseId) return;
    (async () => {
      const { data: courseRow } = await supabase.from('courses')
        .select('id, name, code, tier, term').eq('id', courseId).single();
      if (!courseRow) return;
      const { data: assessRows } = await supabase.from('assessments')
        .select('id, title, brief_text, due_date, weight, status')
        .eq('course_id', courseId).order('created_at');
      const briefs = (assessRows || []).map(a => ({
        title: a.title,
        body: a.brief_text || '',
        dueDate: a.due_date || null,
        weight: a.weight || '',
        wordCountGoal: 0,
      }));
      setSbCourse({
        name: courseRow.name,
        extractionData: {
          assessmentBriefs: briefs,
          assessmentTitles: briefs.map(b => b.weight ? `${b.title} (${b.weight})` : b.title),
          rubricCriteria: [],
        },
      });
    })();
  }, [courseId, courses]);

  // Resolve course and assessment
  const course = courses?.[courseId] || activeCourse || sbCourse || {};
  const courseName = course.name || 'Untitled';
  const briefs = course.extractionData?.assessmentBriefs || [];
  const brief = useMemo(() => {
    if (!assessmentTitle) return briefs[0] || null;
    return briefs.find(b => {
      const display = b.weight ? `${b.title} (${b.weight})` : b.title;
      return display === assessmentTitle || b.title === assessmentTitle;
    }) || briefs[0] || null;
  }, [briefs, assessmentTitle]);

  // Document classification: use value baked in during ingestion if present.
  // Skip modal if already confirmed for this course.
  const preClassifiedType = course.extractionData?.documentType || null;
  const classificationConfirmed = localStorage.getItem(`simplifii-classified-${courseId}`);
  const [docClassification, setDocClassification] = useState(
    preClassifiedType && !classificationConfirmed ? { type: preClassifiedType, confidence: 1 } : null
  );
  // Client-side exam heuristic: if pre-classification is missing, check the full
  // extracted text for unambiguous exam paper signals. This prevents the layout
  // from flipping mid-render when the async /api/classify-document call is slow.
  const examHeuristic = !preClassifiedType && !!extractedText && (
    /\b(?:HIGHER SCHOOL CERTIFICATE|NESA|VCAA|QCAA|SCSA|Board of Studies)\b/i.test(extractedText.slice(0, 4000)) ||
    /\b(?:Section\s+I{1,3}|Multiple Choice|Extended Response|Answer Booklet)\b/i.test(extractedText.slice(0, 4000)) ||
    /\bQuestion\s+\d+\b.*\bmarks?\b/i.test(extractedText.slice(0, 4000))
  );
  const effectiveDocType = docClassification?.type || preClassifiedType || (examHeuristic ? 'exam_paper' : null);
  const isExamPaper = effectiveDocType === 'exam_paper';
  const targetWords = isExamPaper ? 0 : (brief?.wordCountGoal || 1500);
  const currentTitle = brief?.title || assessmentTitle || 'Assessment';
  const rubricCriteria = course.extractionData?.rubricCriteria || [];
  const rubricBands = course.extractionData?.rubricBands || [];
  const rubricDetected = course.extractionData?.rubricDetected || false;
  const sourceFiles = course.extractionData?.sourceFiles || [];
  const nodes = course.extractionData?.nodes || [];

  // Sprint 5: task sequence phase bar
  const taskSequence = course.extractionData?.taskSequence || null;
  const taskPhases = taskSequence?.phases || [];
  const assessmentKey = useMemo(
    () => (courseId && currentTitle) ? buildAssessmentKey(courseId, currentTitle) : null,
    [courseId, currentTitle]
  );
  const [activePhaseId, setActivePhaseId] = useState(null);
  useEffect(() => {
    if (assessmentKey && taskPhases.length > 0) {
      setActivePhaseId(prev => prev || getCurrentPhaseId(assessmentKey, taskPhases));
    }
  }, [assessmentKey, taskPhases.length]); // eslint-disable-line
  const currentPhase = taskPhases.find(p => p.id === activePhaseId) || null;

  // Raw extracted text: fallback for tools when structured brief is empty.
  // This ensures tools work even for non-brief PDFs (exam papers, notes, etc).
  const extractedText = course.extractionData?.rawText || course.sourceContent || '';

  // Exam paper: parse questions from raw text for multimodal canvas
  const examData = useMemo(() => {
    if (!isExamPaper || !extractedText) return null;
    return parseExamPaper(extractedText);
  }, [isExamPaper, extractedText]);

  // Stable document fingerprint: djb2 hash of first 200 chars of extracted text.
  // Gives each uploaded exam paper its own answer-key namespace even when two
  // papers sit under the same courseId.
  const examDocId = useMemo(() => {
    if (!extractedText) return courseId;
    const snippet = extractedText.slice(0, 200);
    let h = 5381;
    for (let i = 0; i < snippet.length; i++) {
      h = ((h << 5) + h + snippet.charCodeAt(i)) & 0xffffffff;
    }
    return `${courseId}_${(h >>> 0).toString(36)}`;
  }, [courseId, extractedText]);
  // Marking guidelines: parse any uploaded marking_guidelines docs and merge per-question criteria.
  const markingGuidelines = useMemo(() => {
    if (!isExamPaper) return {};
    const docs = course.extractionData?.documents || [];
    const guidelineDocs = docs.filter(d => d.type === 'marking_guidelines');
    if (guidelineDocs.length === 0) return {};
    return guidelineDocs.reduce((acc, doc) => {
      const parsed = parseMarkingGuidelines(doc.text || '');
      return { ...acc, ...parsed };
    }, {});
  }, [isExamPaper, course.extractionData?.documents]);

  const [activeQuestionNum, setActiveQuestionNum] = useState(1);
  const [examPhase, setExamPhase] = useState('reading');
  const [examBreakVisible, setExamBreakVisible] = useState(false);

  // Show break overlay when energy hits zero (EnergyOrbs dispatches lowEnergy).
  useEffect(() => {
    if (!isExamPaper) return;
    const handler = (e) => {
      if (e.detail?.state === 'lowEnergy') setExamBreakVisible(true);
    };
    const resetHandler = () => setExamBreakVisible(false);
    window.addEventListener('simplifii:aura-state', handler);
    window.addEventListener('simplifii:energy-reset', resetHandler);
    return () => {
      window.removeEventListener('simplifii:aura-state', handler);
      window.removeEventListener('simplifii:energy-reset', resetHandler);
    };
  }, [isExamPaper]);
  // Prefer actual content (body or extractedText) over the assessment title.
  // brief.body may be empty if cloud enhancement hasn't completed yet;
  // extractedText always has the raw PDF output from pdfjs.
  const briefOrText = (brief?.body && brief.body.length > 50 ? brief.body : null)
    || (extractedText && extractedText.length > 50 ? extractedText : null)
    || brief?.title || '';

  // Save status + save-event affirmation (fires every 5th save)
  const [saveStatus, setSaveStatus] = useState('saved');
  const [lastSavedAgo, setLastSavedAgo] = useState('');
  const [showSaveAffirmation, setShowSaveAffirmation] = useState(false);
  const saveCountRef = useRef(0);
  const handleSaveStatus = useCallback((status, ago) => {
    setSaveStatus(status);
    setLastSavedAgo(ago || '');
    if (status === 'saved') {
      saveCountRef.current += 1;
      if (saveCountRef.current % 5 === 0) {
        setShowSaveAffirmation(true);
        setTimeout(() => setShowSaveAffirmation(false), 6000);
      }
    }
  }, []);

  // Word count + draft text + TipTap JSON (for panels and export)
  const [wordCount, setWordCount] = useState(0);
  const [draftText, setDraftText] = useState('');
  const [tiptapDoc, setTiptapDoc] = useState(null);
  const handleWordCount = useCallback((count) => setWordCount(count), []);

  // Hallucination scanner: detects citations in draft text and flags
  // any that are not found+verified in the project corpus.
  const [unverifiedMatches, setUnverifiedMatches] = useState([]);
  const scanTimerRef = useRef(null);
  useEffect(() => {
    clearTimeout(scanTimerRef.current);
    scanTimerRef.current = setTimeout(() => {
      const plain = draftText.replace(/<[^>]*>/g, ' ');
      const suspected = detectSuspectedCitations(plain);
      if (suspected.length === 0) {
        setUnverifiedMatches([]);
        return;
      }
      const sourcesList = Object.values(projectSources || {});
      const flagged = suspected
        .filter(hit => {
          const result = verifyFromSources(sourcesList, { author: hit.author, year: hit.year });
          return !result.found || !result.verified;
        })
        .map(hit => hit.match);
      setUnverifiedMatches(flagged);
    }, 1500);
    return () => clearTimeout(scanTimerRef.current);
  }, [draftText, projectSources]);

  // Dynamic sections: AI-generated based on uploaded brief
  const [dynamicSections, setDynamicSections] = useState(null);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('introduction');
  const compileFnRef = useRef(null);
  const lastDocTypeRef = useRef(null);

  // Use sections pre-generated during ingestion when available, otherwise
  // fetch on demand. Re-fetches when document type changes (e.g. classification
  // arrives and changes from unknown to exam_paper).
  useEffect(() => {
    // If docType changed and we already have sections, regenerate
    if (dynamicSections && effectiveDocType && lastDocTypeRef.current !== effectiveDocType) {
      lastDocTypeRef.current = effectiveDocType;
      setDynamicSections(null); // force re-fetch with correct type
      return;
    }
    if (dynamicSections) return;

    // 1. Sections already baked into extractionData by the ingestion cloud path.
    const preSections = course.extractionData?.aiSections;
    if (Array.isArray(preSections) && preSections.length > 0) {
      setDynamicSections(preSections);
      setActiveSection(preSections[0]?.type || 'introduction');
      return;
    }

    if (!briefOrText || briefOrText.length < 30) return;
    // Exam papers use QuestionCoach, not SectionEditor - skip section generation.
    if (isExamPaper) return;

    // 2. Session cache (avoids duplicate API calls on re-render).
    // Include docType in key so cached essay sections are not reused for exam papers.
    const cacheKey = `simplifii_sections_${courseId}_${currentTitle}_${effectiveDocType || 'unknown'}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setDynamicSections(parsed);
        setActiveSection(parsed[0]?.type || 'introduction');
        return;
      } catch { /* ignore corrupt cache */ }
    }

    // 3. On-demand fetch: brief is available but ingestion cloud path did not run.
    setSectionsLoading(true);
    fetch('/api/generate-sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefText: briefOrText.slice(0, 4000),
        assessmentTitle: currentTitle,
        assessmentType: effectiveDocType || course.extractionData?.documentType || '',
        tier: course.extractionData?.detectedLevel || 'tertiary',
        wordCount: targetWords,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.sections?.length > 0) {
          setDynamicSections(data.sections);
          setActiveSection(data.sections[0].type);
          sessionStorage.setItem(cacheKey, JSON.stringify(data.sections));
        }
      })
      .catch(() => {})
      .finally(() => setSectionsLoading(false));
  }, [briefOrText, course.extractionData, courseId, currentTitle, targetWords, dynamicSections, effectiveDocType]);

  const examFallbackSections = [
    { type: 'section_mc', label: 'Section I: Multiple Choice', targetWords: 0, guidance: 'Practice the multiple choice questions. Eliminate wrong answers first.' },
    { type: 'section_short', label: 'Section II: Short Answer', targetWords: 0, guidance: 'Short answer questions. Show your working. Be specific.' },
    { type: 'section_extended', label: 'Section III: Extended Response', targetWords: 0, guidance: 'Extended response. Plan before writing. Use evidence from the question.' },
  ];

  const essayFallbackSections = [
    { type: 'introduction', label: 'Introduction', targetWords: Math.round(targetWords * 0.15), guidance: '' },
    { type: 'body_1', label: 'Body Section 1', targetWords: Math.round(targetWords * 0.25), guidance: '' },
    { type: 'body_2', label: 'Body Section 2', targetWords: Math.round(targetWords * 0.25), guidance: '' },
    { type: 'body_3', label: 'Body Section 3', targetWords: Math.round(targetWords * 0.20), guidance: '' },
    { type: 'conclusion', label: 'Conclusion', targetWords: Math.round(targetWords * 0.15), guidance: '' },
  ];

  const activeSections = dynamicSections || (isExamPaper ? examFallbackSections : essayFallbackSections);

  useEffect(() => {
    if (docClassification) return;
    if (localStorage.getItem(`simplifii-classified-${courseId}`)) return;
    if (!briefOrText || briefOrText.length < 30) return;
    const classKey = `simplifii_classified_${courseId}_${currentTitle}`;
    if (sessionStorage.getItem(classKey)) return;
    fetch('/api/classify-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textSnippet: briefOrText.slice(0, 1000) }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.type !== 'unknown') {
          setDocClassification(data);
          sessionStorage.setItem(classKey, 'true');
        }
      })
      .catch(() => {});
  }, [briefOrText, courseId, currentTitle, docClassification]);

  // Panel rail + collapse state.
  // Default to tutor (Tier 2 Socratic) so the three-tier layout is visible on load.
  const [activePanel, setActivePanel] = useState('tutor');

  // Log tier transitions to HistoryOfThought for the Authenticity Report
  const setActivePanelWithLog = useCallback((panel) => {
    setActivePanel(panel);
    if (panel === 'tutor') {
      appendEvent({ event_type: 'tier_transition', payload: { to: 2, panel: 'tutor' } }).catch(() => {});
    }
  }, []);
  // Pending message to inject into TutorPanel (from MultimodalCanvas "Check my answer" etc)
  const [pendingTutorMessage, setPendingTutorMessage] = useState(null);

  const [leftCollapsed, setLeftCollapsed] = useState(() => localStorage.getItem('simplifii_left_collapsed') === 'true');
  const [railVisible, setRailVisible] = useState(false);
  const [focusTimerOpen, setFocusTimerOpen] = useState(false);

  // Close panel when session starts (FocusBar takes over); re-open panel on session end
  useEffect(() => {
    const onStart = () => setFocusTimerOpen(false);
    const onEnd = () => setFocusTimerOpen(true);
    window.addEventListener('bodyDoubling:sessionStarted', onStart);
    window.addEventListener('bodyDoubling:sessionEnded', onEnd);
    return () => {
      window.removeEventListener('bodyDoubling:sessionStarted', onStart);
      window.removeEventListener('bodyDoubling:sessionEnded', onEnd);
    };
  }, []);

  const toggleLeft = () => { const next = !leftCollapsed; setLeftCollapsed(next); localStorage.setItem('simplifii_left_collapsed', String(next)); };
  const [canvasTab, setCanvasTab] = useState('write'); // 'think' | 'ideas' | 'write'
  const [hasThinkContent, setHasThinkContent] = useState(false);
  const [hasIdeasContent, setHasIdeasContent] = useState(false);
  const [docLibOpen, setDocLibOpen] = useState(false);
  const [midIngest, setMidIngest] = useState(false);
  const [midIngestStatus, setMidIngestStatus] = useState('');
  const [aiPermDismissed, setAiPermDismissed] = useState(false);

  // Mid-session ingestion: adds a new document to the active course without
  // restarting the canvas. Classifies, extracts nodes, and merges into
  // extractionData. Fires document_added EventBus event on completion.
  const handleMidSessionIngest = async (fileList) => {
    if (!courseId) return;
    setMidIngest(true);
    setMidIngestStatus('Reading document...');
    try {
      for (const file of Array.from(fileList)) {
        const text = await processDocumentWithGCP(file);
        if (!text || text.trim().length === 0) continue;
        setMidIngestStatus('Extracting structure...');
        const extractNodes = await import('../services/DocumentNodeService').then(m => m.extractNodes);
        const classified = classifyDocumentText(text, file.name);
        const { nodes } = await extractNodes(
          { type: classified, text, filename: file.name },
          user?.id || 'local'
        );
        const newDoc = {
          filename: file.name,
          type: classified,
          text: text.slice(0, 5000),
          nodes: nodes || [],
        };
        const course = courses?.[courseId] || activeCourse || {};
        const existing = course?.extractionData?.documents || [];
        upgradeCourseExtraction(courseId, {
          extractionData: {
            documents: [...existing, newDoc],
            nodes: [
              ...(course.extractionData?.nodes || []),
              ...(nodes || []),
            ],
            sourceFiles: [
              ...(course.extractionData?.sourceFiles || []),
              file.name,
            ],
          },
        });
        window.dispatchEvent(new CustomEvent('simplifii:document-added', {
          detail: { courseId, filename: file.name, type: classified },
        }));
        setMidIngestStatus(`Added: ${file.name}`);
      }
    } catch (err) {
      setMidIngestStatus('Could not add document. Try again.');
    } finally {
      setMidIngest(false);
      setTimeout(() => setMidIngestStatus(''), 3000);
    }
  };

  // Listen for AURA tool suggestions: open the rail to a specific panel
  useEffect(() => {
    const handler = (e) => {
      const toolId = e.detail?.toolId;
      if (toolId) {
        setRailVisible(true);
        setActivePanelWithLog(toolId);
      }
    };
    window.addEventListener('simplifii:open-tool', handler);
    return () => window.removeEventListener('simplifii:open-tool', handler);
  }, [setActivePanelWithLog]);

  // Each panel is always mounted (preserves local state like chat messages
  // and check results) but hidden via display:none when not active. Only
  // PreviewPanel and CheckPanel receive draftText; the others never
  // re-render on keystrokes.
  const panelContent = activePanel ? (
    <>
      <div style={{ display: activePanel === 'brief' ? 'contents' : 'none' }}>
        <BriefPanel
          brief={brief}
          rubricCriteria={rubricCriteria}
          rubricBands={rubricBands}
          rubricDetected={rubricDetected}
          courseId={courseId}
          assessmentTitle={currentTitle}
          extractedText={extractedText}
          documentType={effectiveDocType}
        />
      </div>
      <div style={{ display: activePanel === 'tutor' ? 'contents' : 'none' }}>
        <TutorPanel assessmentTitle={currentTitle} briefText={briefOrText} documentType={effectiveDocType} pendingMessage={pendingTutorMessage} onPendingConsumed={() => setPendingTutorMessage(null)} />
      </div>
      <div style={{ display: activePanel === 'preview' ? 'contents' : 'none' }}>
        <PreviewPanel draftText={compileFnRef.current ? compileFnRef.current() : draftText} wordCount={wordCount} />
      </div>
      <div style={{ display: activePanel === 'sources' ? 'contents' : 'none' }}>
        <SourcesPanel courseId={courseId} />
      </div>
      <div style={{ display: activePanel === 'provenance' ? 'contents' : 'none' }}>
        <ProvenancePanel
          courseId={courseId}
          assessmentTitle={currentTitle}
          courseName={courseName}
          courseCode={courseName}
          term={course.term || course.extractionData?.term}
        />
      </div>
      <div style={{ display: activePanel === 'check' ? 'contents' : 'none' }}>
        <CheckPanel
          draftText={draftText}
          wordCount={wordCount}
          targetWords={targetWords}
          rubricCriteria={rubricCriteria}
          courseId={courseId}
          assessmentTitle={currentTitle}
        />
      </div>
      <div style={{ display: activePanel === 'pastqs' ? 'contents' : 'none' }}>
        <PastQuestionsPanel
          assessmentTitle={currentTitle}
          briefText={briefOrText}
          courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'udl' ? 'contents' : 'none' }}>
        <RepresentationsPanel
          assessmentTitle={currentTitle}
          briefText={briefOrText}
          courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'simplify' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="brief-simplifier" title="Brief Simplifier" endpoint="/api/simplify-brief" resultKey="plan"
          description="Week-by-week action plan from your uploaded brief."
          buttonLabel="Generate action plan"
          buildPayload={(brief, rubric, draft, s) => ({ briefText: brief, assessmentTitle: s.assessmentTitle, tier: s.tier, documentType: effectiveDocType || '', literalMode: s.literalMode, accessibilityProfile: s.accessibilityProfile, learnerContext: s.learnerContext })}
          briefText={briefOrText} rubricText="" draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'rubric' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="rubric-decoder" title="Rubric Decoder" endpoint="/api/decode-rubric" resultKey="decoded"
          description="Plain language translation of what markers actually want."
          buttonLabel="Decode rubric"
          buildPayload={(brief, rubric, draft, s) => ({ rubricText: brief, assessmentTitle: s.assessmentTitle, tier: s.tier, literalMode: s.literalMode, accessibilityProfile: s.accessibilityProfile, learnerContext: s.learnerContext })}
          briefText={briefOrText} rubricText={rubricCriteria?.join('\n') || ''} draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'scorer' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="essay-scorer" title="Essay Scorer" endpoint="/api/score-essay" resultKey="feedback"
          description="Formative feedback on your draft. Not a grade. Honest improvement suggestions."
          buttonLabel="Score my draft"
          buildPayload={(brief, rubric, draft, s) => ({ draftText: draft, rubricCriteria: rubric, assessmentTitle: s.assessmentTitle, tier: s.tier, literalMode: s.literalMode, accessibilityProfile: s.accessibilityProfile, learnerContext: s.learnerContext })}
          briefText="" rubricText={rubricCriteria?.join('\n') || ''} draftText={draftText} assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'hidden' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="hidden-decoder" title="Hidden Curriculum" endpoint="/api/decode-hidden" resultKey="decoded"
          description="Decode what markers actually want vs what the brief literally says."
          buttonLabel="Decode hidden curriculum"
          buildPayload={(brief, rubric, draft, s) => ({ briefText: brief, assessmentTitle: s.assessmentTitle, tier: s.tier, literalMode: s.literalMode, accessibilityProfile: s.accessibilityProfile, learnerContext: s.learnerContext })}
          briefText={briefOrText} rubricText="" draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      {/* Humaniser: AURA-triggered only, not in PanelRail tabs */}
      <div style={{ display: activePanel === 'humanise' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="humaniser" title="Humaniser" endpoint="/api/humanise" resultKey="humanisedText"
          description="Rewrite your draft to sound like you wrote it. Reduces AI detection markers."
          buttonLabel="Make it sound like me"
          buildPayload={(brief, rubric, draft, s) => ({ draftText: draft, assessmentTitle: s.assessmentTitle, tier: s.tier, literalMode: s.literalMode, accessibilityProfile: s.accessibilityProfile, learnerContext: s.learnerContext })}
          briefText="" rubricText="" draftText={draftText} assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      {/* BreathBubble relocated to CanvasSettingsOverlay > Wellbeing */}
      <div style={{ display: activePanel === 'analysis' ? 'contents' : 'none' }}>
        <WritingAnalysis draftText={draftText} />
      </div>
    </>
  ) : null;

  return (
    <div className={`canvas-root theme-${theme || 'dark'} ${reducedMotion ? 'canvas-no-motion' : ''} ${isZenMode ? 'canvas-zen' : ''}`}
      style={autismFirstEnabled ? getSensoryCSSVars(sensoryLevel) : undefined}
    >
      <CanvasNav
        courseName={courseName}
        assessmentTitle={currentTitle}
        saveStatus={saveStatus}
        lastSavedAgo={lastSavedAgo}
        tiptapDoc={tiptapDoc}
        htmlContent={compileFnRef.current ? compileFnRef.current() : draftText}
        courseId={courseId}
        onOpenSettings={() => setSettingsOpen(true)}
        onCourseName={briefs.length > 1 ? () => navigateToAssessments(courseId) : undefined}
      />}

      {/* Docs button: opens DocLibrary drawer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 24px 0' }}>
        <button
          type="button"
          aria-label="Open document library"
          onClick={() => setDocLibOpen(true)}
          style={{
            background: 'transparent',
            border: '1px solid var(--theme-border, #27272a)',
            borderRadius: 6,
            color: 'var(--text-faint, #71717a)',
            fontFamily: 'var(--font-system, system-ui)',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0 12px',
            minHeight: 32,
            cursor: 'pointer',
            outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.outline = '2px solid #f4f4f5'; }} /* allow-style */
          onBlur={e => { e.currentTarget.style.outline = 'none'; }}
        >
          Docs
        </button>
        {/* Focus button: one tap starts a session (skips setup form on return visits) */}
        <button
          type="button"
          aria-label="Start focus session"
          title={localStorage.getItem('bd_sessions') ? 'Start a focus session' : 'Focus with AURA'}
          onClick={() => {
            const isReturn = !!localStorage.getItem('bd_sessions');
            setFocusTimerOpen(true);
            if (isReturn) window.dispatchEvent(new CustomEvent('bodyDoubling:quickStart'));
          }}
          style={{
            background: 'transparent',
            border: '1px solid var(--theme-border, #27272a)',
            borderRadius: 6,
            color: 'var(--text-faint, #71717a)',
            fontFamily: 'var(--font-system, system-ui)',
            fontSize: 9,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0 12px',
            minHeight: 32,
            cursor: 'pointer',
            outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.outline = '2px solid #f4f4f5'; }} /* allow-style */
          onBlur={e => { e.currentTarget.style.outline = 'none'; }}
        >
          Focus
        </button>
      </div>

      {taskPhases.length > 0 && (
        <div style={{ padding: '0 24px' }}>
          <TaskPhaseBar
            phases={taskPhases}
            currentPhaseId={activePhaseId}
            onSelectPhase={(phaseId) => {
              setActivePhaseId(phaseId);
              if (assessmentKey) setCurrentPhaseId(assessmentKey, phaseId, taskPhases);
            }}
          />
        </div>
      )}

      <NextStepBanner
        briefText={briefOrText}
        rubricText={rubricCriteria?.join('\n') || ''}
        draftText={draftText}
        wordCount={wordCount}
        targetWords={targetWords}
        assessmentTitle={currentTitle}
        activePanel={activePanel}
        onSelectPanel={setActivePanelWithLog}
      />

      <div className="canvas-body">
        {/* AI Permission banner: No Assistance warning */}
        {!aiPermDismissed && course.extractionData?.aiPermission === 'no_assistance' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: COLOUR_WARN_TINT, borderBottom: `1px solid ${COLOUR_WARN_BORDER}`, fontFamily: 'var(--font-body, Inter, sans-serif)', fontSize: 12, color: COLOUR_WARN }}> {/* allow-style */}
            <span>Your lecturer has set this assessment to No AI Assistance. AURA can help you think but cannot generate content for this task.</span>
            <button type="button" onClick={() => setAiPermDismissed(true)} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLOUR_WARN, fontSize: 16, padding: 4, minHeight: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u2715'}</button>
          </div>
        )}
        {/* Exam paper: show question nav instead of section rail */}
        {/* Vertical tab sidebar: 48px left column, restores layout anchoring */}
        {!isExamPaper && (
          <nav
            role="tablist"
            aria-label="Canvas sections"
            style={{
              width: 52,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--theme-surface, #18181b)', /* allow-style */
              borderRight: '1px solid var(--theme-border, #27272a)', /* allow-style */
              paddingTop: 12,
              gap: 4,
            }}
          >
            {[
              { id: 'think', label: 'THINK', fullLabel: '1. Think First', hasDot: hasThinkContent },
              { id: 'ideas', label: 'IDEAS', fullLabel: '2. Get Ideas', hasDot: hasIdeasContent },
              { id: 'write', label: 'WRITE', fullLabel: '3. Write', hasDot: false },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={canvasTab === tab.id}
                aria-label={tab.fullLabel}
                title={tab.fullLabel}
                onClick={() => setCanvasTab(tab.id)}
                style={{
                  width: '100%',
                  minHeight: 72,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  background: 'transparent',
                  border: 'none',
                  borderLeft: canvasTab === tab.id ? '2px solid var(--sov-line, #10b981)' : '2px solid transparent', /* allow-style */
                  cursor: 'pointer',
                  outline: 'none',
                  paddingLeft: 0,
                  paddingRight: 0,
                }}
                onFocus={e => { e.currentTarget.style.outline = '2px solid #f4f4f5'; }} /* allow-style */
                onBlur={e => { e.currentTarget.style.outline = 'none'; }}
              >
                <span style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  fontFamily: 'var(--font-system, system-ui)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: canvasTab === tab.id ? 'var(--sov-line, #10b981)' : 'var(--text-faint, #8d8d96)', /* allow-style */
                  userSelect: 'none',
                }}>
                  {tab.label}
                </span>
                {tab.hasDot && (
                  <span
                    style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sov-line, #10b981)', flexShrink: 0 }} /* allow-style */
                    aria-label="Content ready"
                  />
                )}
              </button>
            ))}
          </nav>
        )}

        <div className="canvas-centre">
          {/* Tab: Think First (Tier 2 Socratic) */}
          <div style={{ display: !isExamPaper && canvasTab === 'think' ? 'flex' : 'none', flex: 1, overflow: 'auto' }}>
            {currentTitle && (
              <SocraticPanel
                assessmentTitle={currentTitle}
                courseId={courseId}
                currentPhase={currentPhase}
                nodes={nodes}
                onContentReady={() => setHasThinkContent(true)}
              />
            )}
          </div>

          {/* Tab: Get Ideas (Tier 1 Pre-Write) */}
          <div style={{ display: !isExamPaper && canvasTab === 'ideas' ? 'flex' : 'none', flex: 1, overflow: 'auto' }}>
            <PreWritePanel
              assessmentTitle={currentTitle}
              briefText={briefOrText}
              rubricCriteria={rubricCriteria}
              sectionType={activeSection}
              tier={course.extractionData?.detectedLevel || 'tertiary'}
              onInsert={(text) => {
                window.dispatchEvent(new CustomEvent('simplifii:voice-transcript', { detail: { text: ' ' + text } }));
                appendEvent({ event_type: 'tier_transition', payload: { from: 1, to: 3, trigger: 'pre_write_insert' } }).catch(() => {});
                setCanvasTab('write');
              }}
              onContentReady={() => setHasIdeasContent(true)}
              courseId={courseId}
            />
          </div>

          {/* Tab: Write (Tier 3 editor, always mounted, display-toggled) */}
          {/* isExamPaper: tab nav is hidden, so this pane must always be visible for exam papers */}
          <div style={{ display: (isExamPaper || canvasTab === 'write') ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}>
            {briefs.length === 0 && !extractedText && <NoBriefPrompt courseId={courseId} />}

          {/* First Look: auto-generated document summary on first visit */}
          {(briefOrText && briefOrText.length > 50) && (
            <FirstLookCard
              courseId={courseId}
              assessmentTitle={currentTitle}
              briefText={briefOrText}
              documentType={effectiveDocType}
              isExamPaper={isExamPaper}
              examData={examData}
              rubricDetected={rubricDetected}
              targetWords={targetWords}
            />
          )}

          {/* Section navigation pills: let students switch sections within WRITE tab */}
          {!isExamPaper && activeSections.length > 1 && (
            <div
              role="tablist"
              aria-label="Assessment sections"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                padding: '8px 16px',
                borderBottom: '1px solid var(--theme-border, #27272a)', /* allow-style */
              }}
            >
              {activeSections.map(sec => {
                const isActive = sec.type === activeSection;
                return (
                  <button
                    key={sec.type}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveSection(sec.type)}
                    style={{
                      fontFamily: 'var(--font-system, system-ui)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius, 6px)',
                      cursor: 'pointer',
                      outline: 'none',
                      minHeight: 32,
                      border: isActive
                        ? '1px solid var(--sov-line, #10b981)' /* allow-style */
                        : '1px solid var(--theme-border, #27272a)', /* allow-style */
                      background: isActive
                        ? ACCENT_GLASS_SUBTLE
                        : 'transparent',
                      color: isActive
                        ? 'var(--sov-line, #10b981)' /* allow-style */
                        : 'var(--text-faint, #71717a)', /* allow-style */
                    }}
                  >
                    {sec.label}
                    {sec.targetWords > 0 && (
                      <span style={{ marginLeft: 4, fontWeight: 400, opacity: 0.7 }}>
                        (target: {sec.targetWords}w)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Exam timer: fixed left-edge strip, only on exam papers */}
          {isExamPaper && examData && (
            <ExamTimer
              examData={examData}
              activeQuestion={activeQuestionNum}
              extraTimePercent={examExtraTimePercent}
              onSetExtraTime={setExamExtraTimePercent}
              onPhaseChange={setExamPhase}
              onMoveOn={() => {
                const idx = (examData.questions || []).findIndex(q => q.number === activeQuestionNum);
                const next = examData.questions?.[idx + 1];
                if (next) setActiveQuestionNum(next.number);
              }}
              reducedMotion={reducedMotion}
            />
          )}

          {/* Break overlay: shown when exam energy hits zero */}
          {isExamPaper && examBreakVisible && (
            <ExamBreakOverlay onReturn={() => setExamBreakVisible(false)} />
          )}

          {/* Exam paper: multimodal canvas per question. SectionEditor NEVER renders on exam papers. */}
          {isExamPaper ? (
            <QuestionCoach
              questions={examData?.questions || []}
              activeQuestion={activeQuestionNum}
              onSelectQuestion={setActiveQuestionNum}
              documentId={examDocId}
              markingGuidelines={markingGuidelines}
              isReadingTime={examPhase === 'reading'}
              extraTimePercent={examExtraTimePercent ?? 0}
              energyCostPerQuestion={examQuestionsPerBall > 0 ? 1 / examQuestionsPerBall : 0}
              onAskTutor={(text) => { setPendingTutorMessage(text); setRailVisible(true); setActivePanelWithLog('tutor'); }}
            />
          ) : (
          <SectionEditor
            sections={activeSections}
            activeSection={activeSection}
            courseId={courseId}
            assessmentTitle={currentTitle}
            targetWords={targetWords}
            onWordCountChange={handleWordCount}
            onSaveStatusChange={handleSaveStatus}
            onTextChange={setDraftText}
            onJsonDocChange={setTiptapDoc}
            onCompileReady={(fn) => { compileFnRef.current = fn; }}
            citationFlags={unverifiedMatches}
          />
          )}
          <BibliographyView />
          </div>
        </div>

        {/* Minimal UI: rail hidden by default, AURA surfaces tools contextually */}
        {railVisible ? (
          <PanelRail
            activePanel={activePanel}
            onSelectPanel={setActivePanelWithLog}
            panelContent={panelContent}
            onHideRail={() => { setRailVisible(false); setActivePanelWithLog(null); }}
          />
        ) : (
          <button
            type="button"
            aria-label="Open tools"
            title="Open tools panel"
            onClick={() => setRailVisible(true)}
            style={{ position: 'absolute', right: 8, top: 56, zIndex: 20, width: 32, height: 32, borderRadius: 16, background: ACCENT_LINE_DIM, border: 'none', color: 'var(--sov-line, #10b981)', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} /* allow-style */
          >
            T
          </button>
        )}
      </div>

      <AnnouncementBanner />
      <FidgetZone />
      <ReadingRuler />
      {!isExamPaper && (
        <ComprehensionBreak onCheckRequest={() => { setRailVisible(true); setActivePanel('check'); }} />
      )}
      {showSaveAffirmation && <AffirmationBanner trigger="save_event" visible={true} />}
      {/* Focus timer (body doubling) */}
      {focusTimerOpen && (
        <div style={{ position: 'fixed', bottom: 48, right: 16, zIndex: 50, width: 340, maxWidth: 'calc(100vw - 32px)', maxHeight: '70vh', overflowY: 'auto', borderRadius: 8, boxShadow: `0 4px 24px ${SHADOW_CARD}` }}>
          <BodyDoublingLine />
        </div>
      )}
      <button
        type="button"
        onClick={() => setFocusTimerOpen(prev => !prev)}
        aria-label={focusTimerOpen ? 'Close focus timer' : 'Open focus timer'}
        title="Focus timer"
        style={{ position: 'fixed', bottom: 52, right: focusTimerOpen ? 360 : 16, zIndex: 51, width: 36, height: 36, borderRadius: 18, background: focusTimerOpen ? ACCENT_PULSE : ACCENT_LINE_DIM, border: 'none', color: focusTimerOpen ? '#fff' : 'var(--sov-line, #10b981)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'right 200ms ease' }} /* allow-style */
      >
        {focusTimerOpen ? '\u2715' : '\u23F1'}
      </button>
      <BottomStrip wordCount={wordCount} targetWords={targetWords} assessmentTitle={currentTitle} />

      <ReentryOverlay
        courseId={courseId}
        assessmentTitle={currentTitle}
        onDismiss={() => {}}
        onChoice={(choiceId) => {
          if (choiceId === 'lost-flow') { setRailVisible(true); setActivePanelWithLog('tutor'); }
          else if (choiceId === 'overwhelmed') { setRailVisible(true); setActivePanelWithLog('check'); }
          else if (choiceId === 'forgot') { setRailVisible(true); setActivePanelWithLog('brief'); }
        }}
      />

      {settingsOpen && (
        <CanvasSettingsOverlay onClose={() => setSettingsOpen(false)} />
      )}

      <JokeOverlay />

      {docClassification && (
        <DocumentClassifiedModal
          type={docClassification.type}
          confidence={docClassification.confidence}
          suggestedActions={docClassification.suggested_actions}
          onAction={(i) => {
            const toolMap = { 0: 'simplify', 1: 'rubric', 2: null };
            if (docClassification.type === 'exam_paper') toolMap[0] = 'pastqs';
            if (docClassification.type === 'rubric') toolMap[0] = 'rubric';
            const panel = toolMap[i];
            if (panel) { setRailVisible(true); setActivePanelWithLog(panel); }
            localStorage.setItem(`simplifii-classified-${courseId}`, 'true');
            setDocClassification(null);
          }}
          onOverride={(newType) => {
            upgradeCourseExtraction(courseId, { extractionData: { documentType: newType } });
            localStorage.setItem(`simplifii-classified-${courseId}`, 'true');
            setDocClassification(null);
          }}
          onDismiss={() => { localStorage.setItem(`simplifii-classified-${courseId}`, 'true'); setDocClassification(null); }}
        />
      )}

      <DocLibrary
        isOpen={docLibOpen}
        onClose={() => setDocLibOpen(false)}
        documents={activeCourse?.extractionData?.documents || []}
        sourceFiles={activeCourse?.extractionData?.sourceFiles || []}
        onAddFiles={handleMidSessionIngest}
        ingesting={midIngest}
        ingestStatus={midIngestStatus}
      />
    </div>
  );
}
