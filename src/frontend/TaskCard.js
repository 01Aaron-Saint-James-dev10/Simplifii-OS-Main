import React from 'react';
import { Play } from 'lucide-react';

export default function TaskCard({ task, onStart, isActive }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all cursor-pointer ${isActive ? 'bg-zinc-800 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/50 hover:shadow-glow-emerald'}`}>
      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase">{task.course}</span>
      <h3 className="text-sm font-black mt-2 tracking-tight">{task.task}</h3>
      <button onClick={() => onStart(task)} className={`w-full mt-3 text-black py-2 rounded-lg font-black text-[10px] flex items-center justify-center gap-2 transition-shadow ${isActive ? 'bg-emerald-500 shadow-glow-emerald-lg' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
        <Play size={12} fill="black"/> {isActive ? 'ACTIVE SPRINT' : 'START SPRINT'}
      </button>
    </div>
  );
}
