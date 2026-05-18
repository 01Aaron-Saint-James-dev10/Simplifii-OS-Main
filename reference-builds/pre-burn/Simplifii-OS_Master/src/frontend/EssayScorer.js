import React, { useState } from 'react';
import { Target, CheckCircle2, UploadCloud, RefreshCw } from 'lucide-react';

export default function EssayScorer({ rubricCriteria }) {
  const [draft, setDraft] = useState('');
  const [isScoring, setIsScoring] = useState(false);
  const [score, setScore] = useState(null);

  const handleScore = () => {
    if (!draft) return;
    setIsScoring(true);
    setTimeout(() => {
      setIsScoring(false);
      setScore(Math.floor(Math.random() * 15) + 85); // HD Grade Band simulation
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8 animate-fade-in relative z-0">
      <div className="w-full max-w-3xl z-10">
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
            <Target size={32} className="text-emerald-500 relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">Essay Scorer</h2>
            <p className="text-zinc-400 font-medium mt-1 tracking-wide">Evaluate against dynamic HD criteria.</p>
          </div>
        </div>

        {rubricCriteria && rubricCriteria.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <h4 className="text-emerald-500 text-xs font-black uppercase tracking-widest mb-2">Detected HD Rubric Logic</h4>
            <ul className="list-disc pl-5 space-y-1">
              {rubricCriteria.map((c, i) => <li key={i} className="text-emerald-400 text-sm font-medium">{c}</li>)}
            </ul>
          </div>
        )}

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste your draft here..."
          className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white font-medium focus:border-emerald-500 outline-none resize-none mb-6"
        ></textarea>

        <button
          onClick={handleScore}
          disabled={isScoring || !draft}
          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${draft ? 'bg-emerald-500 text-black shadow-glow-emerald hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
          {isScoring ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          {isScoring ? 'Evaluating...' : 'Score Draft'}
        </button>

        {score !== null && (
          <div className="mt-8 p-8 rounded-3xl border border-emerald-500/50 bg-emerald-500/10 flex flex-col items-center justify-center animate-fade-in shadow-glow-emerald">
            <h3 className="text-emerald-500 font-black tracking-widest uppercase text-sm mb-2">Estimated Grade</h3>
            <div className="text-6xl font-black text-white">{score}<span className="text-2xl text-emerald-500">/100</span></div>
            <p className="text-emerald-400 mt-2 font-bold tracking-widest uppercase">High Distinction (HD)</p>
          </div>
        )}
      </div>
    </div>
  );
}
