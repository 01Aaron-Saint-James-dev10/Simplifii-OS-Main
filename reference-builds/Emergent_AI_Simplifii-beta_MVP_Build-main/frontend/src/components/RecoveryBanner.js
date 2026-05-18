import React, { useState, useEffect } from 'react';
import { getRecentOutput, clearRecentOutput } from '../utils/autosave';
import { RotateCcw, X } from 'lucide-react';

const RecoveryBanner = ({ toolName, onRecover }) => {
  const [recent, setRecent] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const entry = getRecentOutput(toolName);
    if (entry) setRecent(entry);
  }, [toolName]);

  if (!recent || dismissed) return null;

  return (
    <div data-testid="recovery-banner" className="mb-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-300">
        <RotateCcw size={16} className="text-emerald-400 flex-shrink-0" />
        <span>You have a recent <strong className="text-white">{toolName}</strong> output.</span>
        <button
          data-testid="recovery-view-btn"
          onClick={() => { onRecover(recent.outputData); setDismissed(true); }}
          className="text-emerald-400 hover:text-emerald-300 underline font-medium"
        >
          View it
        </button>
        <span>or start a new one.</span>
      </div>
      <button
        data-testid="recovery-dismiss-btn"
        onClick={() => { clearRecentOutput(toolName); setDismissed(true); }}
        className="text-gray-500 hover:text-gray-300"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default RecoveryBanner;
