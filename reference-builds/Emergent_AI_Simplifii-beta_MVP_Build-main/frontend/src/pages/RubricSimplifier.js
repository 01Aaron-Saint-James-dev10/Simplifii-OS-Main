import React, { useState, useCallback, useRef } from 'react';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import PdfUploadZone from '../components/PdfUploadZone';
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
import { Upload, Loader2, ArrowLeft, Download, CheckCircle2, Lightbulb, AlertTriangle, ChevronRight, Heart, FileText, HelpCircle } from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';

const rubricTourSteps = [
  { target: '[data-testid="rubric-text-input"]', title: 'Paste Your Rubric', description: 'Upload a PDF or paste rubric text directly. We\'ll translate it into plain language.' },
  { target: '[data-testid="submit-rubric-btn"]', title: 'Simplify!', description: 'Click to break down every criterion into clear, actionable steps.' },
];

const sectionColours = {
  blue:   { bg: 'bg-blue-500/5',    border: 'border-blue-500/20',    badge: 'bg-blue-500',    text: 'text-blue-400',    bar: 'bg-blue-500',    light: 'bg-blue-500/10' },
  green:  { bg: 'bg-emerald-500/5',  border: 'border-emerald-500/20',  badge: 'bg-emerald-500',  text: 'text-emerald-400',  bar: 'bg-emerald-500',  light: 'bg-emerald-500/10' },
  purple: { bg: 'bg-purple-500/5',  border: 'border-purple-500/20',  badge: 'bg-purple-500',  text: 'text-purple-400',  bar: 'bg-purple-500',  light: 'bg-purple-500/10' },
  amber:  { bg: 'bg-amber-500/5',   border: 'border-amber-500/20',   badge: 'bg-amber-500',   text: 'text-amber-400',   bar: 'bg-amber-500',   light: 'bg-amber-500/10' },
  cyan:   { bg: 'bg-cyan-500/5',    border: 'border-cyan-500/20',    badge: 'bg-cyan-500',    text: 'text-cyan-400',    bar: 'bg-cyan-500',    light: 'bg-cyan-500/10' },
  rose:   { bg: 'bg-rose-500/5',    border: 'border-rose-500/20',    badge: 'bg-rose-500',    text: 'text-rose-400',    bar: 'bg-rose-500',    light: 'bg-rose-500/10' },
};

const ProgressRing = ({ percent, size = 36, stroke = 3, colour = '#14b8a6' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width={size} height={size} className={`${percent === 100 ? 'ring-pulse' : ''}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={colour} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
      />
    </svg>
  );
};

const RubricSimplifier = () => {
  const { user, checkAuth } = useAuth();
  const [rubricText, setRubricText] = useState('');
  const [briefText, setBriefText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [checkedSteps, setCheckedSteps] = useState({});
  const [checkedSelfAssess, setCheckedSelfAssess] = useState({});
  const [showExplainer, setShowExplainer] = useState(false);
  const sectionRefs = useRef({});
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { rubric_text: rubricText };
      if (briefText.trim()) payload.brief_text = briefText;
      const response = await axios.post(`${API}/rubric/simplify`, payload, { withCredentials: true });
      setResult(response.data);
      saveToolOutput('Rubric Simplifier', rubricText, response.data.assessmentTitle || '', response.data, 1);
      autosaveOutput('Rubric Simplifier', response.data, rubricText, user);
      setCheckedSteps({});
      setCheckedSelfAssess({});
      await checkAuth();
    } catch (err) {
      if (err.response?.status === 401) setError('Your session has expired. Please log in again.');
      else setError(err.response?.data?.detail || 'Failed to simplify rubric');
    } finally {
      setLoading(false);
    }
  };

  const getSectionProgress = useCallback((sectionIdx) => {
    if (!result?.criteria?.[sectionIdx]) return { checked: 0, total: 0, percent: 0 };
    const criterion = result.criteria[sectionIdx];
    const total = criterion.microTaskChecklist?.length || 0;
    const checked = criterion.microTaskChecklist?.filter((_, stepIdx) => checkedSteps[`${sectionIdx}-${stepIdx}`])?.length || 0;
    return { checked, total, percent: total > 0 ? (checked / total) * 100 : 0 };
  }, [result, checkedSteps]);

  const getTotalProgress = useCallback(() => {
    if (!result?.criteria) return { checked: 0, total: 0, percent: 0 };
    let checked = 0, total = 0;
    result.criteria.forEach((criterion, sIdx) => {
      criterion.microTaskChecklist?.forEach((_, stepIdx) => {
        total++;
        if (checkedSteps[`${sIdx}-${stepIdx}`]) checked++;
      });
    });
    return { checked, total, percent: total > 0 ? (checked / total) * 100 : 0 };
  }, [result, checkedSteps]);

  const handleExportPdf = () => {
    if (!result) return;
    exportToPdf({
      studentName: user?.name || 'Student',
      toolName: 'Rubric Simplifier',
      date: new Date().toLocaleDateString('en-AU'),
      rawOutput: result,
    });
  };

  return (
    <CelebrationManager>
      {({ celebrateStep, celebrateSection, celebrateFull }) => (
        <div className="min-h-screen bg-[#09090B]">
          <Navigation />
          <AccessibilityToolbar />
          <GuidedTour steps={rubricTourSteps} storageKey="simplifii_tour_rubric" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <RecoveryBanner toolName="Rubric Simplifier" onRecover={(data) => setResult(data)} />
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Rubric Simplifier</h1>
                <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
              </div>
              <p className="text-lg text-zinc-400 mt-3">Translate grading criteria into plain language with interactive checkable steps.</p>
              <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Rubric Simplifier" />
            </div>

            {!result ? (
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <PdfUploadZone onTextExtracted={(text) => setRubricText(text)} label="Upload rubric PDF(s)" maxFiles={10} />

                  <div className="relative flex items-center gap-3 my-2">
                    <div className="flex-1 border-t border-white/[0.06]"></div>
                    <span className="text-xs text-zinc-600 px-2">Or paste text below</span>
                    <div className="flex-1 border-t border-white/[0.06]"></div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Rubric text</label>
                    <textarea
                      data-testid="rubric-text-input"
                      value={rubricText}
                      onChange={(e) => setRubricText(e.target.value)}
                      placeholder="Paste your assessment rubric here..."
                      className="w-full h-48 px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 resize-none text-sm"
                      required
                    />
                  </div>

                  {/* Optional brief upload (Issue 6) */}
                  <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl" data-testid="brief-upload-section">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-teal-400" />
                      <span className="text-sm text-teal-300 font-medium">Upload your assessment brief too (optional)</span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">We'll make the tips even more specific to your exact task.</p>
                    <PdfUploadZone onTextExtracted={(text) => setBriefText(text)} label="Upload brief PDF" maxFiles={3} />
                    {briefText && <p className="text-xs text-teal-400 mt-2">Brief uploaded — tips will be hyper-specific.</p>}
                  </div>

                  {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
                  <div className="pt-4 border-t border-white/[0.04] space-y-3">
                    <TicketCostBar toolKey="rubric-simplifier" cost={2} />
                    <div className="flex justify-end">
                      <button type="submit" disabled={loading || !rubricText.trim() || ((user?.credits ?? 0) < 2 && !user?.is_owner)} data-testid="submit-rubric-btn" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                        {loading ? <><Loader2 size={18} className="animate-spin" /> Simplifying...</> : <><Upload size={18} /> Simplify Rubric</>}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <ToolOutputBar toolName="Rubric Simplifier" onStartFresh={() => { setResult(null); setRubricText(''); setBriefText(''); setCheckedSteps({}); setCheckedSelfAssess({}); }} />
                {/* Header with controls */}
                <div className="flex flex-wrap gap-3 justify-between items-center">
                  <button onClick={() => { setResult(null); setRubricText(''); setBriefText(''); setCheckedSteps({}); setCheckedSelfAssess({}); }} data-testid="new-rubric-btn" className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg transition-all text-sm">
                    <ArrowLeft size={16} /> New Rubric
                  </button>
                  <div className="flex gap-2">
                    <AmbientSound />
                    <button onClick={handleExportPdf} data-testid="export-rubric-btn" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all text-sm font-medium">
                      <Download size={16} /> Export PDF
                    </button>
                  </div>
                </div>

                {/* Assessment title & overall progress */}
                <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6">
                  <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }} data-testid="rubric-title">
                    {result.assessmentTitle || 'Assessment Rubric'}
                  </h2>
                  <div className="flex items-center gap-4 mb-4 flex-wrap">
                    <span className="text-sm text-zinc-400 flex items-center gap-1.5">Total:
                      <input
                        type="number"
                        min="1"
                        defaultValue={parseInt(String(result.totalMarks || '0').replace(/[^0-9]/g, '')) || ''}
                        onChange={(e) => { result.totalMarks = e.target.value; }}
                        className="w-14 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-white text-sm font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                        data-testid="editable-total-marks"
                      /> marks
                    </span>
                    <span className="text-sm text-zinc-400">Criteria: <span className="text-white font-bold">{result.criteria?.length}</span></span>
                  </div>
                  {(() => {
                    const total = getTotalProgress();
                    return (
                      <div data-testid="overall-progress">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-zinc-500 uppercase tracking-wider">Overall Progress</span>
                          <span className="text-sm font-bold text-emerald-400">{total.checked}/{total.total} steps</span>
                        </div>
                        <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${total.percent}%` }} />
                        </div>
                        {total.percent === 100 && (
                          <div className="mt-3 flex items-center gap-2 text-teal-400 text-sm font-medium">
                            <CheckCircle2 size={16} /> All steps completed!
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Normalising Message */}
                {result.normalisingMessage && (
                  <div className="p-5 bg-teal-500/5 border border-teal-500/10 rounded-2xl" data-testid="normalising-message">
                    <div className="flex items-start gap-2">
                      <Heart size={14} className="text-teal-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-teal-300/80 leading-relaxed italic">{result.normalisingMessage}</p>
                    </div>
                  </div>
                )}

                {/* Criteria */}
                {result.criteria?.map((criterion, sIdx) => {
                  const colourKeys = Object.keys(sectionColours);
                  const colours = sectionColours[colourKeys[sIdx % colourKeys.length]];
                  const progress = getSectionProgress(sIdx);
                  return (
                    <div key={sIdx} ref={el => sectionRefs.current[sIdx] = el} className={`${colours.bg} rounded-2xl border ${colours.border} overflow-hidden`} data-testid={`section-${sIdx}`}>
                      <div className="p-6 pb-4">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0 relative">
                            <ProgressRing percent={progress.percent} />
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{sIdx + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>{criterion.criterionName}</h3>
                              {criterion.totalMarks && <span className={`px-2.5 py-0.5 ${colours.light} ${colours.text} rounded-lg text-xs font-bold`}>{String(criterion.totalMarks).replace(/\s*marks?\s*$/i, '')} marks</span>}
                            </div>

                            {/* Grade Bands */}
                            {criterion.gradeBands?.length > 0 && (
                              <div className="mt-3 space-y-1.5">
                                {criterion.gradeBands.map((band, bIdx) => (
                                  <div key={bIdx} className="flex items-start gap-2 text-xs">
                                    <span className={`shrink-0 px-1.5 py-0.5 rounded font-bold ${
                                      band.band === 'HD' ? 'bg-emerald-500/10 text-emerald-400' :
                                      band.band === 'D' || band.band === 'DN' ? 'bg-violet-500/10 text-violet-400' :
                                      band.band === 'CR' || band.band === 'C' ? 'bg-blue-500/10 text-blue-400' :
                                      'bg-amber-500/10 text-amber-400'
                                    }`}>{band.band}{band.marksRange ? ` (${band.marksRange})` : ''}</span>
                                    <span className="text-zinc-400">{band.whatItLooksLike}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-zinc-500">{progress.checked}/{progress.total} steps</span>
                            <span className={`text-xs font-bold ${colours.text}`}>{Math.round(progress.percent)}%</span>
                          </div>
                          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className={`h-full ${colours.bar} rounded-full transition-all duration-500 ease-out`} style={{ width: `${progress.percent}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Micro-Task Checklist */}
                      <div className="px-6 pb-2 space-y-2">
                        {criterion.microTaskChecklist?.map((task, stepIdx) => {
                          const key = `${sIdx}-${stepIdx}`;
                          const isChecked = !!checkedSteps[key];
                          return (
                            <div
                              key={stepIdx}
                              className={`p-4 rounded-xl border transition-all duration-200 ${
                                isChecked ? 'bg-teal-500/[0.06] border-teal-500/20' : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'
                              }`}
                              data-testid={`step-${sIdx}-${stepIdx}`}
                            >
                              <div
                                className="flex items-start gap-3 cursor-pointer"
                                onClick={(e) => {
                                  const checkbox = e.currentTarget.querySelector('[data-checkbox]');
                                  setCheckedSteps(prev => {
                                    const next = { ...prev, [key]: !prev[key] };
                                    if (!prev[key]) {
                                      celebrateStep(checkbox);
                                      const sectionSteps = criterion.microTaskChecklist?.length || 0;
                                      const newChecked = criterion.microTaskChecklist?.filter((_, si) => si === stepIdx ? true : next[`${sIdx}-${si}`])?.length || 0;
                                      if (newChecked === sectionSteps) {
                                        setTimeout(() => celebrateSection(sectionRefs.current[sIdx]), 400);
                                        let allDone = true;
                                        result.criteria?.forEach((crit, si) => {
                                          crit.microTaskChecklist?.forEach((_, sti) => {
                                            if (si === sIdx && sti === stepIdx) return;
                                            if (!next[`${si}-${sti}`]) allDone = false;
                                          });
                                        });
                                        if (allDone) setTimeout(() => celebrateFull(), 800);
                                      }
                                    }
                                    return next;
                                  });
                                }}
                              >
                                <div data-checkbox className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                                  isChecked ? 'step-checked border-teal-500' : 'border-white/[0.15] hover:border-white/[0.3]'
                                }`}>
                                  {isChecked && (
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                  )}
                                </div>
                                <span className={`text-sm leading-relaxed ${isChecked ? 'text-teal-400 line-through opacity-70' : 'text-zinc-300'}`}>
                                  {task}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Strength Signals + Common Mistakes + Workforce + Learning Prefs */}
                      <div className="mx-6 mb-6 mt-3 space-y-3">
                        {criterion.strengthSignals?.length > 0 && (
                          <div className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 size={14} className={colours.text} />
                              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Strength Signals</span>
                            </div>
                            <ul className="space-y-1.5">
                              {criterion.strengthSignals.map((sig, i) => (
                                <li key={i} className="text-xs text-zinc-500 flex items-start gap-2">
                                  <span className={`${colours.text} mt-0.5`}>&#8226;</span><span>{sig}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {criterion.commonMistakes?.length > 0 && (
                          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle size={14} className="text-amber-400" />
                              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Common Mistakes</span>
                            </div>
                            <ul className="space-y-1.5">
                              {criterion.commonMistakes.map((m, i) => (
                                <li key={i} className="text-xs text-amber-400/70 flex items-start gap-2">
                                  <span className="text-amber-400 mt-0.5">&#8226;</span><span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {criterion.workforceConnection && (
                          <div className="p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-xl">
                            <div className="flex items-center gap-2 mb-1">
                              <Lightbulb size={12} className="text-cyan-400" />
                              <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Workforce Connection</span>
                            </div>
                            <p className="text-xs text-zinc-400">{criterion.workforceConnection}</p>
                          </div>
                        )}
                        {criterion.learningPreferences && (
                          <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl">
                            <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider block mb-2">Learning Strategies</span>
                            <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                              {criterion.learningPreferences.visual && <div><span className="text-violet-400 font-medium block mb-0.5">Visual</span>{criterion.learningPreferences.visual}</div>}
                              {criterion.learningPreferences.auditory && <div><span className="text-violet-400 font-medium block mb-0.5">Auditory</span>{criterion.learningPreferences.auditory}</div>}
                              {criterion.learningPreferences.kinesthetic && <div><span className="text-violet-400 font-medium block mb-0.5">Kinesthetic</span>{criterion.learningPreferences.kinesthetic}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Self-Assessment Checklist */}
                {result.selfAssessmentChecklist?.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6" data-testid="self-assessment-checklist">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 size={22} className="text-amber-400" />
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Self-Assessment Checklist</h3>
                    </div>
                    <div className="space-y-2">
                      {result.selfAssessmentChecklist.map((item, idx) => {
                        const isChecked = !!checkedSelfAssess[idx];
                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              const cb = e.currentTarget.querySelector('[data-sa-checkbox]');
                              setCheckedSelfAssess(prev => {
                                const next = { ...prev, [idx]: !prev[idx] };
                                if (!prev[idx]) celebrateStep(cb);
                                return next;
                              });
                            }}
                            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked ? 'bg-teal-500/[0.06] border-teal-500/20' : 'bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]'
                            }`}
                            data-testid={`self-assess-${idx}`}
                          >
                            <div data-sa-checkbox className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300 ${
                              isChecked ? 'step-checked border-teal-500' : 'border-white/[0.15]'
                            }`}>
                              {isChecked && <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                            </div>
                            <span className={`text-sm ${isChecked ? 'text-teal-400 line-through opacity-70' : 'text-zinc-300'}`}>{typeof item === 'string' ? item : item.checklistItem || item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Higher Order Thinking */}
                {result.higherOrderThinking?.length > 0 && (
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-6" data-testid="extra-tips">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb size={22} className="text-amber-400" />
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Higher-Order Thinking</h3>
                    </div>
                    <ul className="space-y-2">
                      {result.higherOrderThinking.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-zinc-400">
                          <ChevronRight size={14} className="text-amber-400 flex-shrink-0 mt-1" /><span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Workforce Readiness */}
                {result.workforceReadiness && (
                  <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-6" data-testid="workforce-readiness">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText size={18} className="text-cyan-400" />
                      <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit' }}>Workforce Readiness</h3>
                    </div>
                    <p className="text-sm text-zinc-300 leading-relaxed">{result.workforceReadiness}</p>
                  </div>
                )}

                <AiDisclaimer />
                <FeedbackWidget toolName="Rubric Simplifier" sessionId={`rubric_${Date.now()}`} />
                <NextStepSuggestion toolName="Rubric Simplifier" />
              </div>
            )}
            <RecentToolOutputs toolName="Rubric Simplifier" />
          </div>
        </div>
      )}
    </CelebrationManager>
  );
};

export default RubricSimplifier;
