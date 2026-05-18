import React, { useState } from 'react';
import { Volume2, VolumeX, Loader2, Play, Pause, SkipForward } from 'lucide-react';

const VoiceMode = ({ content }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [utterance, setUtterance] = useState(null);

  const sections = [
    { name: 'Summary', text: content?.simpleSummary || '' },
    { name: 'Weekly Plan', text: generateWeeklyPlanText(content?.weeklyPlan) },
    { name: 'Key Requirements', text: content?.keyRequirements?.join('. ') || '' },
  ].filter(s => s.text);

  function generateWeeklyPlanText(weeklyPlan) {
    if (!weeklyPlan) return '';
    let text = '';
    Object.entries(weeklyPlan).forEach(([phase, tasks]) => {
      text += `${phase.replace('OfWeek', ' of week')}. `;
      tasks.forEach(task => { text += `${task.task}. `; });
    });
    return text;
  }

  const playSection = (sectionIndex) => {
    window.speechSynthesis.cancel();
    const section = sections[sectionIndex];
    if (!section) return;

    const utt = new SpeechSynthesisUtterance(section.text);
    utt.rate = speed;
    utt.lang = 'en-AU';
    utt.onend = () => {
      setIsPlaying(false);
      if (sectionIndex < sections.length - 1) {
        setCurrentSection(sectionIndex + 1);
        playSection(sectionIndex + 1);
      }
    };
    setUtterance(utt);
    setCurrentSection(sectionIndex);
    setIsPlaying(true);
    window.speechSynthesis.speak(utt);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
    } else {
      playSection(currentSection);
    }
  };

  const skipSection = () => {
    window.speechSynthesis.cancel();
    if (currentSection < sections.length - 1) {
      playSection(currentSection + 1);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  if (sections.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="voice-mode-widget">
      <div className="bg-[#111113]/95 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-2xl p-4 w-72">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center">
            <Volume2 size={18} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Outfit' }}>Voice Mode</h3>
            <p className="text-[10px] text-zinc-500">Listen to your plan</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-zinc-400">{sections[currentSection]?.name}</span>
            <span className="text-[10px] text-zinc-600">{currentSection + 1} / {sections.length}</span>
          </div>
          <div className="w-full h-1 bg-[#1A1A1C] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-300 rounded-full" style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-3">
          <button onClick={togglePlayPause} disabled={loading} className="w-10 h-10 bg-violet-500 hover:bg-violet-400 rounded-full flex items-center justify-center text-black transition-all disabled:opacity-50" data-testid="voice-play-pause">
            {loading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button onClick={skipSection} disabled={currentSection >= sections.length - 1} className="w-8 h-8 bg-white/[0.04] hover:bg-white/[0.08] rounded-full flex items-center justify-center text-zinc-400 transition-all disabled:opacity-30">
            <SkipForward size={14} />
          </button>
          <button onClick={stop} className="w-8 h-8 bg-white/[0.04] hover:bg-white/[0.08] rounded-full flex items-center justify-center text-zinc-400 transition-all">
            <VolumeX size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-600">Speed:</span>
          {[0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
            <button key={s} onClick={() => { setSpeed(s); if (utterance) utterance.rate = s; }}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-all ${speed === s ? 'bg-violet-500/20 text-violet-400' : 'bg-white/[0.04] text-zinc-600 hover:text-zinc-400'}`}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoiceMode;
