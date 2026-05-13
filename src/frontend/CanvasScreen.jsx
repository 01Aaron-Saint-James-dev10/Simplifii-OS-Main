import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useProject } from './ProjectContext';
import { useSettings } from './SettingsContext';
import { useRouter } from '../contexts/RouterContext';
import CanvasNav from './components/CanvasNav';
import CanvasEditor from './components/CanvasEditor';
import SectionRail from './components/SectionRail';
import PanelRail from './components/PanelRail';
import BriefPanel from './components/BriefPanel';
import TutorPanel from './components/TutorPanel';
import PreviewPanel from './components/PreviewPanel';
import SourcesPanel from './components/SourcesPanel';
import CheckPanel from './components/CheckPanel';
import BottomStrip from './components/BottomStrip';
import ReentryOverlay from './components/ReentryOverlay';
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
  const { courseId, assessmentTitle } = useRouter();
  const { courses, activeCourse } = useProject();
  const { reducedMotion } = useSettings();

  // Resolve course and assessment
  const course = courses?.[courseId] || activeCourse || {};
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

  // Word count + draft text ref (for panels that need current text)
  const [wordCount, setWordCount] = useState(0);
  const [draftText, setDraftText] = useState('');
  const handleWordCount = useCallback((count) => setWordCount(count), []);

  // Section rail
  const [activeSection, setActiveSection] = useState('introduction');

  // Panel rail
  const [activePanel, setActivePanel] = useState(null);

  // Render active panel content
  const panelContent = useMemo(() => {
    switch (activePanel) {
      case 'brief':
        return (
          <BriefPanel
            brief={brief}
            rubricCriteria={rubricCriteria}
            rubricBands={rubricBands}
            rubricDetected={rubricDetected}
            courseId={courseId}
            assessmentTitle={currentTitle}
          />
        );
      case 'tutor':
        return <TutorPanel assessmentTitle={currentTitle} />;
      case 'preview':
        return <PreviewPanel draftText={draftText} wordCount={wordCount} />;
      case 'sources':
        return <SourcesPanel sourceFiles={sourceFiles} />;
      case 'check':
        return (
          <CheckPanel
            draftText={draftText}
            wordCount={wordCount}
            targetWords={targetWords}
            rubricCriteria={rubricCriteria}
            courseId={courseId}
            assessmentTitle={currentTitle}
          />
        );
      default:
        return null;
    }
  }, [activePanel, brief, rubricCriteria, rubricBands, rubricDetected, courseId, currentTitle, draftText, wordCount, targetWords, sourceFiles]);

  return (
    <div className={`canvas-root ${reducedMotion ? 'canvas-no-motion' : ''}`}>
      <CanvasNav
        courseName={courseName}
        assessmentTitle={currentTitle}
        saveStatus={saveStatus}
        lastSavedAgo={lastSavedAgo}
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
          <CanvasEditor
            courseId={courseId}
            assessmentTitle={currentTitle}
            targetWords={targetWords}
            onWordCountChange={handleWordCount}
            onSaveStatusChange={handleSaveStatus}
            onTextChange={setDraftText}
          />
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
    </div>
  );
}
