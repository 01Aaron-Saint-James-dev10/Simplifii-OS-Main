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
const STATES = {
  idle: { distortion: 0.08, pulse: 1.0, rotationSpeed: 0.2, primary: [0.94, 0.62, 0.15], secondary: [0.06, 0.73, 0.50] },
  listening: { distortion: 0.12, pulse: 2.5, rotationSpeed: 0.4, primary: [0.06, 0.73, 0.50], secondary: [0.24, 0.83, 0.93] },
  thinking: { distortion: 0.15, pulse: 3.0, rotationSpeed: 0.8, primary: [0.94, 0.62, 0.15], secondary: [0.94, 0.82, 0.15] },
  speaking: { distortion: 0.10, pulse: 2.0, rotationSpeed: 0.3, primary: [0.06, 0.73, 0.50], secondary: [0.94, 0.62, 0.15] },
  success: { distortion: 0.05, pulse: 1.5, rotationSpeed: 0.1, primary: [0.20, 0.82, 0.40], secondary: [0.34, 0.93, 0.60] },
  lowEnergy: { distortion: 0.04, pulse: 0.5, rotationSpeed: 0.05, primary: [0.44, 0.44, 0.48], secondary: [0.28, 0.28, 0.31] },
};

function FluidOrb({ state = 'idle' }) {
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

    // Lerp towards target state
    u.uDistortion.value += (targetRef.current.distortion - u.uDistortion.value) * 0.02;
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
  const containerRef = useRef(null);

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
    const handler = (e) => setCurrentState(e.detail?.state || 'idle');
    window.addEventListener('simplifii:aura-state', handler);
    return () => window.removeEventListener('simplifii:aura-state', handler);
  }, []);

  useEffect(() => { setCurrentState(auraState); }, [auraState]);

  const handleClick = useCallback(() => { onClick?.(); }, [onClick]);

  // Reduced motion fallback: CSS-only gradient orb
  if (reducedMotion) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Open AURA assistant"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 80,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #ef9f27, #10b981)',
          border: '2px solid rgba(16,185,129,0.3)',
          boxShadow: '0 0 24px rgba(239,159,39,0.4), 0 0 48px rgba(16,185,129,0.2)',
          cursor: 'pointer',
          zIndex: 100,
          outline: 'none',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 76,
        width: 64,
        height: 64,
        zIndex: 100,
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Open AURA assistant"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 2, 2]} intensity={0.8} color="#ef9f27" />
        <pointLight position={[-2, -1, 1]} intensity={0.4} color="#10b981" />
        <FluidOrb state={currentState} />
        <GlyphCore state={currentState} />
      </Canvas>
    </div>
  );
}
