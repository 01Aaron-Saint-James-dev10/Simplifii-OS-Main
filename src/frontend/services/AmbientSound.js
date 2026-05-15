/**
 * AmbientSound.js
 *
 * Web Audio API ambient sound generator. All sounds generated
 * client-side, no external assets. Supports: brown noise, pink noise,
 * rain, ocean. Auto-pauses when tab inactive.
 */

let audioCtx = null;
let sourceNode = null;
let gainNode = null;
let isPlaying = false;
let currentType = 'none';

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.3;
  }
  return audioCtx;
};

const createBrownNoise = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5; // compensate for gain loss
  }
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  return node;
};

const createPinkNoise = (ctx) => {
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    output[i] *= 0.11;
    b6 = white * 0.115926;
  }
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  return node;
};

const createRain = (ctx) => {
  // Rain is filtered white noise with gentle volume modulation
  const bufferSize = 4 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Slow volume modulation to simulate rain intensity variation
    const mod = 0.6 + 0.4 * Math.sin(i / ctx.sampleRate * 0.3);
    output[i] = white * 0.15 * mod;
  }
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  // Low-pass filter for rain-like quality
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  node.connect(filter);
  filter.connect(gainNode);
  return { node, filter };
};

const createOcean = (ctx) => {
  const bufferSize = 6 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // Slow wave pattern (6-second cycle)
    const wave = Math.sin(i / ctx.sampleRate * Math.PI / 3);
    const intensity = 0.3 + 0.7 * Math.max(0, wave);
    output[i] = white * 0.12 * intensity;
  }
  const node = ctx.createBufferSource();
  node.buffer = buffer;
  node.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 600;
  node.connect(filter);
  filter.connect(gainNode);
  return { node, filter };
};

export const startAmbient = (type) => {
  stopAmbient();
  if (type === 'none') return;

  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();

  if (type === 'brown_noise') {
    sourceNode = createBrownNoise(ctx);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else if (type === 'pink_noise') {
    sourceNode = createPinkNoise(ctx);
    sourceNode.connect(gainNode);
    sourceNode.start();
  } else if (type === 'rain') {
    const { node } = createRain(ctx);
    sourceNode = node;
    sourceNode.start();
  } else if (type === 'ocean') {
    const { node } = createOcean(ctx);
    sourceNode = node;
    sourceNode.start();
  }

  currentType = type;
  isPlaying = true;
};

export const stopAmbient = () => {
  if (sourceNode) {
    try { sourceNode.stop(); } catch { /* already stopped */ }
    sourceNode = null;
  }
  isPlaying = false;
  currentType = 'none';
};

export const setVolume = (vol) => {
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, vol));
};

export const getState = () => ({ isPlaying, currentType });

// Auto-pause when tab hidden
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!audioCtx) return;
    if (document.hidden) {
      audioCtx.suspend();
    } else if (isPlaying) {
      audioCtx.resume();
    }
  });
}
