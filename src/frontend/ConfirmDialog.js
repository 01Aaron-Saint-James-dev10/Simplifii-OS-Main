import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

// Styled confirm dialog that matches the cockpit zinc/emerald/rose palette.
// No external modal library; minimal accessibility primitives wired in:
// role="dialog" + aria-modal, Escape closes, click-outside cancels, focus
// returns to the triggering element on close.
export default function ConfirmDialog({
  open,
  title = 'Confirm',
  body = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel
}) {
  const cancelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    cancelRef.current?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass = destructive
    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-glow-rose'
    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-glow-emerald';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[99999] flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl max-w-md mx-4 w-full animate-fade-in">
        <div className="flex items-start gap-4 mb-6">
          {destructive && (
            <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl shrink-0">
              <AlertTriangle size={20} className="text-rose-400" />
            </div>
          )}
          <div className="flex-1">
            <h2 id="confirm-dialog-title" className="text-base font-black uppercase tracking-widest text-white mb-2">
              {title}
            </h2>
            <p className="text-zinc-400 text-sm font-medium leading-relaxed">{body}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-black uppercase tracking-widest text-xs transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
