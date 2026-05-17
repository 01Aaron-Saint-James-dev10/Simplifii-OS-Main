import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useProject } from './ProjectContext';
import { useSettings } from './SettingsContext';
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
import MultimodalCanvas from './components/MultimodalCanvas';
import QuestionNav from './components/QuestionNav';
import { parseExamPaper } from '../services/ExamPaperParser';
import { startAmbient, stopAmbient } from './services/AmbientSound';
import { startIdleDetection, stopIdleDetection } from '../core/ExecutiveSpine';
import ReadingRuler from './components/ReadingRuler';
import WritingAnalysis from './components/WritingAnalysis';
import ComprehensionBreak from './components/ComprehensionBreak';
import PreWritePanel from './components/PreWritePanel';
import SocraticPanel from './components/SocraticPanel';
import FirstLookCard from './components/FirstLookCard';
import { appendEvent } from '../core/HistoryOfThought';
import TaskPhaseBar from './components/TaskPhaseBar';
import { buildAssessmentKey, getCurrentPhaseId, setCurrentPhaseId } from '../core/TaskSequenceManager';
import './CanvasScreen.css';

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
  const { reducedMotion, isZenMode, theme, autismFirstEnabled, sensoryLevel, isLiteralMode, ambientPreference } = useSettings();

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
  const preClassifiedType = course.extractionData?.documentType || null;
  const [docClassification, setDocClassification] = useState(
    preClassifiedType ? { type: preClassifiedType, confidence: 1 } : null
  );
  const effectiveDocType = docClassification?.type || preClassifiedType || null;
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
  const [activeQuestionNum, setActiveQuestionNum] = useState(1);
  // Prefer actual content (body or extractedText) over the assessment title.
  // brief.body may be empty if cloud enhancement hasn't completed yet;
  // extractedText always has the raw PDF output from pdfjs.
  const briefOrText = (brief?.body && brief.body.length > 50 ? brief.body : null)
    || (extractedText && extractedText.length > 50 ? extractedText : null)
    || brief?.title || '';

  // Save status + save-event affirmation (fires every 5th save)
  const [saveStatus, setSaveStatus] = useState('unsaved');
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

    // 2. Session cache (avoids duplicate API calls on re-render).
    const cacheKey = `simplifii_sections_${courseId}_${currentTitle}`;
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
  const toggleLeft = () => { const next = !leftCollapsed; setLeftCollapsed(next); localStorage.setItem('simplifii_left_collapsed', String(next)); };
  const [canvasTab, setCanvasTab] = useState('write'); // 'think' | 'ideas' | 'write'
  const [hasThinkContent, setHasThinkContent] = useState(false);
  const [hasIdeasContent, setHasIdeasContent] = useState(false);

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
          buildPayload={(brief, rubric, draft, s) => ({ rubricText: rubric || brief, assessmentTitle: s.assessmentTitle, tier: s.tier, literalMode: s.literalMode, accessibilityProfile: s.accessibilityProfile, learnerContext: s.learnerContext })}
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
      />

      {taskPhases.length > 0 && (
        <div style={{ padding: '0 16px' }}>
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
        {/* Exam paper: show question nav instead of section rail */}
        {isExamPaper && examData?.questions?.length > 0 && (
          <QuestionNav
            questions={examData.questions}
            activeQuestion={activeQuestionNum}
            onSelect={setActiveQuestionNum}
            progress={{}}
          />
        )}

        <div className="canvas-centre">
          {/* Three-tier tab bar (essay mode only) */}
          {!isExamPaper && (
            <div style={{ display: 'flex', borderBottom: `1px solid var(--sov-line-dim, rgba(16,185,129,0.12))`, padding: '0 16px' }}> {/* allow-style */}
              {[
                { id: 'think', label: '1. Think First', hasDot: hasThinkContent },
                { id: 'ideas', label: '2. Get Ideas', hasDot: hasIdeasContent },
                { id: 'write', label: '3. Write', hasDot: false },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCanvasTab(tab.id)}
                  style={{
                    background: canvasTab === tab.id ? 'var(--sov-line-dim, rgba(16,185,129,0.12))' : 'none', /* allow-style */
                    border: 'none',
                    borderBottom: canvasTab === tab.id ? '2px solid var(--sov-line, #10b981)' : '2px solid transparent', /* allow-style */
                    color: canvasTab === tab.id ? 'var(--sov-line, #10b981)' : 'var(--text-faint)', /* allow-style */
                    cursor: 'pointer',
                    fontFamily: 'var(--font-system, system-ui)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '8px 14px',
                    transition: 'background 0.15s',
                  }}
                >
                  {tab.label}
                  {tab.hasDot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--sov-line, #10b981)', display: 'inline-block', marginLeft: 5 }} aria-label="Content ready" />} {/* allow-style */}
                </button>
              ))}
            </div>
          )}

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
          <div style={{ display: !isExamPaper && canvasTab === 'write' ? 'flex' : 'none', flexDirection: 'column', flex: 1 }}>
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

          {/* Exam paper: multimodal canvas per question. SectionEditor NEVER renders on exam papers. */}
          {isExamPaper ? (
            examData?.questions?.length > 0 ? (
              <MultimodalCanvas
                question={examData.questions.find(q => q.number === activeQuestionNum) || examData.questions[0]}
                documentId={courseId}
                onAskTutor={(text) => { setPendingTutorMessage(text); setActivePanelWithLog('tutor'); }}
              />
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontFamily: 'var(--font-system, system-ui)', fontSize: 12 }}> {/* allow-style */}
                Parsing exam questions...
              </div>
            )
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
            style={{ position: 'absolute', right: 8, top: 56, zIndex: 20, width: 32, height: 32, borderRadius: 16, background: 'var(--sov-line-dim, rgba(16,185,129,0.18))', border: 'none', color: 'var(--sov-line, #10b981)', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            T
          </button>
        )}
      </div>

      <AnnouncementBanner />
      <FidgetZone />
      <ReadingRuler />
      {!isExamPaper && (
        <ComprehensionBreak onCheckRequest={() => setActivePanel('check')} />
      )}
      {showSaveAffirmation && <AffirmationBanner trigger="save_event" visible={true} />}
      <BottomStrip wordCount={wordCount} targetWords={targetWords} />

      <ReentryOverlay
        courseId={courseId}
        assessmentTitle={currentTitle}
        onDismiss={() => {}}
        onChoice={(choiceId) => {
          if (choiceId === 'lost-flow') setActivePanelWithLog('tutor');
          else if (choiceId === 'overwhelmed') setActivePanelWithLog('check');
          else if (choiceId === 'forgot') setActivePanelWithLog('brief');
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
            if (panel) setActivePanelWithLog(panel);
            setDocClassification(null);
          }}
          onOverride={(newType) => {
            upgradeCourseExtraction(courseId, { extractionData: { documentType: newType } });
            setDocClassification(null);
          }}
          onDismiss={() => setDocClassification(null)}
        />
      )}
    </div>
  );
}
