import React from 'react';
import { useProject } from './ProjectContext';
import { useRouter } from '../contexts/RouterContext';
import AssessmentListView from './components/AssessmentListView';

/**
 * AssessmentListScreen
 *
 * Shown when a multi-assessment course is opened.
 * Renders AssessmentListView which lists each assessment as a clickable row.
 */
export default function AssessmentListScreen() {
  const { courseId } = useRouter();
  const { courses, activeCourse } = useProject();
  const { navigateHome } = useRouter();

  const course = courses?.[courseId] || activeCourse || {};
  const briefs = course.extractionData?.assessmentBriefs || [];

  return (
    <AssessmentListView
      courseId={courseId}
      courseName={course.name || 'Untitled'}
      briefs={briefs}
      onBack={navigateHome}
    />
  );
}
