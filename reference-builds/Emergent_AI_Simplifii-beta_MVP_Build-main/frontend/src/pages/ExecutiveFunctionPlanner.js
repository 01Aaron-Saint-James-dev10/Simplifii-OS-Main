import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import GuidedTour from '../components/GuidedTour';
import TicketCostBar from '../components/TicketCostBar';
import AmbientSound from '../components/AmbientSound';
import { useAuth } from '../contexts/AuthContext';
import AiDisclaimer from '../components/AiDisclaimer';
import FeedbackWidget from '../components/FeedbackWidget';
import NextStepSuggestion from '../components/NextStepSuggestion';
import { exportToPdf } from '../components/PdfExport';
import axios from 'axios';
import { Timer, Play, Pause, RotateCcw, Plus, X, Check, Coffee, Brain, Zap, Calendar, Clock, AlertTriangle, Sparkles, ChevronRight, Loader2, Target, TrendingUp, ArrowRight, ArrowLeft, Upload, FileText, Download, HelpCircle } from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';

const execTourSteps = [
  { target: '[data-testid="pomodoro-timer"]', title: 'Pomodoro Timer', description: 'Use the timer to break study into focused chunks. 25 minutes on, 5 minutes break. Your brain will thank you.', position: 'bottom' },
  { target: '[data-testid="cognitive-load-tracker"]', title: 'Cognitive Load Tracker', description: 'Track how full your brain is feeling. We\'ll adjust recommendations based on your current load.', position: 'top' },
];

const ExecutiveFunctionPlanner = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('simplifii_ef_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [newTask, setNewTask] = useState('');
  const [pomodoroState, setPomodoroState] = useState('idle');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [pomodoroType, setPomodoroType] = useState('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [aiTip, setAiTip] = useState(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [showTimeBlocker, setShowTimeBlocker] = useState(false);
  const [importingBriefs, setImportingBriefs] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const timerRef = useRef(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    localStorage.setItem('simplifii_ef_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (pomodoroState === 'running') {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pomodoroState]);

  const handleTimerEnd = useCallback(() => {
    setPomodoroState('idle');
    if (pomodoroType === 'work') {
      setCompletedPomodoros(prev => prev + 1);
      if (activeTaskId) {
        setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, pomodoros: (t.pomodoros || 0) + 1 } : t));
      }
      const isLongBreak = (completedPomodoros + 1) % 4 === 0;
      setPomodoroType('break');
      setTimeLeft(isLongBreak ? 15 * 60 : 5 * 60);
    } else {
      setPomodoroType('work');
      setTimeLeft(25 * 60);
    }
  }, [pomodoroType, completedPomodoros, activeTaskId]);

  const addTask = (text, priority = 'medium', estimatedPomodoros = 2) => {
    const taskText = text || newTask;
    if (!taskText.trim()) return;
    setTasks(prev => [...prev, {
      id: Date.now().toString(),
      text: taskText,
      completed: false,
      pomodoros: 0,
      estimatedPomodoros,
      priority,
      day: selectedDay,
      timeBlock: null,
      createdAt: new Date().toISOString()
    }]);
    setNewTask('');
  };

  const toggleTask = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const removeTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));
  const updateTaskPriority = (id, priority) => setTasks(prev => prev.map(t => t.id === id ? { ...t, priority } : t));
  const updateTaskDay = (id, day) => setTasks(prev => prev.map(t => t.id === id ? { ...t, day } : t));
  const formatTime = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const startTimer = () => setPomodoroState('running');
  const pauseTimer = () => { setPomodoroState('paused'); clearInterval(timerRef.current); };
  const resetTimer = () => { setPomodoroState('idle'); clearInterval(timerRef.current); setTimeLeft(pomodoroType === 'work' ? 25 * 60 : 5 * 60); };

  const completedCount = tasks.filter(t => t.completed).length;
  const activeTasks = tasks.filter(t => !t.completed);
  const cognitiveLoad = activeTasks.length;
  const loadLevel = cognitiveLoad <= 3 ? 'low' : cognitiveLoad <= 6 ? 'moderate' : 'high';

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const priorityColors = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const getAIWeeklyPlan = async () => {
    if (tasks.length === 0) return;
    setLoadingPlan(true);
    try {
      const taskList = tasks.filter(t => !t.completed).map(t => `${t.text} (priority: ${t.priority})`).join('\n');
      const response = await axios.post(`${API}/briefs/ai-guidance`, {
        task: `Create a weekly study plan to distribute these tasks across the week. Consider priority levels and cognitive load. Here are the tasks:\n${taskList}`,
        assessment_title: 'Weekly Study Plan',
        assessment_type: 'Executive Function Planning'
      }, { withCredentials: true });
      setWeeklyPlan(response.data.guidance);
      await checkAuth();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(false);
    }
  };

  const getAICognitiveTip = async () => {
    setLoadingTip(true);
    try {
      const context = `Active tasks: ${cognitiveLoad}, Completed today: ${completedCount}, Pomodoros done: ${completedPomodoros}, Current load: ${loadLevel}`;
      const response = await axios.post(`${API}/briefs/ai-guidance`, {
        task: `Based on this student's current state: ${context}. Give ONE specific, actionable tip for managing their cognitive load right now. Be encouraging and brief.`,
        assessment_title: 'Cognitive Load Management',
        assessment_type: 'Executive Function Support'
      }, { withCredentials: true });
      setAiTip(response.data.guidance);
      await checkAuth();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTip(false);
    }
  };

  const importFromBriefs = async () => {
    setImportingBriefs(true);
    try {
      const response = await axios.get(`${API}/briefs/history`, { withCredentials: true });
      const briefs = response.data;
      const newTasks = [];
      briefs.slice(0, 3).forEach(brief => {
        const weeklyPlan = brief.output_json?.weeklyPlan;
        if (weeklyPlan) {
          Object.entries(weeklyPlan).forEach(([phase, phaseTasks]) => {
            phaseTasks.slice(0, 3).forEach(task => {
              newTasks.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                text: `[${brief.assessment_title}] ${task.task}`,
                completed: false,
                pomodoros: 0,
                estimatedPomodoros: 2,
                priority: 'medium',
                day: 'monday',
                createdAt: new Date().toISOString()
              });
            });
          });
        }
      });
      setTasks(prev => [...prev, ...newTasks]);
    } catch (err) {
      console.error(err);
    } finally {
      setImportingBriefs(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <GuidedTour steps={execTourSteps} storageKey="simplifii_tour_exec" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Executive Function Planner</h1>
              <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
            </div>
            <p className="text-lg text-zinc-400 mt-3">Your brain works differently — this planner works with it, not against it.</p>
            <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Executive Function Planner" />
          </div>
          <div className="flex gap-2">
            <AmbientSound />
            {tasks.length > 0 && (
              <button onClick={() => exportToPdf({
                studentName: user?.name, toolName: 'Executive Function Planner', date: new Date().toLocaleDateString('en-AU'),
                rawOutput: { tasks: tasks.map(t => ({ task: t.text, completed: t.done })), weeklyPlan: weeklyPlan || 'No AI plan generated yet' },
              })} data-testid="export-planner-btn" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all text-sm font-medium">
                <Download size={16} /> Export PDF
              </button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Timer + Cognitive Load + AI */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pomodoro Timer */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6 text-center">
              <div className="mb-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${pomodoroType === 'work' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                  {pomodoroType === 'work' ? <><Zap size={12} /> Focus Time</> : <><Coffee size={12} /> Break Time</>}
                </div>
              </div>
              <div className="text-6xl font-bold text-white mb-4 font-mono" style={{ fontFamily: 'Outfit' }} data-testid="pomodoro-timer">{formatTime(timeLeft)}</div>
              {activeTaskId && (
                <div className="mb-4 px-3 py-2 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                  <div className="text-[10px] text-zinc-500 uppercase">Working on</div>
                  <div className="text-xs text-violet-300 truncate">{tasks.find(t => t.id === activeTaskId)?.text}</div>
                </div>
              )}
              <div className="flex justify-center gap-3 mb-4">
                {pomodoroState === 'running' ? (
                  <button onClick={pauseTimer} data-testid="pause-timer-btn" className="w-12 h-12 bg-amber-500 hover:bg-amber-400 text-black rounded-full flex items-center justify-center transition-all"><Pause size={20} /></button>
                ) : (
                  <button onClick={startTimer} data-testid="start-timer-btn" className="w-12 h-12 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20"><Play size={20} className="ml-0.5" /></button>
                )}
                <button onClick={resetTimer} data-testid="reset-timer-btn" className="w-12 h-12 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 rounded-full flex items-center justify-center transition-all"><RotateCcw size={18} /></button>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {[1,2,3,4].map(i => (<div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i <= (completedPomodoros % 4) ? 'bg-emerald-500' : 'bg-white/[0.06]'}`} />))}
                <span className="ml-2 text-xs text-zinc-600">{completedPomodoros} done</span>
              </div>
            </div>

            {/* Cognitive Load Tracker */}
            <div className={`rounded-2xl p-5 border ${loadLevel === 'low' ? 'bg-emerald-500/5 border-emerald-500/10' : loadLevel === 'moderate' ? 'bg-amber-500/5 border-amber-500/10' : 'bg-red-500/5 border-red-500/10'}`} data-testid="cognitive-load-tracker">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain size={18} className={loadLevel === 'low' ? 'text-emerald-400' : loadLevel === 'moderate' ? 'text-amber-400' : 'text-red-400'} />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Cognitive Load</h3>
                </div>
                <button onClick={getAICognitiveTip} disabled={loadingTip} className="p-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg transition-all" title="Get AI tip" data-testid="get-ai-tip-btn">
                  {loadingTip ? <Loader2 size={14} className="animate-spin text-zinc-400" /> : <Sparkles size={14} className="text-zinc-500" />}
                </button>
              </div>
              <div className="flex items-end gap-3 mb-2">
                <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{cognitiveLoad}</div>
                <div className="text-xs text-zinc-600 mb-1">active tasks</div>
              </div>
              <div className="w-full h-2 bg-white/[0.04] rounded-full mb-2">
                <div className={`h-full rounded-full transition-all ${loadLevel === 'low' ? 'bg-emerald-500 w-1/3' : loadLevel === 'moderate' ? 'bg-amber-500 w-2/3' : 'bg-red-500 w-full'}`} />
              </div>
              <div className={`text-xs font-medium uppercase ${loadLevel === 'low' ? 'text-emerald-400' : loadLevel === 'moderate' ? 'text-amber-400' : 'text-red-400'}`}>
                {loadLevel} load {loadLevel === 'high' && '— consider parking some tasks for later'}
              </div>
              {aiTip && (
                <div className="mt-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]" data-testid="ai-tip">
                  <div className="text-[10px] text-emerald-400 uppercase font-semibold mb-1">AI Tip</div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{aiTip}</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><div className="text-xl font-bold text-emerald-400" style={{ fontFamily: 'Outfit' }}>{completedCount}</div><div className="text-[10px] text-zinc-600 uppercase">Done</div></div>
                <div><div className="text-xl font-bold text-zinc-400" style={{ fontFamily: 'Outfit' }}>{tasks.length - completedCount}</div><div className="text-[10px] text-zinc-600 uppercase">Left</div></div>
                <div><div className="text-xl font-bold text-violet-400" style={{ fontFamily: 'Outfit' }}>{completedPomodoros * 25}m</div><div className="text-[10px] text-zinc-600 uppercase">Focus</div></div>
              </div>
            </div>

            {/* AI Weekly Plan */}
            <div className="space-y-2">
              <TicketCostBar toolKey="planner" cost={1} />
              <button onClick={getAIWeeklyPlan} disabled={loadingPlan || tasks.length === 0 || ((user?.credits ?? 0) < 1 && !user?.is_owner)} data-testid="generate-weekly-plan-btn" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-xl hover:bg-violet-500/20 transition-all text-sm font-medium disabled:opacity-40">
                {loadingPlan ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> AI Weekly Plan</>}
              </button>
            </div>

            {weeklyPlan && (
              <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4" data-testid="weekly-plan-output">
                <h4 className="text-xs font-semibold text-violet-400 uppercase mb-2">AI Study Plan</h4>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{weeklyPlan}</p>
              </div>
            )}
          </div>

          {/* Right Column: Tasks + Weekly View */}
          <div className="lg:col-span-2 space-y-4">
            {/* Day Tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1" data-testid="day-tabs">
              {days.map(day => (
                <button key={day} onClick={() => setSelectedDay(day)} data-testid={`day-${day}`}
                  className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${selectedDay === day ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#111113] text-zinc-500 border border-white/[0.06] hover:text-zinc-300'}`}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                  <span className="ml-1.5 text-[10px] opacity-60">({tasks.filter(t => t.day === day && !t.completed).length})</span>
                </button>
              ))}
            </div>

            {/* Add Task */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
              <div className="flex gap-2 mb-3">
                <input data-testid="new-task-input" type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addTask()} placeholder={`Add a task for ${selectedDay}...`} className="flex-1 px-4 py-2.5 bg-[#09090B] border border-white/[0.08] rounded-lg text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 text-sm" />
                <button onClick={() => addTask()} data-testid="add-task-btn" className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all"><Plus size={16} /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={importFromBriefs} disabled={importingBriefs} data-testid="import-briefs-btn" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition-all disabled:opacity-40 border border-blue-500/20">
                  {importingBriefs ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Import from Briefs
                </button>
              </div>
            </div>

            {/* Task List for Selected Day */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white capitalize" style={{ fontFamily: 'Outfit' }}>{selectedDay}'s Tasks</h2>
                <span className="text-xs text-zinc-500">{tasks.filter(t => t.day === selectedDay).length} tasks</span>
              </div>

              {tasks.filter(t => t.day === selectedDay).length === 0 ? (
                <div className="text-center py-8">
                  <Calendar size={32} className="mx-auto text-zinc-700 mb-3" />
                  <p className="text-zinc-600 text-sm">No tasks for {selectedDay}. Add one above.</p>
                </div>
              ) : (
                <div className="space-y-2" data-testid="task-list">
                  {/* High priority first */}
                  {['high', 'medium', 'low'].map(priority => {
                    const priorityTasks = tasks.filter(t => t.day === selectedDay && t.priority === priority);
                    if (priorityTasks.length === 0) return null;
                    return (
                      <div key={priority}>
                        <div className="text-[10px] text-zinc-600 uppercase font-semibold mb-1.5 mt-3 first:mt-0">{priority} priority</div>
                        {priorityTasks.map(task => (
                          <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all mb-1.5 ${
                            task.completed ? 'bg-emerald-500/[0.03] border-emerald-500/10' :
                            activeTaskId === task.id ? 'bg-violet-500/5 border-violet-500/20 ring-1 ring-violet-500/20' :
                            'bg-[#0D0D0F] border-white/[0.04] hover:border-white/[0.08]'
                          }`} data-testid={`task-item-${task.id}`}>
                            <button onClick={() => toggleTask(task.id)} className="flex-shrink-0" data-testid={`toggle-task-${task.id}`}>
                              {task.completed ? <Check size={20} className="text-emerald-500" /> : <div className="w-5 h-5 rounded-full border-2 border-zinc-700 hover:border-zinc-500 transition-colors" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm block truncate ${task.completed ? 'line-through text-zinc-600' : 'text-white'}`}>{task.text}</span>
                              {task.pomodoros > 0 && <span className="text-[10px] text-zinc-600">{task.pomodoros} pomodoros done</span>}
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <select value={task.priority} onChange={(e) => updateTaskPriority(task.id, e.target.value)} className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityColors[task.priority]} bg-transparent`}>
                                <option value="high">High</option>
                                <option value="medium">Med</option>
                                <option value="low">Low</option>
                              </select>
                              <button onClick={() => setActiveTaskId(activeTaskId === task.id ? null : task.id)} className={`p-1.5 rounded-lg text-xs transition-all ${activeTaskId === task.id ? 'bg-violet-500/20 text-violet-400' : 'bg-white/[0.04] text-zinc-600 hover:text-zinc-400'}`} title="Focus on this task">
                                <Timer size={12} />
                              </button>
                              <button onClick={() => removeTask(task.id)} className="p-1 text-zinc-700 hover:text-red-400 transition-colors"><X size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly Overview */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
              <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Outfit' }}>Weekly Overview</h2>
              <div className="grid grid-cols-7 gap-2" data-testid="weekly-overview">
                {days.map(day => {
                  const dayTasks = tasks.filter(t => t.day === day);
                  const dayCompleted = dayTasks.filter(t => t.completed).length;
                  const dayTotal = dayTasks.length;
                  const pct = dayTotal > 0 ? (dayCompleted / dayTotal) * 100 : 0;
                  return (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`p-3 rounded-xl border text-center transition-all ${selectedDay === day ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/[0.04] bg-[#0D0D0F] hover:border-white/[0.08]'}`}>
                      <div className="text-[10px] text-zinc-500 uppercase font-medium mb-1">{day.slice(0, 3)}</div>
                      <div className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>{dayTotal}</div>
                      <div className="w-full h-1 bg-white/[0.04] rounded-full mt-1.5">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-[9px] text-zinc-600 mt-1">{dayCompleted}/{dayTotal}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Productivity Tips */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
              <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }}>Executive Function Tips</h3>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                  <Target size={16} className="text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-white mb-1">Start with a Win</h4>
                  <p className="text-[10px] text-zinc-500">Pick one small task you know you can finish. Momentum builds confidence.</p>
                </div>
                <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                  <Clock size={16} className="text-blue-400 mb-2" />
                  <h4 className="text-xs font-bold text-white mb-1">Time Boxing</h4>
                  <p className="text-[10px] text-zinc-500">Set a timer. Work only during the box. Then stop. Your brain thrives on structure.</p>
                </div>
                <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                  <Brain size={16} className="text-violet-400 mb-2" />
                  <h4 className="text-xs font-bold text-white mb-1">Body Doubling</h4>
                  <p className="text-[10px] text-zinc-500">Work alongside someone (even virtually). Many brains focus better with company.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AiDisclaimer />
        {tasks.length > 0 && <FeedbackWidget toolName="Executive Function Planner" sessionId={`planner_${Date.now()}`} />}
        {tasks.length > 0 && <NextStepSuggestion toolName="Executive Function Planner" />}
        <RecentToolOutputs toolName="Executive Function Planner" />
      </div>
    </div>
  );
};

export default ExecutiveFunctionPlanner;
