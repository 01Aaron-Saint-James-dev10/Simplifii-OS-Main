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

// speakSystemMessage. Backwards compatible: many callsites pass a subtitle
// string as the second arg (legacy avatarSpeak pattern), so we now ignore
// non-function values rather than wiring them to onend (which would silently
// no-op). All speech attempts log to console so the student can verify the
// path even when the OS volume or Chrome autoplay policy is blocking audio.
export const speakSystemMessage = (text, onEndOrSubtitle, rate = 1.05, pitch = 0.9, onBoundaryCallback) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (typeof console !== 'undefined') console.warn('[Speech] speechSynthesis unavailable');
    return;
  }
  if (!text || typeof text !== 'string') return;

  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }

  const utterance = new SpeechSynthesisUtterance(text);

  // Voice picking. The voices list is populated asynchronously on Chromium;
  // first call after a hard reload returns []. We attempt synchronously, then
  // re-attempt once on the voiceschanged event for the next utterance.
  const pickVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === 'en-AU') ||
      voices.find(v => v.name && v.name.toLowerCase().includes('karen')) ||
      voices.find(v => v.name && (v.name.includes('Google') || v.name.includes('Siri'))) ||
      voices.find(v => v.lang && v.lang.startsWith('en')) ||
      null
    );
  };
  const preferred = pickVoice();
  if (preferred) utterance.voice = preferred;

  utterance.rate = rate;
  utterance.pitch = pitch;

  // onEndOrSubtitle: only wire as a callback when it is a function. A
  // string here is the legacy subtitle pattern; we just ignore it.
  if (typeof onEndOrSubtitle === 'function') {
    utterance.onend = onEndOrSubtitle;
    utterance.onerror = onEndOrSubtitle;
  }
  if (typeof onBoundaryCallback === 'function') {
    utterance.onboundary = onBoundaryCallback;
  }

  utterance.onerror = utterance.onerror || ((e) => {
    if (typeof console !== 'undefined') console.warn('[Speech] utterance error', e?.error || e);
  });

  if (typeof console !== 'undefined') {
    console.info('[Speech] speak ->', text.length > 80 ? text.slice(0, 80) + '...' : text);
  }

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    if (typeof console !== 'undefined') console.warn('[Speech] speak() threw', err);
  }
};
