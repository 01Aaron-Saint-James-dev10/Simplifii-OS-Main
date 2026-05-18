import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SUGGESTIONS = {
  'Brief Simplifier': {
    title: 'Now understand how you\'ll be marked',
    body: 'You know what to do. Find out exactly what your marker is looking for.',
    button: 'Open Rubric Simplifier',
    path: '/rubric-simplifier',
  },
  'Rubric Simplifier': {
    title: 'Got a draft? See how it scores',
    body: 'Use your rubric breakdown to get specific feedback on your writing.',
    button: 'Open Essay Scorer',
    path: '/essay-scorer',
  },
  'Humaniser': {
    title: 'Add this to your semester plan',
    body: 'Track this alongside all your other assessments.',
    button: 'Open Course Planner',
    path: '/course-planner',
  },
  'Assessment Scaffolder': {
    title: 'Start writing — then get feedback',
    body: 'Once you have a draft, bring it back for rubric-aligned scoring.',
    button: 'Open Essay Scorer',
    path: '/essay-scorer',
  },
  'Concept Visualiser': {
    title: 'Decode the hidden expectations',
    body: 'Now you understand the concept — find out what your marker really wants.',
    button: 'Open Hidden Curriculum Decoder',
    path: '/hidden-curriculum',
  },
  'Hidden Curriculum Decoder': {
    title: 'Build your writing structure',
    body: 'You know the rules. Now plan exactly what goes where.',
    button: 'Open Scaffolder',
    path: '/assessment-scaffolder',
  },
  'Course Planner': {
    title: 'Simplify your most urgent brief',
    body: 'Start with your closest deadline.',
    button: 'Open Brief Simplifier',
    path: '/brief-simplifier',
  },
  'Executive Function Planner': {
    title: 'Break down your most urgent brief',
    body: 'You have your time blocks. Now understand what you need to do.',
    button: 'Open Brief Simplifier',
    path: '/brief-simplifier',
  },
};

const NextStepSuggestion = ({ toolName, result, assessmentName, dueDate, courseCode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Essay Scorer adapts by band
  let suggestion = SUGGESTIONS[toolName];
  if (toolName === 'Essay Scorer' && result) {
    const band = (result.overallFeedback?.overallBand || result.estimatedBand || '').toLowerCase();
    if (band.includes('hd') || band.includes('high distinction') || band.includes('distinction') || band.includes(' d')) {
      suggestion = {
        title: 'Make your writing sound like you',
        body: 'Your ideas are strong. Make sure your authentic voice comes through.',
        button: 'Open Humaniser',
        path: '/humaniser',
      };
    } else if (band.includes('credit') || band.includes('pass') || band.includes('fail') || band.includes(' c') || band.includes(' p') || band.includes(' f')) {
      suggestion = {
        title: 'Build a stronger structure first',
        body: 'A clearer structure will lift your score.',
        button: 'Open Scaffolder',
        path: '/assessment-scaffolder',
      };
    } else {
      suggestion = {
        title: 'Make your writing sound like you',
        body: 'Your ideas are strong. Make sure your authentic voice comes through.',
        button: 'Open Humaniser',
        path: '/humaniser',
      };
    }
  }

  if (!suggestion) return null;

  const handleClick = async () => {
    // Save context to localStorage for the next tool
    try {
      if (assessmentName) localStorage.setItem('simplifii_context_assessmentName', assessmentName);
      if (dueDate) localStorage.setItem('simplifii_context_dueDate', dueDate);
      if (courseCode) localStorage.setItem('simplifii_context_courseCode', courseCode);
      localStorage.setItem('simplifii_context_sourceTool', toolName);
    } catch {}

    // Track pathway event
    try {
      await axios.post(`${API}/analytics/pathway`, {
        fromTool: toolName,
        toTool: suggestion.button.replace('Open ', ''),
        assessmentName: assessmentName || '',
      }, { withCredentials: true });
    } catch {}

    navigate(suggestion.path);
  };

  return (
    <div className="mt-6 p-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03]" data-testid="next-step-suggestion">
      <h4 className="text-sm font-semibold text-white mb-1">{suggestion.title}</h4>
      <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{suggestion.body}</p>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium transition-all"
        data-testid="next-step-btn"
      >
        {suggestion.button} <ArrowRight size={14} />
      </button>
    </div>
  );
};

export default NextStepSuggestion;
