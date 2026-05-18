import React, { useState } from 'react';
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

const decoderTourSteps = [
  { target: '[data-testid="jargon-input"]', title: 'Paste Confusing Text', description: 'Drop in the part of your brief with academic jargon, hidden expectations, or confusing language.', position: 'bottom' },
  { target: '[data-testid="submit-decode-btn"]', title: 'Decode It', description: 'We\'ll translate every term into plain English and reveal the hidden expectations.', position: 'top' },
];
import { BookOpen, Loader2, ArrowRight, AlertCircle, Lightbulb, Copy, Check, Download, Award, MessageSquare, CheckSquare, HelpCircle } from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';

const HiddenCurriculumDecoder = () => {
  const { user, checkAuth } = useAuth();
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null);
  const [showExplainer, setShowExplainer] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API}/decode-jargon`, { text: inputText }, { withCredentials: true });
      setResult(response.data);
      saveToolOutput('Hidden Curriculum Decoder', inputText, response.data.youBelongHere || '', response.data, 1);
      autosaveOutput('Hidden Curriculum Decoder', response.data, inputText, user);
      await checkAuth();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to decode text');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <GuidedTour steps={decoderTourSteps} storageKey="simplifii_tour_decoder" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <RecoveryBanner toolName="Hidden Curriculum Decoder" onRecover={(data) => setResult(data)} />
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Hidden Curriculum Decoder</h1>
            <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
          </div>
          <p className="text-lg text-zinc-400 mt-3">Academic language is a code — not a measure of intelligence. Let's crack it together.</p>
          <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Hidden Curriculum Decoder" />
        </div>

        {!result ? (
          <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <PdfUploadZone
                onTextExtracted={(text) => setInputText(text)}
                label="Upload assessment brief PDF"
                maxFiles={10}
              />

              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 border-t border-white/[0.06]"></div>
                <span className="text-xs text-zinc-600 px-2">Or paste text below</span>
                <div className="flex-1 border-t border-white/[0.06]"></div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Assessment brief or instructions</label>
                <textarea data-testid="jargon-input" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Paste the section of your brief that contains confusing language, expectations, or academic jargon..." className="w-full h-48 px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 resize-none text-sm" required />
              </div>
              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
              <div className="pt-4 border-t border-white/[0.04] space-y-3">
                <TicketCostBar toolKey="decoder" cost={2} />
                <div className="flex justify-end">
                  <button type="submit" disabled={loading || !inputText.trim() || ((user?.credits ?? 0) < 2 && !user?.is_owner)} data-testid="submit-decode-btn" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Decoding...</> : <><BookOpen size={18} /> Decode Jargon</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-6 fade-in">
            <ToolOutputBar toolName="Hidden Curriculum Decoder" onStartFresh={() => { setResult(null); setInputText(''); }} />
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <button onClick={() => { setResult(null); setInputText(''); }} data-testid="decode-again-btn" className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg transition-all text-sm">
                <BookOpen size={16} /> Decode More Text
              </button>
              <div className="flex gap-2">
                <AmbientSound />
                <button onClick={() => exportToPdf({
                  studentName: user?.name, toolName: 'Hidden Curriculum Decoder', date: new Date().toLocaleDateString('en-AU'),
                  rawOutput: result,
                })} data-testid="export-decode-btn" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all text-sm font-medium">
                  <Download size={16} /> Export PDF
                </button>
              </div>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }}>You Belong Here</h2>
              <p className="text-zinc-300 leading-relaxed">{result.youBelongHere}</p>
            </div>
            {result.soundLikeYouBelong?.appropriateTone && (
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2"><AlertCircle size={16} className="text-blue-400" /><span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Expected Tone</span></div>
                <p className="text-zinc-300 text-sm">{result.soundLikeYouBelong.appropriateTone}</p>
              </div>
            )}
            {result.jargonDecoder?.length > 0 && (
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8">
                <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit' }}>Decoded Terms</h2>
                <div className="space-y-4">
                  {result.jargonDecoder.map((term, idx) => (
                    <div key={idx} className="border-l-2 border-emerald-500/30 pl-5 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-bold text-white">"{term.term}"</h3>
                        <button onClick={() => copyText(`${term.term}: ${term.plainMeaning}`, idx)} className="p-1.5 hover:bg-white/[0.04] rounded-lg transition-all">
                          {copied === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-zinc-600" />}
                        </button>
                      </div>
                      <p className="text-emerald-300 text-sm mb-2"><strong>Plain English:</strong> {term.plainMeaning}</p>
                      {term.whyItMatters && <p className="text-zinc-400 text-sm mb-1"><strong className="text-zinc-300">Why it matters:</strong> {term.whyItMatters}</p>}
                      <p className="text-zinc-400 text-sm mb-1"><strong className="text-zinc-300">What to do:</strong> {term.whatDifferentLooksLike}</p>
                      {term.commonMisunderstanding && <p className="text-amber-400/80 text-xs"><strong>Common misunderstanding:</strong> {term.commonMisunderstanding}</p>}
                      {term.workforceTransfer && <p className="text-emerald-400/80 text-xs mt-1"><strong>Workforce transfer:</strong> {term.workforceTransfer}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.whatMarkerWants?.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4"><Lightbulb size={22} className="text-amber-400" /><h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>What Your Marker Actually Wants</h2></div>
                <p className="text-sm text-zinc-500 mb-4">These are things your assessor expects but may not have stated directly.</p>
                <ul className="space-y-2">
                  {result.whatMarkerWants.map((exp, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-300 text-sm"><ArrowRight size={14} className="flex-shrink-0 mt-1 text-amber-400" /><span>{exp}</span></li>
                  ))}
                </ul>
              </div>
            )}
            {/* SECTION A — What Your Marker Actually Wants — now rendered above with whatMarkerWants array */}
            {/* SECTION B — How to Sound Like You Belong */}
            {result.soundLikeYouBelong && (
              <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-8" data-testid="sound-like-you-belong">
                <div className="flex items-center gap-3 mb-4"><MessageSquare size={22} className="text-cyan-400" /><h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>The Language That Signals You Understand the Field</h2></div>
                {result.soundLikeYouBelong.phrasesToUse?.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Phrases That Signal Competence</h3>
                    <div className="space-y-1.5">
                      {result.soundLikeYouBelong.phrasesToUse.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-zinc-300"><Check size={14} className="flex-shrink-0 mt-0.5 text-emerald-400" /><span>{p}</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {result.soundLikeYouBelong.phrasesToAvoid?.length > 0 && (
                  <div className="mb-5">
                    <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Phrases to Avoid</h3>
                    <div className="space-y-1.5">
                      {result.soundLikeYouBelong.phrasesToAvoid.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-red-400" />
                          <span><strong className="text-red-400">{p.avoid || p}</strong>{p.useInstead && <> — use instead: <span className="text-emerald-400">{p.useInstead}</span></>}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.soundLikeYouBelong.honestyNote && (
                  <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-3">
                    <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">A Note on Honesty</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed italic">{result.soundLikeYouBelong.honestyNote}</p>
                  </div>
                )}
              </div>
            )}
            {/* SECTION C — Hidden Curriculum Checklist */}
            {result.hiddenCurriculumChecklist?.length > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-8" data-testid="hidden-curriculum-checklist">
                <div className="flex items-center gap-3 mb-4"><CheckSquare size={22} className="text-rose-400" /><h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Things Nobody Told You But Everyone Expects</h2></div>
                <div className="space-y-3">
                  {result.hiddenCurriculumChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <div className="w-6 h-6 bg-rose-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-rose-400">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Higher Order Prompts */}
            {result.higherOrderPrompts?.length > 0 && (
              <div className="bg-violet-500/5 border border-violet-500/10 rounded-2xl p-8" data-testid="higher-order-prompts">
                <div className="flex items-center gap-3 mb-4"><Lightbulb size={22} className="text-violet-400" /><h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Think Deeper</h2></div>
                <div className="space-y-3">
                  {result.higherOrderPrompts.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <div className="w-6 h-6 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-violet-400">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <AiDisclaimer />
            <FeedbackWidget toolName="Hidden Curriculum Decoder" sessionId={`decoder_${Date.now()}`} />
            <NextStepSuggestion toolName="Hidden Curriculum Decoder" />
          </div>
        )}
        <RecentToolOutputs toolName="Hidden Curriculum Decoder" />
      </div>
    </div>
  );
};

export default HiddenCurriculumDecoder;
