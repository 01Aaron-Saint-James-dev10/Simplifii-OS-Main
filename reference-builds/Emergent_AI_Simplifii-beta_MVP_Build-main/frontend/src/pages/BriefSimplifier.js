import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketCostBar from '../components/TicketCostBar';
import AmbientSound from '../components/AmbientSound';
import { useAuth } from '../contexts/AuthContext';
import { exportToPdf } from '../components/PdfExport';
import { autosaveOutput } from '../utils/autosave';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import GuidedTour from '../components/GuidedTour';
import axios from 'axios';
import { Upload, FileText, AlertCircle, Loader2, Clock, X, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';
import HelpTooltip from '../components/HelpTooltip';

const briefTourSteps = [
  { target: '[data-testid="file-input"]', title: 'Upload Your Brief', description: 'Start by uploading your assessment brief PDF. You can upload up to 10 files at once — course outlines, rubrics, anything relevant.', position: 'bottom' },
  { target: '[data-testid="assessment-title-input"]', title: 'Assessment Title', description: 'If your PDF has enough info, we\'ll auto-fill this for you. Otherwise, type your assessment title here.', position: 'bottom' },
  { target: '[data-testid="assessment-type-select"]', title: 'Choose Assessment Type', description: 'Select what kind of assessment this is. This helps us tailor the output specifically for your task.', position: 'bottom' },
  { target: '[data-testid="submit-btn"]', title: 'Simplify!', description: 'Hit this button and we\'ll create a visual week-by-week action plan with checkboxes, tips, and AI guidance. Uses 1 ticket.', position: 'top' },
];

const BriefSimplifier = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentType, setAssessmentType] = useState('Essay');
  const [depthLevel, setDepthLevel] = useState('v2');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState('');
  const [recentBriefs, setRecentBriefs] = useState([]);
  const [extractedInfo, setExtractedInfo] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const fileInputRef = React.useRef(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchRecentBriefs = async () => {
      try {
        const response = await axios.get(`${API}/briefs/history`, { withCredentials: true });
        setRecentBriefs(response.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch recent briefs:', err);
      }
    };
    fetchRecentBriefs();
  }, [API]);

  const processNewFiles = async (incoming) => {
    const pdfFiles = incoming.filter(f => f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length < incoming.length) { setError('Only PDF files are accepted'); return; }
    const newFiles = [...files, ...pdfFiles].slice(0, 10);
    setFiles(newFiles);
    setError('');

    if (!assessmentTitle && newFiles.length > 0) {
      setExtracting(true);
      try {
        const formData = new FormData();
        newFiles.slice(0, 3).forEach(file => formData.append('files', file));
        const response = await axios.post(`${API}/briefs/extract-metadata`, formData, {
          withCredentials: true
        });
        const meta = response.data;
        if (meta.assessment_title) setAssessmentTitle(meta.assessment_title);
        if (meta.assessment_type) setAssessmentType(meta.assessment_type);
        setExtractedInfo(meta);
      } catch (err) {
        console.error('Auto-extract failed:', err);
      } finally {
        setExtracting(false);
      }
    }
  };

  const handleFileChange = async (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length === 0) return;
    await processNewFiles(selected);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > 0) await processNewFiles(dropped);
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));

  const [progressStatus, setProgressStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) { setError('Please upload at least one PDF file'); return; }
    if (!assessmentTitle.trim()) { setError('Please enter an assessment title'); return; }

    setLoading(true);
    setError('');
    setProgressStatus('Extracting your document...');

    // Pre-flight auth check
    try {
      await axios.get(`${API}/auth/me`, { withCredentials: true, timeout: 5000 });
    } catch {
      setError('Your session has expired. Please log in again.');
      setLoading(false);
      setProgressStatus('');
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('assessment_title', assessmentTitle);
    formData.append('assessment_type', assessmentType);
    formData.append('depth_level', depthLevel);

    try {
      // Stage A: Submit and get job_id
      const submitRes = await axios.post(`${API}/briefs/upload-async`, formData, {
        withCredentials: true,
        timeout: 15000,
      });
      const jobId = submitRes.data.job_id;
      setProgressStatus('Analysing your brief...');

      // Stage B+C: Poll for completion
      const pollForResult = async () => {
        for (let attempt = 0; attempt < 50; attempt++) {
          await new Promise(r => setTimeout(r, 2000));
          try {
            const poll = await axios.get(`${API}/briefs/job/${jobId}`, { withCredentials: true, timeout: 10000 });
            const st = poll.data.status;
            if (st === 'analysing') setProgressStatus('Analysing your brief...');
            else if (st === 'building') setProgressStatus('Building your action plan...');
            else if (st === 'complete' && poll.data.brief_id) return { ok: true, brief_id: poll.data.brief_id, data: poll.data };
            else if (st === 'failed') return { ok: false, error: poll.data.error, refund: poll.data.refund };
          } catch (pollErr) {
            if (pollErr?.response?.status === 404) return { ok: false, error: 'interrupted' };
          }
        }
        return { ok: false, error: 'timeout' };
      };

      const pr = await pollForResult();
      if (pr.ok) {
        setProgressStatus('');
        autosaveOutput('Brief Simplifier', pr.data, assessmentTitle, user);
        await checkAuth();
        setLoading(false);
        navigate(`/results/${pr.brief_id}`);
        return;
      }
      // Handle failure
      if (pr.error === 'interrupted') {
        setError('Processing was interrupted. No tickets were charged. Please try again.');
      } else if (pr.error === 'timeout') {
        setError('Processing is taking longer than expected. Please try again with a shorter document.');
      } else {
        const refund = pr.refund || {};
        const refundMsg = refund.new_balance >= 0 ? ` Your ${refund.amount || 3} tickets have been refunded (balance: ${refund.new_balance}).` : '';
        setError(`Processing failed.${refundMsg} Please try again. If this keeps happening, email simplifii.contact@gmail.com`);
      }
      await checkAuth();
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err.response?.data?.detail || 'Failed to process brief. Please try again.');
      }
    } finally {
      setLoading(false);
      setProgressStatus('');
    }
  };

  const assessmentTypes = ['Essay', 'Report', 'Research Project', 'Case Study', 'Literature Review', 'Presentation', 'Other'];

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <GuidedTour steps={briefTourSteps} storageKey="simplifii_tour_brief" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="page-title">
              Brief Simplifier
            </h1>
            <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
          </div>
          <p className="text-lg text-zinc-400 mt-3">
            Upload your assessment brief and get a structured, neuroinclusive action plan.
          </p>
          <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Brief Simplifier" />
        </div>

        <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload First - triggers auto-fill */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Upload PDFs (up to 10 files) *</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 bg-[#09090B]/50 ${
                  dragActive ? 'border-emerald-500/60 bg-emerald-500/[0.03]' : 'border-white/[0.08] hover:border-emerald-500/30'
                }`}
              >
                <input ref={fileInputRef} data-testid="file-input" type="file" accept=".pdf" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload size={40} className={`mx-auto mb-4 transition-colors ${dragActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  <p className="text-zinc-300 font-medium mb-2 text-sm">
                    {dragActive ? 'Drop your PDFs here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-zinc-600">
                    Assessment brief, course outline, rubric (PDF only)
                    {files.length > 0 && ` \u00b7 ${files.length}/10 uploaded`}
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="mt-4 space-y-2" data-testid="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                      <FileText size={18} className="text-emerald-400" />
                      <span className="text-sm text-zinc-300 flex-1">{file.name}</span>
                      <span className="text-xs text-zinc-600">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <button type="button" onClick={() => removeFile(index)} className="p-1 hover:bg-white/[0.04] rounded text-zinc-500 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {extracting && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-violet-500/5 border border-violet-500/10 rounded-lg" data-testid="extracting-indicator">
                  <Loader2 size={16} className="animate-spin text-violet-400" />
                  <span className="text-sm text-violet-300">Reading PDF and extracting assessment details...</span>
                </div>
              )}
            </div>

            {/* Auto-extracted Info */}
            {extractedInfo && (extractedInfo.subject_name || extractedInfo.due_date || extractedInfo.weighting || extractedInfo.word_count) && (
              <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl" data-testid="extracted-info">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Auto-Detected from PDF</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {extractedInfo.subject_name && (
                    <div><div className="text-[10px] text-zinc-500 uppercase">Subject</div><div className="text-sm text-white font-medium">{extractedInfo.subject_name}</div></div>
                  )}
                  {extractedInfo.word_count && (
                    <div><div className="text-[10px] text-zinc-500 uppercase">Word Count</div><div className="text-sm text-white font-medium">{extractedInfo.word_count}</div></div>
                  )}
                  {extractedInfo.due_date && (
                    <div><div className="text-[10px] text-zinc-500 uppercase">Due Date</div><div className="text-sm text-white font-medium">{extractedInfo.due_date}</div></div>
                  )}
                  {extractedInfo.weighting && (
                    <div><div className="text-[10px] text-zinc-500 uppercase">Weighting</div><div className="text-sm text-white font-medium">{extractedInfo.weighting}</div></div>
                  )}
                </div>
                {extractedInfo.key_topics && extractedInfo.key_topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {extractedInfo.key_topics.map((topic, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-white/[0.04] text-zinc-400 rounded text-xs">{topic}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                  Assessment Title *
                  {extractedInfo?.assessment_title && <span className="text-emerald-400 ml-2">(auto-filled)</span>}
                </label>
                <input
                  data-testid="assessment-title-input"
                  type="text"
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  placeholder="e.g., Marketing Strategy Essay"
                  className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-200 min-h-[48px] text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                  Assessment Type
                  {extractedInfo?.assessment_type && <span className="text-emerald-400 ml-2">(auto-filled)</span>}
                </label>
                <select
                  data-testid="assessment-type-select"
                  value={assessmentType}
                  onChange={(e) => setAssessmentType(e.target.value)}
                  className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all duration-200 min-h-[48px] text-sm"
                >
                  {assessmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Depth Level Selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">Analysis Depth <HelpTooltip text={"Quick Scan: key tasks only (1-2 min)\nDeep Dive: full week-by-week plan (2-3 min)\nExpert Analysis: maximum detail with cross-referencing (3-5 min)"} /></label>
              <div className="grid grid-cols-3 gap-3" data-testid="depth-selector">
                {[
                  { id: 'v1', name: 'Quick Scan', desc: 'Fast overview, key tasks only', icon: '\u26A1' },
                  { id: 'v2', name: 'Deep Dive', desc: 'Detailed week-by-week plan', icon: '\uD83D\uDD0D' },
                  { id: 'v3', name: 'Expert Analysis', desc: 'Maximum depth, cross-referencing', icon: '\uD83C\uDF93' },
                ].map(level => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setDepthLevel(level.id)}
                    data-testid={`depth-${level.id}`}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      depthLevel === level.id
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-white/[0.06] hover:border-white/[0.12] bg-[#09090B]/50'
                    }`}
                  >
                    <div className="text-lg mb-1">{level.icon}</div>
                    <div className="text-sm font-semibold text-white">{level.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div data-testid="error-alert" className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.04] space-y-3">
              <TicketCostBar toolKey="brief-simplifier" cost={3} />
              <div className="flex justify-end">
                <button
                  data-testid="submit-btn"
                  type="submit"
                  disabled={loading || files.length === 0 || !assessmentTitle.trim() || ((user?.credits ?? 0) < 3 && !user?.is_owner)}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-xl transition-all duration-200 min-h-[48px] disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {progressStatus || 'Processing...'}</>
                  ) : (
                    'Simplify Brief'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {recentBriefs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4" style={{ fontFamily: 'Outfit' }}>Recent Briefs</h2>
            <div className="space-y-2" data-testid="recent-briefs-list">
              {recentBriefs.map((brief) => (
                <div
                  key={brief.brief_id}
                  onClick={() => navigate(`/results/${brief.brief_id}`)}
                  className="flex items-center justify-between p-4 bg-[#111113] border border-white/[0.06] rounded-xl hover:border-white/[0.12] cursor-pointer transition-all duration-200"
                  data-testid={`recent-brief-${brief.brief_id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <FileText size={18} className="text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{brief.assessment_title}</div>
                      <div className="text-xs text-zinc-600">{brief.assessment_type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <Clock size={14} />
                    {new Date(brief.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <RecentToolOutputs toolName="Brief Simplifier" />
      </div>
    </div>
  );
};

export default BriefSimplifier;
