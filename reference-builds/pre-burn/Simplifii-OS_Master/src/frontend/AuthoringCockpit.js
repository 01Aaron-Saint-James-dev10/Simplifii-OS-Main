import React from 'react';
import { ChevronLeft, Target, FileText, Circle, Shield } from 'lucide-react';

/**
 * AuthoringCockpit - Stage 04: Active Task View
 * Calm Dashboard centre column. Shows a 5-step Pareto workflow for the
 * active assessment with a pinned weight badge. Light theme, focus rings
 * on every control.
 *
 * Props:
 *   activeCourse    {Object}   course object from ProjectContext
 *   activeTask      {Object}   active task object from ProjectContext
 *   onEnterCanvas   {Function} called when the learner opens the authoring canvas
 *   onBackToGallery {Function} called when the learner navigates back to Stage 03
 *
 * Stage 04 slot: onEnterCanvas is the insertion point for ThreeTierCanvas.
 * When the three-tier canvas is built, the parent sets viewMode to 'canvas'
 * and ThreeTierCanvas renders in the main content area.
 */
export default function AuthoringCockpit({ activeCourse, activeTask, onEnterCanvas, onBackToGallery }) {
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

        {/* Enter canvas action: Stage 04 slot */}
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
