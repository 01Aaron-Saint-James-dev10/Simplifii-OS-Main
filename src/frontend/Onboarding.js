import React, { useState } from 'react';
import { Brain, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useSettings } from './SettingsContext';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const { setEduLevel, eduLevel, mode, setMode, highContrast, setHighContrast, reducedMotion, setReducedMotion, darkMode, setDarkMode } = useSettings();

  const handleNext = () => setStep(s => s + 1);

  return (
    <div className="min-h-screen bg-[#07080D] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-zinc-900/50 border border-zinc-800 rounded-3xl p-10 z-10 shadow-2xl relative">
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500 p-1.5 rounded-md shadow-glow-emerald"><Brain size={16} className="text-black" /></div>
            <span className="font-black tracking-tighter">SIMPLIFII-OS</span>
          </div>
          <span className="text-zinc-500 font-bold text-sm tracking-widest uppercase">Step {step} of 4</span>
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black mb-2 tracking-tight">Who are you building for?</h2>
            <p className="text-zinc-400 mb-8 font-medium">This helps us tailor the AI coaching and scaffold complexity.</p>
            <div className="grid grid-cols-2 gap-4 mb-10">
              {['Primary', 'Secondary', 'University', 'TAFE'].map(level => (
                <button
                  key={level}
                  onClick={() => setEduLevel(level.toLowerCase())}
                  className={`p-6 rounded-2xl border transition-all text-lg font-black tracking-tight ${eduLevel === level.toLowerCase() ? 'bg-emerald-500/10 border-emerald-500 shadow-glow-emerald text-emerald-400' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'}`}
                >
                  {level}
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:shadow-glow-emerald transition-all flex items-center justify-center gap-2">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black mb-2 tracking-tight">How does your brain work today?</h2>
            <p className="text-zinc-400 mb-8 font-medium">Choose a neuro-adaptive preset. This changes typography and layout instantly.</p>
            <div className="space-y-4 mb-10">
              {[
                { id: 'sequential', label: 'Sequential/Deep Processing', desc: 'Standard layout for deep, sequential focus.' },
                { id: 'nonlinear', label: 'Non-Linear/Rapid Processing', desc: 'Activates focus masking for rapid processors.' },
                { id: 'lexical', label: 'Lexical/Visual Processing', desc: 'Enhanced typography for visual structuring.' }
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setMode(preset.id)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all flex items-center justify-between ${mode === preset.id ? 'bg-emerald-500/10 border-emerald-500 shadow-glow-emerald' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}
                >
                  <div>
                    <h3 className={`font-black text-lg ${mode === preset.id ? 'text-emerald-400' : 'text-zinc-200'}`}>{preset.label}</h3>
                    <p className="text-zinc-500 text-sm font-medium mt-1">{preset.desc}</p>
                  </div>
                  {mode === preset.id && <CheckCircle2 className="text-emerald-500" />}
                </button>
              ))}
            </div>
            <button onClick={handleNext} className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:shadow-glow-emerald transition-all flex items-center justify-center gap-2">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-3xl font-black mb-2 tracking-tight">Fine-tune your workspace</h2>
            <p className="text-zinc-400 mb-8 font-medium">Adjust sensory elements to match your comfort levels.</p>
            <div className="space-y-4 mb-10">
              <div className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div>
                  <h3 className="font-black text-white text-lg">High Contrast</h3>
                  <p className="text-zinc-500 text-sm font-medium">Increases saturation and border visibility.</p>
                </div>
                <button 
                  onClick={() => setHighContrast(!highContrast)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${highContrast ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-zinc-700'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${highContrast ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div>
                  <h3 className="font-black text-white text-lg">Reduced Motion</h3>
                  <p className="text-zinc-500 text-sm font-medium">Disables animations and pulsing glows.</p>
                </div>
                <button 
                  onClick={() => setReducedMotion(!reducedMotion)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${reducedMotion ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-zinc-700'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${reducedMotion ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              <div className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 rounded-2xl">
                <div>
                  <h3 className="font-black text-white text-lg">Dark Mode</h3>
                  <p className="text-zinc-500 text-sm font-medium">Toggle high-fidelity dark UI.</p>
                </div>
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-14 h-8 rounded-full transition-colors relative ${darkMode ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-zinc-700'}`}
                >
                  <div className={`w-6 h-6 rounded-full bg-white absolute top-1 transition-transform ${darkMode ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>
            <button onClick={handleNext} className="w-full py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:shadow-glow-emerald transition-all flex items-center justify-center gap-2">
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in text-center">
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-emerald">
              <Brain size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black mb-2 tracking-tight">The University Bridge</h2>
            <p className="text-zinc-400 mb-10 font-medium">Connect your institution to sync real deadlines directly into your Block-Based OS.</p>
            
            <button onClick={onComplete} className="w-full py-5 rounded-2xl bg-zinc-900 border border-emerald-500/50 text-emerald-400 font-black text-lg uppercase tracking-widest hover:bg-emerald-500 hover:text-black hover:shadow-glow-emerald transition-all mb-4">
              Connect Institution & Enter OS
            </button>
            <button onClick={onComplete} className="text-zinc-500 hover:text-white font-bold text-sm underline decoration-zinc-700 underline-offset-4">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
