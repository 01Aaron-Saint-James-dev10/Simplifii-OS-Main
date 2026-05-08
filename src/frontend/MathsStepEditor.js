import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, ChevronRight, RefreshCw, Zap, Lightbulb, Lock, Unlock } from 'lucide-react';
import { speakSystemMessage } from '../services/MessagingHub';

export default function MathsStepEditor({ extractionData, profile }) {
  const [decoded, setDecoded] = useState(false);
  const [decodeText, setDecodeText] = useState('');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [stepInputs, setStepInputs] = useState(['', '', '']);
  const [successPulses, setSuccessPulses] = useState([false, false, false]);

  const [hintStyleIndex, setHintStyleIndex] = useState(0);
  const hintStyles = ['Step-by-Step', 'Visual Storyboard', 'Simple Language'];

  const isADHD = profile?.neuroTypes?.includes('ADHD');
  const isProcessingDiff = profile?.neuroTypes?.includes('Processing Differences');

  // Mock Question Context
  const questionContext = "If a train travels at 120km/h for 2.5 hours, how far does it travel?";

  const steps = [
    { 
      id: 1, 
      label: 'Identify Variables', 
      hints: [
        'List out what you know: speed (v) and time (t).', 
        'Imagine a speedometer showing 120, and a clock showing 2.5.', 
        'What numbers does the question give you?'
      ],
      answerRegex: /120|2\.5/
    },
    { 
      id: 2, 
      label: 'Setup Equation', 
      hints: [
        'Use the formula Distance = Speed × Time.',
        'We need distance. How do speed and time combine to make distance?',
        'Multiply the two numbers together.'
      ],
      answerRegex: /\*|x|times/i
    },
    { 
      id: 3, 
      label: 'Solve', 
      hints: [
        'Calculate 120 × 2.5.',
        'Think of 120 × 2, plus half of 120.',
        'Do the multiplication to get the final answer.'
      ],
      answerRegex: /300/
    }
  ];

  const handleDecodeSubmit = (e) => {
    e.preventDefault();
    if (decodeText.length > 5) {
      setDecoded(true);
      if (isADHD) {
        speakSystemMessage("Great job decoding! Let's hit the first step.");
      }
    }
  };

  const handleStepChange = (index, value) => {
    const newInputs = [...stepInputs];
    newInputs[index] = value;
    setStepInputs(newInputs);

    if (!successPulses[index] && steps[index].answerRegex.test(value)) {
      const newPulses = [...successPulses];
      newPulses[index] = true;
      setSuccessPulses(newPulses);
      
      if (index === currentStep && currentStep < steps.length - 1) {
        setTimeout(() => setCurrentStep(currentStep + 1), 800);
        if (isADHD) speakSystemMessage("Boom! Nailed it.");
        else speakSystemMessage("Correct. Proceeding to the next step.");
      }
    }
  };

  const pivotHint = () => {
    setHintStyleIndex((prev) => (prev + 1) % hintStyles.length);
    speakSystemMessage(`Switching to ${hintStyles[(hintStyleIndex + 1) % hintStyles.length]} mode.`);
  };

  return (
    <div className="flex-1 flex bg-[#030303] text-white overflow-hidden relative font-sans">
      
      {/* Sidebar Hints (Live Proctor) */}
      <aside className="w-80 border-r border-zinc-900 bg-black p-8 flex flex-col shrink-0 z-10">
        <div className="flex items-center gap-3 mb-10 text-amber-500">
          <Target size={24} />
          <h3 className="font-black tracking-widest uppercase text-sm">Live Proctor</h3>
        </div>

        {decoded ? (
          <div className="space-y-6 animate-fade-in">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Neural Scaffolding</p>
            <div className="p-5 bg-[#0A0A0A] border border-amber-500/30 rounded-2xl relative shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">{hintStyles[hintStyleIndex]}</span>
                <Lightbulb size={16} className="text-amber-500" />
              </div>
              <p className="text-sm font-medium text-zinc-300 leading-relaxed">
                {steps[currentStep].hints[hintStyleIndex]}
              </p>
            </div>
            
            <button 
              onClick={pivotHint}
              className="w-full py-3 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw size={14} /> Pivot Explanation
            </button>
          </div>
        ) : (
          <div className="opacity-50 pointer-events-none">
            <p className="text-xs text-zinc-500 font-medium">Hints locked. Complete the Pre-Flight Check first.</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-16 custom-scrollbar relative">
        <div className="max-w-3xl mx-auto space-y-12 pb-32">
          
          <div className="mb-16">
            <p className="text-amber-500 font-black uppercase tracking-widest text-sm mb-4">HSC / Maths Mode</p>
            <h1 className="text-4xl font-black leading-tight text-white mb-6">
              {questionContext}
            </h1>
          </div>

          {!decoded ? (
            <div className="p-8 bg-zinc-900 border border-zinc-700 rounded-3xl animate-fade-in shadow-2xl">
              <div className="flex items-center gap-3 mb-6 text-emerald-500">
                <Lock size={20} />
                <h2 className="font-black tracking-widest uppercase text-sm">Instruction Decoder</h2>
              </div>
              <p className="text-zinc-300 mb-6 font-medium text-lg">In your own words, what is this question actually asking you to find?</p>
              <form onSubmit={handleDecodeSubmit}>
                <textarea 
                  value={decodeText}
                  onChange={(e) => setDecodeText(e.target.value)}
                  placeholder="I need to figure out..."
                  className="w-full bg-black/50 border border-zinc-800 rounded-xl p-6 text-white outline-none focus:border-emerald-500 transition-colors min-h-[120px] resize-none text-xl"
                  autoFocus
                />
                <div className="mt-6 flex justify-end">
                  <button 
                    type="submit"
                    disabled={decodeText.length < 5}
                    className="px-8 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl disabled:opacity-50 hover:shadow-glow-emerald transition-all"
                  >
                    Confirm Understanding
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-8">
              {steps.map((step, idx) => {
                const isLocked = idx > currentStep;
                const isActive = idx === currentStep;
                const isSuccess = successPulses[idx];

                return (
                  <div 
                    key={step.id} 
                    className={`relative p-8 rounded-3xl transition-all duration-700 overflow-hidden ${
                      isLocked ? 'opacity-20 scale-[0.98] blur-[2px] pointer-events-none bg-zinc-900/50' : 
                      isSuccess ? 'bg-emerald-500/10 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 
                      isActive ? 'bg-[#0A0A0A] border border-zinc-700 shadow-2xl scale-100' : 'bg-zinc-900/50 border border-zinc-800'
                    }`}
                  >
                    {/* Success Pulse Animation */}
                    {isSuccess && (
                      <div className="absolute inset-0 bg-emerald-500/20 animate-pulse pointer-events-none"></div>
                    )}

                    <div className="flex items-center gap-4 mb-6 relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${isSuccess ? 'bg-emerald-500 text-black' : isActive ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                        {isSuccess ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <h3 className={`font-black uppercase tracking-widest text-sm ${isSuccess ? 'text-emerald-400' : isActive ? 'text-white' : 'text-zinc-500'}`}>
                        {step.label}
                      </h3>
                      {isLocked && <Lock size={14} className="text-zinc-600 ml-auto" />}
                    </div>
                    
                    {!isLocked && (
                      <div className="relative z-10">
                        <input 
                          type="text"
                          value={stepInputs[idx]}
                          onChange={(e) => handleStepChange(idx, e.target.value)}
                          placeholder="Type your working here..."
                          className="w-full bg-transparent border-b border-zinc-800 pb-4 text-2xl text-white outline-none focus:border-amber-500 transition-colors placeholder-zinc-700 font-mono"
                          disabled={isSuccess}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
