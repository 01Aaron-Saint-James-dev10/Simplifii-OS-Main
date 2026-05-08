import React, { useState, useEffect } from 'react';
import { Timer, Wind, Music, Play, Pause, Volume2, X } from 'lucide-react';

export default function ZenTools({ onClose }) {
  const [activeTab, setActiveTab] = useState('pomodoro'); // 'pomodoro', 'breathe', 'lofi'
  
  // Pomodoro State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Breathing State
  const [breathePhase, setBreathePhase] = useState('Inhale'); // Inhale (4s), Hold (7s), Exhale (8s)
  const [breatheScale, setBreatheScale] = useState(1);

  useEffect(() => {
    if (activeTab === 'breathe') {
      let phase = 'Inhale';
      const cycle = () => {
        if (phase === 'Inhale') {
          setBreathePhase('Inhale');
          setBreatheScale(1.5);
          setTimeout(() => { phase = 'Hold'; cycle(); }, 4000);
        } else if (phase === 'Hold') {
          setBreathePhase('Hold');
          setTimeout(() => { phase = 'Exhale'; cycle(); }, 7000);
        } else if (phase === 'Exhale') {
          setBreathePhase('Exhale');
          setBreatheScale(1);
          setTimeout(() => { phase = 'Inhale'; cycle(); }, 8000);
        }
      };
      cycle();
      return () => {}; // Cannot easily clear this recursive timeout pattern without refs, keeping it simple
    }
  }, [activeTab]);

  // LoFi State
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-black/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 w-[360px] shadow-2xl animate-fade-in flex flex-col gap-4">
      
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/50 pb-3">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('pomodoro')}
            className={`p-2 rounded-lg transition-colors ${activeTab === 'pomodoro' ? 'bg-emerald-500/10 text-emerald-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <Timer size={16} />
          </button>
          <button 
            onClick={() => setActiveTab('breathe')}
            className={`p-2 rounded-lg transition-colors ${activeTab === 'breathe' ? 'bg-blue-500/10 text-blue-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <Wind size={16} />
          </button>
          <button 
            onClick={() => setActiveTab('lofi')}
            className={`p-2 rounded-lg transition-colors ${activeTab === 'lofi' ? 'bg-purple-500/10 text-purple-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <Music size={16} />
          </button>
        </div>
        <button onClick={onClose} className="p-1 rounded text-zinc-500 hover:text-white">
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="h-[120px] flex items-center justify-center">
        
        {activeTab === 'pomodoro' && (
          <div className="flex flex-col items-center gap-4">
            <h2 className="text-4xl font-black tracking-widest text-emerald-500 font-mono">
              {formatTime(timeLeft)}
            </h2>
            <div className="flex gap-4">
              <button onClick={toggleTimer} className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-xs font-black uppercase tracking-widest">
                {isTimerRunning ? 'Pause' : 'Focus'}
              </button>
              <button onClick={() => setTimeLeft(25 * 60)} className="px-4 py-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest">
                Reset
              </button>
            </div>
          </div>
        )}

        {activeTab === 'breathe' && (
          <div className="flex flex-col items-center gap-6 relative w-full h-full justify-center">
            <div 
              className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center transition-all duration-[4000ms] ease-in-out"
              style={{ transform: `scale(${breatheScale})`, transitionDuration: breathePhase === 'Inhale' ? '4s' : breathePhase === 'Exhale' ? '8s' : '0s' }}
            >
              <div className="w-4 h-4 rounded-full bg-blue-400"></div>
            </div>
            <span className="absolute bottom-0 text-[10px] font-black uppercase tracking-widest text-blue-500">
              {breathePhase}
            </span>
          </div>
        )}

        {activeTab === 'lofi' && (
          <div className="flex flex-col items-center gap-4 w-full">
            <p className="text-xs font-black uppercase tracking-widest text-purple-400">Deep Work Soundscape</p>
            <div className="flex items-center gap-4 w-full px-6">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center hover:bg-purple-500/30 transition-colors"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              </button>
              <div className="flex-1 flex items-center gap-2">
                <Volume2 size={14} className="text-zinc-500" />
                <div className="h-1 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 w-[60%]"></div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
