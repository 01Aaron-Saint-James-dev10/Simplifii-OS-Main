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
import { autosaveOutput } from '../utils/autosave';
import RecoveryBanner from '../components/RecoveryBanner';
import FeedbackWidget from '../components/FeedbackWidget';
import NextStepSuggestion from '../components/NextStepSuggestion';
import ToolOutputBar from '../components/ToolOutputBar';
import axios from 'axios';
import { Building, Loader2, Lightbulb, AlertCircle, ArrowLeft, FileText, BookOpen, GraduationCap, Layers, Brain, Target, Link2, ChevronDown, ChevronUp, Zap, Star, AlertTriangle, HelpCircle } from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';
import HelpTooltip from '../components/HelpTooltip';

const scaffolderTourSteps = [
  { target: '[data-testid="doc-upload-brief"]', title: 'Upload Your Assessment Brief', description: 'Start here. Upload the actual assessment document so we can analyse the specific requirements.', position: 'bottom' },
  { target: '[data-testid="doc-upload-rubric"]', title: 'Add Your Rubric', description: 'This is where the magic happens. We\'ll map every rubric criterion to your scaffold sections.', position: 'bottom' },
  { target: '[data-testid="doc-upload-outline"]', title: 'Course Outline (Optional)', description: 'Upload your unit guide so we can connect learning outcomes to your assessment.', position: 'bottom' },
  { target: '[data-testid="doc-upload-slides"]', title: 'Lecture Slides (Optional)', description: 'We\'ll find which lecture topics directly inform each section of your scaffold.', position: 'bottom' },
  { target: '[data-testid="submit-scaffold-btn"]', title: 'Generate Deep Scaffold', description: 'We\'ll cross-reference ALL your documents and create a scaffold with critical thinking prompts, rubric alignment, and lecture connections.', position: 'top' },
];

const bloomColours = {
  'Analyse': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'Evaluate': 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  'Create': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Apply': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'Understand': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Remember': 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

const AssessmentScaffolder = () => {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({ assignment_type: 'Essay', topic: '', word_count: 2000, level: 'Second Year' });
  const [docTexts, setDocTexts] = useState({ brief: '', rubric: '', outline: '', slides: '' });
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState({});
  const [activeTab, setActiveTab] = useState('structure');
  const [showExplainer, setShowExplainer] = useState(false);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const assignmentTypes = ['Essay', 'Report', 'Literature Review', 'Case Study', 'Presentation', 'Research Project'];
  const levels = ['First Year', 'Second Year', 'Third Year', 'Postgraduate'];

  const handleDocUpload = (docType) => async (text) => {
    setDocTexts(prev => ({ ...prev, [docType]: text }));
    // Auto-fill metadata from brief
    if (docType === 'brief' && text) {
      try {
        const fd = new FormData();
        const blob = new Blob([text], { type: 'text/plain' });
        fd.append('files', new File([blob], 'text.pdf'));
        const res = await axios.post(`${API}/briefs/extract-metadata`, fd, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
        const meta = res.data;
        if (meta.assessment_title) setFormData(prev => ({ ...prev, topic: meta.assessment_title }));
        if (meta.assessment_type) setFormData(prev => ({ ...prev, assignment_type: meta.assessment_type }));
        if (meta.word_count) {
          const wc = parseInt(String(meta.word_count).replace(/\D/g, ''));
          if (wc > 0) setFormData(prev => ({ ...prev, word_count: wc }));
        }
      } catch (e) {
        if (text) setFormData(prev => ({ ...prev, topic: text.substring(0, 200) }));
      }
    }
  };

  const docsUploaded = Object.values(docTexts).filter(t => t.trim()).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const startTime = Date.now();
      const estimatedTotal = docsUploaded >= 2 ? 90 : 60; // seconds
      setTimeRemaining(estimatedTotal);

      // Step 1: Start the scaffold job
      const startResp = await axios.post(`${API}/scaffold`, {
        ...formData,
        brief_text: docTexts.brief,
        rubric_text: docTexts.rubric,
        outline_text: docTexts.outline,
        slides_text: docTexts.slides,
      }, { withCredentials: true });

      const { job_id } = startResp.data;
      if (!job_id) {
        setResult(startResp.data);
        return;
      }

      // Step 2: Poll for completion with countdown
      const pollInterval = 3000;
      const maxPolls = 100;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise(r => setTimeout(r, pollInterval));
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, estimatedTotal - elapsed);
        setTimeRemaining(remaining);

        const statusResp = await axios.get(`${API}/scaffold/status/${job_id}`, { withCredentials: true });
        const { status, result: jobResult, error: jobError, progress } = statusResp.data;

        if (status === 'complete' && jobResult) {
          setResult(jobResult);
          autosaveOutput('Assessment Scaffolder', jobResult, formData.topic, user);
          await checkAuth();
          return;
        } else if (status === 'error') {
          setError(jobError || 'Failed to create scaffold');
          return;
        }
        if (progress) {
          setLoadingMsg(progress);
        }
      }
      setError('Scaffold generation timed out. Please try again.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create scaffold');
    } finally {
      setLoading(false);
      setLoadingMsg('');
      setTimeRemaining(null);
    }
  };

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <GuidedTour steps={scaffolderTourSteps} storageKey="simplifii_tour_scaffolder" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <RecoveryBanner toolName="Assessment Scaffolder" onRecover={(data) => setResult(data)} />
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>Assessment Scaffolder</h1>
            <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
          </div>
          <p className="text-base text-zinc-400 mt-3">Upload your documents and we'll build a scaffold that connects your brief, rubric, course outline, and lectures.</p>
          <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Assessment Scaffolder" />
        </div>

        {!result ? (
          <div className="space-y-6">
            {/* Document Upload Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              <div data-testid="doc-upload-brief" className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-white">Assessment Brief</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <PdfUploadZone onTextExtracted={handleDocUpload('brief')} label="Upload your assessment brief PDF" maxFiles={3} />
                {docTexts.brief && <div className="mt-2 text-[10px] text-emerald-400">Brief loaded ({docTexts.brief.split(' ').length} words)</div>}
              </div>

              <div data-testid="doc-upload-rubric" className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Rubric / Marking Criteria</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">Recommended</span>
                </div>
                <PdfUploadZone onTextExtracted={handleDocUpload('rubric')} label="Upload your rubric PDF" maxFiles={3} />
                {docTexts.rubric && <div className="mt-2 text-[10px] text-cyan-400">Rubric loaded ({docTexts.rubric.split(' ').length} words)</div>}
              </div>

              <div data-testid="doc-upload-outline" className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-violet-400" />
                  <span className="text-sm font-semibold text-white">Course Outline / Unit Guide</span>
                  <span className="text-[10px] text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <PdfUploadZone onTextExtracted={handleDocUpload('outline')} label="Upload your course outline PDF" maxFiles={3} />
                {docTexts.outline && <div className="mt-2 text-[10px] text-violet-400">Outline loaded ({docTexts.outline.split(' ').length} words)</div>}
              </div>

              <div data-testid="doc-upload-slides" className="bg-[#111113] rounded-2xl border border-white/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={16} className="text-amber-400" />
                  <span className="text-sm font-semibold text-white">Lecture Slides / Readings</span>
                  <span className="text-[10px] text-zinc-500 bg-white/[0.04] px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <PdfUploadZone onTextExtracted={handleDocUpload('slides')} label="Upload lecture slides or reading PDFs" maxFiles={10} />
                {docTexts.slides && <div className="mt-2 text-[10px] text-amber-400">Slides loaded ({docTexts.slides.split(' ').length} words)</div>}
              </div>
            </div>

            {/* Doc Count Indicator */}
            {docsUploaded > 0 && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                <Link2 size={14} className="text-emerald-400" />
                <span className="text-xs text-emerald-400">{docsUploaded} document{docsUploaded > 1 ? 's' : ''} loaded — {docsUploaded >= 3 ? 'we can build deep cross-document connections' : docsUploaded >= 2 ? 'great start — add more for deeper analysis' : 'add your rubric for rubric-aligned scaffolding'}</span>
              </div>
            )}

            {/* Manual Fields */}
            <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider flex items-center gap-2">Assignment Type <HelpTooltip text="Not sure what type? Select the closest option. The tool works with any format." /></label>
                    <select value={formData.assignment_type} onChange={(e) => setFormData({...formData, assignment_type: e.target.value})} className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white focus:ring-2 focus:ring-emerald-500/40 text-sm">
                      {assignmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Level</label>
                    <select value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})} className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white focus:ring-2 focus:ring-emerald-500/40 text-sm">
                      {levels.map(level => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Topic</label>
                  <input type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} placeholder="e.g., Impact of Social Media on Mental Health" className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Word Count</label>
                  <input type="number" value={formData.word_count} onChange={(e) => setFormData({...formData, word_count: parseInt(e.target.value)})} min="500" max="10000" step="100" className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white focus:ring-2 focus:ring-emerald-500/40 text-sm" required />
                </div>
                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
                <div className="pt-4 border-t border-white/[0.04] space-y-3">
                  <TicketCostBar toolKey="scaffolder" cost={3} />
                  <div className="flex items-center justify-end">
                    <button type="submit" disabled={loading || (user?.credits ?? 0) < 3 && !user?.is_owner} data-testid="submit-scaffold-btn" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                      {loading ? <><Loader2 size={18} className="animate-spin" /> {loadingMsg || 'Analysing Documents...'}</> : <><Building size={18} /> Generate Deep Scaffold</>}
                    </button>
                  </div>
                  {loading && timeRemaining !== null && (
                    <div className="text-center mt-3" data-testid="scaffold-time-remaining">
                      <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-emerald-500/60 rounded-full transition-all duration-3000" style={{ width: `${Math.max(5, 100 - (timeRemaining / (docsUploaded >= 2 ? 90 : 60)) * 100)}%` }} />
                      </div>
                      <p className="text-xs text-zinc-500">
                        {timeRemaining > 60 ? `About ${Math.ceil(timeRemaining / 60)} minutes remaining` :
                         timeRemaining > 10 ? `About ${Math.ceil(timeRemaining / 10) * 10} seconds remaining` :
                         timeRemaining > 0 ? 'Almost there...' : 'Finishing up...'}
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ToolOutputBar toolName="Assessment Scaffolder" onStartFresh={() => { setResult(null); setExpandedSections({}); setActiveTab('structure'); }} />
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <button onClick={() => { setResult(null); setExpandedSections({}); setActiveTab('structure'); }} data-testid="new-scaffold-btn" className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg transition-all text-sm"><ArrowLeft size={16} /> New Scaffold</button>
              <div className="flex gap-2">
                <AmbientSound />
                <button onClick={() => exportToPdf({
                  studentName: user?.name, toolName: 'Assessment Scaffolder', date: new Date().toLocaleDateString('en-AU'),
                  rawOutput: result,
                })} data-testid="export-scaffold-btn" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all text-sm font-medium">
                  <Star size={16} /> Export PDF
                </button>
              </div>
            </div>

            {/* Overall Guidance */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-8" data-testid="scaffold-guidance">
              <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }}>Strategic Overview</h2>
              <p className="text-zinc-300 leading-relaxed whitespace-pre-line">{result.overallGuidance}</p>
            </div>

            {/* Normalising Message */}
            {result.normalisingMessage && (
              <div className="p-5 bg-teal-500/5 border border-teal-500/10 rounded-2xl" data-testid="normalising-message">
                <p className="text-sm text-teal-300/80 leading-relaxed italic">{result.normalisingMessage}</p>
              </div>
            )}

            {/* Before You Start */}
            {result.beforeYouStart?.length > 0 && (
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6" data-testid="before-you-start">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Before You Start</h3>
                </div>
                <ol className="space-y-2">
                  {result.beforeYouStart.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-zinc-300">
                      <span className="text-amber-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Time Estimate */}
            {result.timeEstimate && (
              <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6" data-testid="time-estimate">
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={16} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Time Estimate</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(result.timeEstimate).map(([key, val]) => (
                    <div key={key} className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className={`text-sm font-semibold ${key === 'total' ? 'text-emerald-400' : 'text-zinc-300'}`}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/[0.06] pb-1" data-testid="scaffold-tabs">
              {[
                { key: 'structure', label: 'Structure', icon: Building },
                ...(result.documentConnections?.length > 0 ? [{ key: 'connections', label: 'Connections', icon: Link2 }] : []),
                ...(result.rubricAlignment?.length > 0 ? [{ key: 'rubric', label: 'Rubric Map', icon: Target }] : []),
                { key: 'thinking', label: 'Thinking Framework', icon: Brain },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  data-testid={`tab-${tab.key}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all ${activeTab === tab.key ? 'bg-[#111113] text-emerald-400 border border-white/[0.06] border-b-0' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Structure Tab */}
            {activeTab === 'structure' && (
              <div className="space-y-4" data-testid="scaffold-structure">
                {result.suggestedStructure?.map((section, idx) => (
                  <div key={idx} className="bg-[#111113] rounded-2xl border border-white/[0.06] overflow-hidden" data-testid={`section-${idx}`}>
                    <div className="p-5 cursor-pointer" onClick={() => toggleSection(idx)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] text-zinc-600 font-mono">0{idx + 1}</span>
                            <h3 className="text-base font-bold text-white">{section.section}</h3>
                          </div>
                          <p className="text-xs text-zinc-500 ml-8">{section.purpose}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium">{section.percentage}%</span>
                          <span className="text-zinc-500 text-xs">~{section.wordCount}w</span>
                          {expandedSections[idx] ? <ChevronUp size={16} className="text-zinc-600" /> : <ChevronDown size={16} className="text-zinc-600" />}
                        </div>
                      </div>

                      {/* Rubric Criteria Tags */}
                      {section.rubricCriteria?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                          {section.rubricCriteria.map((c, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {expandedSections[idx] && (
                      <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04] pt-4">
                        {/* Starter Sentence */}
                        {section.starterSentence && (
                          <div className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={14} className="text-violet-400" />
                              <h4 className="font-bold text-violet-300 text-xs uppercase tracking-wider">Starter Sentence</h4>
                            </div>
                            <p className="text-sm text-zinc-300 italic">{section.starterSentence}</p>
                          </div>
                        )}

                        {/* Critical Thinking Prompts */}
                        {section.criticalThinking?.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Brain size={14} className="text-violet-400" />
                              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Critical Thinking Prompts</h4>
                            </div>
                            <div className="space-y-2">
                              {section.criticalThinking.map((ct, i) => (
                                <div key={i} className={`p-3 rounded-lg border ${bloomColours[ct.level] || bloomColours['Analyse']}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider">{ct.level}</span>
                                  </div>
                                  <p className="text-sm font-medium text-white">{ct.prompt}</p>
                                  {ct.hint && <p className="text-xs text-zinc-500 mt-1">{ct.hint}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-3">
                          {/* Key Questions */}
                          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertCircle size={14} className="text-blue-400" />
                              <h4 className="font-bold text-blue-300 text-xs uppercase tracking-wider">Key Questions</h4>
                            </div>
                            <ul className="space-y-1.5">{section.keyQuestions?.map((q, i) => <li key={i} className="text-xs text-zinc-400 leading-relaxed">{q}</li>)}</ul>
                          </div>

                          {/* Tips */}
                          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Lightbulb size={14} className="text-emerald-400" />
                              <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">Tips</h4>
                            </div>
                            <ul className="space-y-1.5">{(section.tips || (section.tipForThisSection ? [section.tipForThisSection] : []))?.map((tip, i) => <li key={i} className="text-xs text-zinc-400 leading-relaxed">{tip}</li>)}</ul>
                          </div>
                        </div>

                        {/* Lecture Links */}
                        {section.lectureLinks?.length > 0 && (
                          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <GraduationCap size={14} className="text-amber-400" />
                              <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">Lecture Connections</h4>
                            </div>
                            <ul className="space-y-1">{section.lectureLinks.map((link, i) => <li key={i} className="text-xs text-zinc-400">{link}</li>)}</ul>
                          </div>
                        )}

                        {/* Common Mistakes */}
                        {section.commonMistakes?.length > 0 && (
                          <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle size={14} className="text-red-400" />
                              <h4 className="font-bold text-red-300 text-xs uppercase tracking-wider">Common Mistakes</h4>
                            </div>
                            <ul className="space-y-1">{section.commonMistakes.map((m, i) => <li key={i} className="text-xs text-zinc-400">{m}</li>)}</ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Connections Tab */}
            {activeTab === 'connections' && result.documentConnections?.length > 0 && (
              <div className="space-y-4" data-testid="scaffold-connections">
                <p className="text-sm text-zinc-400 mb-2">How your documents connect to each other:</p>
                {result.documentConnections.map((conn, idx) => (
                  <div key={idx} className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]">
                    <div className="flex items-start gap-3">
                      <Link2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-white leading-relaxed mb-2">{conn.insight}</p>
                        <div className="flex items-center gap-2 mb-2">
                          {conn.documents?.map((doc, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 bg-white/[0.04] text-zinc-400 rounded-full capitalize">{doc}</span>
                          ))}
                        </div>
                        <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Zap size={12} className="text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Action Item</span>
                          </div>
                          <p className="text-xs text-zinc-300">{conn.actionItem}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rubric Map Tab */}
            {activeTab === 'rubric' && result.rubricAlignment?.length > 0 && (
              <div className="space-y-4" data-testid="scaffold-rubric-map">
                <p className="text-sm text-zinc-400 mb-2">How each rubric criterion maps to your scaffold:</p>
                {result.rubricAlignment.map((crit, idx) => (
                  <div key={idx} className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-white">{crit.criterion}</h3>
                        {crit.weighting && <span className="text-xs text-cyan-400">{crit.weighting}</span>}
                      </div>
                      <Target size={16} className="text-cyan-400" />
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-zinc-400 mb-2 font-medium">What markers want:</p>
                      <p className="text-sm text-zinc-300">{crit.whatMarkersWant}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {crit.sections?.map((s, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">{s}</span>
                      ))}
                    </div>
                    {crit.lectureConnections?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {crit.lectureConnections.map((lc, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">{lc}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Thinking Framework Tab */}
            {activeTab === 'thinking' && result.thinkingFramework && (
              <div className="space-y-4" data-testid="scaffold-thinking">
                <p className="text-sm text-zinc-400 mb-2">Bloom's Taxonomy applied to your assessment:</p>
                {Object.entries(result.thinkingFramework).map(([level, content]) => {
                  const colours = { remember: 'zinc', understand: 'blue', apply: 'amber', analyse: 'cyan', evaluate: 'violet', create: 'emerald' };
                  const c = colours[level] || 'zinc';
                  return (
                    <div key={level} className={`p-5 bg-[#111113] rounded-2xl border border-${c}-500/20`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain size={14} className={`text-${c}-400`} />
                        <h3 className={`text-sm font-bold text-${c}-400 uppercase tracking-wider`}>{level}</h3>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">{content}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Higher Order Scaffolding + Workforce Readiness */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.higherOrderScaffolding?.length > 0 && (
                <div className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="higher-order-scaffolding">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-violet-400" />
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Think Beyond the Assessment</h3>
                  </div>
                  <ul className="space-y-2">{result.higherOrderScaffolding.map((q, i) => <li key={i} className="text-xs text-zinc-300 leading-relaxed">{q}</li>)}</ul>
                </div>
              )}
              {result.workforceReadiness && (
                <div className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="workforce-readiness">
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap size={14} className="text-cyan-400" />
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Workforce Readiness</h3>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">{result.workforceReadiness}</p>
                </div>
              )}
            </div>

            {/* Hidden Expectations + Success Tips */}
            <div className="grid md:grid-cols-2 gap-4">
              {result.hiddenExpectations?.length > 0 && (
                <div className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="hidden-expectations">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Hidden Expectations</h3>
                  </div>
                  <ul className="space-y-2">{result.hiddenExpectations.map((exp, i) => <li key={i} className="text-xs text-zinc-300 leading-relaxed">{exp}</li>)}</ul>
                </div>
              )}
              {result.successTips?.length > 0 && (
                <div className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="success-tips">
                  <div className="flex items-center gap-2 mb-3">
                    <Star size={14} className="text-emerald-400" />
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">What Separates HD from D</h3>
                  </div>
                  <ul className="space-y-2">{result.successTips.map((tip, i) => <li key={i} className="text-xs text-zinc-300 leading-relaxed">{tip}</li>)}</ul>
                </div>
              )}
            </div>

            <AiDisclaimer />
            <FeedbackWidget toolName="Assessment Scaffolder" sessionId={`scaffolder_${Date.now()}`} />
            <NextStepSuggestion toolName="Assessment Scaffolder" />
          </div>
        )}
        <RecentToolOutputs toolName="Assessment Scaffolder" />
      </div>
    </div>
  );
};

export default AssessmentScaffolder;
