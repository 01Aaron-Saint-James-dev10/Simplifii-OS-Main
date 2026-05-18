import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Volume2, VolumeX, CloudRain, Coffee, Radio, Music } from 'lucide-react';

const SOUNDS = [
  { id: 'off', label: 'Off', icon: VolumeX },
  { id: 'rain', label: 'Rain', icon: CloudRain },
  { id: 'cafe', label: 'Caf\u00e9', icon: Coffee },
  { id: 'white', label: 'White', icon: Radio },
  { id: 'lofi', label: 'Lo-fi', icon: Music },
];

const createNoise = (ctx, type) => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
};

const buildRain = (ctx, dest) => {
  const nodes = [];
  // Layer 1: broadband rain
  const n1 = createNoise(ctx, 'rain');
  const bp1 = ctx.createBiquadFilter();
  bp1.type = 'bandpass'; bp1.frequency.value = 800; bp1.Q.value = 0.5;
  const g1 = ctx.createGain(); g1.gain.value = 0.12;
  n1.connect(bp1); bp1.connect(g1); g1.connect(dest);
  nodes.push(n1, bp1, g1);
  // Layer 2: high patter
  const n2 = createNoise(ctx, 'rain');
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass'; hp.frequency.value = 4000;
  const g2 = ctx.createGain(); g2.gain.value = 0.04;
  n2.connect(hp); hp.connect(g2); g2.connect(dest);
  nodes.push(n2, hp, g2);
  n1.start(); n2.start();
  return { stop: () => { n1.stop(); n2.stop(); } };
};

const buildCafe = (ctx, dest) => {
  const n = createNoise(ctx, 'cafe');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 600;
  const g = ctx.createGain(); g.gain.value = 0.10;
  n.connect(lp); lp.connect(g); g.connect(dest);
  // Murmur layer
  const n2 = createNoise(ctx, 'cafe');
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 1.5;
  const g2 = ctx.createGain(); g2.gain.value = 0.03;
  n2.connect(bp); bp.connect(g2); g2.connect(dest);
  n.start(); n2.start();
  return { stop: () => { n.stop(); n2.stop(); } };
};

const buildWhite = (ctx, dest) => {
  const n = createNoise(ctx, 'white');
  const g = ctx.createGain(); g.gain.value = 0.08;
  n.connect(g); g.connect(dest);
  n.start();
  return { stop: () => n.stop() };
};

const buildLofi = (ctx, dest) => {
  // Warm filtered noise + slow LFO
  const n = createNoise(ctx, 'lofi');
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 400;
  const g = ctx.createGain(); g.gain.value = 0.09;
  n.connect(lp); lp.connect(g); g.connect(dest);
  // Sub bass hum
  const osc = ctx.createOscillator();
  osc.frequency.value = 55; osc.type = 'sine';
  const og = ctx.createGain(); og.gain.value = 0.06;
  osc.connect(og); og.connect(dest);
  // LFO modulation
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.15; lfo.type = 'sine';
  const lfoG = ctx.createGain(); lfoG.gain.value = 100;
  lfo.connect(lfoG); lfoG.connect(lp.frequency);
  n.start(); osc.start(); lfo.start();
  return { stop: () => { n.stop(); osc.stop(); lfo.stop(); } };
};

const BUILDERS = { rain: buildRain, cafe: buildCafe, white: buildWhite, lofi: buildLofi };

const AmbientSound = () => {
  const [active, setActive] = useState(() => localStorage.getItem('simplifii_ambient') || 'off');
  const [open, setOpen] = useState(false);
  const ctxRef = useRef(null);
  const playerRef = useRef(null);

  const stopCurrent = useCallback(() => {
    if (playerRef.current) { try { playerRef.current.stop(); } catch {} playerRef.current = null; }
  }, []);

  useEffect(() => {
    stopCurrent();
    if (active === 'off' || !BUILDERS[active]) return;
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    playerRef.current = BUILDERS[active](ctx, ctx.destination);
    localStorage.setItem('simplifii_ambient', active);
    return stopCurrent;
  }, [active, stopCurrent]);

  const ActiveIcon = SOUNDS.find(s => s.id === active)?.icon || Volume2;

  return (
    <div className="fixed top-4 right-4 z-[60]" data-testid="ambient-sound">
      <button
        onClick={() => setOpen(!open)}
        className={`p-2.5 rounded-xl border transition-all shadow-lg backdrop-blur-sm ${
          active !== 'off'
            ? 'bg-teal-500/10 border-teal-500/20 text-teal-400'
            : 'bg-[#111113]/90 border-white/[0.06] text-zinc-500 hover:text-zinc-300'
        }`}
        data-testid="ambient-toggle-btn"
        title="Focus sounds"
      >
        <ActiveIcon size={16} />
      </button>
      {open && (
        <div className="absolute top-12 right-0 bg-[#111113]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-2 shadow-2xl min-w-[140px]" data-testid="ambient-menu">
          {SOUNDS.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => { setActive(s.id); if (s.id === 'off') setOpen(false); }}
                data-testid={`ambient-${s.id}`}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                  active === s.id
                    ? 'bg-teal-500/10 text-teal-400'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                }`}
              >
                <Icon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AmbientSound;
