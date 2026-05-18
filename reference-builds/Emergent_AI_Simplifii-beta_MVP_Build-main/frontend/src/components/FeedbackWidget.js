import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ThumbsUp, Minus, ThumbsDown, Send, X, Users, HelpCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const FOLLOWUP_POSITIVE = {
  'Brief Simplifier': { question: 'What was clearest?', options: ['Timeline', 'Key requirements', 'Workflow steps', 'All of it'] },
  'Rubric Simplifier': { question: 'Did the mark breakdown help you understand what to aim for?', options: ['Yes', 'Somewhat', "I'm still unsure"] },
  'Essay Scorer': { question: 'Will you use this feedback to revise?', options: ['Yes definitely', 'Maybe', 'No'] },
  'Humaniser': { question: 'Did your writing still sound like you?', options: ['Yes', 'Mostly', 'Not really'] },
  'Concept Visualiser': { question: 'Which part helped most?', options: ['Simple explanation', 'Where it breaks down', 'The analogy', 'Thinking questions'] },
  'Assessment Scaffolder': { question: 'Did having the structure make it easier to start?', options: ['Yes', 'Somewhat', 'Still felt stuck'] },
  'Hidden Curriculum Decoder': { question: 'Did you learn something you didn\'t know?', options: ['Yes', 'Some of it', 'Not really'] },
  _default: { question: 'What worked best?', options: ['The structure', 'The language', 'The specific advice', 'Everything'] }
};

const FOLLOWUP_NEUTRAL = { question: 'What was missing?', options: ['More specific to my task', 'Clearer language', 'More detail', 'Something else'] };
const FOLLOWUP_NEGATIVE = { question: 'What went wrong?', options: ['Output was too generic', "Didn't match my document", 'Wrong information', 'Too long or overwhelming', 'Something else'] };

const FeedbackWidget = ({ toolName, sessionId }) => {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [openText, setOpenText] = useState('');
  const [showCoDesign, setShowCoDesign] = useState(false);
  const [coDesignName, setCoDesignName] = useState('');
  const [coDesignEmail, setCoDesignEmail] = useState('');
  const [coDesignUni, setCoDesignUni] = useState('');
  const [coDesignIdea, setCoDesignIdea] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [thankYou, setThankYou] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const getFollowUp = () => {
    if (!reaction) return null;
    if (reaction === 'positive') return FOLLOWUP_POSITIVE[toolName] || FOLLOWUP_POSITIVE._default;
    if (reaction === 'neutral') return FOLLOWUP_NEUTRAL;
    return FOLLOWUP_NEGATIVE;
  };

  const handleReaction = async (type) => {
    setReaction(type);
    const score = type === 'positive' ? 3 : type === 'neutral' ? 2 : 1;
    try {
      await axios.post(`${API}/feedback/tool`, {
        toolName,
        sessionId: sessionId || 'unknown',
        reaction: type,
        followUpAnswer: '',
        openText: '',
        interestedInCoDesign: false,
        outputQualityScore: score
      }, { withCredentials: true });
    } catch {}
  };

  const handleFollowUp = async (answer) => {
    setFollowUpAnswer(answer);
    try {
      await axios.post(`${API}/feedback/tool`, {
        toolName,
        sessionId: sessionId || 'unknown',
        reaction,
        followUpAnswer: answer,
        openText: '',
        interestedInCoDesign: false,
        outputQualityScore: reaction === 'positive' ? 3 : reaction === 'neutral' ? 2 : 1
      }, { withCredentials: true });
    } catch {}
  };

  const handleOpenTextSubmit = async () => {
    try {
      await axios.post(`${API}/feedback/tool`, {
        toolName,
        sessionId: sessionId || 'unknown',
        reaction,
        followUpAnswer,
        openText,
        interestedInCoDesign: false,
        outputQualityScore: reaction === 'positive' ? 3 : reaction === 'neutral' ? 2 : 1
      }, { withCredentials: true });
    } catch {}
    if (reaction === 'positive' || reaction === 'neutral') {
      setShowCoDesign(true);
    } else {
      showThankYou();
    }
  };

  const handleCoDesignSubmit = async () => {
    try {
      await axios.post(`${API}/feedback/codesign`, {
        name: coDesignName,
        email: coDesignEmail,
        university: coDesignUni,
        toolIdea: coDesignIdea
      }, { withCredentials: true });
    } catch {}
    showThankYou();
  };

  const showThankYou = () => {
    setThankYou(true);
    setSubmitted(true);
    setTimeout(() => setVisible(false), 3000);
  };

  if (!visible || submitted) {
    if (thankYou) {
      return (
        <div data-testid="feedback-thankyou" className="mt-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-center animate-in slide-in-from-bottom-4 duration-500">
          <p className="text-emerald-400 text-sm font-medium">Thanks — this goes straight to Aaron. You're building Simplifii with us</p>
        </div>
      );
    }
    return null;
  }

  const followUp = getFollowUp();

  return (
    <div data-testid="feedback-widget" className="mt-6 p-4 rounded-xl border border-white/10 bg-white/[0.02] animate-in slide-in-from-bottom-4 duration-500">
      {!reaction ? (
        <div data-testid="feedback-reactions">
          <p className="text-sm text-gray-400 mb-3">Was this output helpful?</p>
          <div className="flex gap-3">
            <button data-testid="feedback-positive" onClick={() => handleReaction('positive')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-sm text-gray-300 hover:text-emerald-400 transition-all">
              <ThumbsUp size={16} /> This helped
            </button>
            <button data-testid="feedback-neutral" onClick={() => handleReaction('neutral')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-sm text-gray-300 hover:text-amber-400 transition-all">
              <Minus size={16} /> Partially helpful
            </button>
            <button data-testid="feedback-negative" onClick={() => handleReaction('negative')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-sm text-gray-300 hover:text-red-400 transition-all">
              <ThumbsDown size={16} /> Didn't help
            </button>
          </div>
        </div>
      ) : !followUpAnswer ? (
        <div data-testid="feedback-followup">
          <p className="text-sm text-gray-400 mb-3">{followUp?.question}</p>
          <div className="flex flex-wrap gap-2">
            {followUp?.options.map((opt) => (
              <button key={opt} data-testid={`followup-${opt.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => handleFollowUp(opt)} className="px-3 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/30 text-sm text-gray-300 hover:text-white transition-all">
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : !showCoDesign ? (
        <div data-testid="feedback-opentext">
          <p className="text-sm text-gray-400 mb-2">Want to tell us more? <span className="text-gray-500">(30 seconds, genuinely read by Aaron)</span></p>
          <div className="flex gap-2">
            <textarea
              data-testid="feedback-text-input"
              value={openText}
              onChange={(e) => setOpenText(e.target.value.slice(0, 500))}
              placeholder="What would have made this more useful?"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500/30"
              rows={2}
              maxLength={500}
            />
            <button data-testid="feedback-submit-text" onClick={handleOpenTextSubmit} className="self-end px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white transition-colors">
              <Send size={14} />
            </button>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-600">{openText.length}/500</span>
            <button data-testid="feedback-skip-text" onClick={() => {
              if (reaction === 'positive' || reaction === 'neutral') setShowCoDesign(true);
              else showThankYou();
            }} className="text-xs text-gray-500 hover:text-gray-400">Skip</button>
          </div>
        </div>
      ) : (
        <div data-testid="feedback-codesign">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-emerald-400" />
            <p className="text-sm text-gray-300 font-medium">Want to help shape Simplifii?</p>
          </div>
          <p className="text-xs text-gray-500 mb-3">Join the waitlist — 10 seconds</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input data-testid="codesign-name" value={coDesignName} onChange={(e) => setCoDesignName(e.target.value)} placeholder="Name" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/30" />
            <input data-testid="codesign-email" value={coDesignEmail} onChange={(e) => setCoDesignEmail(e.target.value)} placeholder="Email" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/30" />
            <input data-testid="codesign-uni" value={coDesignUni} onChange={(e) => setCoDesignUni(e.target.value)} placeholder="University" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/30" />
            <input data-testid="codesign-idea" value={coDesignIdea} onChange={(e) => setCoDesignIdea(e.target.value)} placeholder="What tool would change your uni life?" className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/30" />
          </div>
          <div className="flex gap-2">
            <button data-testid="codesign-submit" onClick={handleCoDesignSubmit} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white transition-colors">Join the waitlist</button>
            <button data-testid="codesign-skip" onClick={showThankYou} className="text-xs text-gray-500 hover:text-gray-400 px-2">Skip</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackWidget;
