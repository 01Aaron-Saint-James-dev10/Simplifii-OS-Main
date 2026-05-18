import React, { useState, useEffect, useCallback } from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { Brain, X, RotateCcw, Sun, Moon, Type, Eye, Contrast, Zap, Focus, Ruler, AlignJustify, ChevronRight } from 'lucide-react';

const Toggle = ({ checked, onChange, label, testId }) => (
  <button
    onClick={() => onChange(!checked)}
    data-testid={testId}
    className="flex items-center justify-between w-full py-2 group"
    role="switch"
    aria-checked={checked}
  >
    <span className="text-sm text-zinc-300">{label}</span>
    <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-teal-500' : 'bg-white/[0.08]'}`}>
      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </div>
  </button>
);

const SegmentPicker = ({ options, value, onChange, testId }) => (
  <div className="flex gap-1 p-1 bg-white/[0.04] rounded-lg" data-testid={testId}>
    {options.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all duration-200 ${
          value === opt.value ? 'bg-teal-500/20 text-teal-400' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const AccessibilityToolbar = () => {
  const {
    fontSize, setFontSizePreset,
    dyslexiaFont, setDyslexiaFont,
    highContrast, setHighContrast,
    reduceMotion, setReduceMotion,
    focusMode, setFocusMode,
    readingRuler, setReadingRuler,
    darkMode, setDarkMode,
    lineSpacing, setLineSpacingPreset,
    resetAll,
  } = useAccessibility();
  const [panelOpen, setPanelOpen] = useState(false);
  const [rulerY, setRulerY] = useState(-100);

  // Reading ruler follows mouse
  useEffect(() => {
    if (!readingRuler) return;
    const handler = (e) => setRulerY(e.clientY);
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, [readingRuler]);

  return (
    <>
      {/* Floating trigger — bottom right */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        data-testid="accessibility-trigger"
        className={`fixed bottom-20 left-4 z-[70] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          panelOpen
            ? 'bg-teal-500 text-black scale-95'
            : 'bg-[#111113] border border-white/[0.08] text-teal-400 hover:border-teal-500/30 hover:shadow-teal-500/10'
        }`}
        aria-label="Accessibility settings"
      >
        {panelOpen ? <X size={20} /> : <Brain size={20} />}
      </button>

      {/* Slide-in panel */}
      <div
        className={`fixed left-0 bottom-0 z-[65] w-80 max-h-[85vh] bg-[#0D0D0F]/98 backdrop-blur-2xl border-r border-t border-white/[0.08] rounded-tr-2xl shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${
          panelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="accessibility-panel"
        role="dialog"
        aria-label="Accessibility settings"
      >
        <div className="sticky top-0 bg-[#0D0D0F]/95 backdrop-blur-xl z-10 px-5 pt-5 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit' }}>Accessibility</h2>
            <button onClick={resetAll} data-testid="accessibility-reset" className="flex items-center gap-1 text-xs text-zinc-500 hover:text-teal-400 transition-colors px-2 py-1 rounded-lg hover:bg-white/[0.04]">
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Theme */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              {darkMode ? <Moon size={14} className="text-teal-400" /> : <Sun size={14} className="text-amber-400" />}
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Theme</span>
            </div>
            <Toggle checked={!darkMode} onChange={(v) => setDarkMode(!v)} label={darkMode ? 'Dark mode' : 'Light mode'} testId="toggle-dark-mode" />
          </div>

          {/* Typography */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Type size={14} className="text-teal-400" />
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Typography</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Font Size</label>
                <SegmentPicker
                  options={[{ value: 'small', label: 'S' }, { value: 'medium', label: 'M' }, { value: 'large', label: 'L' }, { value: 'xl', label: 'XL' }]}
                  value={fontSize}
                  onChange={setFontSizePreset}
                  testId="font-size-picker"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Line Spacing</label>
                <SegmentPicker
                  options={[{ value: 'normal', label: 'Normal' }, { value: 'wide', label: 'Wide' }, { value: 'extra-wide', label: 'Extra' }]}
                  value={lineSpacing}
                  onChange={setLineSpacingPreset}
                  testId="line-spacing-picker"
                />
              </div>
              <Toggle checked={dyslexiaFont} onChange={setDyslexiaFont} label="Dyslexia-friendly font" testId="toggle-dyslexia" />
            </div>
          </div>

          {/* Vision */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Eye size={14} className="text-teal-400" />
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Vision</span>
            </div>
            <div className="space-y-1">
              <Toggle checked={highContrast} onChange={setHighContrast} label="High contrast" testId="toggle-contrast" />
              <Toggle checked={readingRuler} onChange={setReadingRuler} label="Reading ruler" testId="toggle-ruler" />
            </div>
          </div>

          {/* Focus */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Focus size={14} className="text-teal-400" />
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-medium">Focus</span>
            </div>
            <div className="space-y-1">
              <Toggle checked={focusMode} onChange={setFocusMode} label="Focus mode" testId="toggle-focus" />
              <Toggle checked={reduceMotion} onChange={setReduceMotion} label="Reduce motion" testId="toggle-motion" />
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <p className="text-[10px] text-zinc-700 text-center">Settings save automatically across all pages</p>
        </div>
      </div>

      {/* Reading ruler overlay */}
      {readingRuler && (
        <div
          className="fixed left-0 right-0 h-10 pointer-events-none z-[80] transition-none"
          style={{
            top: `${rulerY - 20}px`,
            background: 'linear-gradient(180deg, transparent 0%, rgba(13,148,136,0.08) 40%, rgba(13,148,136,0.08) 60%, transparent 100%)',
            borderTop: '1px solid rgba(13,148,136,0.15)',
            borderBottom: '1px solid rgba(13,148,136,0.15)',
          }}
          data-testid="reading-ruler"
        />
      )}
    </>
  );
};

export default AccessibilityToolbar;
