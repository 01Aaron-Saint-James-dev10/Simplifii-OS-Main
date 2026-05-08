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

export const speakSystemMessage = (text, onEndCallback, rate = 1.05, pitch = 0.9, onBoundaryCallback) => {
  if (!window.speechSynthesis) return;
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Find a decent english voice if possible
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Siri') || v.lang.startsWith('en'));
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  utterance.rate = rate;
  utterance.pitch = 0.9;
  
  if (onEndCallback) {
    utterance.onend = onEndCallback;
    utterance.onerror = onEndCallback;
  }

  if (onBoundaryCallback) {
    utterance.onboundary = onBoundaryCallback;
  }
  
  window.speechSynthesis.speak(utterance);
};
