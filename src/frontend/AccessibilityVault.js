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

  // Handle escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-vault-title"
    >
      <div className="bg-card border border-blue-500/50 rounded-2xl w-[600px] max-w-[90vw] overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <header className="p-6 border-b border-border flex justify-between items-center bg-blue-500/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center border border-blue-500/50">
              <Eye size={20} />
            </div>
            <div>
              <h2 id="accessibility-vault-title" className="text-lg font-bold text-blue-500 uppercase tracking-widest">
                Accessibility Vault
              </h2>
              <p className="text-xs text-blue-400/80 font-medium tracking-wide">
                NeuroDoc Display & Structural Overrides
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close accessibility vault"
          >
            <X size={20} />
          </button>
        </header>

        {/* Content */}
        <div className="p-8 space-y-10 overflow-y-auto max-h-[70vh]">
          
          {/* Irlen Overlays */}
          <section aria-labelledby="irlen-label">
            <div className="flex items-center gap-3 mb-4">
              <Palette size={16} className="text-muted-foreground" />
              <h3 id="irlen-label" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Irlen Syndrome Overlays
              </h3>
            </div>
            <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label="Select overlay tint">
              {[
                { value: 'none', label: 'None', color: 'bg-muted border-border' },
                { value: 'cream', label: 'Cream', color: 'bg-[#fdf5e6]' },
                { value: 'mint', label: 'Mint', color: 'bg-[#e6fdee]' },
                { value: 'skyblue', label: 'Sky Blue', color: 'bg-[#e6f0fd]' }
              ].map((opt) => {
                const active = overlayTint === opt.value;
                return (
                  <button 
                    key={opt.value}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setOverlayTint(opt.value)} 
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active 
                        ? 'bg-muted border-primary text-foreground' 
                        : 'bg-card border-border text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full ${opt.color} border border-border`}></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Typography */}
          <div className="grid grid-cols-2 gap-8">
            <section aria-labelledby="font-scale-label">
              <div className="flex items-center gap-3 mb-4">
                <Type size={16} className="text-muted-foreground" />
                <h3 id="font-scale-label" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Font Scale
                </h3>
              </div>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Select font scale">
                {[
                  { value: 'normal', label: 'Normal', size: 'text-xs' },
                  { value: 'large', label: 'Large', size: 'text-sm' },
                  { value: 'xl', label: 'Extra Large', size: 'text-base' }
                ].map((opt) => {
                  const active = fontScale === opt.value;
                  return (
                    <button 
                      key={opt.value}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFontScale(opt.value)} 
                      className={`p-3 rounded-lg border ${opt.size} font-semibold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active 
                          ? 'bg-muted border-primary text-foreground' 
                          : 'bg-card border-border text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section aria-labelledby="line-spacing-label">
              <div className="flex items-center gap-3 mb-4">
                <AlignJustify size={16} className="text-muted-foreground" />
                <h3 id="line-spacing-label" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Line Spacing
                </h3>
              </div>
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Select line spacing">
                {[
                  { value: 'normal', label: 'Normal' },
                  { value: 'relaxed', label: 'Relaxed (1.6)' },
                  { value: 'loose', label: 'Loose (2.0)' }
                ].map((opt) => {
                  const active = lineSpacing === opt.value;
                  return (
                    <button 
                      key={opt.value}
                      role="radio"
                      aria-checked={active}
                      onClick={() => setLineSpacing(opt.value)} 
                      className={`p-3 rounded-lg border text-xs font-semibold text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        active 
                          ? 'bg-muted border-primary text-foreground' 
                          : 'bg-card border-border text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Bionic Reading & Reading Ruler */}
          <div className="pt-6 border-t border-border space-y-8">
            
            {/* Bionic Reading */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isBionicActive ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-1">Bionic Reading</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Bolds the first part of words to create visual fixation anchors.</p>
                  </div>
                </div>
                <button 
                  onClick={handleBionicToggle}
                  role="switch"
                  aria-checked={isBionicActive}
                  aria-label="Toggle Bionic Reading"
                  className={`w-14 h-7 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isBionicActive ? 'bg-amber-500' : 'bg-muted'
                  }`}
                >
                  <span className={`w-5 h-5 bg-card rounded-full absolute top-1 transition-transform shadow-sm ${
                    isBionicActive ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {isBionicActive && (
                <div className="ml-13 pl-13 pt-2">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    <span>Low (F1)</span>
                    <span>High (F5)</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    value={bionicIntensity}
                    onChange={(e) => setBionicIntensity(Number(e.target.value))}
                    aria-label="Bionic intensity level"
                    className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                  <p className="text-[10px] text-muted-foreground font-semibold mt-2">Bionic Intensity: F{bionicIntensity}</p>
                </div>
              )}
            </section>

            {/* Reading Ruler */}
            <section className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isRulerActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <span className="font-bold">_</span>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-1">Reading Ruler</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Adds a horizontal guide tracking your cursor to reduce line-skipping.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRulerActive(!isRulerActive)}
                role="switch"
                aria-checked={isRulerActive}
                aria-label="Toggle Reading Ruler"
                className={`w-14 h-7 rounded-full transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  isRulerActive ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`w-5 h-5 bg-card rounded-full absolute top-1 transition-transform shadow-sm ${
                  isRulerActive ? 'translate-x-8' : 'translate-x-1'
                }`} />
              </button>
            </section>

            {/* Prune Local AI Caches */}
            <section className="pt-6 border-t border-border">
              <div className="flex items-center justify-between bg-destructive/5 border border-destructive/20 p-4 rounded-xl relative overflow-hidden">
                <div className="flex items-center gap-3 relative z-10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    pruneComplete ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {pruneComplete ? <CheckCircle2 size={20} /> : <Trash2 size={20} />}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground mb-1">Storage Handshake</h3>
                    <p className="text-[10px] text-muted-foreground font-medium">Wipe temporary Neural Telemetry. Zero internal SSD bloat.</p>
                  </div>
                </div>
                <button 
                  onClick={handlePrune}
                  disabled={isPruning || pruneComplete}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed ${
                    pruneComplete 
                      ? 'bg-primary text-primary-foreground' 
                      : isPruning 
                        ? 'bg-muted text-muted-foreground' 
                        : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  }`}
                >
                  {pruneComplete ? '0MB Bloat' : isPruning ? 'Pruning...' : 'Prune Caches'}
                </button>
                {/* Sweep Animation */}
                {isPruning && (
                  <div className="absolute top-0 left-0 w-2 h-full bg-destructive shadow-lg animate-pulse" />
                )}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
