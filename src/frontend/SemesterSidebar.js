import React from 'react';
import { Brain, ChevronLeft, ChevronRight, Layout, Target, Shield, Trash2 } from 'lucide-react';
import TaskCard from './TaskCard';

/**
 * SemesterSidebar - Left Sidebar Panel
 * Collapsed rail or full-width course switcher + semester roadmap.
 * data-focus-locked: the ExecutiveSpine FocusSession CSS rule dims and
 * click-protects this panel when a sprint is active.
 *
 * Props:
 *   isZenMode          {boolean}  hide everything in Zen Mode
 *   leftSidebarClass   {string}   computed width/padding classes from MasterDashboard
 *   isLeftCollapsed    {boolean}  collapsed state
 *   setIsLeftCollapsed {Function} toggle collapse
 *   activeCourse       {Object}   active course from ProjectContext
 *   activeCourseId     {string}   active course ID
 *   setActiveCourseId  {Function} switch active course
 *   courses            {Object}   keyed course map
 *   courseEditMode     {string|null} 'rename' | null
 *   setCourseEditMode  {Function}
 *   courseEditValue    {string}
 *   setCourseEditValue {Function}
 *   courseEditInputRef {Ref}      ref for rename input autofocus
 *   commitCourseEdit   {Function} save rename
 *   cancelCourseEdit   {Function} cancel rename
 *   isBooting          {boolean}  true while onboarding stages 0-4 are active
 *   tasks              {Array}    task list for the active course
 *   activeTask         {Object}   currently selected task
 *   setShowAddCourseModal {Function} open the Add Course modal
 *   setPendingDeleteCourseId {Function} open the Delete confirm dialog
 *   simulateVoiceNote  {Function} test the audio path
 *   generatePremiumPDF {Function} export the course as PDF
 */
export default function SemesterSidebar({
  isZenMode,
  leftSidebarClass,
  isLeftCollapsed, setIsLeftCollapsed,
  activeCourse,
  activeCourseId, setActiveCourseId,
  courses,
  courseEditMode, setCourseEditMode,
  courseEditValue, setCourseEditValue,
  courseEditInputRef,
  commitCourseEdit, cancelCourseEdit,
  isBooting,
  tasks, activeTask,
  setShowAddCourseModal,
  setPendingDeleteCourseId,
  simulateVoiceNote, generatePremiumPDF
}) {
  return (
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
          {/* Course Switcher: data scopes follow the active course. */}
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
                  Simulate Voice
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
  );
}
