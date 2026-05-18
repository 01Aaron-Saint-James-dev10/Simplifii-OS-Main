import React, { useState, useCallback } from 'react';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import CelebrationManager from '../components/CelebrationManager';
import GuidedTour from '../components/GuidedTour';
import TicketCostBar from '../components/TicketCostBar';
import AmbientSound from '../components/AmbientSound';
import { useAuth } from '../contexts/AuthContext';
import AiDisclaimer from '../components/AiDisclaimer';
import { saveToolOutput } from '../utils/saveHistory';
import { autosaveOutput } from '../utils/autosave';
import RecoveryBanner from '../components/RecoveryBanner';
import FeedbackWidget from '../components/FeedbackWidget';
import NextStepSuggestion from '../components/NextStepSuggestion';
import ToolOutputBar from '../components/ToolOutputBar';
import { exportToPdf } from '../components/PdfExport';
import axios from 'axios';
import {
  Search, Loader2, Lightbulb, Brain,
  RotateCcw, Sparkles, Download, HelpCircle
} from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';

const tourSteps = [
  { target: '[data-testid="concept-input"]', title: 'Enter a Concept', description: 'Type any concept you want to understand — we\'ll break it down using the Feynman Technique.' },
  { target: '[data-testid="visualise-btn"]', title: 'Visualise!', description: 'Click to get a simple explanation, then see where it breaks down and the accurate version.' },
];

const ConceptVisualiser = () => {
  const { user, checkAuth } = useAuth();
  const [concept, setConcept] = useState('');
  const [simpleMode, setSimpleMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [showExplainer, setShowExplainer] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!concept.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API}/concept/visualise`, {
        concept: concept.trim(),
        simple_mode: simpleMode
      }, { withCredentials: true });
      setResult(response.data);
      saveToolOutput('Concept Visualiser', concept, response.data.simpleExplanation?.substring(0, 100) || '', response.data, 1);
      autosaveOutput('Concept Visualiser', response.data, concept, user);
      await checkAuth();
      setHistory(prev => {
        const updated = [concept.trim(), ...prev.filter(c => c.toLowerCase() !== concept.trim().toLowerCase())];
        return updated.slice(0, 10);
      });
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to visualise concept');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CelebrationManager>
      {({ celebrate }) => (
        <div className="min-h-screen bg-[#09090B]">
          <Navigation />
          <AccessibilityToolbar />
          <GuidedTour steps={tourSteps} storageKey="simplifii_tour_concept" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <RecoveryBanner toolName="Concept Visualiser" onRecover={(data) => setResult(data)} />
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>
                  Concept Visualiser
                </h1>
                <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
              </div>
              <p className="text-lg text-zinc-400 mt-3">Understand any concept using the Feynman Technique — then connect it back to your coursework.</p>
              <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Concept Visualiser" />
            </div>

            {/* Input Section */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8 mb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input
                      data-testid="concept-input"
                      type="text"
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      placeholder="e.g., cognitive dissonance, supply & demand, photosynthesis..."
                      className="w-full pl-11 pr-4 py-3.5 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !concept.trim() || ((user?.credits ?? 0) < 1 && !user?.is_owner)}
                    data-testid="visualise-btn"
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Thinking...</> : <><Sparkles size={18} /> Visualise</>}
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer" data-testid="simple-mode-toggle">
                    <div className={`relative w-11 h-6 rounded-full transition-colors ${simpleMode ? 'bg-emerald-500' : 'bg-white/[0.08]'}`} onClick={() => setSimpleMode(!simpleMode)}>
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${simpleMode ? 'translate-x-5' : ''}`} />
                    </div>
                    <span className="text-sm text-zinc-400">Explain Like I'm 5</span>
                  </label>
                  <TicketCostBar toolKey="visualiser" cost={1} />
                </div>
              </form>

              {history.length > 0 && !result && (
                <div className="mt-4 pt-4 border-t border-white/[0.04]">
                  <span className="text-xs text-zinc-600 font-medium uppercase tracking-wider">Recent:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {history.map((h, i) => (
                      <button key={i} onClick={() => { setConcept(h); }} className="px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs text-zinc-400 hover:text-white hover:border-white/[0.12] transition-all">
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            {/* Results — Feynman Technique 6 Sections */}
            {result && !loading && (
              <div className="space-y-6">
                <ToolOutputBar toolName="Concept Visualiser" onStartFresh={() => { setResult(null); setConcept(''); }} />
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="concept-title">
                    {result.concept}
                  </h2>
                  <div className="flex gap-2">
                    <AmbientSound />
                    <button onClick={() => exportToPdf({
                      studentName: user?.name, toolName: 'Concept Visualiser', date: new Date().toLocaleDateString('en-AU'),
                      rawOutput: result,
                    })} data-testid="export-concept-btn" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all text-sm font-medium">
                      <Download size={16} /> Export PDF
                    </button>
                    <button onClick={() => { setResult(null); setConcept(''); }} data-testid="new-concept-btn" className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg text-sm">
                      <RotateCcw size={14} /> New Concept
                    </button>
                  </div>
                </div>

                {/* Section 1 — Simple Explanation */}
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-6" data-testid="simple-explanation">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-bold" style={{ fontFamily: 'Outfit' }}>1</div>
                    <div>
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Explain It Simply</h3>
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider">Feynman Step 1</span>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{result.simpleExplanation}</p>
                </div>

                {/* Section 2 — Where It Breaks Down */}
                {result.whereItBreaksDown?.length > 0 && (
                  <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-6" data-testid="where-it-breaks-down">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-rose-500 rounded-2xl flex items-center justify-center text-white font-bold" style={{ fontFamily: 'Outfit' }}>2</div>
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Where the Simple Version Breaks Down</h3>
                        <span className="text-[10px] text-rose-400 uppercase tracking-wider">Feynman Step 2 — Find the Gaps</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {result.whereItBreaksDown.map((gap, idx) => (
                        <div key={idx} className="border-l-2 border-rose-500/30 pl-4 space-y-1">
                          <p className="text-sm text-zinc-400"><span className="text-rose-400 font-medium">Simple version says:</span> {gap.simpleVersion}</p>
                          <p className="text-sm text-zinc-300"><span className="text-emerald-400 font-medium">Reality:</span> {gap.reality}</p>
                          <p className="text-xs text-zinc-500"><span className="text-amber-400 font-medium">Why it matters:</span> {gap.whyItMatters}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3 — Accurate Explanation */}
                {result.accurateExplanation && (
                  <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-2xl p-6" data-testid="accurate-explanation">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-cyan-500 rounded-2xl flex items-center justify-center text-white font-bold" style={{ fontFamily: 'Outfit' }}>3</div>
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>The Accurate Explanation</h3>
                        <span className="text-[10px] text-cyan-400 uppercase tracking-wider">University-Level Understanding</span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.accurateExplanation}</p>
                  </div>
                )}

                {/* Section 4 — Higher Order Thinking */}
                {result.higherOrderThinking && (
                  <div className="bg-violet-500/5 border border-violet-500/15 rounded-2xl p-6" data-testid="higher-order-thinking">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-violet-500 rounded-2xl flex items-center justify-center text-white font-bold" style={{ fontFamily: 'Outfit' }}>4</div>
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Higher-Order Thinking</h3>
                        <span className="text-[10px] text-violet-400 uppercase tracking-wider">Test Your Understanding</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { level: 'Recall', q: result.higherOrderThinking.recall, cls: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400' },
                        { level: 'Application', q: result.higherOrderThinking.application, cls: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
                        { level: 'Analysis', q: result.higherOrderThinking.analysis, cls: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' },
                        { level: 'Evaluation', q: result.higherOrderThinking.evaluation, cls: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
                      ].filter(item => item.q).map((item, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border ${item.cls}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider">{item.level}</span>
                          <p className="text-sm font-medium text-white mt-1">{item.q}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 5 — Workforce Connection */}
                {result.workforceConnection && (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-6" data-testid="workforce-connection">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white font-bold" style={{ fontFamily: 'Outfit' }}>5</div>
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Why This Matters for Your Career</h3>
                        <span className="text-[10px] text-amber-400 uppercase tracking-wider">Workforce Connection</span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.workforceConnection}</p>
                  </div>
                )}

                {/* Section 6 — Memory Anchor */}
                {result.memoryAnchor && (
                  <div className="bg-teal-500/5 border border-teal-500/15 rounded-2xl p-6" data-testid="memory-anchor">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white font-bold" style={{ fontFamily: 'Outfit' }}>6</div>
                      <div>
                        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Memory Anchor</h3>
                        <span className="text-[10px] text-teal-400 uppercase tracking-wider">One Analogy to Remember</span>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">"{result.memoryAnchor}"</p>
                  </div>
                )}

                <AiDisclaimer />
                <FeedbackWidget toolName="Concept Visualiser" sessionId={`concept_${Date.now()}`} />
                <NextStepSuggestion toolName="Concept Visualiser" />
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div className="space-y-4">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-white/[0.04] rounded-2xl" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 w-48 bg-white/[0.04] rounded" />
                        <div className="h-4 w-full bg-white/[0.04] rounded" />
                        <div className="h-4 w-3/4 bg-white/[0.04] rounded" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <RecentToolOutputs toolName="Concept Visualiser" />
          </div>
        </div>
      )}
    </CelebrationManager>
  );
};

export default ConceptVisualiser;
