import React from 'react';
import { Brain, Layout, FlaskConical, BookOpen, CheckCircle2, Plus } from 'lucide-react';

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
 * Clean grid, maximum six tiles (five courses plus one add tile).
 * High-contrast light theme, keyboard-first tab order.
 *
 * Props:
 *   courses        {Object}   keyed course map from ProjectContext
 *   activeCourseId {string}   currently selected course id
 *   onSelect       {Function} called with course id when a pillar is clicked
 *   onAddCourse    {Function} called when the add tile is clicked
 */
export default function PillarGallery({ courses, activeCourseId, onSelect, onAddCourse }) {
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
