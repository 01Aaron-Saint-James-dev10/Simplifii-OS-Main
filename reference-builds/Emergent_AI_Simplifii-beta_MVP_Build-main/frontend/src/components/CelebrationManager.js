import React, { useState, useCallback, useRef, useEffect } from 'react';

const SECTION_MESSAGES = [
  "Section complete.",
  "Well done.",
  "That's the work.",
  "One section closer.",
];

const CelebrationManager = ({ children }) => {
  const [particles, setParticles] = useState([]);
  const [sectionMsg, setSectionMsg] = useState(null);
  const [fullComplete, setFullComplete] = useState(false);
  const canvasRef = useRef(null);
  const nextId = useRef(0);
  const prefersReduced = useRef(false);

  useEffect(() => {
    prefersReduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.body.classList.contains('reduce-motion');
  }, []);

  // Step completion: teal ripple from element
  const celebrateStep = useCallback((element) => {
    if (prefersReduced.current) return;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const id = nextId.current++;
    const p = { id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    setParticles(prev => [...prev, p]);
    setTimeout(() => setParticles(prev => prev.filter(pp => pp.id !== id)), 600);
  }, []);

  // Section completion: particle burst + message
  const celebrateSection = useCallback((element) => {
    if (prefersReduced.current) {
      const msg = SECTION_MESSAGES[Math.floor(Math.random() * SECTION_MESSAGES.length)];
      setSectionMsg(msg);
      setTimeout(() => setSectionMsg(null), 2000);
      return;
    }
    // Particle burst
    if (element) {
      const rect = element.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top;
      const newP = Array.from({ length: 12 }, (_, i) => ({
        id: nextId.current++,
        x: cx, y: cy,
        angle: (i / 12) * Math.PI * 2,
        _burst: true,
      }));
      setParticles(prev => [...prev, ...newP]);
      setTimeout(() => setParticles(prev => prev.filter(pp => !newP.find(n => n.id === pp.id))), 900);
    }
    // Message
    const msg = SECTION_MESSAGES[Math.floor(Math.random() * SECTION_MESSAGES.length)];
    setSectionMsg(msg);
    setTimeout(() => setSectionMsg(null), 2000);
  }, []);

  // Full tool completion
  const celebrateFull = useCallback(() => {
    setFullComplete(true);
    setTimeout(() => setFullComplete(false), 3500);
  }, []);

  return (
    <>
      {/* Step ripple effects */}
      {particles.filter(p => !p._burst).map(p => (
        <div key={p.id} className="fixed pointer-events-none z-[9999]" style={{ left: p.x - 20, top: p.y - 20 }}>
          <div className="w-10 h-10 rounded-full border-2 border-teal-400/40 animate-[rippleOut_0.4s_ease-out_forwards]" />
        </div>
      ))}

      {/* Section burst particles */}
      {particles.filter(p => p._burst).map(p => {
        const dx = Math.cos(p.angle) * 40;
        const dy = Math.sin(p.angle) * 40;
        return (
          <div key={p.id} className="fixed pointer-events-none z-[9999]" style={{ left: p.x, top: p.y }}>
            <div
              className="w-2 h-2 rounded-full animate-[burstParticle_0.8s_ease-out_forwards]"
              style={{
                backgroundColor: p.angle > Math.PI ? '#5eead4' : '#14b8a6',
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              }}
            />
          </div>
        );
      })}

      {/* Section completion message */}
      {sectionMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none">
          <div className="text-sm font-medium text-teal-400 animate-[fadeMsg_2s_ease-in-out_forwards]" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {sectionMsg}
          </div>
        </div>
      )}

      {/* Full completion overlay */}
      {fullComplete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none animate-[fullOverlay_3.5s_ease-in-out_forwards]">
          <div className="absolute inset-0 bg-teal-500/[0.15]" />
          <div className="relative bg-teal-600/90 backdrop-blur-sm px-10 py-8 rounded-2xl shadow-2xl text-center animate-[scaleIn_0.3s_ease-out]">
            <p className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>You've done the work.</p>
            <p className="text-sm text-teal-100">Now go show them what you're made of.</p>
          </div>
        </div>
      )}

      {typeof children === 'function' ? children({ celebrateStep, celebrateSection, celebrateFull }) : children}

      <style>{`
        @keyframes rippleOut {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes burstParticle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; }
        }
        @keyframes fadeMsg {
          0% { opacity: 0; transform: translateY(4px); }
          10% { opacity: 1; transform: translateY(0); }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes fullOverlay {
          0% { opacity: 0; }
          10% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tealSweep {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        @keyframes underlineDraw {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes ringPulse {
          0% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
          50% { box-shadow: 0 0 8px 3px rgba(20, 184, 166, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
        }
        .step-checked {
          background: linear-gradient(90deg, #14b8a6 50%, transparent 50%);
          background-size: 200% 100%;
          animation: tealSweep 0.3s ease-in-out forwards;
        }
        .step-underline::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          height: 1px;
          background: #14b8a6;
          animation: underlineDraw 0.2s ease-out forwards;
        }
        .ring-pulse {
          animation: ringPulse 0.6s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .step-checked { animation: none; background: #14b8a6; }
          .step-underline::after { animation: none; width: 100%; }
          .ring-pulse { animation: none; }
        }
        .reduce-motion .step-checked { animation: none; background: #14b8a6; }
        .reduce-motion .step-underline::after { animation: none; width: 100%; }
        .reduce-motion .ring-pulse { animation: none; }
      `}</style>
    </>
  );
};

export default CelebrationManager;
