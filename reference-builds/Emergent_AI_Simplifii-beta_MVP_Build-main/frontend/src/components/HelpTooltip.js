import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

const HelpTooltip = ({ text, className = '' }) => {
  const [show, setShow] = useState(false);

  return (
    <span className={`relative inline-flex ${className}`} data-testid="help-tooltip">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors"
        aria-label="Help"
        type="button"
      >
        <HelpCircle size={14} />
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-3 bg-[#1a1a1e] border border-white/10 rounded-lg shadow-xl text-xs text-zinc-300 leading-relaxed" data-testid="help-tooltip-content">
          <div className="whitespace-pre-line">{text}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#1a1a1e]" />
        </div>
      )}
    </span>
  );
};

export default HelpTooltip;
