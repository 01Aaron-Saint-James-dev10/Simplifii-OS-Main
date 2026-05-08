import React from 'react';
import { Eye, Type, AlignJustify, X, Palette, Zap, Trash2, CheckCircle2 } from 'lucide-react';
import { useSettings } from './SettingsContext';
import { speakSystemMessage } from '../services/MessagingHub';

export default function AccessibilityVault({ onClose }) {
  const { 
    overlayTint, setOverlayTint,
    fontScale, setFontScale,
    lineSpacing, setLineSpacing,
    isRulerActive, setIsRulerActive,
    isBionicActive, setIsBionicActive,
    bionicIntensity, setBionicIntensity
  } = useSettings();

  const handleBionicToggle = () => {
    const nextState = !isBionicActive;
    setIsBionicActive(nextState);
    if (nextState) {
      speakSystemMessage("Bionic fixation points active. Your visual load is now optimised for the active sprint.", "Bionic reading engaged.");
    }
  };

  const [isPruning, setIsPruning] = React.useState(false);
  const [pruneComplete, setPruneComplete] = React.useState(false);

  const handlePrune = () => {
    setIsPruning(true);
    setTimeout(() => {
      setIsPruning(false);
      setPruneComplete(true);
      speakSystemMessage("Temporary neural telemetry wiped. Zero megabytes bloat.", "Caches pruned successfully.");
      setTimeout(() => setPruneComplete(false), 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-black border border-blue-500/50 rounded-3xl w-[600px] max-w-[90vw] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.15)] relative">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center border border-blue-500/50">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-500 uppercase tracking-widest">Accessibility Vault</h2>
              <p className="text-xs text-blue-400/80 font-bold tracking-wide">NeuroDoc Display & Structural Overrides</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          {/* Irlen Overlays */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Palette size={16} className="text-zinc-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Irlen Syndrome Overlays</h3>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <button onClick={() => setOverlayTint('none')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${overlayTint === 'none' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">None</span>
              </button>
              <button onClick={() => setOverlayTint('cream')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${overlayTint === 'cream' ? 'bg-amber-100/10 border-amber-200/50 text-amber-200' : 'bg-black border-zinc-800 text-zinc-500'}`}>
                <div className="w-6 h-6 rounded-full bg-[#fdf5e6]"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Cream</span>
              </button>
              <button onClick={() => setOverlayTint('mint')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${overlayTint === 'mint' ? 'bg-emerald-100/10 border-emerald-200/50 text-emerald-200' : 'bg-black border-zinc-800 text-zinc-500'}`}>
                <div className="w-6 h-6 rounded-full bg-[#e6fdee]"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Mint</span>
              </button>
              <button onClick={() => setOverlayTint('skyblue')} className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${overlayTint === 'skyblue' ? 'bg-blue-100/10 border-blue-200/50 text-blue-200' : 'bg-black border-zinc-800 text-zinc-500'}`}>
                <div className="w-6 h-6 rounded-full bg-[#e6f0fd]"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Sky Blue</span>
              </button>
            </div>
          </div>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Type size={16} className="text-zinc-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Font Scale</h3>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setFontScale('normal')} className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${fontScale === 'normal' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>Normal</button>
                <button onClick={() => setFontScale('large')} className={`p-3 rounded-lg border text-sm font-bold text-left transition-all ${fontScale === 'large' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>Large</button>
                <button onClick={() => setFontScale('xl')} className={`p-3 rounded-lg border text-base font-bold text-left transition-all ${fontScale === 'xl' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>Extra Large</button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <AlignJustify size={16} className="text-zinc-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Line Spacing</h3>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => setLineSpacing('normal')} className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${lineSpacing === 'normal' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>Normal</button>
                <button onClick={() => setLineSpacing('relaxed')} className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${lineSpacing === 'relaxed' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>Relaxed (1.6)</button>
                <button onClick={() => setLineSpacing('loose')} className={`p-3 rounded-lg border text-xs font-bold text-left transition-all ${lineSpacing === 'loose' ? 'bg-zinc-800 border-zinc-600 text-white' : 'bg-black border-zinc-800 text-zinc-500'}`}>Loose (2.0)</button>
              </div>
            </div>
          </div>

          {/* Bionic Reading & Reading Ruler */}
          <div className="pt-6 border-t border-zinc-800 space-y-8">
            
            {/* Bionic Reading */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isBionicActive ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-900 text-zinc-500'}`}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white mb-1">Bionic Reading®</h3>
                    <p className="text-[10px] text-zinc-400 font-medium">Bolds the first part of words to create visual fixation anchors.</p>
                  </div>
                </div>
                <button 
                  onClick={handleBionicToggle}
                  className={`w-14 h-7 rounded-full transition-colors relative ${isBionicActive ? 'bg-amber-500' : 'bg-zinc-700'}`}
                >
                  <div className={`w-5 h-5 bg-black rounded-full absolute top-1 transition-transform ${isBionicActive ? 'translate-x-8' : 'translate-x-1'}`}></div>
                </button>
              </div>
              
              {isBionicActive && (
                <div className="ml-13 pl-13 pt-2">
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                    <span>Low (F1)</span>
                    <span>High (F5)</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={bionicIntensity}
                    onChange={(e) => setBionicIntensity(Number(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-full appearance-none cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-500 font-bold mt-2">Bionic Intensity: F{bionicIntensity}</p>
                </div>
              )}
            </div>

            {/* Reading Ruler */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRulerActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-zinc-900 text-zinc-500'}`}>
                  <span className="font-black">_</span>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white mb-1">Reading Ruler</h3>
                  <p className="text-[10px] text-zinc-400 font-medium">Adds a horizontal guide tracking your cursor to reduce line-skipping.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRulerActive(!isRulerActive)}
                className={`w-14 h-7 rounded-full transition-colors relative ${isRulerActive ? 'bg-emerald-500' : 'bg-zinc-700'}`}
              >
                <div className={`w-5 h-5 bg-black rounded-full absolute top-1 transition-transform ${isRulerActive ? 'translate-x-8' : 'translate-x-1'}`}></div>
              </button>
            </div>

            {/* Prune Local AI Caches */}
            <div className="pt-6 border-t border-zinc-800">
              <div className="flex items-center justify-between bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl relative overflow-hidden">
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${pruneComplete ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                    {pruneComplete ? <CheckCircle2 size={20} /> : <Trash2 size={20} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white mb-1">Storage Handshake</h3>
                    <p className="text-[10px] text-zinc-400 font-medium">Wipe temporary Neural Telemetry. Zero internal SSD bloat.</p>
                  </div>
                </div>
                <button 
                  onClick={handlePrune}
                  disabled={isPruning || pruneComplete}
                  className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all relative z-10 ${pruneComplete ? 'bg-emerald-500 text-black' : isPruning ? 'bg-zinc-800 text-zinc-500' : 'bg-rose-500 text-black hover:bg-rose-400 shadow-glow-rose'}`}
                >
                  {pruneComplete ? '0MB Bloat' : isPruning ? 'Pruning...' : 'Prune Caches'}
                </button>
                {/* Sweep Animation */}
                {isPruning && <div className="absolute top-0 left-0 w-2 h-full bg-rose-500 shadow-[0_0_50px_rgba(244,63,94,1)] animate-sweep"></div>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
