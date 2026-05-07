import React, { useState } from 'react';
import { Brain, Sparkles, Mic, ArrowRight, Zap, ListTree } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import CourseTrack from './CourseTrack';
import TaskCard from './TaskCard';
import SmartIntake from './SmartIntake';

export default function MasterDashboard() {
  const { mode, setMode, eduLevel } = useSettings();
  const { project, updateDraft } = useProject();
  const [activeTask, setActiveTask] = useState(null);
  const [lmsConnected, setLmsConnected] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('grounding');

  const handleSync = () => setLmsConnected(true);

  return (
    <div className="flex h-screen bg-[#07080D] text-white overflow-hidden font-sans">
      <aside className={`transition-all duration-500 border-r border-zinc-800 bg-[#0D0F18] p-5 flex flex-col ${activeTask ? 'w-20' : 'w-80'}`}>
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-emerald-500 p-1.5 rounded-lg shadow-lg"><Brain size={20} /></div>
          {!activeTask && <span className="font-bold text-lg tracking-tighter uppercase">Simplifii-OS</span>}
        </div>
        {!activeTask && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-3">Active Sprints</p>
            <TaskCard task={{course: 'ARTS5200', task: 'Foundations Essay'}} onStart={setActiveTask} />
          </div>
        )}
      </aside>

      <main className="flex-1 flex overflow-hidden">
        <section className="w-1/2 border-r border-zinc-800 p-8 overflow-y-auto space-y-6 bg-[#07080D]">
          <header className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-black uppercase text-emerald-500 tracking-widest">Guidance Engine</h2>
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {['standard', 'adhd', 'dyslexia'].map(m => (
                <button key={m} onClick={() => setMode(m)} className={`px-2 py-1 rounded text-[8px] font-bold ${mode===m ? 'bg-emerald-500 text-black' : 'text-zinc-500'}`}>{m.toUpperCase()}</button>
              ))}
            </div>
          </header>
          {!lmsConnected ? (
            <div className="p-10 rounded-[40px] bg-zinc-900 border border-zinc-800 text-center space-y-6 shadow-2xl">
              <Sparkles size={40} className="mx-auto text-emerald-500" />
              <h3 className="text-3xl font-bold">Connect your university...</h3>
              <button onClick={handleSync} className="px-8 py-4 rounded-2xl bg-emerald-500 text-black font-black hover:scale-105 transition-all">START AUTO-SYNC</button>
            </div>
          ) : currentPhase === 'grounding' ? (
            <SmartIntake onComplete={(phase) => setCurrentPhase(phase)} />
          ) : (
            <div className="p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 animate-fade-in">
              <p className="text-xs font-black text-emerald-500 uppercase mb-2">Sprint Goal</p>
              <p className="text-lg font-medium">Draft your methodology section.</p>
              <button className="mt-6 w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center gap-3 text-zinc-400"><Mic size={18}/> Talk through your ideas</button>
            </div>
          )}
        </section>

        <section className="w-1/2 bg-zinc-950 p-8 flex flex-col relative">
           <div className="flex justify-between items-center mb-6">
             <CourseTrack />
           </div>
           <div className={`flex-1 rounded-[40px] border border-white/5 ${mode === 'dyslexia' ? 'bg-[#FEFCE8]/5' : 'bg-white/5'} p-8 flex flex-col`}>
             <textarea 
               value={project.currentDraft} 
               onChange={(e) => updateDraft(e.target.value)}
               className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-300 text-xl leading-relaxed resize-none"
               placeholder="Your work belongs here..."
             />
           </div>
           <div className="absolute bottom-6 left-8 right-8 h-12 flex items-end gap-1 opacity-40 pointer-events-none">
             {project.integrityLog.map((log, i) => (
               <div key={i} className="bg-emerald-500 w-1 rounded-full" style={{ height: `${Math.min(log.length / 5, 100)}%` }} />
             ))}
           </div>
        </section>
      </main>
    </div>
  );
}
