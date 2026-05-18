import React, { useState } from 'react';
import { MessageCircle, Volume2, Globe, Plus, X, Pause, Play, Square } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CHECKIN_OPTIONS = [
  { id: 'confident', label: 'Confident — I know what to do', response: "That's the work paying off. Keep going." },
  { id: 'getting-there', label: 'Getting there — a bit clearer now', response: "That clarity will grow. Use the next step when you're ready." },
  { id: 'confused', label: 'Still confused — need more help', response: "That's okay. Try the Hidden Curriculum Decoder next — it reveals what nobody tells you." },
  { id: 'overwhelmed', label: 'Overwhelmed — not sure where to start', response: "One section at a time. You don't have to do everything today." },
];

const ToolOutputBar = ({ toolName, onStartFresh, outputRef }) => {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkinResponse, setCheckinResponse] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);

  const handleCheckIn = async (option) => {
    setCheckinResponse(option.response);
    try {
      await axios.post(`${API}/analytics/checkin`, { toolName, feeling: option.id }, { withCredentials: true });
    } catch {}
  };

  const handleVoice = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    // Get text content from the output area
    const el = outputRef?.current || document.querySelector('[data-testid="tool-output-area"]');
    if (!el) return;
    const text = el.innerText || el.textContent || '';
    if (!text.trim()) return;
    const utterance = new SpeechSynthesisUtterance(text.substring(0, 5000));
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const handleStartFresh = () => {
    if (window.confirm(`Start a new ${toolName}? Your current output is saved.`)) {
      if (onStartFresh) onStartFresh();
    }
  };

  return (
    <div className="mb-6" data-testid="tool-output-bar">
      <div className="flex flex-wrap items-center gap-2">
        {/* Check In */}
        <button onClick={() => { setShowCheckIn(!showCheckIn); setShowTranslate(false); }} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showCheckIn ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/[0.04] hover:bg-white/[0.06] text-zinc-400 border border-white/[0.06]'}`} data-testid="checkin-btn">
          <MessageCircle size={14} /> Check In
        </button>

        {/* Voice */}
        <button onClick={handleVoice} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${speaking ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-white/[0.04] hover:bg-white/[0.06] text-zinc-400 border border-white/[0.06]'}`} data-testid="voice-btn">
          {speaking ? <><Square size={14} /> Stop Reading</> : <><Volume2 size={14} /> Voice</>}
        </button>

        {/* New */}
        <button onClick={handleStartFresh} className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-400 border border-white/[0.06] rounded-lg text-xs font-medium transition-all" data-testid="start-fresh-btn">
          <Plus size={14} /> New {toolName}
        </button>
      </div>

      {speaking && (
        <p className="text-[10px] text-zinc-600 mt-1.5">Voice quality improving soon. Using browser speech for now.</p>
      )}

      {/* Check In Panel */}
      {showCheckIn && (
        <div className="mt-3 p-4 bg-[#111113] border border-white/[0.06] rounded-xl" data-testid="checkin-panel">
          {checkinResponse ? (
            <div className="text-center py-2">
              <p className="text-sm text-emerald-400 font-medium">{checkinResponse}</p>
              <button onClick={() => { setShowCheckIn(false); setCheckinResponse(''); }} className="mt-2 text-xs text-zinc-500 hover:text-zinc-300">Close</button>
            </div>
          ) : (
            <>
              <p className="text-sm text-white mb-3">How are you feeling about this assessment?</p>
              <div className="space-y-2">
                {CHECKIN_OPTIONS.map(opt => (
                  <button key={opt.id} onClick={() => handleCheckIn(opt)} className="w-full text-left p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] text-sm text-zinc-300 transition-all" data-testid={`checkin-${opt.id}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolOutputBar;
