import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
export default function SmartIntake({ onComplete }) {
  return (
    <div className="p-10 rounded-[40px] bg-zinc-900 border border-zinc-800 shadow-2xl space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 text-emerald-500">
        <Sparkles size={32} />
        <h2 className="text-2xl font-bold">I've scanned your UNSW Moodle...</h2>
      </div>
      <p className="text-zinc-400 text-lg">I see you have an <b>ARTS5200 Essay</b> due in 12 days. Tell me where your brain is at:</p>
      <div className="grid grid-cols-1 gap-4">
        <button onClick={() => onComplete('scaffold')} className="p-6 rounded-2xl bg-zinc-800 border border-zinc-700 text-left hover:border-emerald-500 transition-all group">
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="font-bold">"I'm staring at a blank page."</p>
              <p className="text-xs text-zinc-500 mt-1">Open the Scaffolder to build your structure.</p>
            </div>
            <ArrowRight className="text-zinc-600 group-hover:text-emerald-500" />
          </div>
        </button>
        <button onClick={() => onComplete('humaniser')} className="p-6 rounded-2xl bg-zinc-800 border border-zinc-700 text-left hover:border-amber-500 transition-all group">
          <div className="flex justify-between items-center text-white">
            <div>
              <p className="font-bold">"I've written a draft, but I'm worried it sounds like AI."</p>
              <p className="text-xs text-zinc-500 mt-1">Open the Humaniser Shield to protect your voice.</p>
            </div>
            <ArrowRight className="text-zinc-600 group-hover:text-amber-500" />
          </div>
        </button>
      </div>
    </div>
  );
}
