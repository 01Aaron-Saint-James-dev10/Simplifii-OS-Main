export const processVoiceToLogic = (transcriptionText) => {
  let processedText = transcriptionText;

  // Harvard Referencing Alert (Intelligent Scaffolding)
  const citationKeywords = ['a study found', 'researchers discovered', 'it was proven that'];
  const hasCitationKeyword = citationKeywords.some(kw => transcriptionText.toLowerCase().includes(kw));
  const hasCitation = /\([A-Za-z]+,?\s\d{4}\)/.test(transcriptionText); // checks for (Name, 2024)

  if (hasCitationKeyword && !hasCitation) {
    processedText += ' <mark class="bg-amber-500/20 text-amber-500 font-bold px-1 rounded">[CITATION NEEDED]</mark>';
  }

  // Routing Logic
  let targetBlock = 'Drafting';
  if (transcriptionText.toLowerCase().includes('lab note') || transcriptionText.toLowerCase().includes('process')) {
    targetBlock = 'Research Process';
  } else if (transcriptionText.toLowerCase().includes('database') || transcriptionText.toLowerCase().includes('search')) {
    targetBlock = 'Documentation';
  }

  return { processedText, targetBlock };
};

export const simulateIncomingWebhook = (payload, dispatchToState) => {
  setTimeout(() => {
    const { processedText, targetBlock } = processVoiceToLogic(payload.content);
    dispatchToState({
      ...payload,
      id: Date.now(),
      content: processedText,
      targetBlock
    });
  }, 1000); 
};

// Speech queue. Previous version called speechSynthesis.cancel() at the
// top of every speak call, which clipped boot-pulse + handshake messages
// in flight and produced a wall of 'utterance error canceled' lines.
// Now utterances are queued; each finishes before the next starts. The
// caller can interrupt explicitly via stopSpeaking() (used when the
// student sends a new chat message and wants the previous reply muted).
const __speechQueue = [];
let __speechSpeaking = false;

const __pickVoice = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === 'en-AU') ||
    voices.find(v => v.name && v.name.toLowerCase().includes('karen')) ||
    voices.find(v => v.name && (v.name.includes('Google') || v.name.includes('Siri'))) ||
    voices.find(v => v.lang && v.lang.startsWith('en')) ||
    null
  );
};

const __dequeue = () => {
  if (__speechSpeaking) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const job = __speechQueue.shift();
  if (!job) return;
  __speechSpeaking = true;
  const { utterance, onEnd } = job;
  utterance.onend = () => {
    __speechSpeaking = false;
    if (typeof onEnd === 'function') { try { onEnd(); } catch { /* swallow */ } }
    __dequeue();
  };
  utterance.onerror = (e) => {
    __speechSpeaking = false;
    if (e?.error && e.error !== 'canceled' && e.error !== 'interrupted') {
      if (typeof console !== 'undefined') console.warn('[Speech] utterance error', e.error);
    }
    __dequeue();
  };
  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    __speechSpeaking = false;
    if (typeof console !== 'undefined') console.warn('[Speech] speak() threw', err);
    __dequeue();
  }
};

export const stopSpeaking = () => {
  __speechQueue.length = 0;
  __speechSpeaking = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
};

export const speakSystemMessage = (text, onEndOrSubtitle, rate = 1.05, pitch = 0.9, onBoundaryCallback) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (typeof console !== 'undefined') console.warn('[Speech] speechSynthesis unavailable');
    return;
  }
  if (!text || typeof text !== 'string') return;

  const utterance = new SpeechSynthesisUtterance(text);
  const preferred = __pickVoice();
  if (preferred) utterance.voice = preferred;
  utterance.rate = rate;
  utterance.pitch = pitch;

  if (typeof onBoundaryCallback === 'function') {
    utterance.onboundary = onBoundaryCallback;
  }

  if (typeof console !== 'undefined') {
    console.info('[Speech] queue ->', text.length > 80 ? text.slice(0, 80) + '...' : text);
  }

  __speechQueue.push({
    utterance,
    onEnd: typeof onEndOrSubtitle === 'function' ? onEndOrSubtitle : null
  });
  __dequeue();
};
