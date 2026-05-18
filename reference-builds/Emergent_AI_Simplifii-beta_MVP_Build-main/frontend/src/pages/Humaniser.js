import React, { useState, useRef } from 'react';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import PdfUploadZone from '../components/PdfUploadZone';
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
import { Sparkles, Loader2, Copy, Check, ArrowLeft, Heart, Shield, Brain, AlertTriangle, MessageCircle, BookOpen, Download, Info, ChevronDown, ChevronUp, ArrowRight, HelpCircle } from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';
import HelpTooltip from '../components/HelpTooltip';

const AccuracyNotice = () => {
  const [expanded, setExpanded] = useState(() => {
    return !localStorage.getItem('simplifii_humaniser_notice_seen');
  });

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!localStorage.getItem('simplifii_humaniser_notice_seen')) {
      localStorage.setItem('simplifii_humaniser_notice_seen', 'true');
    }
  };

  return (
    <div className="mb-6 bg-teal-500/[0.06] border border-teal-500/15 rounded-xl overflow-hidden" data-testid="accuracy-notice">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left"
        data-testid="accuracy-notice-toggle"
      >
        <div className="flex items-center gap-2.5">
          <Info size={16} className="text-teal-400 flex-shrink-0" />
          <span className="text-sm font-medium text-teal-300">A note on AI detection accuracy</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-teal-400" /> : <ChevronDown size={16} className="text-teal-400" />}
      </button>
      {expanded && (
        <div className="px-5 pb-4 space-y-2.5">
          <p className="text-sm text-zinc-400 leading-relaxed">
            AI detection tools (like Turnitin's AI detector, GPTZero, etc.) are <span className="text-teal-300 font-medium">not 100% accurate</span>. They frequently flag neurodivergent writing patterns, ESL writing, and certain academic styles as AI-generated &mdash; even when the writing is entirely human.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            While this tool helps your authentic voice come through more clearly, <span className="text-teal-300 font-medium">no tool can guarantee a specific AI detection score</span>. We recommend always disclosing any AI assistance as per your university's academic integrity policy.
          </p>
          <p className="text-xs text-zinc-600 mt-1">
            This tool changes style only. Your arguments, evidence, and citations remain untouched.
          </p>
        </div>
      )}
    </div>
  );
};

const humaniserTourSteps = [
  { target: '[data-testid="humanise-text-input"]', title: 'Paste Your Writing', description: 'This isn\'t about "fixing" AI text. It\'s about making sure YOUR authentic voice comes through clearly — especially if you write in ways that get unfairly flagged.', position: 'bottom' },
  { target: '[data-testid="submit-humanise-btn"]', title: 'Humanise Your Voice', description: 'We\'ll adjust style only — your arguments, evidence, and citations stay exactly as they are.', position: 'top' },
];

const Humaniser = () => {
  const { user, checkAuth } = useAuth();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const sessionRef = useRef(`humaniser_${Date.now()}`);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API}/humanise`, { text: inputText }, { withCredentials: true });
      setResult(response.data);
      saveToolOutput('Humaniser', inputText, (response.data.humanisedText || '').substring(0, 200), response.data, 1);
      autosaveOutput('Humaniser', response.data, inputText, user);
      await checkAuth();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to humanise text');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.humanised);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <GuidedTour steps={humaniserTourSteps} storageKey="simplifii_tour_humaniser" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Humaniser</h1>
            <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
          </div>
          <p className="text-base text-zinc-400 mt-3">Ensure your writing sounds authentically like you. Style changes only — your ideas stay untouched.</p>
          <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Humaniser" />
          <div className="mt-4 p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl flex items-start gap-3">
            <Heart size={18} className="text-violet-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-violet-300/80">Many neurodivergent students naturally write in ways that AI detectors flag as artificial. This tool helps your authentic voice come through — not to deceive, but to ensure your real work is recognised as your own.</p>
          </div>
        </div>

        {!result ? (
          <div className="space-y-0">
            <RecoveryBanner toolName="Humaniser" onRecover={(data) => setResult(data)} />
            <AccuracyNotice />
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <PdfUploadZone onTextExtracted={(text) => setInputText(text)} label="Upload PDF(s) to extract text" maxFiles={5} />
              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 border-t border-white/[0.06]" />
                <span className="text-xs text-zinc-600 px-2">Or paste text below</span>
                <div className="flex-1 border-t border-white/[0.06]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Your writing</label>
                <textarea data-testid="humanise-text-input" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste your writing here — we'll adjust the style while keeping your ideas exactly as they are..." className="w-full h-64 px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 resize-none text-sm" required />
              </div>
              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
              <div className="pt-4 border-t border-white/[0.04] space-y-3">
                <TicketCostBar toolKey="humaniser" cost={2} />
                <div className="flex justify-end">
                  <button type="submit" disabled={loading || !inputText.trim() || ((user?.credits ?? 0) < 2 && !user?.is_owner)} data-testid="submit-humanise-btn" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Humanising Your Voice...</> : <><Sparkles size={18} /> Humanise My Writing</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ToolOutputBar toolName="Humaniser" onStartFresh={() => { setResult(null); setInputText(''); }} />
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <button onClick={() => { setResult(null); setInputText(''); }} data-testid="new-humanise-btn" className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg transition-all text-sm">
                <ArrowLeft size={16} /> Humanise New Text
              </button>
              <div className="flex gap-2">
                <AmbientSound />
                <button onClick={() => exportToPdf({
                  studentName: user?.name, toolName: 'Humaniser', date: new Date().toLocaleDateString('en-AU'),
                  rawOutput: result,
                  headerExtra: result.originalAiRisk != null ? `AI Risk: Original ${result.originalAiRisk}% → Humanised ${result.humanisedAiRisk}%` : undefined,
                })} data-testid="export-humanise-btn" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all text-sm font-medium">
                  <Download size={16} /> Export PDF
                </button>
              </div>
            </div>

            {/* Why This Matters */}
            {result.whyThisMatters && (
              <div className="p-6 bg-violet-500/5 border border-violet-500/10 rounded-2xl" data-testid="why-this-matters">
                <div className="flex items-center gap-2 mb-3">
                  <Heart size={16} className="text-violet-400" />
                  <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Why This Matters For You</h2>
                </div>
                <p className="text-zinc-300 leading-relaxed">{result.whyThisMatters}</p>
              </div>
            )}

            {/* AI Risk Score Badges */}
            {result.originalAiRisk != null && result.humanisedAiRisk != null && (
              <div className="relative">
                <div className="flex items-center justify-center gap-1 mb-1"><span className="text-xs text-zinc-500">AI Detection Risk</span><HelpTooltip text={"This estimates how likely your text is to be flagged by AI detection tools.\nLower is better. Under 20% is safe."} /></div>
                <div className="flex items-center justify-center gap-4 py-4" data-testid="ai-risk-scores">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1.5">Original Text</p>
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border-2 text-2xl font-bold ${
                    result.originalAiRisk > 70 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    result.originalAiRisk >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {result.originalAiRisk}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">AI Risk</p>
                </div>
                <ArrowRight size={24} className="text-emerald-400 mt-4" />
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1.5">After Humanising</p>
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border-2 text-2xl font-bold ${
                    result.humanisedAiRisk > 70 ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    result.humanisedAiRisk >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {result.humanisedAiRisk}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">AI Risk</p>
                </div>
              </div>
              </div>
            )}
            {result.originalAiRisk != null && (
              <>
              <p className="text-center text-xs text-gray-500 -mt-2 mb-2">Lower score = less likely to be flagged by AI detection software</p>
              <p className="text-center text-[10px] text-zinc-600 mb-2">AI detection is imperfect — this score is an estimate based on common writing patterns. Always check your university's AI policy.</p>
              </>
            )}

            {/* Original vs Humanised */}
            <div className="grid md:grid-cols-2 gap-4" data-testid="comparison-section">
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Your Original</h3>
                  <span className="px-2 py-0.5 bg-white/[0.04] text-zinc-500 rounded text-xs font-medium">Before</span>
                </div>
                <p className="text-zinc-400 whitespace-pre-wrap leading-relaxed text-sm">{result.original}</p>
              </div>
              <div className="bg-emerald-500/[0.03] rounded-2xl border border-emerald-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Humanised Version</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">After</span>
                    <button onClick={copyToClipboard} className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-all" title="Copy humanised text">
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-500" />}
                    </button>
                  </div>
                </div>
                <p className="text-white whitespace-pre-wrap leading-relaxed text-sm">{result.humanised}</p>
              </div>
            </div>

            {/* Changes Table */}
            {result.changesTable?.length > 0 && (
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] overflow-hidden" data-testid="changes-table">
                <div className="px-5 pt-5 pb-3">
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">What Changed, Where, and Why</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-white/[0.04]">
                        <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Original Phrase</th>
                        <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Humanised Version</th>
                        <th className="text-left px-3 py-3 text-xs text-zinc-500 font-medium">Why It Changed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.changesTable.map((row, idx) => (
                        <tr key={idx} className="border-t border-white/[0.04]">
                          <td className="px-5 py-3 text-zinc-500 text-xs max-w-[200px]"><span className="line-through">{row.originalPhrase}</span></td>
                          <td className="px-3 py-3 text-emerald-400 text-xs max-w-[200px]">{row.humanisedVersion}</td>
                          <td className="px-3 py-3 text-zinc-400 text-xs max-w-[250px] italic">{row.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AI Detection Risk Areas */}
            {result.aiDetectionRiskAreas?.length > 0 && (
              <div className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="detection-risks">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Your AI Detection Risk Areas</h3>
                </div>
                <div className="space-y-3">
                  {result.aiDetectionRiskAreas.map((risk, idx) => (
                    <div key={idx} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <p className="text-sm text-amber-300 font-medium mb-1">{risk.pattern}</p>
                      <p className="text-xs text-zinc-400">{risk.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Reflection Questions */}
            {result.voiceReflectionQuestions?.length > 0 && (
              <div className="p-5 bg-violet-500/5 border border-violet-500/10 rounded-2xl" data-testid="voice-reflection">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={14} className="text-violet-400" />
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Think About Your Own Voice</h3>
                </div>
                <ul className="space-y-3">
                  {result.voiceReflectionQuestions.map((q, idx) => (
                    <li key={idx} className="text-sm text-zinc-300 pl-4 border-l-2 border-violet-500/30 leading-relaxed">{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Academic Enquiry Prompt */}
            {result.academicEnquiryPrompt && (
              <div className="p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl" data-testid="academic-enquiry">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Go Deeper — Academic Enquiry</h3>
                </div>
                <p className="text-base text-white leading-relaxed" style={{ fontFamily: 'Outfit' }}>{result.academicEnquiryPrompt}</p>
              </div>
            )}

            {/* Integrity Reminder */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-start gap-3" data-testid="integrity-reminder">
              <BookOpen size={16} className="text-zinc-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-zinc-500 leading-relaxed">{result.integrityReminder || "Remember: this tool helps your authentic voice come through more clearly — it does not write for you or change your ideas. Always check your university's AI use policy and declare any AI assistance where required. Your thinking is yours. This tool just helps it sound that way."}</p>
            </div>

            <AiDisclaimer />
            <FeedbackWidget toolName="Humaniser" sessionId={sessionRef.current} />
            <NextStepSuggestion toolName="Humaniser" />
          </div>
        )}
        <RecentToolOutputs toolName="Humaniser" />
      </div>
    </div>
  );
};

export default Humaniser;
