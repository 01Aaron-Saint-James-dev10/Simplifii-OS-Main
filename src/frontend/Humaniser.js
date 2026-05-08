import React, { useState } from 'react';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Humaniser() {
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleHumanise = () => {
    if (!text) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setResult("This is your humanised text, actively rewritten to reduce AI false positives while maintaining HD academic integrity.");
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8 animate-fade-in relative z-0">
      <div className="w-full max-w-3xl z-10">
        <div className="flex items-center gap-4 mb-8 justify-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
            <Sparkles size={32} className="text-amber-500 relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight">Humaniser Engine</h2>
            <p className="text-zinc-400 font-medium mt-1 tracking-wide">Synthesise text to minimise false positives.</p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste AI-generated drafting here..."
          className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-white font-medium focus:border-amber-500 outline-none resize-none mb-6"
        ></textarea>

        <button
          onClick={handleHumanise}
          disabled={isProcessing || !text}
          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${text ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:bg-amber-400' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}
        >
          {isProcessing ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
          {isProcessing ? 'Humanising...' : 'Humanise Text'}
        </button>

        {result && (
          <div className="mt-8 p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 animate-fade-in">
            <h4 className="text-amber-500 text-xs font-black uppercase tracking-widest mb-2">Rewritten Output</h4>
            <p className="text-amber-100 font-medium">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
