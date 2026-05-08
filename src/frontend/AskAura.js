import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, X, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { askAura } from '../services/ChatService';
import { speakSystemMessage } from '../services/MessagingHub';
import { useProject } from './ProjectContext';

const SPEAK_KEY = 'simplifii_aura_chat_speech';
const safeReadLS = (key, fallback) => {
  try { return window.localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const safeWriteLS = (key, value) => {
  try { window.localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};

// Reduce a long reply to the first 1-2 sentences, capped at 280 chars, so
// the AURA voice stays punchy. The full reply still renders in the
// transcript above the input.
const firstSentences = (text, max = 280) => {
  if (!text) return '';
  const trimmed = text.trim().replace(/\s+/g, ' ');
  const sentenceMatch = trimmed.match(/^.+?[.!?](?:\s|$)(?:.+?[.!?](?:\s|$))?/);
  const candidate = sentenceMatch ? sentenceMatch[0].trim() : trimmed;
  return candidate.length > max ? candidate.slice(0, max - 1) + '.' : candidate;
};

/**
 * AskAura. Floating chat bar pinned to the bottom of the canvas. Click the
 * pill to expand into a full input row; the last AURA reply renders above
 * the input. Escape collapses. The reasoning-pulse fires automatically via
 * ChatService so the AURA dot speeds up while AURA is generating.
 *
 * Reads activeCourse from ProjectContext directly so the chat always sees
 * the syllabus context the rest of the cockpit is operating on, without the
 * parent component needing to thread it down.
 */
export default function AskAura() {
  const { activeCourse } = useProject();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // {role, content}
  const [error, setError] = useState('');
  const [speakReplies, setSpeakReplies] = useState(() => safeReadLS(SPEAK_KEY, 'true') !== 'false');
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => { safeWriteLS(SPEAK_KEY, String(speakReplies)); }, [speakReplies]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, loading]);

  const submit = async (e) => {
    if (e) e.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    setLoading(true);
    setError('');
    const nextHistory = [...history, { role: 'user', content: message }];
    setHistory(nextHistory);
    setInput('');
    try {
      const reply = await askAura(message, activeCourse, history);
      setHistory(prev => [...prev, { role: 'assistant', content: reply }]);
      if (speakReplies) {
        try { speakSystemMessage(firstSentences(reply)); } catch { /* speech unavailable */ }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setHistory([]);
    setError('');
    setInput('');
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[min(720px,92vw)] pointer-events-none">
      {!open && (
        <div className="flex justify-center pointer-events-auto">
          <button
            onClick={() => setOpen(true)}
            type="button"
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-zinc-950/90 backdrop-blur border border-emerald-500/30 hover:border-emerald-500 text-emerald-400 hover:text-emerald-300 text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_24px_rgba(16,185,129,0.25)]"
            aria-label="Open AURA chat"
          >
            <Sparkles size={14} /> Ask AURA
          </button>
        </div>
      )}

      {open && (
        <div className="bg-zinc-950/95 backdrop-blur-md border border-emerald-500/30 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.3)] overflow-hidden animate-fade-in pointer-events-auto">
          {(history.length > 0 || error) && (
            <div ref={scrollRef} className="px-4 py-3 border-b border-zinc-800/80 max-h-[40vh] overflow-y-auto custom-scrollbar space-y-3">
              {history.map((turn, i) => (
                <div key={i} className={turn.role === 'user' ? 'text-right' : 'text-left'}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-zinc-500">
                    {turn.role === 'user' ? 'You' : 'AURA'}
                  </p>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${turn.role === 'user' ? 'text-zinc-100' : 'text-emerald-200'}`}>
                    {turn.content}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="text-left">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 text-zinc-500">AURA</p>
                  <p className="text-sm text-emerald-300/70 italic flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" /> Thinking...
                  </p>
                </div>
              )}
              {error && (
                <p className="text-rose-400 text-xs font-medium border border-rose-500/30 bg-rose-500/5 rounded-lg p-2">{error}</p>
              )}
            </div>
          )}
          <form onSubmit={submit} className="flex items-center gap-2 p-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={activeCourse?.extractionData ? `Ask AURA about ${activeCourse.name}...` : 'Drop a syllabus first, then ask AURA.'}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
              }}
              className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm outline-none px-2 py-1"
              aria-label="Message AURA"
            />
            <button
              type="button"
              onClick={() => setSpeakReplies(v => !v)}
              className={`p-2 rounded-lg transition-all ${speakReplies ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-500 hover:text-white'}`}
              title={speakReplies ? 'Mute AURA voice' : 'Speak AURA replies aloud'}
              aria-label={speakReplies ? 'Mute AURA voice' : 'Unmute AURA voice'}
            >
              {speakReplies ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            {history.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-widest px-2 py-1 transition-all"
                title="Clear conversation"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              aria-label="Send message"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-lg text-zinc-500 hover:text-white transition-all"
              aria-label="Close AURA chat"
            >
              <X size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
