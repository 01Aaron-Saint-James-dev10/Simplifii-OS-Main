import React from 'react';
import { Play } from 'lucide-react';
export default function TaskCard({ task, onStart }) {
  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-all shadow-xl">
      <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase">{task.course}</span>
      <h3 className="text-sm font-bold mt-2">{task.task}</h3>
      <button onClick={() => onStart(task)} className="w-full mt-3 bg-emerald-500 text-black py-2 rounded-lg font-black text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all">
        <Play size={12} fill="black"/> START SPRINT
      </button>
    </div>
  );
}
