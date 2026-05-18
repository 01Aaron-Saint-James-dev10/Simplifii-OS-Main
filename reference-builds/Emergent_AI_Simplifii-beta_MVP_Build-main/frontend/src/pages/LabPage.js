import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { Beaker, Lightbulb, ThumbsUp, AlertTriangle, Send, ChevronUp, X } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const IDEAS = [
  { id: 'citation-formatter', title: 'Citation formatter', desc: 'Auto-format references in APA, Harvard, etc.' },
  { id: 'exam-predictor', title: 'Exam question predictor', desc: 'Predict likely exam questions from course material.' },
  { id: 'group-coordinator', title: 'Group assignment coordinator', desc: 'Manage group tasks, deadlines, and contributions.' },
  { id: 'presentation-builder', title: 'Presentation script builder', desc: 'Turn notes into presentation scripts with timing.' }
];

const LabPage = () => {
  const { user } = useAuth();
  const [votes, setVotes] = useState({});
  const [myVotes, setMyVotes] = useState({});

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      const res = await axios.get(`${API}/lab/votes`, { withCredentials: true });
      setVotes(res.data.votes || {});
      setMyVotes(res.data.myVotes || {});
    } catch {}
  };

  const handleVote = async (ideaId) => {
    if (myVotes[ideaId]) return;
    try {
      await axios.post(`${API}/lab/vote`, { ideaId }, { withCredentials: true });
      setVotes(prev => ({ ...prev, [ideaId]: (prev[ideaId] || 0) + 1 }));
      setMyVotes(prev => ({ ...prev, [ideaId]: true }));
      toast.success('Vote recorded!', { duration: 2000 });
    } catch {
      toast.error('Failed to vote');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="lab-page">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Beaker className="text-emerald-400" size={28} />
          <h1 className="text-2xl font-bold text-white">Simplifii Lab</h1>
        </div>
        <p className="text-sm text-gray-400 mb-8">Vote on what we build next. Every tool was shaped by students like you.</p>

        <div className="space-y-4">
          {IDEAS.map((idea) => (
            <div key={idea.id} data-testid={`lab-idea-${idea.id}`} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">{idea.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{idea.desc}</p>
              </div>
              <button
                data-testid={`vote-${idea.id}`}
                onClick={() => handleVote(idea.id)}
                disabled={myVotes[idea.id]}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  myVotes[idea.id]
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : 'border border-white/10 text-gray-400 hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/5'
                }`}
              >
                <ChevronUp size={14} />
                <span>{votes[idea.id] || 0}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const LabSidebarCard = ({ onSuggest, onReport }) => {
  return (
    <div data-testid="lab-sidebar-card" className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-2 mb-2">
        <Beaker size={16} className="text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Help build what's next</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">Every tool was shaped by students like you. Tell us what's missing.</p>
      <div className="space-y-2">
        <button data-testid="lab-suggest-tool" onClick={onSuggest} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-emerald-500/30 text-xs text-gray-300 hover:text-emerald-400 transition-all text-left">
          <Lightbulb size={14} /> Suggest a tool
        </button>
        <a href="/lab" data-testid="lab-vote-link" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-emerald-500/30 text-xs text-gray-300 hover:text-emerald-400 transition-all">
          <ThumbsUp size={14} /> Vote on ideas
        </a>
        <button data-testid="lab-report-problem" onClick={onReport} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:border-red-500/30 text-xs text-gray-300 hover:text-red-400 transition-all text-left">
          <AlertTriangle size={14} /> Report a problem
        </button>
      </div>
    </div>
  );
};

export const LabSuggestModal = ({ open, onClose }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/lab`, { type: 'suggestion', content, toolName: '' }, { withCredentials: true });
      toast.success('Suggestion submitted!', { duration: 2000 });
      onClose();
      setContent('');
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="lab-suggest-modal">
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Lightbulb size={18} className="text-emerald-400" /> Suggest a tool</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
        </div>
        <textarea
          data-testid="suggest-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What tool would change your uni life?"
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500/30"
          rows={4}
        />
        <button data-testid="suggest-submit" onClick={handleSubmit} disabled={submitting || !content.trim()} className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2">
          <Send size={14} /> Submit suggestion
        </button>
      </div>
    </div>
  );
};

export const LabReportModal = ({ open, onClose }) => {
  const TOOLS = ['Brief Simplifier', 'Rubric Simplifier', 'Essay Scorer', 'Humaniser', 'Assessment Scaffolder', 'Hidden Curriculum Decoder', 'Concept Visualiser', 'Executive Function Planner', 'Course Planner'];
  const [toolName, setToolName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/lab`, { type: 'problem', content, toolName }, { withCredentials: true });
      toast.success('Problem reported!', { duration: 2000 });
      onClose();
      setContent('');
      setToolName('');
    } catch {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="lab-report-modal">
      <div className="bg-[#111] border border-white/10 rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2"><AlertTriangle size={18} className="text-red-400" /> Report a problem</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
        </div>
        <select data-testid="report-tool-select" value={toolName} onChange={(e) => setToolName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white mb-3 focus:outline-none focus:border-emerald-500/30">
          <option value="">Select tool (optional)</option>
          {TOOLS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea
          data-testid="report-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Describe the problem..."
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-emerald-500/30"
          rows={4}
        />
        <button data-testid="report-submit" onClick={handleSubmit} disabled={submitting || !content.trim()} className="mt-3 w-full py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-lg text-sm text-white transition-colors flex items-center justify-center gap-2">
          <Send size={14} /> Submit report
        </button>
      </div>
    </div>
  );
};

export default LabPage;
