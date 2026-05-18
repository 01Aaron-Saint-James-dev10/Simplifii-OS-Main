import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * AuraOrb
 *
 * WebGL floating orb: AURA's visual presence in Simplifii-OS.
 * Hybrid form: fluid organic sphere with geometric glyph core.
 * Always visible (floating bottom-right). Click expands chat.
 *
 * States: idle, listening, thinking, speaking, success, low-energy
 * Reads theme from CSS vars. Respects prefers-reduced-motion.
 */

// Vertex shader: passes UV and position to fragment
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform float uDistortion;

  // Simplex noise approximation
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    float noise = snoise(pos * 2.0 + uTime * 0.3) * uDistortion;
    pos += normal * noise;
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader: gradient with fresnel glow
const fragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float uTime;
  uniform vec3 uColourPrimary;
  uniform vec3 uColourSecondary;
  uniform float uPulse;

  void main() {
    // Fresnel edge glow
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - abs(dot(viewDir, normalize(vPosition))), 2.5);

    // Animated gradient
    float gradient = sin(vPosition.y * 3.0 + uTime * 0.5) * 0.5 + 0.5;
    vec3 colour = mix(uColourPrimary, uColourSecondary, gradient);

    // Pulse brightness
    float pulse = 1.0 + sin(uTime * uPulse) * 0.15;
    colour *= pulse;

    // Add fresnel glow
    colour += uColourPrimary * fresnel * 0.8;

    // Alpha: solid centre, glowing edge
    float alpha = 0.85 + fresnel * 0.15;

    gl_FragColor = vec4(colour, alpha);
  }
`;

// State configurations: colour, distortion, pulse speed, rotation speed
// Ditto palette: lavender purple base, shifting on state
const STATES = {
  idle:      { distortion: 0.08, pulse: 1.0, rotationSpeed: 0.2,  primary: [0.706, 0.624, 0.831], secondary: [0.82, 0.75, 0.91] },
  listening: { distortion: 0.12, pulse: 2.5, rotationSpeed: 0.4,  primary: [0.54,  0.44,  0.78],  secondary: [0.706, 0.624, 0.831] },
  thinking:  { distortion: 0.15, pulse: 3.0, rotationSpeed: 0.8,  primary: [0.94,  0.62,  0.15],  secondary: [0.82, 0.69, 0.91] },
  speaking:  { distortion: 0.10, pulse: 2.0, rotationSpeed: 0.3,  primary: [0.706, 0.624, 0.831], secondary: [0.94, 0.62, 0.15] },
  success:   { distortion: 0.05, pulse: 1.5, rotationSpeed: 0.1,  primary: [0.60,  0.82,  0.40],  secondary: [0.706, 0.624, 0.831] },
  lowEnergy: { distortion: 0.04, pulse: 0.5, rotationSpeed: 0.05, primary: [0.44,  0.44,  0.48],  secondary: [0.36, 0.32, 0.44] },
};

const STATE_LABELS = {
  idle:      'Ask AURA for help',
  listening: 'Listening...',
  thinking:  'Thinking...',
  speaking:  'Responding...',
  success:   'Done',
  lowEnergy: 'AURA is resting',
};

function FluidOrb({ state = 'idle', audioLevel = 0 }) {
  const meshRef = useRef();
  const materialRef = useRef();
  const config = STATES[state] || STATES.idle;

  // Smoothly interpolate between states
  const targetRef = useRef(config);
  targetRef.current = config;

  useFrame(({ clock }) => {
    if (!materialRef.current) return;
    const t = clock.getElapsedTime();
    const u = materialRef.current.uniforms;

    u.uTime.value = t;

    // Audio-reactive distortion: adds audioLevel to base distortion when speaking
    const audioBoost = audioLevel * 0.12;
    u.uDistortion.value += (targetRef.current.distortion + audioBoost - u.uDistortion.value) * 0.08;
    u.uPulse.value += (targetRef.current.pulse - u.uPulse.value) * 0.02;
    u.uColourPrimary.value.lerp(new THREE.Vector3(...targetRef.current.primary), 0.02);
    u.uColourSecondary.value.lerp(new THREE.Vector3(...targetRef.current.secondary), 0.02);

    // Rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += targetRef.current.rotationSpeed * 0.01;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDistortion: { value: config.distortion },
    uPulse: { value: config.pulse },
    uColourPrimary: { value: new THREE.Vector3(...config.primary) },
    uColourSecondary: { value: new THREE.Vector3(...config.secondary) },
  }), []);

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// Floating particles orbiting the sphere
function OrbParticles({ state }) {
  const ref = useRef();
  const config = STATES[state] || STATES.idle;
  const count = 24;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.3 + Math.random() * 0.4;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * config.rotationSpeed * 0.3;
    ref.current.rotation.x = Math.sin(t * 0.15) * 0.2;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={new THREE.Color(...config.primary)}
        size={0.04}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

// Inner geometric glyph (wireframe icosahedron as the "core")
function GlyphCore({ state }) {
  const ref = useRef();
  const config = STATES[state] || STATES.idle;

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = -t * config.rotationSpeed * 0.5;
    ref.current.rotation.z = t * config.rotationSpeed * 0.3;
  });

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshBasicMaterial
        color={new THREE.Color(...config.primary)}
        wireframe
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

export default function AuraOrb({ onClick, auraState = 'idle' }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const containerRef = useRef(null);

  // Minimise state: persisted to localStorage
  const [isMinimised, setIsMinimised] = useState(() => {
    try { return localStorage.getItem('simplifii_aura_minimised') === 'true'; } catch { return false; }
  });
  const toggleMinimise = useCallback((e) => {
    e.stopPropagation();
    setIsMinimised(prev => {
      const next = !prev;
      try { localStorage.setItem('simplifii_aura_minimised', String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Listen for audio level events from the voice engine
  useEffect(() => {
    const handler = (e) => setAudioLevel(e.detail?.level || 0);
    window.addEventListener('simplifii:aura-audio-level', handler);
    return () => window.removeEventListener('simplifii:aura-audio-level', handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Listen for AURA state events from the app
  const [currentState, setCurrentState] = useState(auraState);
  useEffect(() => {
    const stateHandler = (e) => setCurrentState(e.detail?.state || 'idle');
    const idleHandler = () => setCurrentState('lowEnergy');
    const inputHandler = () => { if (currentState === 'lowEnergy') setCurrentState('idle'); };
    window.addEventListener('simplifii:aura-state', stateHandler);
    window.addEventListener('simplifii:idle', idleHandler);
    document.addEventListener('keydown', inputHandler, { passive: true });
    document.addEventListener('mousedown', inputHandler, { passive: true });
    return () => {
      window.removeEventListener('simplifii:aura-state', stateHandler);
      window.removeEventListener('simplifii:idle', idleHandler);
      document.removeEventListener('keydown', inputHandler);
      document.removeEventListener('mousedown', inputHandler);
    };
  }, [currentState]);

  useEffect(() => { setCurrentState(auraState); }, [auraState]);

  // Drag positioning
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('simplifii_aura_pos');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { bottom: 20, right: 76 };
  });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startPos: position });

  const handlePointerDown = useCallback((e) => {
    dragRef.current = { dragging: false, startX: e.clientX, startY: e.clientY, startPos: { ...position }, moved: 0 };
    const handleMove = (ev) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      dragRef.current.moved = Math.abs(dx) + Math.abs(dy);
      if (dragRef.current.moved > 5) {
        dragRef.current.dragging = true;
        const newRight = Math.max(0, dragRef.current.startPos.right - dx);
        const newBottom = Math.max(0, dragRef.current.startPos.bottom + dy);
        setPosition({ bottom: newBottom, right: newRight });
      }
    };
    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      if (dragRef.current.dragging) {
        localStorage.setItem('simplifii_aura_pos', JSON.stringify(position));
      }
    };
    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
  }, [position]);

  const handleClick = useCallback(() => {
    if (dragRef.current.dragging) return; // Suppress click after drag
    onClick?.();
  }, [onClick]);

  // Wake word: "Hey AURA" triggers onClick, same as tapping the orb
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-AU';
    let triggered = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.toLowerCase().trim();
        if (!triggered && (t.includes('hey aura') || t.includes('hey ora') || t.includes('hey laura'))) {
          triggered = true;
          onClick?.();
          setTimeout(() => { triggered = false; }, 3000);
        }
      }
    };
    rec.onerror = () => {};
    try { rec.start(); } catch { /* mic not available */ }
    return () => { try { rec.stop(); } catch { /* ignore */ } };
  }, [onClick]);

  // Minimised: small pill, click to expand
  if (isMinimised) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimised(false)}
        aria-label="Expand AURA assistant"
        style={{
          position: 'fixed',
          bottom: position.bottom,
          right: position.right,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 12px',
          background: 'rgba(180,159,212,0.18)', /* allow-style */
          border: '1px solid rgba(180,159,212,0.4)', /* allow-style */
          borderRadius: 20,
          cursor: 'pointer',
          fontFamily: 'var(--font-system, system-ui)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.06em',
          color: '#b49fd4', /* allow-style */
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#b49fd4', display: 'inline-block' }} /> {/* allow-style */}
        AURA
      </button>
    );
  }

  // Reduced motion fallback: CSS-only Ditto gradient orb
  if (reducedMotion) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          zIndex: 100,
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={handleClick}
            aria-label="Open AURA assistant"
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 30%, #d0bfe8, #b49fd4)', /* allow-style */
              border: '2px solid rgba(180,159,212,0.4)', /* allow-style */
              boxShadow: '0 0 24px rgba(180,159,212,0.5)', /* allow-style */
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#ede9f7', letterSpacing: '-1px', pointerEvents: 'none', userSelect: 'none' }}>{'>_<'}</span> {/* allow-style */}
          </button>
          <button type="button" onClick={toggleMinimise} aria-label="Minimise AURA"
            style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: 'rgba(180,159,212,0.3)', border: 'none', cursor: 'pointer', fontSize: 9, color: '#2d1a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}> {/* allow-style */}
            {'\u2212'}
          </button>
        </div>
        <span style={{ fontFamily: 'var(--font-system, system-ui)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: '#b49fd4', whiteSpace: 'nowrap' }}>{STATE_LABELS[currentState] || STATE_LABELS.idle}</span> {/* allow-style */}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      data-tour="aura-orb"
      onPointerDown={handlePointerDown}
      style={{
        position: 'fixed',
        bottom: position.bottom,
        right: position.right,
        width: 88,
        height: 88,
        zIndex: 100,
        cursor: 'pointer',
        pointerEvents: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: currentState === 'listening' ? 'scale(1.08)' : currentState === 'thinking' ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 300ms ease', // allow-style
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Open AURA assistant"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Minimise button */}
      <button
        type="button"
        onClick={toggleMinimise}
        aria-label="Minimise AURA"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'rgba(180,159,212,0.25)', /* allow-style */
          border: 'none',
          cursor: 'pointer',
          fontSize: 10,
          color: '#2d1a4a', /* allow-style */
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
          opacity: 0.7,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.7'; }}
      >
        {'\u2212'}
      </button>

      {/* Cyber face overlay: centred over the 3D canvas */}
      <span
        style={{
          position: 'absolute',
          top: '42%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: 700,
          color: '#ede9f7',
          letterSpacing: '-1px',
          pointerEvents: 'none',
          zIndex: 1,
          userSelect: 'none',
          textShadow: '0 0 6px rgba(180,159,212,0.9)', /* allow-style */
        }}
      >
        {'>_<'}
      </span>

      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        onCreated={({ gl }) => {
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); setReducedMotion(true); });
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 2, 2]} intensity={0.8} color="#c4a8e0" />
        <pointLight position={[-2, -1, 1]} intensity={0.4} color="#9b7fd4" />
        <FluidOrb state={currentState} audioLevel={audioLevel} />
        <GlyphCore state={currentState} />
        <OrbParticles state={currentState} />
      </Canvas>

      <span style={{ fontFamily: 'var(--font-system, system-ui)', fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: '#b49fd4', whiteSpace: 'nowrap', position: 'absolute', bottom: -16 }}>{STATE_LABELS[currentState] || STATE_LABELS.idle}</span> {/* allow-style */}
    </div>
  );
}
