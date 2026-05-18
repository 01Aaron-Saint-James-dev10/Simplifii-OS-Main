import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../contexts/AccessibilityContext';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import VoiceMode from '../components/VoiceMode';
import MindMapView from '../components/MindMapView';
import CelebrationManager from '../components/CelebrationManager';
import ShareCard from '../components/ShareCard';
import AmbientSound from '../components/AmbientSound';
import AiDisclaimer from '../components/AiDisclaimer';
import FeedbackWidget from '../components/FeedbackWidget';
import NextStepSuggestion from '../components/NextStepSuggestion';
import ToolOutputBar from '../components/ToolOutputBar';
import axios from 'axios';
import {
  CheckCircle2, Circle, Download, Loader2, Sparkles, ChevronRight, FileDown,
  BookOpen, Calendar, TrendingUp, BookMarked, GraduationCap, Target, Clock,
  FileText, Copy, Check, ArrowLeft, Plus, MessageCircle, X, Eye, Layers,
  Zap, Map, Globe, Volume2, Heart, Smile, Frown, AlertTriangle, Lightbulb, ExternalLink, Share2
} from 'lucide-react';

const weekColours = [
  { bg: 'bg-amber-500/5', border: 'border-amber-500/15', badge: 'bg-amber-500', text: 'text-amber-400', light: 'bg-amber-500/10', accent: '#f59e0b' },
  { bg: 'bg-cyan-500/5', border: 'border-cyan-500/15', badge: 'bg-cyan-500', text: 'text-cyan-400', light: 'bg-cyan-500/10', accent: '#06b6d4' },
  { bg: 'bg-emerald-500/5', border: 'border-emerald-500/15', badge: 'bg-emerald-500', text: 'text-emerald-400', light: 'bg-emerald-500/10', accent: '#10b981' },
  { bg: 'bg-orange-500/5', border: 'border-orange-500/15', badge: 'bg-orange-500', text: 'text-orange-400', light: 'bg-orange-500/10', accent: '#f97316' },
  { bg: 'bg-violet-500/5', border: 'border-violet-500/15', badge: 'bg-violet-500', text: 'text-violet-400', light: 'bg-violet-500/10', accent: '#8b5cf6' },
  { bg: 'bg-rose-500/5', border: 'border-rose-500/15', badge: 'bg-rose-500', text: 'text-rose-400', light: 'bg-rose-500/10', accent: '#f43f5e' },
];

const phaseLabels = {
  beginning: { label: 'Beginning of week', colour: 'text-amber-400', bg: 'bg-amber-500/10' },
  throughout: { label: 'Throughout week', colour: 'text-rose-400', bg: 'bg-rose-500/10' },
  end: { label: 'End of week', colour: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const ResultsPremium = () => {
  const { briefId } = useParams();
  const { cognitiveMode, fontSize } = useAccessibility();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [breakingDownTask, setBreakingDownTask] = useState(null);
  const [outputMode, setOutputMode] = useState('structured');
  const [citationStyle, setCitationStyle] = useState('harvard');
  const [copied, setCopied] = useState(null);
  const [showOverwhelmModal, setShowOverwhelmModal] = useState(false);
  const [guidanceLoading, setGuidanceLoading] = useState(null);
  const [guidanceOpen, setGuidanceOpen] = useState(null);
  const [guidanceText, setGuidanceText] = useState({});
  const [showVoice, setShowVoice] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('');
  const [showTranslate, setShowTranslate] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInMood, setCheckInMood] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInResponse, setCheckInResponse] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [shareCardData, setShareCardData] = useState(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const idleTimerRef = useRef(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const navigate = useNavigate();

  const fetchShareCard = async () => {
    try {
      const res = await axios.get(`${API}/share/card/${briefId}`, { withCredentials: true });
      setShareCardData(res.data);
      setShowShareCard(true);
    } catch (err) {
      console.error('Failed to fetch share card:', err);
    }
  };

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const response = await axios.get(`${API}/briefs/${briefId}`, { withCredentials: true });
        setBrief(response.data);
        setProgress(response.data.progress || {});
      } catch (err) {
        navigate('/brief-simplifier');
      } finally {
        setLoading(false);
      }
    };
    fetchBrief();
  }, [briefId, API, navigate]);

  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setShowOverwhelmModal(true), 3 * 60 * 1000);
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach(event => document.removeEventListener(event, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const handleTaskToggle = async (taskKey) => {
    const newProgress = { ...progress, [taskKey]: !progress[taskKey] };
    setProgress(newProgress);
    try {
      await axios.post(`${API}/briefs/progress`, { brief_id: briefId, task_key: taskKey, completed: newProgress[taskKey] }, { withCredentials: true });
    } catch (err) { console.error(err); }
  };

  const handleBreakDown = async (task, taskKey) => {
    setBreakingDownTask(taskKey);
    try {
      const response = await axios.post(`${API}/briefs/break-down`, { task }, { withCredentials: true });
      const microSteps = response.data.microSteps;
      const updatedBrief = { ...brief };
      // Handle both old and new format
      if (updatedBrief.output_json.weeks) {
        updatedBrief.output_json.weeks.forEach(week => {
          ['beginning', 'throughout', 'end'].forEach(phase => {
            if (week[phase]) {
              week[phase] = week[phase].map(t => t.task === task ? { ...t, microSteps } : t);
            }
          });
        });
      } else if (updatedBrief.output_json.weeklyPlan) {
        Object.keys(updatedBrief.output_json.weeklyPlan).forEach(phase => {
          updatedBrief.output_json.weeklyPlan[phase] = updatedBrief.output_json.weeklyPlan[phase].map(t =>
            t.task === task ? { ...t, microSteps } : t
          );
        });
      }
      setBrief(updatedBrief);
    } catch (err) { console.error(err); }
    setBreakingDownTask(null);
  };

  const handleAIGuidance = async (task, taskKey) => {
    if (guidanceOpen === taskKey) { setGuidanceOpen(null); return; }
    if (guidanceText[taskKey]) { setGuidanceOpen(taskKey); return; }
    setGuidanceLoading(taskKey);
    setGuidanceOpen(taskKey);
    try {
      const response = await axios.post(`${API}/briefs/ai-guidance`, { task, assessment_title: brief.assessment_title, assessment_type: brief.assessment_type }, { withCredentials: true });
      setGuidanceText(prev => ({ ...prev, [taskKey]: response.data.guidance }));
    } catch (err) {
      setGuidanceText(prev => ({ ...prev, [taskKey]: 'Unable to get guidance right now. Please try again.' }));
    }
    setGuidanceLoading(null);
  };

  const handleTranslate = async () => {
    if (!targetLang || !brief) return;
    setTranslating(true);
    try {
      const output = brief.output_json;
      const textToTranslate = output.simpleSummary + '\n\n' +
        (output.weeks ? output.weeks.map(w => `Week ${w.weekNumber}: ${w.theme}`).join('\n') :
          Object.entries(output.weeklyPlan || {}).map(([phase, tasks]) => `${phase}: ${tasks.map(t => t.task).join('; ')}`).join('\n'));
      const response = await axios.post(`${API}/translate`, { text: textToTranslate, target_language: targetLang }, { withCredentials: true });
      setTranslatedText(response.data.translated);
    } catch (err) { setTranslatedText('Translation failed. Please try again.'); }
    setTranslating(false);
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`${API}/briefs/export/${briefId}/${format}`, { withCredentials: true, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${brief.assessment_title}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error(err); }
  };

  const handleCheckIn = async () => {
    if (!checkInMood) return;
    setCheckInLoading(true);
    try {
      const response = await axios.post(`${API}/checkin`, { brief_id: briefId, mood: checkInMood, note: checkInNote }, { withCredentials: true });
      setCheckInResponse(response.data);
    } catch (err) {
      setCheckInResponse({ message: 'Thanks for checking in! Keep going.' });
    }
    setCheckInLoading(false);
  };

  const copyCitation = (citation, index) => {
    navigator.clipboard.writeText(citation);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  // Build task lists for both formats
  const getAllTasks = useCallback(() => {
    if (!brief) return [];
    const output = brief.output_json;
    const tasks = [];
    if (output.weeks) {
      output.weeks.forEach((week, wIdx) => {
        ['beginning', 'throughout', 'end'].forEach(phase => {
          (week[phase] || []).forEach((t, tIdx) => {
            tasks.push({ ...t, weekNumber: week.weekNumber, phase, taskKey: `w${wIdx}_${phase}_${tIdx}` });
          });
        });
      });
    } else if (output.weeklyPlan) {
      Object.entries(output.weeklyPlan).forEach(([phase, phaseTasks]) => {
        phaseTasks.forEach((t, idx) => {
          tasks.push({ ...t, phase, taskKey: `${phase}_${idx}` });
        });
      });
    }
    return tasks;
  }, [brief]);

  if (loading) return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 size={40} className="animate-spin text-emerald-500" />
      </div>
    </div>
  );

  if (!brief) return null;

  const output = brief.output_json || {};
  const hasWeeks = output.weeks && output.weeks.length > 0;
  const allTasks = getAllTasks();
  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const outputModes = [
    { id: 'structured', label: 'Weekly Plan', icon: Calendar, desc: 'Week-by-week' },
    { id: 'visual', label: 'Mind Map', icon: Map, desc: 'Visual overview' },
    { id: 'simplified', label: 'Simple', icon: Eye, desc: 'Plain English' },
    { id: 'deep', label: 'Deep', icon: BookOpen, desc: 'Full detail' },
    { id: 'interactive', label: 'Focus Mode', icon: Zap, desc: 'One task at a time' },
  ];

  const languages = [
    { code: 'Chinese (Simplified)', label: 'Chinese' }, { code: 'Hindi', label: 'Hindi' },
    { code: 'Arabic', label: 'Arabic' }, { code: 'Vietnamese', label: 'Vietnamese' },
    { code: 'Korean', label: 'Korean' }, { code: 'Japanese', label: 'Japanese' },
    { code: 'Indonesian', label: 'Indonesian' }, { code: 'Thai', label: 'Thai' },
    { code: 'Spanish', label: 'Spanish' }, { code: 'Portuguese', label: 'Portuguese' },
  ];

  const citationExamples = {
    harvard: { journal: "Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, volume(issue), pages.", book: "Author, A. A. (Year). Title of work. Publisher.", website: "Author, A. A. (Year, Month Day). Title of page. Website Name. URL" },
    apa: { journal: "Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, volume(issue), pages.", book: "Author, A. A. (Year). Title of work. Publisher.", website: "Author, A. A. (Year, Month Day). Title of page. Website Name. URL" },
    mla: { journal: 'Author. "Title." Journal, vol. #, no. #, Year, pp. ##-##.', book: "Author. Title. Publisher, Year.", website: 'Author. "Title." Site, Day Month Year, URL.' }
  };

  const nextUncompletedTask = allTasks.find(t => !progress[t.taskKey]);

  const moods = [
    { id: 'great', emoji: '🎉', label: 'Great', colour: 'emerald' },
    { id: 'okay', emoji: '👍', label: 'Okay', colour: 'blue' },
    { id: 'struggling', emoji: '😓', label: 'Struggling', colour: 'amber' },
    { id: 'overwhelmed', emoji: '😰', label: 'Overwhelmed', colour: 'rose' },
  ];

  // Render a single task item with checkbox, break-down, guidance
  const renderTask = (task, taskKey, celebrate, colourClass = 'text-emerald-400') => {
    const isChecked = !!progress[taskKey];
    return (
      <div key={taskKey} className={`group p-4 rounded-xl border transition-all duration-200 ${isChecked ? 'bg-emerald-500/[0.04] border-emerald-500/10' : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'}`} data-testid={`task-${taskKey}`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => { handleTaskToggle(taskKey); if (!isChecked) celebrate(); }}
            className="flex-shrink-0 mt-0.5"
            data-testid={`task-checkbox-${taskKey}`}
          >
            {isChecked
              ? <CheckCircle2 size={22} className="text-emerald-500" />
              : <Circle size={22} className="text-zinc-700 hover:text-zinc-500 transition-colors" />
            }
          </button>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium mb-1 ${isChecked ? 'line-through text-zinc-600' : 'text-white'}`}>
              {task.task}
            </div>
            {/* Sub-tasks */}
            {task.subTasks?.length > 0 && (
              <ul className="mt-2 space-y-1 ml-1">
                {task.subTasks.map((st, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-500">
                    <ChevronRight size={10} className={`flex-shrink-0 mt-1 ${colourClass}`} />
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            )}
            {/* Resources */}
            {task.resources?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-medium rounded-md hover:bg-blue-500/20 transition-colors">
                    <ExternalLink size={8} /> {r.name}
                  </a>
                ))}
              </div>
            )}
            {/* Micro-steps from break-down */}
            {task.microSteps?.length > 0 && (
              <ul className="mt-3 space-y-1.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                {task.microSteps.map((step, stepIdx) => (
                  <li key={stepIdx} className="flex items-start gap-2 text-xs text-zinc-400">
                    <Sparkles size={10} className="flex-shrink-0 mt-1 text-emerald-500" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
            {/* Guidance panel */}
            {guidanceOpen === taskKey && (
              <div className="mt-3 p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg" data-testid={`guidance-panel-${taskKey}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">AI Guidance</span>
                  <button onClick={() => setGuidanceOpen(null)} className="text-zinc-600 hover:text-zinc-400"><X size={12} /></button>
                </div>
                {guidanceLoading === taskKey ? <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 size={12} className="animate-spin" /> Thinking...</div> : <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{guidanceText[taskKey]}</p>}
              </div>
            )}
            {/* Action buttons */}
            <div className="flex gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleBreakDown(task.task, taskKey)} disabled={breakingDownTask === taskKey} className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-medium rounded-md hover:bg-emerald-500/20 transition-all disabled:opacity-50" data-testid={`break-down-btn-${taskKey}`}>
                {breakingDownTask === taskKey ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />} Break down
              </button>
              <button onClick={() => handleAIGuidance(task.task, taskKey)} className="flex items-center gap-1 px-2 py-1 bg-violet-500/10 text-violet-400 text-[10px] font-medium rounded-md hover:bg-violet-500/20 transition-all" data-testid={`ai-guidance-btn-${taskKey}`}>
                <MessageCircle size={10} /> Guidance
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <CelebrationManager>
      {({ celebrateStep: celebrate }) => (
        <div className={`min-h-screen bg-[#09090B] ${fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
          <Navigation />
          <AccessibilityToolbar />
          <AmbientSound />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Top Actions */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
              <button onClick={() => navigate('/brief-simplifier')} data-testid="back-to-briefs-btn" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                <ArrowLeft size={16} /> Back to Briefs
              </button>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowCheckIn(true)} data-testid="checkin-btn" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all">
                  <Heart size={14} /> Check In
                </button>
                <button onClick={() => setShowVoice(!showVoice)} data-testid="toggle-voice-btn" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showVoice ? 'bg-violet-500/20 text-violet-400' : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300'}`}>
                  <Volume2 size={14} /> Voice
                </button>
                <button onClick={() => setShowTranslate(!showTranslate)} data-testid="toggle-translate-btn" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${showTranslate ? 'bg-blue-500/20 text-blue-400' : 'bg-white/[0.04] text-zinc-500 hover:text-zinc-300'}`}>
                  <Globe size={14} /> Translate
                </button>
                <button onClick={() => navigate('/brief-simplifier')} data-testid="start-new-brief-btn" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg transition-all text-sm">
                  <Plus size={16} /> New Brief
                </button>
              </div>
            </div>

            {/* Check-In Modal */}
            {showCheckIn && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="checkin-modal">
                <div className="bg-[#111113] border border-white/[0.08] rounded-3xl p-8 max-w-md w-full shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>How are you going?</h3>
                    <button onClick={() => { setShowCheckIn(false); setCheckInResponse(null); setCheckInMood(''); setCheckInNote(''); }} className="text-zinc-600 hover:text-white"><X size={18} /></button>
                  </div>
                  {!checkInResponse ? (
                    <>
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        {moods.map(m => (
                          <button key={m.id} onClick={() => setCheckInMood(m.id)} data-testid={`mood-${m.id}`} className={`p-4 rounded-xl border-2 transition-all text-center ${checkInMood === m.id ? `border-${m.colour}-500/50 bg-${m.colour}-500/10` : 'border-white/[0.06] hover:border-white/[0.12]'}`}>
                            <div className="text-2xl mb-1">{m.emoji}</div>
                            <div className="text-[10px] text-zinc-400 font-medium">{m.label}</div>
                          </button>
                        ))}
                      </div>
                      <textarea value={checkInNote} onChange={e => setCheckInNote(e.target.value)} placeholder="Anything else on your mind? (optional)" className="w-full h-20 px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 text-sm resize-none mb-4" />
                      <button onClick={handleCheckIn} disabled={!checkInMood || checkInLoading} data-testid="submit-checkin-btn" className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all disabled:opacity-40 text-sm">
                        {checkInLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Submit Check-In'}
                      </button>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-4xl mb-4">{checkInMood === 'great' ? '🎉' : checkInMood === 'okay' ? '💪' : '💛'}</div>
                      <p className="text-zinc-300 leading-relaxed mb-4">{checkInResponse.message}</p>
                      {checkInResponse.suggestion && (
                        <p className="text-sm text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 mb-4">{checkInResponse.suggestion}</p>
                      )}
                      <button onClick={() => { setShowCheckIn(false); setCheckInResponse(null); setCheckInMood(''); setCheckInNote(''); if (checkInMood === 'great') celebrate(); }} className="px-6 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-xl text-sm">
                        Close
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Translation Panel */}
            {showTranslate && (
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 mb-6" data-testid="translate-panel">
                <div className="flex items-center gap-3 mb-4">
                  <Globe size={20} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Translate Your Plan</h3>
                </div>
                <div className="flex gap-3 mb-4">
                  <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="flex-1 px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500/40">
                    <option value="">Select language...</option>
                    {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <button onClick={handleTranslate} disabled={!targetLang || translating} className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-black font-medium rounded-lg text-sm transition-all disabled:opacity-40">
                    {translating ? <Loader2 size={14} className="animate-spin" /> : 'Translate'}
                  </button>
                </div>
                {translatedText && (
                  <div className="p-4 bg-[#09090B] border border-white/[0.06] rounded-xl max-h-60 overflow-y-auto">
                    <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">{translatedText}</p>
                  </div>
                )}
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <GraduationCap size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="results-title">
                    {brief.assessment_title}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-medium border border-emerald-500/20">{brief.assessment_type}</span>
                    {output.timeline && <span className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock size={14} />{output.timeline}</span>}
                    {output.dueDate && <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium"><Calendar size={14} />Due: {output.dueDate}</span>}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{progressPercent.toFixed(0)}% Complete</div>
                    <div className="text-xs text-zinc-500">{completedCount} of {totalTasks} tasks</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center"><div className="text-xl font-bold text-zinc-400">{totalTasks - completedCount}</div><div className="text-[10px] text-zinc-600 uppercase tracking-wider">Remaining</div></div>
                    <div className="text-center"><div className="text-xl font-bold text-emerald-400">{completedCount}</div><div className="text-[10px] text-zinc-600 uppercase tracking-wider">Done</div></div>
                  </div>
                </div>
                <div className="relative h-3 bg-[#1A1A1C] rounded-full overflow-hidden">
                  <div className="absolute h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500 rounded-full" style={{ width: `${progressPercent}%` }} data-testid="progress-bar" />
                </div>
              </div>
            </div>

            {/* Output Mode Selector */}
            <ToolOutputBar toolName="Brief Simplifier" onStartFresh={() => window.location.href = '/brief-simplifier'} />
            <div className="mb-6">
              <div className="flex flex-wrap gap-2" data-testid="output-mode-selector">
                {outputModes.map(mode => {
                  const Icon = mode.icon;
                  return (
                    <button key={mode.id} onClick={() => setOutputMode(mode.id)} data-testid={`mode-${mode.id}`}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${outputMode === mode.id ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#111113] text-zinc-500 border border-white/[0.06] hover:border-white/[0.1]'}`}>
                      <Icon size={16} /> {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ===== VISUAL MODE ===== */}
            {outputMode === 'visual' && (
              <div className="mb-6"><MindMapView briefData={brief} progress={progress} /></div>
            )}

            {/* ===== SIMPLIFIED MODE ===== */}
            {outputMode === 'simplified' && (
              <div className="space-y-4 mb-6">
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-8">
                  <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit' }}>Here's What You Need To Do</h2>
                  <p className="text-lg text-zinc-300 leading-relaxed">{output.simpleSummary}</p>
                </div>
                <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8">
                  <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Outfit' }}>Your Tasks (Simple List)</h3>
                  <ol className="space-y-3">
                    {allTasks.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-7 h-7 bg-emerald-500/10 text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold">{idx + 1}</span>
                        <span className="text-zinc-300 text-sm">{task.task}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* ===== INTERACTIVE / FOCUS MODE ===== */}
            {outputMode === 'interactive' && (
              <div className="mb-6">
                {nextUncompletedTask ? (
                  <div className="bg-[#111113] rounded-2xl border-2 border-emerald-500/20 p-10 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Zap size={32} className="text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>Focus on this one thing right now:</h2>
                    <p className="text-2xl text-emerald-300 font-medium mb-4">{nextUncompletedTask.task}</p>
                    {nextUncompletedTask.subTasks?.length > 0 && (
                      <div className="text-left max-w-md mx-auto mb-6">
                        {nextUncompletedTask.subTasks.map((st, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-zinc-400 mb-1">
                            <ChevronRight size={12} className="text-emerald-500 flex-shrink-0 mt-1" />
                            <span>{st}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-center gap-3">
                      <button onClick={() => { handleTaskToggle(nextUncompletedTask.taskKey); celebrate(); }} data-testid="complete-current-task" className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all text-sm">
                        <Check size={16} className="inline mr-2" /> Done! Next task
                      </button>
                      <button onClick={() => handleAIGuidance(nextUncompletedTask.task, nextUncompletedTask.taskKey)} className="px-6 py-3 bg-violet-500/10 text-violet-400 font-semibold rounded-xl hover:bg-violet-500/20 transition-all text-sm">
                        <MessageCircle size={16} className="inline mr-2" /> Help me
                      </button>
                    </div>
                    {guidanceOpen && guidanceText[guidanceOpen] && (
                      <div className="mt-6 p-5 bg-violet-500/5 border border-violet-500/10 rounded-xl text-left max-w-lg mx-auto">
                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{guidanceText[guidanceOpen]}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-10 text-center">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>All tasks completed!</h2>
                    <p className="text-zinc-400">Amazing work. You've finished everything on your action plan.</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== STRUCTURED & DEEP MODE ===== */}
            {(outputMode === 'structured' || outputMode === 'deep') && (
              <>
                {/* Summary */}
                {output.simpleSummary && (
                  <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 bg-violet-500/10 rounded-lg flex items-center justify-center"><Sparkles size={18} className="text-violet-400" /></div>
                      <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>What You Need To Do</h2>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{output.simpleSummary}</p>
                  </div>
                )}

                {/* Learning Objectives (Deep mode only) */}
                {outputMode === 'deep' && output.learningObjectives?.length > 0 && (
                  <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-blue-500/10 rounded-lg flex items-center justify-center"><TrendingUp size={18} className="text-blue-400" /></div>
                      <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Learning Objectives</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-3">
                      {output.learningObjectives.map((obj, idx) => (
                        <div key={idx} className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                          <div className="flex items-center gap-2 mb-2"><Target size={14} className="text-blue-400" /><span className="text-xs font-semibold text-blue-400 uppercase">Objective {idx + 1}</span></div>
                          <p className="text-sm text-zinc-300">{obj}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* NEW WEEK-BY-WEEK VISUAL PLAN */}
                {hasWeeks ? (
                  <div className="space-y-6 mb-6" data-testid="weekly-plan">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center"><Calendar size={18} className="text-cyan-400" /></div>
                      <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Your Week-by-Week Plan</h2>
                    </div>

                    {output.weeks.map((week, wIdx) => {
                      const colours = weekColours[wIdx % weekColours.length];
                      // Count tasks in this week
                      const weekTasks = ['beginning', 'throughout', 'end'].flatMap(p => (week[p] || []).map((t, tIdx) => `w${wIdx}_${p}_${tIdx}`));
                      const weekCompleted = weekTasks.filter(k => progress[k]).length;
                      const weekTotal = weekTasks.length;
                      const weekPercent = weekTotal > 0 ? (weekCompleted / weekTotal) * 100 : 0;

                      return (
                        <div key={wIdx} className={`${colours.bg} rounded-2xl border ${colours.border} overflow-hidden`} data-testid={`week-${wIdx}`}>
                          {/* Week header */}
                          <div className="p-6 pb-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 ${colours.badge} rounded-2xl flex items-center justify-center text-white flex-shrink-0`} style={{ fontFamily: 'Outfit' }}>
                                  <div className="text-center leading-none">
                                    <div className="text-[10px] uppercase font-bold opacity-80">Week</div>
                                    <div className="text-2xl font-black">{week.weekNumber}</div>
                                  </div>
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>{week.theme}</h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    {week.weekdaysUntilDue != null && (
                                      <span className={`text-xs font-medium ${colours.text}`}>
                                        {week.weekdaysUntilDue > 0 ? `${week.weekdaysUntilDue} weekdays until due` : 'Due this week!'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`text-sm font-bold ${colours.text}`}>{Math.round(weekPercent)}%</div>
                                <div className="text-[10px] text-zinc-600">{weekCompleted}/{weekTotal}</div>
                              </div>
                            </div>
                            {/* Week progress bar */}
                            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                              <div className={`h-full ${colours.badge} rounded-full transition-all duration-500`} style={{ width: `${weekPercent}%` }} />
                            </div>
                          </div>

                          {/* Phase sections */}
                          <div className="px-6 pb-6 space-y-4">
                            {['beginning', 'throughout', 'end'].map(phase => {
                              const tasks = week[phase] || [];
                              if (tasks.length === 0) return null;
                              const phaseInfo = phaseLabels[phase];
                              return (
                                <div key={phase}>
                                  <div className={`inline-flex items-center gap-2 px-3 py-1 ${phaseInfo.bg} rounded-lg mb-3`}>
                                    <span className={`text-xs font-bold ${phaseInfo.colour} uppercase tracking-wider`}>{phaseInfo.label}</span>
                                  </div>
                                  <div className="space-y-2">
                                    {tasks.map((task, tIdx) => {
                                      const taskKey = `w${wIdx}_${phase}_${tIdx}`;
                                      return renderTask(task, taskKey, celebrate, colours.text);
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* OLD FORMAT FALLBACK */
                  <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8 mb-6" data-testid="weekly-plan">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 bg-cyan-500/10 rounded-lg flex items-center justify-center"><Calendar size={18} className="text-cyan-400" /></div>
                      <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Your Week-by-Week Plan</h2>
                    </div>
                    {Object.entries(output.weeklyPlan || {}).map(([phase, tasks], phaseIdx) => (
                      <div key={phase} className="mb-8 last:mb-0">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-7 h-7 bg-cyan-500/10 rounded-lg flex items-center justify-center"><span className="text-cyan-400 text-xs font-bold">{phaseIdx + 1}</span></div>
                          <h3 className="text-lg font-semibold text-white" style={{ fontFamily: 'Outfit' }}>{phase.replace('OfWeek', ' of Week').replace('throughout', 'Throughout ')}</h3>
                        </div>
                        <div className="space-y-2 ml-10">
                          {tasks.map((task, idx) => {
                            const taskKey = `${phase}_${idx}`;
                            return renderTask(task, taskKey, celebrate);
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Helpful Tips */}
                {output.helpfulTips?.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb size={20} className="text-amber-400" />
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Helpful Tips</h3>
                    </div>
                    <ul className="space-y-2">
                      {output.helpfulTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                          <ChevronRight size={14} className="text-amber-400 flex-shrink-0 mt-1" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Final Checklist */}
                {output.finalChecklist?.length > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Final Submission Checklist</h3>
                    </div>
                    <ul className="space-y-2">
                      {output.finalChecklist.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-zinc-300">
                          <Circle size={14} className="text-emerald-500 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Glossary (Deep mode) */}
                {outputMode === 'deep' && output.glossary?.length > 0 && (
                  <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8 mb-6">
                    <h2 className="text-xl font-semibold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Glossary</h2>
                    <div className="grid md:grid-cols-2 gap-3">
                      {output.glossary.map((item, idx) => (
                        <div key={idx} className="p-4 bg-[#0D0D0F] border border-white/[0.04] rounded-xl">
                          <div className="text-sm font-bold text-emerald-400 mb-1">{item.term}</div>
                          <div className="text-xs text-zinc-400">{item.definition}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Citations */}
                <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8 mb-6" data-testid="citation-manager">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center"><BookMarked size={18} className="text-amber-400" /></div>
                    <h2 className="text-xl font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Citations & References</h2>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Style:</label>
                    <select value={citationStyle} onChange={(e) => setCitationStyle(e.target.value)} className="px-3 py-1.5 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm">
                      <option value="harvard">Harvard</option>
                      <option value="apa">APA</option>
                      <option value="mla">MLA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(citationExamples[citationStyle]).map(([type, citation], idx) => (
                      <div key={type} className="flex items-start gap-3 p-3 bg-[#0D0D0F] border border-white/[0.04] rounded-lg">
                        <FileText size={16} className="flex-shrink-0 mt-1 text-zinc-600" />
                        <div className="flex-1"><div className="text-xs font-semibold text-zinc-400 mb-1 capitalize">{type}</div><div className="text-xs text-zinc-500 font-mono">{citation}</div></div>
                        <button onClick={() => copyCitation(citation, idx)} className="flex-shrink-0 p-1.5 hover:bg-white/[0.04] rounded-lg transition-all">
                          {copied === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-600" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Export */}
            <div className="flex gap-3">
              <button onClick={() => handleExport('pdf')} data-testid="export-pdf-btn" className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all text-sm">
                <Download size={18} /> Export as PDF
              </button>
              <button onClick={() => handleExport('docx')} data-testid="export-docx-btn" className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-[#111113] border border-white/[0.08] text-white font-semibold rounded-xl hover:bg-[#18181B] transition-all text-sm">
                <FileDown size={18} /> Export as Word
              </button>
              <button onClick={fetchShareCard} data-testid="share-progress-btn" className="flex items-center justify-center gap-2 px-4 py-4 bg-[#111113] border border-white/[0.08] text-white font-semibold rounded-xl hover:bg-[#18181B] transition-all text-sm">
                <Share2 size={18} />
              </button>
            </div>

            <AiDisclaimer />
            <FeedbackWidget toolName="Brief Simplifier" sessionId={briefId} />
            <NextStepSuggestion toolName="Brief Simplifier" assessmentName={output?.assessment || brief?.assessment_title} />
          </div>

          {/* Voice Mode Widget */}
          {showVoice && <VoiceMode content={output} />}

          {/* Share Card Modal */}
          {showShareCard && shareCardData && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="share-card-modal" onClick={() => setShowShareCard(false)}>
              <div className="max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <ShareCard cardData={shareCardData} />
                <button onClick={() => setShowShareCard(false)} className="mt-3 w-full text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors">Close</button>
              </div>
            </div>
          )}

          {/* Overwhelm Modal */}
          {showOverwhelmModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="overwhelm-modal">
              <div className="bg-[#111113] border border-white/[0.08] rounded-3xl p-10 max-w-md w-full shadow-2xl">
                <h3 className="text-2xl font-bold text-white mb-3 text-center" style={{ fontFamily: 'Outfit' }}>Feeling overwhelmed?</h3>
                <p className="text-zinc-400 mb-8 text-center">That's completely normal. Let's just do one thing right now.</p>
                <div className="flex flex-col gap-3">
                  <button onClick={() => { setOutputMode('interactive'); setShowOverwhelmModal(false); }} className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all text-sm" data-testid="show-next-step-btn">
                    Show me the next step only
                  </button>
                  <button onClick={() => setShowOverwhelmModal(false)} className="px-6 py-3 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 font-medium rounded-xl transition-all text-sm">I'm okay, thanks</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </CelebrationManager>
  );
};

export default ResultsPremium;
