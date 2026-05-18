import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const GuidedTour = ({ steps, storageKey, onComplete }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour && steps.length > 0) {
      const timer = setTimeout(() => setShowPrompt(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [storageKey, steps.length]);

  const positionTooltip = useCallback((stepIdx) => {
    if (stepIdx < 0 || stepIdx >= steps.length) return;
    const step = steps[stepIdx];
    const el = document.querySelector(step.target);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const pos = step.position || 'bottom';
      let top, left;

      if (pos === 'bottom') {
        top = rect.bottom + window.scrollY + 12;
        left = rect.left + window.scrollX + rect.width / 2;
      } else if (pos === 'top') {
        top = rect.top + window.scrollY - 12;
        left = rect.left + window.scrollX + rect.width / 2;
      } else if (pos === 'right') {
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.right + window.scrollX + 12;
      } else {
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX - 12;
      }

      setTooltipPos({ top, left, pos });

      // Highlight element
      el.style.position = el.style.position || 'relative';
      el.style.zIndex = '60';
      el.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.1)';
      el.style.borderRadius = el.style.borderRadius || '12px';
      el.style.transition = 'box-shadow 0.3s ease';
    }, 300);
  }, [steps]);

  const clearHighlight = useCallback((stepIdx) => {
    if (stepIdx < 0 || stepIdx >= steps.length) return;
    const el = document.querySelector(steps[stepIdx].target);
    if (el) {
      el.style.zIndex = '';
      el.style.boxShadow = '';
    }
  }, [steps]);

  const startTour = () => {
    setShowPrompt(false);
    setCurrentStep(0);
    positionTooltip(0);
  };

  const skipTour = () => {
    setShowPrompt(false);
    localStorage.setItem(storageKey, 'skipped');
  };

  const nextStep = () => {
    clearHighlight(currentStep);
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      positionTooltip(next);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    clearHighlight(currentStep);
    if (currentStep > 0) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      positionTooltip(prev);
    }
  };

  const completeTour = () => {
    clearHighlight(currentStep);
    setCurrentStep(-1);
    localStorage.setItem(storageKey, 'completed');
    if (onComplete) onComplete();
  };

  if (showPrompt) {
    return (
      <div className="fixed bottom-6 right-6 z-[70] animate-in" data-testid="tour-prompt">
        <div className="bg-[#111113] border border-emerald-500/20 rounded-2xl p-5 shadow-2xl max-w-xs">
          <h4 className="text-sm font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>First time here?</h4>
          <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
            Want us to guide you through the steps? We'll make it easy and accessible.
          </p>
          <div className="flex gap-2">
            <button onClick={startTour} data-testid="start-tour-btn" className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs transition-all">
              Yes, guide me
            </button>
            <button onClick={skipTour} data-testid="skip-tour-btn" className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-400 rounded-lg text-xs transition-all">
              Skip
            </button>
          </div>
        </div>
        <style>{`
          .animate-in { animation: slideIn 0.3s ease-out; }
          @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
      </div>
    );
  }

  if (currentStep < 0 || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/40 z-[55]" onClick={completeTour} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[65] max-w-xs"
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          transform: tooltipPos.pos === 'bottom' ? 'translateX(-50%)' :
                     tooltipPos.pos === 'top' ? 'translateX(-50%) translateY(-100%)' :
                     tooltipPos.pos === 'right' ? 'translateY(-50%)' : 'translateX(-100%) translateY(-50%)',
        }}
        data-testid={`tour-step-${currentStep}`}
      >
        {/* Arrow */}
        <div className={`absolute w-3 h-3 bg-[#111113] border-emerald-500/20 rotate-45 ${
          tooltipPos.pos === 'bottom' ? '-top-1.5 left-1/2 -translate-x-1/2 border-l border-t' :
          tooltipPos.pos === 'top' ? '-bottom-1.5 left-1/2 -translate-x-1/2 border-r border-b' :
          tooltipPos.pos === 'right' ? '-left-1.5 top-1/2 -translate-y-1/2 border-l border-b' :
          '-right-1.5 top-1/2 -translate-y-1/2 border-r border-t'
        }`} />

        <div className="bg-[#111113] border border-emerald-500/20 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button onClick={completeTour} className="text-zinc-600 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
          <h4 className="text-sm font-bold text-white mb-1">{step.title}</h4>
          <p className="text-xs text-zinc-400 leading-relaxed mb-3">{step.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? 'bg-emerald-400' : i < currentStep ? 'bg-emerald-500/30' : 'bg-white/[0.08]'}`} />
              ))}
            </div>
            <div className="flex gap-1.5">
              {currentStep > 0 && (
                <button onClick={prevStep} className="p-1.5 bg-white/[0.04] hover:bg-white/[0.06] rounded-lg text-zinc-400 transition-all">
                  <ChevronLeft size={14} />
                </button>
              )}
              <button onClick={nextStep} data-testid="tour-next-btn" className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold rounded-lg transition-all">
                {isLast ? "Got it!" : "Next"} {!isLast && <ChevronRight size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
