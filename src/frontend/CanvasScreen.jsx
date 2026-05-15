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
import SectionRail from './components/SectionRail';
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
import { startAmbient, stopAmbient } from './services/AmbientSound';
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
  const { courses, activeCourse, projectSources } = useProject();
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

  // Raw extracted text: fallback for tools when structured brief is empty.
  // This ensures tools work even for non-brief PDFs (exam papers, notes, etc).
  const extractedText = course.extractionData?.rawText || course.sourceContent || '';
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

  // Panel rail + collapse state
  const [activePanel, setActivePanel] = useState(null);
  const [leftCollapsed, setLeftCollapsed] = useState(() => localStorage.getItem('simplifii_left_collapsed') === 'true');
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const toggleLeft = () => { const next = !leftCollapsed; setLeftCollapsed(next); localStorage.setItem('simplifii_left_collapsed', String(next)); };
  const toggleRight = () => setRightCollapsed(!rightCollapsed);

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
        <TutorPanel assessmentTitle={currentTitle} briefText={briefOrText} documentType={effectiveDocType} />
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
          buildPayload={(brief, rubric, draft, s) => ({ briefText: brief, assessmentTitle: s.assessmentTitle, tier: s.tier, documentType: effectiveDocType || '', literalMode: isLiteralMode })}
          briefText={briefOrText} rubricText="" draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'rubric' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="rubric-decoder" title="Rubric Decoder" endpoint="/api/decode-rubric" resultKey="decoded"
          description="Plain language translation of what markers actually want."
          buttonLabel="Decode rubric"
          buildPayload={(brief, rubric, draft, s) => ({ rubricText: rubric || brief, assessmentTitle: s.assessmentTitle, tier: s.tier })}
          briefText={briefOrText} rubricText={rubricCriteria?.join('\n') || ''} draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'scorer' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="essay-scorer" title="Essay Scorer" endpoint="/api/score-essay" resultKey="feedback"
          description="Formative feedback on your draft. Not a grade. Honest improvement suggestions."
          buttonLabel="Score my draft"
          buildPayload={(brief, rubric, draft, s) => ({ draftText: draft, rubricCriteria: rubric, assessmentTitle: s.assessmentTitle, tier: s.tier })}
          briefText="" rubricText={rubricCriteria?.join('\n') || ''} draftText={draftText} assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'hidden' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="hidden-decoder" title="Hidden Curriculum" endpoint="/api/decode-hidden" resultKey="decoded"
          description="Decode what markers actually want vs what the brief literally says."
          buttonLabel="Decode hidden curriculum"
          buildPayload={(brief, rubric, draft, s) => ({ briefText: brief, assessmentTitle: s.assessmentTitle, tier: s.tier })}
          briefText={briefOrText} rubricText="" draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      {/* BreathBubble relocated to CanvasSettingsOverlay > Wellbeing */}
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

      <NextStepBanner
        briefText={briefOrText}
        rubricText={rubricCriteria?.join('\n') || ''}
        draftText={draftText}
        wordCount={wordCount}
        targetWords={targetWords}
        assessmentTitle={currentTitle}
        activePanel={activePanel}
        onSelectPanel={setActivePanel}
      />

      <div className="canvas-body">
        {/* Collapse toggle for left rail */}
        <button type="button" onClick={toggleLeft} title={leftCollapsed ? 'Show sections' : 'Hide sections'}
          style={{ position: 'absolute', left: leftCollapsed ? 4 : 130, top: 56, zIndex: 20, width: 20, height: 20, borderRadius: 10, background: 'var(--sov-line-dim, rgba(16,185,129,0.18))', border: 'none', color: 'var(--sov-line, #10b981)', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> {/* allow-style */}
          {leftCollapsed ? '\u203A' : '\u2039'}
        </button>
        {!leftCollapsed && (
        <SectionRail
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          courseId={courseId}
          assessmentTitle={currentTitle}
          brief={brief}
        />
        )}

        <div className="canvas-centre">
          {briefs.length === 0 && !extractedText && <NoBriefPrompt courseId={courseId} />}
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
          <BibliographyView />
        </div>

        <PanelRail
          activePanel={activePanel}
          onSelectPanel={setActivePanel}
          panelContent={panelContent}
        />
      </div>

      <AnnouncementBanner />
      <FidgetZone />
      {showSaveAffirmation && <AffirmationBanner trigger="save_event" visible={true} />}
      <BottomStrip wordCount={wordCount} targetWords={targetWords} />

      <ReentryOverlay
        courseId={courseId}
        assessmentTitle={currentTitle}
        onDismiss={() => {}}
        onChoice={(choiceId) => {
          // TODO: route to appropriate panel based on choice
          if (choiceId === 'lost-flow') setActivePanel('tutor');
          else if (choiceId === 'overwhelmed') setActivePanel('check');
          else if (choiceId === 'forgot') setActivePanel('brief');
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
            if (panel) setActivePanel(panel);
            setDocClassification(null);
          }}
          onOverride={() => setDocClassification(null)}
          onDismiss={() => setDocClassification(null)}
        />
      )}
    </div>
  );
}
