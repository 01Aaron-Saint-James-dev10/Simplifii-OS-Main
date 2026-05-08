import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Minimize2 } from 'lucide-react';
import { speakSystemMessage } from '../services/MessagingHub';
import { useSettings } from './SettingsContext';
import { getPersonaResponse, Personas } from '../services/PersonaEngine';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [displayMessage, setDisplayMessage] = useState('');
  const [boundarySignal, setBoundarySignal] = useState(0);

  // Emergency Directive Mount Speech
  useEffect(() => {
    const msg = "Sovereign engine active, Adonis. My neural loops are now running 100% locally on your Mac, no trials, no timeouts.";
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

  if (minimised) {
    return (
      <button
        type="button"
        aria-label="Expand AURA Assistant"
        onClick={(e) => { e.stopPropagation(); setMinimised(false); }}
        className="relative w-4 h-4 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.9)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400 group"
      >
        <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" aria-hidden="true"></span>
        <span className="sr-only">Neural Dot. Click to restore the assistant.</span>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[8px] font-black uppercase tracking-widest text-emerald-400 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          AURA
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
        <div className="relative w-full h-32 border border-zinc-800/50 rounded-xl overflow-hidden bg-black shadow-2xl group-hover:border-emerald-500/50 transition-colors">
          <Canvas camera={{ position: [0, 0, 4] }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <RobotHead isSpeaking={isSpeaking} personaKey={persona} boundarySignal={boundarySignal} isLiteralMode={isLiteralMode} />
          </Canvas>

          {isSpeaking && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></div>
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
