import React, { useState } from 'react';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import PdfUploadZone from '../components/PdfUploadZone';
import GuidedTour from '../components/GuidedTour';
import TicketCostBar from '../components/TicketCostBar';
import AmbientSound from '../components/AmbientSound';
import { useAuth } from '../contexts/AuthContext';
import AiDisclaimer from '../components/AiDisclaimer';
import { exportToPdf } from '../components/PdfExport';
import { saveToolOutput } from '../utils/saveHistory';
import { autosaveOutput } from '../utils/autosave';
import RecoveryBanner from '../components/RecoveryBanner';
import FeedbackWidget from '../components/FeedbackWidget';
import NextStepSuggestion from '../components/NextStepSuggestion';
import ToolOutputBar from '../components/ToolOutputBar';
import axios from 'axios';
import { Loader2, TrendingUp, ArrowLeft, FileText, Target, BookOpen, CheckCircle2, Star, Brain, AlertTriangle, Zap, ChevronDown, ChevronUp, MessageCircle, Quote, Lightbulb, Briefcase, HelpCircle } from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';

const essayTourSteps = [
  { target: '[data-testid="doc-upload-essay"]', title: 'Upload Your Essay', description: 'Paste or upload your essay draft. We\'ll give you strengths-first formative feedback.', position: 'bottom' },
  { target: '[data-testid="doc-upload-rubric"]', title: 'Add Your Rubric', description: 'Upload the marking rubric so we can score against the actual criteria.', position: 'bottom' },
  { target: '[data-testid="submit-essay-btn"]', title: 'Get Your Score', description: 'We\'ll show you what you did well first, then you choose if you want deeper feedback.', position: 'top' },
];

const gradeBand = (pct) => {
  if (pct >= 85) return { label: 'HD', colour: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  if (pct >= 75) return { label: 'D', colour: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' };
  if (pct >= 65) return { label: 'C', colour: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
  if (pct >= 50) return { label: 'P', colour: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
  return { label: 'F', colour: 'text-red-400 bg-red-500/10 border-red-500/20' };
};

const EssayScorer = () => {
  const { user, checkAuth } = useAuth();
  const [essayText, setEssayText] = useState('');
  const [rubricText, setRubricText] = useState('');
  const [briefText, setBriefText] = useState('');
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [deepResult, setDeepResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedCriteria, setExpandedCriteria] = useState({});
  const [showExplainer, setShowExplainer] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!essayText.trim()) { setError('Please paste or upload your essay.'); return; }
    setError('');
    setLoading(true);
    setResult(null);
    setDeepResult(null);
    try {
      const response = await axios.post(`${API}/essay/score`, {
        essay_text: essayText,
        rubric_text: rubricText,
        brief_text: briefText,
      }, { withCredentials: true });
      setResult(response.data);
      saveToolOutput('Essay Scorer', essayText, response.data.overallFeedback?.strongestAspect || '', response.data, 2);
      autosaveOutput('Essay Scorer', response.data, essayText, user);
      await checkAuth();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to score essay. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepFeedback = async () => {
    setDeepLoading(true);
    try {
      const response = await axios.post(`${API}/essay/deep-feedback`, {
        essay_text: essayText,
        rubric_text: rubricText,
        brief_text: briefText,
        initial_scores: JSON.stringify(result?.criteria || []),
      }, { withCredentials: true });
      setDeepResult(response.data);
    } catch (err) {
      setError('Failed to generate deep feedback. Please try again.');
    } finally {
      setDeepLoading(false);
    }
  };

  const toggleCriterion = (idx) => {
    setExpandedCriteria(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <GuidedTour steps={essayTourSteps} storageKey="simplifii_tour_essay" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <RecoveryBanner toolName="Essay Scorer" onRecover={(data) => setResult(data)} />
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Essay Scorer</h1>
            <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
          </div>
          <p className="text-base text-zinc-400 mt-3">Strengths-first formative feedback. We show you what you did well before anything else.</p>
          <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Essay Scorer" />
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Document Uploads */}
            <div className="grid md:grid-cols-3 gap-4">
              <div data-testid="doc-upload-essay" className="md:col-span-2 bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Your Essay</span>
                  <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Required</span>
                </div>
                <textarea
                  data-testid="essay-text-input"
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  placeholder="Paste your essay or draft here..."
                  className="w-full h-48 px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 text-sm resize-none"
                />
                <div className="mt-2">
                  <PdfUploadZone onTextExtracted={(text) => setEssayText(prev => prev ? prev + '\n\n' + text : text)} label="Or upload your essay PDF" maxFiles={1} />
                </div>
                {essayText && <div className="mt-2 text-[10px] text-emerald-400">{essayText.split(/\s+/).length} words loaded</div>}
              </div>

              <div className="space-y-4">
                <div data-testid="doc-upload-rubric" className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} className="text-cyan-400" />
                    <span className="text-sm font-semibold text-white">Rubric</span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">Recommended</span>
                  </div>
                  <textarea
                    data-testid="rubric-text-input"
                    value={rubricText}
                    onChange={(e) => setRubricText(e.target.value)}
                    placeholder="Paste rubric or upload PDF..."
                    className="w-full h-20 px-3 py-2 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 text-xs resize-none"
                  />
                  <PdfUploadZone onTextExtracted={(text) => setRubricText(text)} label="Upload rubric PDF" maxFiles={3} />
                </div>

                <div data-testid="doc-upload-brief" className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={16} className="text-violet-400" />
                    <span className="text-sm font-semibold text-white">Brief</span>
                    <span className="text-[10px] text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">Optional</span>
                  </div>
                  <PdfUploadZone onTextExtracted={(text) => setBriefText(text)} label="Upload brief PDF" maxFiles={3} />
                  {briefText && <div className="mt-2 text-[10px] text-violet-400">Brief loaded</div>}
                </div>
              </div>
            </div>

            {/* Scoring Mode Indicator */}
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
              <span className="text-xs text-zinc-500">
                Scoring mode: {rubricText ? <span className="text-emerald-400">Mode 1 — Rubric provided (criterion-specific scoring)</span>
                  : briefText ? <span className="text-amber-400">Mode 2 — Brief provided (criteria extracted from brief)</span>
                  : <span className="text-zinc-400">Mode 3 — Essay only (universal criteria applied). Upload rubric for precise scoring.</span>}
              </span>
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            <div className="pt-4 border-t border-white/[0.04] space-y-3">
              <TicketCostBar toolKey="essay-scorer" cost={2} />
              <button
                onClick={handleSubmit}
                disabled={loading || !essayText.trim() || ((user?.credits ?? 0) < 2 && !user?.is_owner)}
                data-testid="submit-essay-btn"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Scoring Your Essay...</> : <><TrendingUp size={18} /> Score My Essay</>}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ToolOutputBar toolName="Essay Scorer" onStartFresh={() => { setResult(null); setDeepResult(null); setExpandedCriteria({}); }} />
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <button onClick={() => { setResult(null); setDeepResult(null); setExpandedCriteria({}); }} data-testid="new-score-btn" className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg transition-all text-sm">
                <ArrowLeft size={16} /> Score Another Essay
              </button>
              <div className="flex gap-2">
                <AmbientSound />
                <button onClick={() => exportToPdf({
                  studentName: user?.name, toolName: 'Essay Scorer', date: new Date().toLocaleDateString('en-AU'),
                  rawOutput: result,
                })} data-testid="export-essay-btn" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all text-sm font-medium">
                  <FileText size={16} /> Export PDF
                </button>
              </div>
            </div>

            {/* Calibration Note */}
            {result.overallFeedback?.calibrationNote && (
              <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl" data-testid="calibration-note">
                <p className="text-xs text-blue-400 leading-relaxed">{result.overallFeedback.calibrationNote}</p>
              </div>
            )}

            {/* Incomplete Warning */}
            {result.completenessCheck && !result.completenessCheck.isComplete && result.completenessCheck.warning && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl" data-testid="incomplete-warning">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">Incomplete Submission</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">{result.completenessCheck.warning}</p>
              </div>
            )}

            {/* Overall Score Hero */}
            {(() => {
              const avgScore = result.calculatedOverall != null
                ? result.calculatedOverall
                : (result.criteria?.length > 0
                  ? Math.round(result.criteria.filter(c => c.score != null).reduce((sum, c) => sum + c.score, 0) / result.criteria.filter(c => c.score != null).length)
                  : 0);
              const gb = gradeBand(avgScore);
              const scoringLabel = rubricText ? 'Rubric-aligned scoring' : briefText ? 'Brief-aligned scoring' : 'Universal criteria applied';
              return (
                <div className="text-center p-8 bg-gradient-to-b from-emerald-500/5 to-transparent rounded-2xl border border-emerald-500/10" data-testid="overall-score">
                  <div className="text-6xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>{avgScore}%</div>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${gb.colour}`}>
                    {result.overallFeedback?.estimatedBand || gb.label}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">{scoringLabel}</div>
                  {result.detectedScale && <div className="mt-1 text-[10px] text-zinc-600">Scale: {result.detectedScale}</div>}
                </div>
              );
            })()}

            {/* Encouragement */}
            {result.encouragement && (
              <div className="p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl" data-testid="encouragement-note">
                <p className="text-sm text-emerald-300 leading-relaxed italic">{result.encouragement}</p>
              </div>
            )}

            {/* Overall Feedback */}
            <div className="p-6 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="overall-impression">
              <div className="flex items-center gap-2 mb-4">
                <Star size={16} className="text-amber-400" />
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Overall Feedback</h2>
              </div>
              {result.overallFeedback?.strongestAspect && (
                <div className="mb-4">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Strongest Aspect</span>
                  <p className="text-zinc-300 leading-relaxed mt-1">{result.overallFeedback.strongestAspect}</p>
                </div>
              )}
              {result.overallFeedback?.priorityImprovement && (
                <div className="mb-4">
                  <span className="text-[10px] text-amber-400 uppercase tracking-wider font-semibold">Priority Improvement</span>
                  <p className="text-zinc-300 leading-relaxed mt-1">{result.overallFeedback.priorityImprovement}</p>
                </div>
              )}
              {result.overallFeedback?.nextDraftFocus?.length > 0 && (
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">Next Draft Focus</span>
                  <ol className="mt-1 space-y-1">
                    {result.overallFeedback.nextDraftFocus.map((f, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="text-cyan-500 font-semibold text-xs mt-0.5">{i + 1}.</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Score Breakdown Table */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] overflow-hidden" data-testid="score-breakdown">
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Score Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-t border-white/[0.04]">
                      <th className="text-left px-5 py-3 text-xs text-zinc-500 font-medium">Criterion</th>
                      <th className="text-center px-3 py-3 text-xs text-zinc-500 font-medium">Weighting</th>
                      <th className="text-center px-3 py-3 text-xs text-zinc-500 font-medium">Score</th>
                      <th className="text-center px-3 py-3 text-xs text-zinc-500 font-medium">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.criteria?.map((crit, idx) => {
                      const gb = crit.score != null ? gradeBand(crit.score) : { colour: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20' };
                      return (
                        <tr key={idx} className="border-t border-white/[0.04]">
                          <td className="px-5 py-3 text-white font-medium">{crit.criterionName}</td>
                          <td className="text-center px-3 py-3 text-zinc-400">{crit.weighting || '—'}</td>
                          <td className="text-center px-3 py-3">
                            {crit.score != null
                              ? <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${gb.colour}`}>{crit.score}%</span>
                              : <span className="text-xs text-zinc-600">—</span>
                            }
                          </td>
                          <td className="text-center px-3 py-3 text-zinc-400 text-xs">{crit.bandAchieved}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per-Criterion Details */}
            <div className="space-y-3" data-testid="strengths-section">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" /> Criterion Feedback
              </h2>
              {result.criteria?.map((crit, idx) => (
                <div key={idx} className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06] space-y-3" data-testid={`strength-${idx}`}>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-semibold text-white">{crit.criterionName}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${gradeBand(crit.score).colour}`}>{crit.score}%</span>
                  </div>

                  {/* Strength */}
                  {crit.strength && (
                    <div className="flex items-start gap-2 text-sm text-zinc-300">
                      <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{crit.strength}</span>
                    </div>
                  )}

                  {/* Evidence Found */}
                  {crit.evidenceFound && (
                    <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Quote size={12} className="text-blue-400" />
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Evidence from Your Essay</span>
                      </div>
                      <p className="text-sm text-zinc-300 italic">{crit.evidenceFound}</p>
                    </div>
                  )}

                  {/* Improvement */}
                  {crit.improvement && (
                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lightbulb size={12} className="text-amber-400" />
                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Priority Improvement</span>
                      </div>
                      <p className="text-sm text-zinc-300">{crit.improvement}</p>
                    </div>
                  )}

                  {/* Higher Order Prompt */}
                  {crit.higherOrderPrompt && (
                    <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Brain size={12} className="text-violet-400" />
                        <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Think Deeper</span>
                      </div>
                      <p className="text-sm text-zinc-300">{crit.higherOrderPrompt}</p>
                    </div>
                  )}

                  {/* Workforce Connection */}
                  {crit.workforceConnection && (
                    <div className="flex items-start gap-2 text-xs text-zinc-500 mt-1">
                      <Briefcase size={12} className="text-zinc-600 mt-0.5 flex-shrink-0" />
                      <span>{crit.workforceConnection}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Opt-In Question */}
            {!deepResult && (
              <div className="p-6 bg-gradient-to-r from-violet-500/5 to-cyan-500/5 border border-violet-500/20 rounded-2xl text-center" data-testid="opt-in-section">
                <MessageCircle size={24} className="text-violet-400 mx-auto mb-3" />
                <p className="text-base text-white font-medium mb-2" style={{ fontFamily: 'Outfit' }}>
                  {result.optInPrompt || "Would you like me to go deeper? I can give you specific, detailed feedback on where marks were lost and exactly how to improve each section."}
                </p>
                <p className="text-xs text-zinc-500 mb-4">This will show constructive feedback, gap analysis, and Socratic thinking questions.</p>
                <button
                  onClick={handleDeepFeedback}
                  disabled={deepLoading}
                  data-testid="go-deeper-btn"
                  className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-40 text-sm"
                >
                  {deepLoading ? <><Loader2 size={16} className="animate-spin" /> Generating Deep Feedback...</> : <><Brain size={16} /> Yes, Go Deeper</>}
                </button>
              </div>
            )}

            {/* Deep Feedback — Only if opted in */}
            {deepResult && (
              <div className="space-y-6" data-testid="deep-feedback-section">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Brain size={14} className="text-violet-400" /> Deep Feedback
                </h2>

                {/* Criterion-by-Criterion */}
                {deepResult.criterionFeedback?.map((crit, idx) => (
                  <div key={idx} className="bg-[#111113] rounded-2xl border border-white/[0.06] overflow-hidden" data-testid={`deep-criterion-${idx}`}>
                    <div className="p-5 cursor-pointer" onClick={() => toggleCriterion(idx)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-semibold text-white">{crit.criterion}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${gradeBand(crit.maximum > 0 ? Math.round((crit.score / crit.maximum) * 100) : crit.percentage).colour}`}>{crit.score}/{crit.maximum} ({crit.maximum > 0 ? Math.round((crit.score / crit.maximum) * 100) : crit.percentage}%)</span>
                        </div>
                        {expandedCriteria[idx] ? <ChevronUp size={16} className="text-zinc-600" /> : <ChevronDown size={16} className="text-zinc-600" />}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">Rubric level: {crit.rubricLevelReached}</p>
                    </div>

                    {expandedCriteria[idx] && (
                      <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04] pt-4">
                        {/* Evidence */}
                        <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Evidence from Your Essay</div>
                          <p className="text-sm text-zinc-300 italic">{crit.evidenceFromEssay}</p>
                        </div>

                        {/* Where Marks Were Lost */}
                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Where Marks Were Lost</div>
                          <p className="text-sm text-zinc-300">{crit.whereMarksWereLost}</p>
                        </div>

                        {/* Socratic Questions */}
                        <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Brain size={12} className="text-violet-400" />
                            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Build the Connection — Answer These Before Redrafting</span>
                          </div>
                          <ul className="space-y-2">
                            {crit.socraticQuestions?.map((q, i) => (
                              <li key={i} className="text-sm text-zinc-300 pl-3 border-l-2 border-violet-500/30">{q}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Next Action */}
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Zap size={12} className="text-emerald-400" />
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Your Next Concrete Action</span>
                          </div>
                          <p className="text-sm text-zinc-300">{crit.nextConcreteAction}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Gap Analysis */}
                {deepResult.gapAnalysis?.length > 0 && (
                  <div className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="gap-analysis">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={14} className="text-amber-400" />
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">What's Missing — Gap Analysis</h3>
                    </div>
                    <ul className="space-y-2">
                      {deepResult.gapAnalysis.map((gap, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <span className="text-amber-400 mt-1">-</span> {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Connect to the Bigger Picture */}
                {deepResult.connectToTheBiggerPicture && (
                  <div className="p-6 bg-gradient-to-r from-cyan-500/5 to-emerald-500/5 border border-cyan-500/20 rounded-2xl" data-testid="bigger-picture">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain size={16} className="text-cyan-400" />
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Connect to the Bigger Picture</h3>
                    </div>
                    <p className="text-base text-white leading-relaxed" style={{ fontFamily: 'Outfit' }}>{deepResult.connectToTheBiggerPicture}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <AiDisclaimer />
        {result && <FeedbackWidget toolName="Essay Scorer" sessionId={`essay_${Date.now()}`} />}
        {result && <NextStepSuggestion toolName="Essay Scorer" result={result} />}
        <RecentToolOutputs toolName="Essay Scorer" />
      </div>
    </div>
  );
};

export default EssayScorer;
