import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useProject } from './ProjectContext';
import { useSettings } from './SettingsContext';
import { detectSuspectedCitations } from '../services/CitationStyleService';
import { verifyFromSources } from '../services/CitationService';
import { useRouter } from '../contexts/RouterContext';
import { supabase } from '../lib/supabaseClient';
import CanvasNav from './components/CanvasNav';
import CanvasEditor from './components/CanvasEditor';
import SectionRail from './components/SectionRail';
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
  const { reducedMotion, isZenMode, theme } = useSettings();
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

  const targetWords = brief?.wordCountGoal || 1500;
  const currentTitle = brief?.title || assessmentTitle || 'Assessment';
  const rubricCriteria = course.extractionData?.rubricCriteria || [];
  const rubricBands = course.extractionData?.rubricBands || [];
  const rubricDetected = course.extractionData?.rubricDetected || false;
  const sourceFiles = course.extractionData?.sourceFiles || [];

  // Save status
  const [saveStatus, setSaveStatus] = useState('unsaved');
  const [lastSavedAgo, setLastSavedAgo] = useState('');
  const handleSaveStatus = useCallback((status, ago) => {
    setSaveStatus(status);
    setLastSavedAgo(ago || '');
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

  // Section rail
  const [activeSection, setActiveSection] = useState('introduction');

  // Panel rail
  const [activePanel, setActivePanel] = useState(null);

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
        />
      </div>
      <div style={{ display: activePanel === 'tutor' ? 'contents' : 'none' }}>
        <TutorPanel assessmentTitle={currentTitle} />
      </div>
      <div style={{ display: activePanel === 'preview' ? 'contents' : 'none' }}>
        <PreviewPanel draftText={draftText} wordCount={wordCount} />
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
          briefText={brief?.body || brief?.title || ''}
          courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'udl' ? 'contents' : 'none' }}>
        <RepresentationsPanel
          assessmentTitle={currentTitle}
          briefText={brief?.body || brief?.title || ''}
          courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'simplify' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="brief-simplifier" title="Brief Simplifier" endpoint="/api/simplify-brief" resultKey="plan"
          description="Week-by-week action plan from your uploaded brief."
          buttonLabel="Generate action plan"
          buildPayload={(brief, rubric, draft, s) => ({ briefText: brief, assessmentTitle: s.assessmentTitle, tier: s.tier })}
          briefText={brief?.body || brief?.title || ''} rubricText="" draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
      <div style={{ display: activePanel === 'rubric' ? 'contents' : 'none' }}>
        <ToolPanel
          toolId="rubric-decoder" title="Rubric Decoder" endpoint="/api/decode-rubric" resultKey="decoded"
          description="Plain language translation of what markers actually want."
          buttonLabel="Decode rubric"
          buildPayload={(brief, rubric, draft, s) => ({ rubricText: rubric || brief, assessmentTitle: s.assessmentTitle, tier: s.tier })}
          briefText={brief?.body || brief?.title || ''} rubricText={rubricCriteria?.join('\n') || ''} draftText="" assessmentTitle={currentTitle} courseId={courseId}
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
          briefText={brief?.body || brief?.title || ''} rubricText="" draftText="" assessmentTitle={currentTitle} courseId={courseId}
        />
      </div>
    </>
  ) : null;

  return (
    <div className={`canvas-root theme-${theme || 'dark'} ${reducedMotion ? 'canvas-no-motion' : ''} ${isZenMode ? 'canvas-zen' : ''}`}>
      <CanvasNav
        courseName={courseName}
        assessmentTitle={currentTitle}
        saveStatus={saveStatus}
        lastSavedAgo={lastSavedAgo}
        tiptapDoc={tiptapDoc}
        htmlContent={draftText}
        courseId={courseId}
        onOpenSettings={() => setSettingsOpen(true)}
        onCourseName={briefs.length > 1 ? () => navigateToAssessments(courseId) : undefined}
      />

      <NextStepBanner
        briefText={brief?.body || brief?.title || ''}
        rubricText={rubricCriteria?.join('\n') || ''}
        draftText={draftText}
        wordCount={wordCount}
        targetWords={targetWords}
        assessmentTitle={currentTitle}
        activePanel={activePanel}
        onSelectPanel={setActivePanel}
      />

      <div className="canvas-body">
        <SectionRail
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          courseId={courseId}
          assessmentTitle={currentTitle}
          brief={brief}
        />

        <div className="canvas-centre">
          {briefs.length === 0 && <NoBriefPrompt courseId={courseId} />}
          <CanvasEditor
            courseId={courseId}
            assessmentTitle={currentTitle}
            targetWords={targetWords}
            onWordCountChange={handleWordCount}
            onSaveStatusChange={handleSaveStatus}
            onTextChange={setDraftText}
            onJsonDocChange={setTiptapDoc}
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
    </div>
  );
}
