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
//
// Audio unlock gate. Chrome (and Safari) silently drop speechSynthesis
// calls that fire before the page has received a user gesture. The boot
// pulse and handshake greeting both fire on mount, before any click, so
// they never produced sound even though the queue logged them. We now
// hold pre-interaction speech in a separate buffer; the first user
// click anywhere on the document drains the buffer into the live queue
// and flips the gate so all subsequent speech plays normally.
const __speechQueue = [];
const __preInteractionBuffer = [];
let __speechSpeaking = false;
let __userHasInteracted = false;
let __loggedVoice = false;

export const markSpeechUnlocked = () => {
  if (__userHasInteracted) return;
  __userHasInteracted = true;
  if (typeof console !== 'undefined') console.info('[Speech] unlocked by user gesture; draining', __preInteractionBuffer.length, 'queued');
  // Prime the synthesizer with a near-silent utterance so the first real
  // utterance does not get clipped on browsers that lazy-init the engine.
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      const primer = new SpeechSynthesisUtterance(' ');
      primer.volume = 0;
      primer.rate = 1;
      window.speechSynthesis.speak(primer);
    } catch { /* ignore */ }
  }
  // Drain the pre-interaction buffer through the normal queue.
  while (__preInteractionBuffer.length) {
    const job = __preInteractionBuffer.shift();
    __speechQueue.push(job);
  }
  __dequeue();
};

// Voice picker. Strict en-AU preference, then Australian-named voices,
// then any English voice. We deliberately do NOT return null when an
// AU voice is missing; falling back to en-US, en-GB, or any other
// English locale guarantees AURA is audible rather than silent.
const __pickVoice = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  return (
    voices.find(v => v.lang === 'en-AU') ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en-au')) ||
    voices.find(v => v.name && /karen|catherine|lee|matilda|olivia/i.test(v.name)) ||
    voices.find(v => v.name && (v.name.includes('Google') || v.name.includes('Siri'))) ||
    voices.find(v => v.lang === 'en-GB') ||
    voices.find(v => v.lang === 'en-US') ||
    voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) ||
    voices[0]
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
  __preInteractionBuffer.length = 0;
  __speechSpeaking = false;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }
};

// Hardwired audio defaults. Volume, rate, and pitch are pinned so a
// per-call override does not silently drop volume to zero or push the
// pitch into 'demonic' territory. Callers can still pass explicit
// rate/pitch but the volume is always 1.0.
export const speakSystemMessage = (text, onEndOrSubtitle, rate = 1.0, pitch = 1.0, onBoundaryCallback) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (typeof console !== 'undefined') console.warn('[Speech] speechSynthesis unavailable');
    return;
  }
  if (!text || typeof text !== 'string') return;

  const utterance = new SpeechSynthesisUtterance(text);
  const preferred = __pickVoice();
  if (preferred) {
    utterance.voice = preferred;
    if (!__loggedVoice) {
      __loggedVoice = true;
      if (typeof console !== 'undefined') console.info('[Speech] using voice:', preferred.name, '(', preferred.lang, ')');
    }
  } else if (!__loggedVoice && typeof console !== 'undefined') {
    const total = window.speechSynthesis.getVoices().length;
    console.warn('[Speech] no English voice available. Total voices loaded:', total, '. macOS users: System Settings > Accessibility > Spoken Content > System Voice.');
    __loggedVoice = true;
  }
  utterance.volume = 1.0;
  utterance.rate = rate;
  utterance.pitch = pitch;

  if (typeof onBoundaryCallback === 'function') {
    utterance.onboundary = onBoundaryCallback;
  }

  const job = {
    utterance,
    onEnd: typeof onEndOrSubtitle === 'function' ? onEndOrSubtitle : null
  };

  if (!__userHasInteracted) {
    if (typeof console !== 'undefined') console.info('[Speech] buffer (waiting for first click) ->', text.length > 80 ? text.slice(0, 80) + '...' : text);
    __preInteractionBuffer.push(job);
    return;
  }

  if (typeof console !== 'undefined') {
    console.info('[Speech] queue ->', text.length > 80 ? text.slice(0, 80) + '...' : text);
  }
  __speechQueue.push(job);
  __dequeue();
};
