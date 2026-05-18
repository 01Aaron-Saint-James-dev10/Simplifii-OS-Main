import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAccessibility } from '../contexts/AccessibilityContext';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import axios from 'axios';
import { CheckCircle2, Circle, Download, Loader2, Sparkles, ChevronRight, FileDown, BookOpen, Lightbulb, ExternalLink } from 'lucide-react';

const Results = () => {
  const { briefId } = useParams();
  const { cognitiveMode, setCognitiveMode, fontSize } = useAccessibility();
  const [brief, setBrief] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({});
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showOverwhelmModal, setShowOverwhelmModal] = useState(false);
  const [breakingDownTask, setBreakingDownTask] = useState(null);
  const idleTimerRef = useRef(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrief = async () => {
      try {
        const response = await axios.get(`${API}/briefs/${briefId}`, {
          withCredentials: true
        });
        setBrief(response.data);
        setProgress(response.data.progress || {});
      } catch (err) {
        console.error('Failed to fetch brief:', err);
        navigate('/brief-simplifier');
      } finally {
        setLoading(false);
      }
    };

    fetchBrief();
  }, [briefId, API, navigate]);

  // Overwhelm detection - 3 minute idle timer
  useEffect(() => {
    const resetIdleTimer = () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      idleTimerRef.current = setTimeout(() => {
        setShowOverwhelmModal(true);
      }, 3 * 60 * 1000); // 3 minutes
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  const handleTaskToggle = async (taskKey) => {
    const newProgress = { ...progress, [taskKey]: !progress[taskKey] };
    setProgress(newProgress);

    try {
      await axios.post(`${API}/briefs/progress`, {
        brief_id: briefId,
        task_key: taskKey,
        completed: newProgress[taskKey]
      }, { withCredentials: true });
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleBreakDown = async (task, taskKey) => {
    setBreakingDownTask(taskKey);
    try {
      const response = await axios.post(`${API}/briefs/break-down`, {
        task: task
      }, { withCredentials: true });

      const microSteps = response.data.microSteps;
      const updatedBrief = { ...brief };
      
      // Find and update the task in the weekly plan
      Object.keys(updatedBrief.output_json.weeklyPlan).forEach(phase => {
        updatedBrief.output_json.weeklyPlan[phase] = updatedBrief.output_json.weeklyPlan[phase].map(taskObj => {
          if (taskObj.task === task) {
            return { ...taskObj, microSteps: microSteps };
          }
          return taskObj;
        });
      });

      setBrief(updatedBrief);
    } catch (err) {
      console.error('Failed to break down task:', err);
    } finally {
      setBreakingDownTask(null);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.get(`${API}/briefs/export/${briefId}/${format}`, {
        withCredentials: true,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${brief.assessment_title}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navigation />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 size={48} className="animate-spin text-[#007C8C]" />
        </div>
      </div>
    );
  }

  if (!brief) return null;

  const output = brief.output_json;
  const weeklyPlan = output.weeklyPlan || {};

  // Collect all tasks for cognitive modes
  const allTasks = [];
  Object.entries(weeklyPlan).forEach(([phase, tasks]) => {
    tasks.forEach(taskObj => {
      allTasks.push({ phase, ...taskObj });
    });
  });

  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalTasks = allTasks.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  // Cognitive Mode Rendering
  const CognitiveModeSwitch = () => (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-xl mb-6" data-testid="cognitive-mode-switcher">
      {[
        { id: 'standard', label: 'Standard' },
        { id: 'focus', label: 'Focus' },
        { id: 'read-easy', label: 'Read Easy' },
        { id: 'calm', label: 'Calm' },
        { id: 'step-by-step', label: 'Step by Step' }
      ].map(mode => (
        <button
          key={mode.id}
          data-testid={`mode-${mode.id}`}
          onClick={() => setCognitiveMode(mode.id)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 min-h-[44px] ${
            cognitiveMode === mode.id
              ? 'bg-[#007C8C] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );

  const TaskItem = ({ task, taskKey, phase }) => (
    <div className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-[#007C8C] transition-all duration-200" data-testid={`task-${taskKey}`}>
      <button
        onClick={() => handleTaskToggle(taskKey)}
        className="flex-shrink-0 mt-1 focus-visible:ring-2 focus-visible:ring-[#007C8C] focus-visible:ring-offset-2 rounded"
        data-testid={`task-checkbox-${taskKey}`}
      >
        {progress[taskKey] ? (
          <CheckCircle2 size={24} className="text-[#007C8C]" />
        ) : (
          <Circle size={24} className="text-gray-300" />
        )}
      </button>
      <div className="flex-1">
        <div className={`font-medium ${progress[taskKey] ? 'line-through text-gray-400' : 'text-gray-900'}`}>
          {task.task}
        </div>
        {task.microSteps && task.microSteps.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {task.microSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <ChevronRight size={16} className="flex-shrink-0 mt-0.5 text-[#007C8C]" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          onClick={() => handleBreakDown(task.task, taskKey)}
          disabled={breakingDownTask === taskKey}
          className="mt-2 text-sm text-[#007C8C] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#007C8C] focus-visible:ring-offset-2 rounded"
          data-testid={`break-down-btn-${taskKey}`}
        >
          {breakingDownTask === taskKey ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Breaking down...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Break it down more
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${cognitiveMode === 'read-easy' ? 'bg-[#FDFBF7]' : 'bg-[#FAFAFA]'} ${fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'}`}>
      <Navigation />
      <AccessibilityToolbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className={`${fontSize === 'small' ? 'text-3xl' : fontSize === 'large' ? 'text-5xl' : 'text-4xl'} font-bold text-gray-900 mb-4`}
            style={{ fontFamily: 'Outfit' }}
            data-testid="results-title"
          >
            {brief.assessment_title}
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className="px-4 py-2 bg-[#E5F2F4] text-[#007C8C] rounded-lg font-medium">
              {brief.assessment_type}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#007C8C] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                  data-testid="progress-bar"
                />
              </div>
              <span className="text-sm text-gray-600">{completedCount}/{totalTasks} tasks</span>
            </div>
          </div>
        </div>

        {/* Cognitive Mode Switcher */}
        <CognitiveModeSwitch />

        {/* Calm Mode Banner */}
        {cognitiveMode === 'calm' && (
          <div className="mb-6 p-4 bg-[#E5F2F4] border border-[#007C8C] rounded-xl text-center" data-testid="calm-banner">
            <p className="text-[#007C8C] font-medium">You've got this. One step at a time. 🌿</p>
          </div>
        )}

        {/* Focus Mode - One Task at a Time */}
        {cognitiveMode === 'focus' && allTasks.length > 0 && (
          <div data-testid="focus-mode-view">
            <div className="bg-white rounded-2xl border-2 border-[#007C8C] p-8 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'Outfit' }}>
                Current Task ({currentTaskIndex + 1} of {allTasks.length})
              </h2>
              <TaskItem 
                task={allTasks[currentTaskIndex]} 
                taskKey={`task_${currentTaskIndex}`}
                phase={allTasks[currentTaskIndex].phase}
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentTaskIndex(Math.max(0, currentTaskIndex - 1))}
                disabled={currentTaskIndex === 0}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous Task
              </button>
              <button
                onClick={() => setCurrentTaskIndex(Math.min(allTasks.length - 1, currentTaskIndex + 1))}
                disabled={currentTaskIndex === allTasks.length - 1}
                className="flex-1 px-6 py-3 bg-[#007C8C] hover:bg-[#006473] text-white font-medium rounded-xl transition-all duration-200 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="next-task-btn"
              >
                Next Task
              </button>
            </div>
          </div>
        )}

        {/* Step by Step Mode */}
        {cognitiveMode === 'step-by-step' && allTasks.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#007C8C] p-8" data-testid="step-by-step-view">
            <h2 className="text-3xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Outfit' }}>
              What do I do right now?
            </h2>
            <TaskItem 
              task={allTasks.find((_, idx) => !progress[`task_${idx}`]) || allTasks[0]} 
              taskKey={`task_${allTasks.findIndex((_, idx) => !progress[`task_${idx}`])}`}
            />
          </div>
        )}

        {/* Standard and Read Easy Modes - Full View */}
        {(cognitiveMode === 'standard' || cognitiveMode === 'read-easy') && (
          <div className={cognitiveMode === 'read-easy' ? 'leading-loose' : ''}>
            {/* Simple Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Outfit' }}>
                Simple Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">{output.simpleSummary}</p>
            </div>

            {/* Weekly Plan */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6" data-testid="weekly-plan">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'Outfit' }}>
                Week-by-Week Plan
              </h2>
              {Object.entries(weeklyPlan).map(([phase, tasks]) => (
                <div key={phase} className="mb-6 last:mb-0">
                  <h3 className="text-lg font-semibold text-[#007C8C] mb-3" style={{ fontFamily: 'Outfit' }}>
                    {phase.replace('OfWeek', ' of Week').replace('throughout', 'Throughout ')}
                  </h3>
                  <div className="space-y-3">
                    {tasks.map((task, idx) => (
                      <TaskItem 
                        key={`${phase}_${idx}`} 
                        task={task} 
                        taskKey={`${phase}_${idx}`}
                        phase={phase}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Glossary */}
            {output.glossary && output.glossary.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6" data-testid="glossary-section">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                  <BookOpen size={24} className="text-[#007C8C]" />
                  Glossary
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {output.glossary.map((item, idx) => (
                    <div key={idx} className="p-4 bg-[#FAFAFA] rounded-lg">
                      <div className="font-semibold text-[#007C8C] mb-1">{item.term}</div>
                      <div className="text-gray-700 text-sm">{item.definition}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Requirements */}
            {output.keyRequirements && output.keyRequirements.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'Outfit' }}>
                  Key Requirements
                </h2>
                <ul className="space-y-2">
                  {output.keyRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5 text-[#007C8C]" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tools & Resources */}
            {output.tools && output.tools.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 mb-6" data-testid="tools-section">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2" style={{ fontFamily: 'Outfit' }}>
                  <Lightbulb size={24} className="text-[#007C8C]" />
                  Helpful Tools & Resources
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {output.tools.map((tool, idx) => (
                    <a
                      key={idx}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:border-[#007C8C] transition-all duration-200"
                    >
                      <ExternalLink size={20} className="flex-shrink-0 mt-0.5 text-[#007C8C]" />
                      <div>
                        <div className="font-medium text-gray-900">{tool.name}</div>
                        <div className="text-sm text-gray-600">{tool.description}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Helpful Tips */}
            {output.helpfulTips && output.helpfulTips.length > 0 && (
              <div className="bg-gradient-to-br from-[#E5F2F4] to-white rounded-2xl border border-gray-200 p-8 mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6" style={{ fontFamily: 'Outfit' }}>
                  Helpful Tips
                </h2>
                <ul className="space-y-3">
                  {output.helpfulTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Sparkles size={20} className="flex-shrink-0 mt-0.5 text-[#007C8C]" />
                      <span className="text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Export Buttons */}
        {(cognitiveMode === 'standard' || cognitiveMode === 'read-easy') && (
          <div className="flex gap-4 mt-8">
            <button
              onClick={() => handleExport('pdf')}
              data-testid="export-pdf-btn"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#007C8C] text-[#007C8C] hover:bg-[#E5F2F4] font-medium rounded-xl transition-all duration-200 min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#007C8C] focus-visible:ring-offset-2"
            >
              <Download size={20} />
              Export as PDF
            </button>
            <button
              onClick={() => handleExport('docx')}
              data-testid="export-docx-btn"
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-[#007C8C] text-[#007C8C] hover:bg-[#E5F2F4] font-medium rounded-xl transition-all duration-200 min-h-[48px] focus-visible:ring-2 focus-visible:ring-[#007C8C] focus-visible:ring-offset-2"
            >
              <FileDown size={20} />
              Export as Word
            </button>
          </div>
        )}
      </div>

      {/* Overwhelm Detection Modal */}
      {showOverwhelmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4" data-testid="overwhelm-modal">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Outfit' }}>
              Feeling overwhelmed?
            </h3>
            <p className="text-gray-700 mb-6">
              That's completely normal. Let's just do one thing right now.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCognitiveMode('step-by-step');
                  setShowOverwhelmModal(false);
                }}
                className="flex-1 px-6 py-3 bg-[#007C8C] hover:bg-[#006473] text-white font-medium rounded-xl transition-all duration-200 min-h-[48px]"
                data-testid="show-next-step-btn"
              >
                Show me the next step only
              </button>
              <button
                onClick={() => setShowOverwhelmModal(false)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200 min-h-[48px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
