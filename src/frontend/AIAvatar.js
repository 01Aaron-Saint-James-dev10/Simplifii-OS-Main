import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Minimize2 } from 'lucide-react';
import { speakSystemMessage } from '../services/MessagingHub';
import { useSettings } from './SettingsContext';
import { useProject } from './ProjectContext';
import { getPersonaResponse, Personas } from '../services/PersonaEngine';
import { ACCENT_GLOW_80, ACCENT_GLOW_60, COLOUR_WARN_GLOW_STRONG } from '../theme/tokens';

const AVATAR_MINIMISED_KEY = 'simplifii_avatar_minimised';

function RobotHead({ isSpeaking, personaKey, boundarySignal, isLiteralMode }) {
  const meshRef = useRef();
  const mouthRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();

  // Pick color based on persona
  const isHardcore = personaKey === 'Hardcore';
  const isSocratic = personaKey === 'Socratic';
  
  const mainColor = isHardcore ? '#EF4444' : isSocratic ? '#3B82F6' : '#10B981'; // Red, Blue, Emerald
  const speakingColor = '#F59E0B'; // Amber

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // Idle animation (calm in literal mode)
    if (meshRef.current) {
      const idleMultiplier = isLiteralMode ? 0.05 : 1;
      meshRef.current.position.y = Math.sin(t * 2) * 0.1 * idleMultiplier;
      meshRef.current.rotation.y = Math.sin(t * 0.5) * 0.2 * idleMultiplier;
    }

    // Eye blinking
    const blink = Math.sin(t * 5) > 0.95 ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = blink;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = blink;

    // Speaking animation
    if (mouthRef.current) {
      if (isSpeaking && boundarySignal > 0) {
        // Pulse based on boundary word length
        mouthRef.current.scale.y = 1 + (boundarySignal * 0.3) + Math.abs(Math.sin(t * 20)) * 1.5;
        mouthRef.current.material.color.set(speakingColor);
      } else if (isSpeaking) {
        // Base speaking animation
        mouthRef.current.scale.y = 1 + Math.abs(Math.sin(t * 15)) * 1.5;
        mouthRef.current.material.color.set(speakingColor);
      } else {
        mouthRef.current.scale.y = 1;
        mouthRef.current.material.color.set(mainColor);
      }
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main Head */}
      <mesh>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#07080D" wireframe={isHardcore} />
      </mesh>
      
      {/* Wireframe Outline (if not hardcore) */}
      {!isHardcore && (
        <mesh>
          <boxGeometry args={[2.05, 2.05, 2.05]} />
          <meshBasicMaterial color={mainColor} wireframe={true} />
        </mesh>
      )}

      {/* Eyes */}
      <mesh ref={leftEyeRef} position={[-0.5, 0.2, 1.01]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.5, 0.2, 1.01]}>
        <boxGeometry args={[0.3, 0.3, 0.1]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, -0.5, 1.01]}>
        <boxGeometry args={[0.8, 0.1, 0.1]} />
        <meshBasicMaterial color={mainColor} />
      </mesh>
    </group>
  );
}

export default function AIAvatar({ eventType, isLiteralMode, onClick }) {
  const { persona } = useSettings();
  const { profile, courses } = useProject();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayMessage, setDisplayMessage] = useState('');
  const [boundarySignal, setBoundarySignal] = useState(0);

  // Mount speech. Two greetings:
  //   - Zero state (no courses yet): 'Sovereign state cleared. Ready for
  //     fresh Handshake.' so the student knows the cockpit is awaiting
  //     a syllabus and not displaying stale data.
  //   - Loaded state (one or more courses): the existing 'Sovereign
  //     engine active' greeting with the student's name.
  useEffect(() => {
    const displayName = (profile?.name || '').trim() || 'Sovereign User';
    const hasCourses = courses && Object.keys(courses).length > 0;
    const msg = hasCourses
      ? `Sovereign engine active, ${displayName}. My neural loops are running locally on your device, no trials, no timeouts.`
      : `Sovereign state cleared. Ready for fresh Handshake, ${displayName}.`;
    setDisplayMessage(msg);
    setIsSpeaking(true);
    
    const handleBoundary = (event) => {
      if (event.name === 'word') {
        setBoundarySignal(event.charLength);
        setTimeout(() => setBoundarySignal(0), 100);
      }
    };

    speakSystemMessage(msg, () => setIsSpeaking(false), 1, 0.9, handleBoundary);
  }, []);

  useEffect(() => {
    if (eventType) {
      const responseText = getPersonaResponse(persona, eventType);
      setDisplayMessage(responseText);
      setIsSpeaking(true);
      
      const p = Personas[persona];
      
      const handleBoundary = (event) => {
        if (event.name === 'word') {
          setBoundarySignal(event.charLength);
          setTimeout(() => setBoundarySignal(0), 100);
        }
      };

      speakSystemMessage(
        responseText, 
        () => setIsSpeaking(false), 
        p.speechRate, 
        0.9, 
        handleBoundary
      );
    }
  }, [eventType, persona]);

  const [minimised, setMinimised] = useState(() => {
    try { return localStorage.getItem(AVATAR_MINIMISED_KEY) === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(AVATAR_MINIMISED_KEY, String(minimised)); }
    catch { /* storage unavailable, ignore */ }
  }, [minimised]);

  // Reasoning pulse. RewriteService dispatches simplifii:reasoning-start and
  // simplifii:reasoning-end on window. While reasoning is active we double
  // the pulse rate on the Neural Dot and add a glow ring on the expanded
  // avatar so the student feels the OS is thinking.
  const [isReasoning, setIsReasoning] = useState(false);
  useEffect(() => {
    const onStart = () => setIsReasoning(true);
    const onEnd = () => setIsReasoning(false);
    window.addEventListener('simplifii:reasoning-start', onStart);
    window.addEventListener('simplifii:reasoning-end', onEnd);
    return () => {
      window.removeEventListener('simplifii:reasoning-start', onStart);
      window.removeEventListener('simplifii:reasoning-end', onEnd);
    };
  }, []);

  if (minimised) {
    return (
      <button
        type="button"
        aria-label={isReasoning ? 'AURA Assistant reasoning' : 'Expand AURA Assistant'}
        onClick={(e) => { e.stopPropagation(); setMinimised(false); }}
        className={`relative w-4 h-4 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 group ${isReasoning ? 'bg-emerald-400' : 'bg-emerald-500'}`}
        style={{ boxShadow: isReasoning ? `0 0 22px ${ACCENT_GLOW_80}` : `0 0 14px ${ACCENT_GLOW_80}` }}
      >
        <span
          className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75"
          style={{ animationDuration: isReasoning ? '0.5s' : '1s' }}
          aria-hidden="true"
        ></span>
        <span className="sr-only">{isReasoning ? 'AURA is reasoning.' : 'Neural Dot. Click to restore the assistant.'}</span>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[8px] font-black uppercase tracking-widest text-emerald-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {isReasoning ? 'THINKING' : 'AURA'}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full group relative">
      <button
        type="button"
        aria-label="Minimise AURA Assistant to Neural Dot"
        onClick={(e) => { e.stopPropagation(); setMinimised(true); }}
        className="absolute -top-1 -right-1 z-10 w-6 h-6 rounded-full bg-zinc-900/90 border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <Minimize2 size={12} />
      </button>
      <div onClick={onClick} className="flex flex-col items-center justify-center w-full cursor-pointer hover:scale-105 transition-transform">
        <div className={`relative w-full h-32 border rounded-xl overflow-hidden bg-black shadow-2xl transition-colors ${isReasoning ? 'border-emerald-400 animate-pulse' : 'border-zinc-800/50 group-hover:border-emerald-500/50'}`}
          style={isReasoning ? { animationDuration: '1s', boxShadow: `0 0 30px ${ACCENT_GLOW_60}` } : undefined}>
          <Canvas
            camera={{ position: [0, 0, 4] }}
            gl={{ antialias: false, powerPreference: 'low-power' }}
            onCreated={({ gl }) => {
              // Sprint 8.3: handle WebGL context loss gracefully instead of
              // crashing. Restore automatically when the GPU recovers.
              const canvas = gl.domElement;
              canvas.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                if (typeof console !== 'undefined') console.warn('[AIAvatar] WebGL context lost, waiting for restore');
              });
              canvas.addEventListener('webglcontextrestored', () => {
                if (typeof console !== 'undefined') console.info('[AIAvatar] WebGL context restored');
              });
            }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <RobotHead isSpeaking={isSpeaking} personaKey={persona} boundarySignal={boundarySignal} isLiteralMode={isLiteralMode} />
          </Canvas>

          {isSpeaking && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" style={{ boxShadow: `0 0 10px ${COLOUR_WARN_GLOW_STRONG}` }}></div>
          )}
        </div>

        <div className="mt-2 text-center min-h-[3rem] flex items-center justify-center px-2 bg-black/80 backdrop-blur-md rounded-lg border border-zinc-800/50 w-full">
          {displayMessage ? (
            <p className="text-[9px] font-bold text-zinc-300 italic leading-snug line-clamp-3">"{displayMessage}"</p>
          ) : (
            <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">
              SYSTEM ONLINE
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
