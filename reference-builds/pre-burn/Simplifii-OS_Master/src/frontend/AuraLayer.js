import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, X, Volume2, VolumeX, FileText } from 'lucide-react';
import { askAura } from '../services/ChatService';
import { ACCENT_GLOW_60 } from '../theme/tokens';
import { speakSystemMessage, stopSpeaking } from '../services/MessagingHub';
import { useProject } from './ProjectContext';
import { REASONING_START_EVENT, REASONING_END_EVENT } from '../services/RewriteService';

const SPEAK_KEY = 'simplifii_aura_chat_speech';
const safeReadLS = (key, fallback) => {
  try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const safeWriteLS = (key, value) => {
  try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};

const firstSentences = (text, max = 280) => {
  if (!text) return '';
  const trimmed = text.trim().replace(/\s+/g, ' ');
  const sentenceMatch = trimmed.match(/^.+?[.!?](?:\s|$)(?:.+?[.!?](?:\s|$))?/);
  const candidate = sentenceMatch ? sentenceMatch[0].trim() : trimmed;
  return candidate.length > max ? candidate.slice(0, max - 1) + '.' : candidate;
};

// ---- Audio Hooks (structural stubs) ----
// These fire on Neural Dot state transitions. Replace the console
// calls with Web Audio API oscillators or sample playback when the
// sound design is finalised.
const audioHooks = {
  onIdle: () => {
    if (typeof console !== 'undefined') console.debug('[AuraLayer] Audio hook: idle (no tone)');
  },
  onListening: () => {
    if (typeof console !== 'undefined') console.debug('[AuraLayer] Audio hook: listening (focus thrum would fire here)');
  },
  onProcessing: () => {
    if (typeof console !== 'undefined') console.debug('[AuraLayer] Audio hook: processing (resonance pulse would fire here)');
  },
};

/**
 * CitationPill - a small badge representing a grounded citation.
 * Colour is paired with a file icon and explicit source text so
 * it never relies on colour alone.
 */
function CitationPill({ source }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-md">
      <FileText size={12} className="flex-shrink-0" />
      <span className="truncate max-w-[160px]">{source}</span>
    </span>
  );
}

/**
 * NeuralDot - biomorphic state indicator.
 * Three states: idle (static grey), listening (subtle pulse),
 * processing (emerald glow). The label beside the dot ensures
 * state is never communicated by colour alone.
 */
function NeuralDot({ state }) {
  const baseClasses = 'w-3 h-3 rounded-full flex-shrink-0';

  if (state === 'processing') {
    return (
      <motion.div
        className={`${baseClasses} bg-emerald-500`}
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        style={{ boxShadow: `0 0 10px ${ACCENT_GLOW_60}` }}
      />
    );
  }

  if (state === 'listening') {
    return (
      <motion.div
        className={`${baseClasses} bg-amber-400`}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  }

  // idle
  return <div className={`${baseClasses} bg-zinc-300`} />;
}

const DOT_LABELS = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing',
};

/**
 * AuraLayer - Stage 05: Multimodal Feedback Overlay
 *
 * Calm Dashboard AURA surface. Slides up from the bottom of the
 * viewport as a light-themed panel. Contains the Neural Dot state
 * indicator, scrollable conversation transcript with citation pills,
 * and a pinned dispatch bar.
 */
export default function AuraLayer({ open, onClose }) {
  const { activeCourse } = useProject();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // { role, content, citations? }
  const [error, setError] = useState('');
  const [speakReplies, setSpeakReplies] = useState(() => safeReadLS(SPEAK_KEY, 'true') !== 'false');
  const [dotState, setDotState] = useState('idle'); // 'idle' | 'listening' | 'processing'
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { safeWriteLS(SPEAK_KEY, String(speakReplies)); }, [speakReplies]);

  // Focus input when the layer opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  // Auto-scroll transcript
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  // Listen for reasoning events to drive the Neural Dot
  useEffect(() => {
    const onStart = () => {
      setDotState('processing');
      audioHooks.onProcessing();
    };
    const onEnd = () => {
      setDotState('idle');
      audioHooks.onIdle();
    };
    window.addEventListener(REASONING_START_EVENT, onStart);
    window.addEventListener(REASONING_END_EVENT, onEnd);
    return () => {
      window.removeEventListener(REASONING_START_EVENT, onStart);
      window.removeEventListener(REASONING_END_EVENT, onEnd);
    };
  }, []);

  // When input is focused, transition to listening
  const handleFocus = () => {
    if (dotState !== 'processing') {
      setDotState('listening');
      audioHooks.onListening();
    }
  };
  const handleBlur = () => {
    if (dotState === 'listening') {
      setDotState('idle');
      audioHooks.onIdle();
    }
  };

  const submit = async (e) => {
    if (e) e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    stopSpeaking();
    setLoading(true);
    setError('');
    setDotState('processing');
    audioHooks.onProcessing();
    const nextHistory = [...history, { role: 'user', content: message }];
    setHistory(nextHistory);
    setInput('');
    try {
      const reply = await askAura(message, activeCourse, history);
      // Extract citation markers like [Source: filename.pdf] from the reply
      const citationRegex = /\[Source:\s*([^\]]+)\]/g;
      const citations = [];
      let match;
      while ((match = citationRegex.exec(reply)) !== null) {
        citations.push(match[1].trim());
      }
      const cleanReply = reply.replace(citationRegex, '').trim();
      setHistory(prev => [...prev, {
        role: 'assistant',
        content: cleanReply,
        citations: citations.length > 0 ? citations : undefined,
      }]);
      if (speakReplies) {
        try { speakSystemMessage(firstSentences(cleanReply)); } catch { /* speech unavailable */ }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
      setDotState('idle');
      audioHooks.onIdle();
    }
  };

  const reset = () => {
    setHistory([]);
    setError('');
    setInput('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex items-end justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-zinc-50 border-t border-zinc-200 rounded-t-2xl shadow-xl pointer-events-auto flex flex-col"
        style={{ maxHeight: '70vh' }}
        role="dialog"
        aria-modal="true"
        aria-label="AURA feedback layer"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <NeuralDot state={dotState} />
            <span className="text-sm font-bold text-zinc-900">AURA</span>
            <span className="text-xs font-medium text-zinc-400">{DOT_LABELS[dotState]}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpeakReplies(v => !v)}
              className="inline-flex items-center gap-1.5 p-2 rounded-md text-zinc-500 hover:text-zinc-900 transition-colors focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none"
              title={speakReplies ? 'Mute voice replies' : 'Speak replies aloud'}
              aria-label={speakReplies ? 'Mute voice replies' : 'Unmute voice replies'}
            >
              {speakReplies ? <Volume2 size={16} /> : <VolumeX size={16} />}
              <span className="text-xs font-medium">{speakReplies ? 'Voice on' : 'Voice off'}</span>
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-900 px-2 py-1 rounded-md transition-colors focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none"
              aria-label="Close AURA layer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Transcript */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {history.length === 0 && !error && (
            <div className="text-center py-10">
              <p className="text-sm text-zinc-400 mb-4">
                {activeCourse?.extractionData
                  ? `Ask AURA about ${activeCourse.name}.`
                  : 'Drop a syllabus first, then ask AURA.'}
              </p>
              {/* Surface ingested source files as grounding context */}
              {activeCourse?.extractionData?.sourceFiles && activeCourse.extractionData.sourceFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">Grounded sources</p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {activeCourse.extractionData.sourceFiles.map((file, i) => (
                      <CitationPill key={i} source={file} />
                    ))}
                  </div>
                </div>
              )}
              {/* Surface assessment context when available */}
              {activeCourse?.extractionData?.assessmentTitles && activeCourse.extractionData.assessmentTitles.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wide mb-2">
                    {activeCourse.extractionData.assessmentTitles.length} assessment{activeCourse.extractionData.assessmentTitles.length === 1 ? '' : 's'} loaded
                  </p>
                  <p className="text-xs text-zinc-400">
                    AURA can answer questions about weightings, due dates, rubric criteria, and learning outcomes.
                  </p>
                </div>
              )}
            </div>
          )}

          {history.map((turn, i) => (
            <div key={i} className={turn.role === 'user' ? 'text-right' : 'text-left'}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-zinc-400">
                {turn.role === 'user' ? 'You' : 'AURA'}
              </p>
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${turn.role === 'user' ? 'text-zinc-900' : 'text-zinc-700'}`}>
                {turn.content}
              </p>
              {turn.citations && turn.citations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {turn.citations.map((src, ci) => (
                    <CitationPill key={ci} source={src} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1 text-zinc-400">AURA</p>
              <p className="text-sm text-zinc-400 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Synthesising response...</span>
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700">
              <span className="font-bold flex-shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Dispatch Bar (pinned bottom) */}
        <form
          onSubmit={submit}
          className="border-t border-zinc-200 bg-white px-4 py-3 flex items-center gap-3 rounded-b-none"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }}
            placeholder={activeCourse?.extractionData
              ? `Message AURA about ${activeCourse.name}...`
              : 'Drop a syllabus first, then ask AURA.'}
            disabled={loading}
            className="flex-1 bg-white border border-zinc-300 rounded-lg px-4 py-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus-visible:ring-3 focus-visible:ring-emerald-500 transition-all"
            aria-label="Message AURA"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-3 bg-zinc-900 hover:bg-black text-white text-sm font-bold rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed focus-visible:ring-3 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="Send message"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span>Send</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
