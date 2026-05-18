import React, { useState, useMemo } from 'react';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import GuidedTour from '../components/GuidedTour';
import TicketCostBar from '../components/TicketCostBar';
import { useAuth } from '../contexts/AuthContext';
import { autosaveOutput } from '../utils/autosave';
import { exportToPdf } from '../components/PdfExport';
import FeedbackWidget from '../components/FeedbackWidget';
import NextStepSuggestion from '../components/NextStepSuggestion';
import ToolOutputBar from '../components/ToolOutputBar';
import axios from 'axios';
import {
  Calendar, Upload, Loader2, FileText, Clock, AlertTriangle, CheckCircle2,
  Download, ArrowLeft, X, Eye, Table2, Target, ListChecks, Sparkles,
  RefreshCw, ChevronDown, ChevronUp, Users, Repeat, BookOpen, Edit3, HelpCircle, Trash2, Plus, Save
} from 'lucide-react';
import ToolExplainerModal from '../components/ToolExplainerModal';
import RecentToolOutputs from '../components/RecentToolOutputs';

const tourSteps = [
  { target: '[data-testid="planner-upload-zone"]', title: 'Upload Any Course Document', description: 'Upload course outlines, unit guides, or assessment schedules from any university. We extract everything automatically.', position: 'top' },
];

const COURSE_COLOURS = [
  '#3B82F6', '#8B5CF6', '#F59E0B', '#06B6D4', '#EC4899', '#22C55E',
  '#EF4444', '#A855F7', '#14B8A6', '#F97316'
];

const CoursePlanner = () => {
  const { user, checkAuth } = useAuth();
  const [files, setFiles] = useState([]);
  const [phase, setPhase] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [extraction, setExtraction] = useState(null);
  const [semesterStart, setSemesterStart] = useState('');
  const [needsStartDate, setNeedsStartDate] = useState(false);
  const [activeView, setActiveView] = useState('timeline');
  const [studyPlan, setStudyPlan] = useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const [confirmedAssessments, setConfirmedAssessments] = useState([]);
  const [editSemesterDates, setEditSemesterDates] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const fileInputRef = React.useRef(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  // --- File Handling ---
  const processNewFiles = (incoming) => {
    const allowed = incoming.filter(f =>
      f.name.toLowerCase().endsWith('.pdf') ||
      f.name.toLowerCase().endsWith('.docx') ||
      f.name.toLowerCase().endsWith('.txt')
    );
    if (allowed.length < incoming.length) setError('Accepted formats: PDF, DOCX, TXT');
    setFiles(prev => [...prev, ...allowed].slice(0, 10));
    if (allowed.length > 0) setError('');
  };
  const handleFileChange = (e) => { processNewFiles(Array.from(e.target.files)); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === 'dragenter' || e.type === 'dragover'); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); processNewFiles(Array.from(e.dataTransfer.files)); };
  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // --- Phase 1: Extract ---
  const handleExtract = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoadingMsg('Uploading documents...');
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('files', f));
      const startResp = await axios.post(`${API}/course-planner/extract`, formData, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
      const { job_id } = startResp.data;
      if (!job_id) { setError('Failed to start extraction'); return; }

      // Poll
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusResp = await axios.get(`${API}/course-planner/extract/status/${job_id}`, { withCredentials: true });
        const { status, result, error: jobErr, progress } = statusResp.data;
        if (progress) setLoadingMsg(progress);
        if (status === 'complete' && result) {
          setExtraction(result);
          const intel = result.document_intelligence || {};
          const needsConfirm = intel.needs_semester_start_confirmation !== false;
          setNeedsStartDate(needsConfirm);
          if (!needsConfirm && intel.semester_start && intel.semester_start !== 'Not stated in document') {
            setSemesterStart(intel.semester_start);
          }
          setPhase('review');
          await checkAuth();
          return;
        }
        if (status === 'error') { setError(jobErr || 'Extraction failed'); return; }
      }
      setError('Extraction timed out. Please try again.');
    } catch (err) {
      setError(err.response?.data?.detail || "We couldn't extract course information from your document. Please check you've uploaded a course outline and try again.");
    } finally { setLoading(false); setLoadingMsg(''); }
  };

  // --- Phase 2: Confirm & Generate ---
  const handleConfirm = async () => {
    if (needsStartDate && !semesterStart) {
      setError('Please enter your semester start date so we can calculate deadlines.');
      return;
    }
    setError('');
    setLoading(true);
    setLoadingMsg('Saving...');
    try {
      await axios.post(`${API}/course-planner/confirm`, {
        extraction,
        semester_start: semesterStart || null
      }, { withCredentials: true });
      // Set up date confirmation with editable assessments
      setConfirmedAssessments((extraction.assessments || []).map(a => ({
        ...a,
        assessment_name: a.assessment_name || '',
        due_date: a.due_date || '',
        weighting: a.weighting || '',
        assessment_type: a.assessment_type || 'Other'
      })));
      setPhase('dateConfirm');
    } catch (err) {
      setError('Failed to confirm data');
    } finally { setLoading(false); setLoadingMsg(''); }
  };

  // --- Study Plan ---
  const loadStudyPlan = async () => {
    if (!extraction?.assessments?.length) return;
    setStudyPlanLoading(true);
    try {
      const resp = await axios.post(`${API}/course-planner/study-plan`, {
        assessments: extraction.assessments,
        semester_start: semesterStart
      }, { withCredentials: true });
      setStudyPlan(resp.data);
    } catch (err) {
      console.error('Study plan error:', err);
    } finally { setStudyPlanLoading(false); }
  };

  // --- ICS Export ---
  const handleDatesConfirmed = () => {
    // Apply confirmed assessments back to extraction
    setExtraction(prev => ({ ...prev, assessments: confirmedAssessments }));
    autosaveOutput('Course Planner', { ...extraction, assessments: confirmedAssessments }, extraction?.document_intelligence?.course_name || 'Course Plan', user);
    setPhase('output');
  };

  const updateConfirmedAssessment = (idx, field, value) => {
    setConfirmedAssessments(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const getUniNote = () => {
    const uni = user?.university || '';
    if (uni.includes('UNSW')) return 'Using UNSW trimester structure (Term 1/2/3)';
    if (uni.includes('USYD') || uni.includes('Sydney')) return 'Using semester structure (Semester 1/2)';
    return "Verify dates against your university's academic calendar";
  };

  const exportICS = async () => {
    try {
      const resp = await axios.post(`${API}/course-planner/export-ics`, { assessments: extraction.assessments }, { withCredentials: true, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'simplifii_semester.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) { console.error(err); }
  };

  // --- Edit Mode Functions ---
  const updateAssessment = (idx, field, value) => {
    setExtraction(prev => {
      const updated = { ...prev, assessments: prev.assessments.map((a, i) => i === idx ? { ...a, [field]: value } : a) };
      autosaveOutput('Course Planner', updated, prev.document_intelligence?.course_name || 'Course Plan', user);
      return updated;
    });
  };

  const deleteAssessment = (idx) => {
    setExtraction(prev => {
      const updated = { ...prev, assessments: prev.assessments.filter((_, i) => i !== idx) };
      autosaveOutput('Course Planner', updated, prev.document_intelligence?.course_name || 'Course Plan', user);
      return updated;
    });
  };

  const addAssessment = (weekNum) => {
    setExtraction(prev => {
      const newItem = {
        assessment_title: 'New Assessment',
        course_code: 'Not stated in document',
        due_date: weekNum ? `Week ${weekNum}` : 'Not stated in document',
        week_number: weekNum || null,
        weighting: 'Not stated in document',
        assessment_type: 'Other',
        is_ongoing: false,
        is_group_work: false,
        submission_format: 'Not stated in document',
        notes: ''
      };
      const updated = { ...prev, assessments: [...(prev.assessments || []), newItem] };
      autosaveOutput('Course Planner', updated, prev.document_intelligence?.course_name || 'Course Plan', user);
      return updated;
    });
  };

  // --- PDF Export ---
  const exportPlannerPdf = () => {
    if (!extraction) return;
    const totalWeeks = extraction.document_intelligence?.total_weeks || 13;
    const weekData = weeklyLoad;

    // Build sections for PDF
    const sections = [];

    // Summary section
    const summaryItems = [
      { title: `Courses: ${[...new Set(extraction.assessments.map(a => a.course_code).filter(c => c && c !== 'Not stated in document'))].join(', ') || 'Not specified'}` },
      { title: `Total Assessments: ${extraction.assessments?.length || 0}` },
      { title: `Semester: ${extraction.document_intelligence?.semester_start || 'Not stated'} to ${extraction.document_intelligence?.semester_end || 'TBC'}` },
    ];
    sections.push({ title: 'Semester Summary', items: summaryItems });

    // Assessment table section
    const tableItems = extraction.assessments.map(a => ({
      title: `${a.assessment_title} | ${a.course_code !== 'Not stated in document' ? a.course_code : '—'} | ${a.assessment_type} | Due: ${a.due_date !== 'Not stated in document' ? a.due_date : '—'} | ${a.weighting !== 'Not stated in document' ? a.weighting : '—'} | ${a.is_group_work ? 'Group' : 'Individual'}`
    }));
    sections.push({ title: 'All Assessments', items: tableItems });

    // Week by week sections
    for (let w = 1; w <= totalWeeks; w++) {
      const load = weekData[w] || { items: [], classes: [] };
      const weekItems = [];
      (load.classes || []).forEach(c => {
        weekItems.push({ title: `[Class] ${c.class_type || c.type} — ${c.day_of_week || c.day} ${c.time || ''} ${c.location && c.location !== 'Not stated in document' ? `@ ${c.location}` : ''}` });
      });
      load.items.filter(it => !it._isEvent).forEach(a => {
        weekItems.push({ title: `[Assessment] ${a.assessment_title} — ${a.assessment_type} — ${a.weighting !== 'Not stated in document' ? a.weighting : ''}` });
      });
      load.items.filter(it => it._isEvent).forEach(d => {
        weekItems.push({ title: `[Event] ${d.event}: ${d.date}` });
      });
      if (weekItems.length > 0 || (load.classes || []).length > 0) {
        const semStart = semesterStart || extraction.document_intelligence?.semester_start;
        let dateRange = '';
        if (semStart && semStart !== 'Not stated in document') {
          try {
            const s = new Date(semStart);
            const weekStart = new Date(s.getTime() + (w - 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
            dateRange = ` (${weekStart.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })})`;
          } catch {}
        }
        sections.push({ title: `Week ${w}${dateRange}`, items: weekItems.length > 0 ? weekItems : [{ title: 'No items this week' }] });
      }
    }

    exportToPdf({
      studentName: user?.name || 'Student',
      toolName: 'Course Planner',
      date: new Date().toLocaleDateString('en-AU'),
      sections,
    });
  };

  // --- Derived Data ---
  const courseColourMap = useMemo(() => {
    if (!extraction?.assessments) return {};
    const codes = [...new Set(extraction.assessments.map(a => a.course_code).filter(c => c && c !== 'Not stated in document'))];
    const map = {};
    codes.forEach((c, i) => { map[c] = COURSE_COLOURS[i % COURSE_COLOURS.length]; });
    return map;
  }, [extraction]);

  const getColour = (a) => {
    const t = (a.assessment_type || '').toLowerCase();
    if (t === 'exam' || t === 'test' || t === 'mid-term') return '#EF4444';
    if (a.is_ongoing) return '#14B8A6';
    return courseColourMap[a.course_code] || '#6B7280';
  };

  const buckets = useMemo(() => {
    if (!extraction?.assessments) return { dueSoon: [], comingUp: [], plentyOfTime: [], ongoing: [] };
    const ongoing = extraction.assessments.filter(a => a.is_ongoing);
    const nonOngoing = extraction.assessments.filter(a => !a.is_ongoing);

    const dueSoon = [];
    const comingUp = [];
    const plentyOfTime = [];
    const now = new Date();

    const semStart = semesterStart || extraction.document_intelligence?.semester_start;
    let semStartDate = null;
    if (semStart && semStart !== 'Not stated in document') {
      try { semStartDate = new Date(semStart); if (isNaN(semStartDate.getTime())) semStartDate = null; } catch { semStartDate = null; }
    }

    nonOngoing.forEach(a => {
      const due = (a.due_date || '').trim();
      if (!due || due === 'Not stated in document' || due.toLowerCase().includes('tba') || due.toLowerCase().includes('to be confirmed')) {
        plentyOfTime.push(a);
        return;
      }

      // Calculate days until due
      let daysUntil = null;

      // Try parsing "Week X" relative to semester start
      const weekMatch = due.match(/week\s*(\d+)/i);
      if (weekMatch && semStartDate) {
        const weekNum = parseInt(weekMatch[1]);
        const dueDate = new Date(semStartDate.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000 + 4 * 24 * 60 * 60 * 1000); // Friday of that week
        daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      }

      // Try parsing as actual date
      if (daysUntil === null) {
        try {
          let parsed = new Date(due);
          if (isNaN(parsed.getTime())) {
            // Try DD/MM/YYYY
            const ddmm = due.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (ddmm) {
              const yr = ddmm[3].length === 2 ? '20' + ddmm[3] : ddmm[3];
              parsed = new Date(`${yr}-${ddmm[2].padStart(2, '0')}-${ddmm[1].padStart(2, '0')}`);
            }
          }
          if (!isNaN(parsed.getTime())) {
            daysUntil = Math.ceil((parsed - now) / (1000 * 60 * 60 * 24));
          }
        } catch {}
      }

      // Exam period → assume end of semester
      if (daysUntil === null && /exam\s*period|final\s*exam/i.test(due)) {
        daysUntil = 60; // far enough to be "plenty of time"
      }

      // Categorise by days
      if (daysUntil !== null) {
        a._daysUntilDue = daysUntil;
        if (daysUntil < 0) plentyOfTime.push(a); // past due
        else if (daysUntil <= 14) dueSoon.push(a);
        else if (daysUntil <= 28) comingUp.push(a);
        else plentyOfTime.push(a);
      } else {
        plentyOfTime.push(a);
      }
    });

    return { dueSoon, comingUp, plentyOfTime, ongoing };
  }, [extraction, semesterStart]);

  // Parse week_range like "Weeks 1-13" or "Weeks 2-6" into [start, end]
  const parseWeekRange = (range) => {
    if (!range || range === 'Not stated in document') return null;
    const match = range.match(/(\d+)\s*[-–to]+\s*(\d+)/);
    if (match) return [parseInt(match[1]), parseInt(match[2])];
    const single = range.match(/(\d+)/);
    if (single) return [parseInt(single[1]), parseInt(single[1])];
    return null;
  };

  // Derive week number from due_date string or semester start
  const deriveWeekNumber = (a, totalWeeks) => {
    if (a.week_number != null && a.week_number > 0) return a.week_number;
    const due = (a.due_date || '').trim();
    if (!due || due === 'Not stated in document') return null;

    // "Week X" or "Monday Week X" or "end of Week X" patterns
    const weekMatch = due.match(/week\s*(\d+)/i);
    if (weekMatch) return parseInt(weekMatch[1]);

    // "Exam Period" / "Final Exam" → last week
    if (/exam\s*period|final\s*exam/i.test(due)) return totalWeeks;

    // Try parsing as a date and calculating week from semester start
    const semStart = semesterStart || extraction?.document_intelligence?.semester_start;
    if (semStart && semStart !== 'Not stated in document') {
      try {
        const startDate = new Date(semStart);
        // Try multiple date formats
        let dueDate = new Date(due);
        if (isNaN(dueDate.getTime())) {
          // Try DD/MM/YYYY
          const ddmm = due.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
          if (ddmm) dueDate = new Date(`${ddmm[3]}-${ddmm[2].padStart(2, '0')}-${ddmm[1].padStart(2, '0')}`);
        }
        if (isNaN(dueDate.getTime())) {
          // Try "17 October 2025" or "Oct 17" etc
          const parsed = Date.parse(due);
          if (!isNaN(parsed)) dueDate = new Date(parsed);
        }
        if (!isNaN(startDate.getTime()) && !isNaN(dueDate.getTime())) {
          const diffDays = (dueDate - startDate) / (1000 * 60 * 60 * 24);
          const week = Math.ceil(diffDays / 7);
          if (week >= 1 && week <= totalWeeks) return week;
          if (week > totalWeeks) return totalWeeks;
        }
      } catch {}
    }
    return null;
  };

  const weeklyLoad = useMemo(() => {
    if (!extraction?.assessments) return {};
    const weeks = {};
    const totalWeeks = extraction.document_intelligence?.total_weeks || 13;
    for (let w = 1; w <= totalWeeks; w++) weeks[w] = { items: [], count: 0, classes: [] };
    extraction.assessments.forEach(a => {
      const wk = deriveWeekNumber(a, totalWeeks);
      if (wk && weeks[wk]) {
        weeks[wk].items.push(a);
        weeks[wk].count++;
      }
    });
    // Add important dates
    (extraction.important_dates || []).forEach(d => {
      const wk = d.week_number || deriveWeekNumber(d, totalWeeks);
      if (wk && weeks[wk]) {
        weeks[wk].items.push({ ...d, _isEvent: true });
      }
    });
    // Add scheduled classes to matching weeks
    (extraction.scheduled_classes || []).forEach(c => {
      const range = parseWeekRange(c.week_range);
      const start = range ? range[0] : 1;
      const end = range ? range[1] : totalWeeks;
      for (let w = start; w <= end && w <= totalWeeks; w++) {
        if (weeks[w]) {
          weeks[w].classes.push(c);
        }
      }
    });
    return weeks;
  }, [extraction, semesterStart]);

  const getLoadIcon = (count) => {
    if (count === 0) return { emoji: '\u{1F7E2}', label: 'Light', cls: 'text-emerald-400' };
    if (count <= 2) return { emoji: '\u{1F7E1}', label: 'Moderate', cls: 'text-amber-400' };
    if (count === 3) return { emoji: '\u{1F7E0}', label: 'Heavy', cls: 'text-orange-400' };
    return { emoji: '\u{1F534}', label: 'Critical', cls: 'text-red-400' };
  };

  const specialWeeks = useMemo(() => {
    const flags = {};
    (extraction?.important_dates || []).forEach(d => {
      const ev = (d.event || '').toLowerCase();
      if (ev.includes('flexibility') || ev.includes('study') || ev.includes('reading') || ev.includes('break')) {
        if (d.week_number) flags[d.week_number] = d.event;
      }
    });
    return flags;
  }, [extraction]);

  // --- Render Helpers ---
  const AssessmentCard = ({ a, compact, assessmentIdx }) => {
    const [editing, setEditing] = useState(false);

    if (editMode && editing) {
      return (
        <div className="p-4 bg-[#111113] rounded-xl border-l-4 border-amber-500 space-y-2" data-testid={`edit-assessment-${assessmentIdx}`}>
          <input value={a.assessment_title} onChange={(e) => updateAssessment(assessmentIdx, 'assessment_title', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30" placeholder="Assessment name" />
          <div className="grid grid-cols-3 gap-2">
            <input type="text" value={a.due_date !== 'Not stated in document' ? a.due_date : ''} onChange={(e) => updateAssessment(assessmentIdx, 'due_date', e.target.value || 'Not stated in document')} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30" placeholder="Due date" />
            <input type="text" value={a.weighting !== 'Not stated in document' ? String(a.weighting).replace(/[^0-9.]/g, '') : ''} onChange={(e) => updateAssessment(assessmentIdx, 'weighting', e.target.value ? e.target.value + '%' : 'Not stated in document')} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30" placeholder="Weight %" />
            <select value={a.assessment_type} onChange={(e) => updateAssessment(assessmentIdx, 'assessment_type', e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30">
              {['Essay', 'Report', 'Exam', 'Quiz', 'Presentation', 'Lab', 'Portfolio', 'Reflection', 'Participation', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <textarea value={a.notes || ''} onChange={(e) => updateAssessment(assessmentIdx, 'notes', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30 h-16 resize-none" placeholder="Notes" />
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-lg"><Save size={12} className="inline mr-1" />Done</button>
            <button onClick={() => { deleteAssessment(assessmentIdx); }} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg"><Trash2 size={12} className="inline mr-1" />Delete</button>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-4 bg-[#111113] rounded-xl border-l-4 transition-all hover:bg-[#141416] ${compact ? 'py-3' : ''}`} style={{ borderLeftColor: getColour(a) }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-white truncate">{a.assessment_title}</h4>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {a.course_code && a.course_code !== 'Not stated in document' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white/80" style={{ backgroundColor: getColour(a) + '30', color: getColour(a) }}>{a.course_code}</span>
              )}
              <span className="px-1.5 py-0.5 bg-white/[0.04] text-zinc-500 rounded text-[10px]">{a.assessment_type}</span>
              {a.weighting && a.weighting !== 'Not stated in document' && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">{a.weighting}</span>}
              {a.is_group_work && <span className="flex items-center gap-0.5 text-[10px] text-violet-400"><Users size={10} />Group</span>}
              {a.is_ongoing && <span className="flex items-center gap-0.5 text-[10px] text-teal-400"><Repeat size={10} />Ongoing</span>}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="text-right shrink-0">
              {a.week_number && <div className="px-2 py-1 rounded-lg border border-white/[0.08] font-bold text-white text-xs">Wk {a.week_number}</div>}
              {a.due_date && a.due_date !== 'Not stated in document' && (
                <div className="flex items-center gap-1 text-[10px] text-zinc-500 mt-1"><Clock size={10} />{a.due_date}</div>
              )}
            </div>
            {editMode && assessmentIdx != null && (
              <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-500 hover:text-amber-400 transition-all" data-testid={`edit-assessment-btn-${assessmentIdx}`}>
                <Edit3 size={12} />
              </button>
            )}
          </div>
        </div>
        {!compact && a.submission_format && a.submission_format !== 'Not stated in document' && (
          <p className="text-[10px] text-zinc-600 mt-2">{a.submission_format}</p>
        )}
      </div>
    );
  };

  // ===================== VIEWS =====================

  const TimelineView = () => {
    const totalWeeks = extraction?.document_intelligence?.total_weeks || 13;
    return (
      <div className="space-y-2">
        {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(w => {
          const load = weeklyLoad[w] || { items: [], count: 0, classes: [] };
          const totalItems = load.count + (load.classes?.length || 0);
          const icon = getLoadIcon(totalItems);
          const isSpecial = specialWeeks[w];
          const hasContent = load.items.length > 0 || (load.classes?.length || 0) > 0;
          const shouldAutoExpand = hasContent && expandedWeeks[w] === undefined;
          const isExpanded = shouldAutoExpand || expandedWeeks[w];
          return (
            <div key={w} className={`rounded-xl border transition-all ${isSpecial ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-white/[0.06] bg-[#111113]'}`}>
              <button
                onClick={() => setExpandedWeeks(prev => ({ ...prev, [w]: !prev[w] }))}
                className="w-full flex items-center justify-between px-5 py-3 text-left"
                data-testid={`week-${w}-header`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{icon.emoji}</span>
                  <span className="font-bold text-white text-sm">Week {w}</span>
                  {isSpecial && <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 bg-amber-500/10 rounded-full">{isSpecial}</span>}
                  <span className={`text-[10px] ${icon.cls}`}>
                    {load.count} assessment{load.count !== 1 ? 's' : ''}
                    {load.classes?.length > 0 && <> + {load.classes.length} class{load.classes.length !== 1 ? 'es' : ''}</>}
                    {' '} — {icon.label}
                  </span>
                </div>
                {hasContent ? (isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />) : null}
              </button>
              {isExpanded && hasContent && (
                <div className="px-5 pb-4 space-y-2">
                  {/* Scheduled Classes — show only in Week 1 as summary */}
                  {w === 1 && load.classes?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-medium mb-1">Weekly Classes</p>
                      {load.classes.map((c, i) => (
                        <div key={`cls-${i}`} className="flex items-center gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs flex-wrap" data-testid={`week-${w}-class-${i}`}>
                          <BookOpen size={12} className="text-indigo-400 shrink-0" />
                          <span className="text-indigo-300 font-medium">{c.class_type || c.type}</span>
                          {(c.course_code && c.course_code !== 'Not stated in document') && <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px]">{c.course_code}</span>}
                          <span className="text-zinc-400">{c.day_of_week || c.day}</span>
                          <span className="text-zinc-500">{c.time}</span>
                          {c.location && c.location !== 'Not stated in document' && <span className="text-zinc-600">{c.location}</span>}
                          <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[10px]">Recurring weekly</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Assessments with edit support */}
                  {load.items.filter(it => !it._isEvent).map((a, i) => {
                    const globalIdx = extraction.assessments.indexOf(a);
                    return <AssessmentCard key={i} a={a} compact assessmentIdx={globalIdx >= 0 ? globalIdx : null} />;
                  })}
                  {/* Important dates */}
                  {load.items.filter(it => it._isEvent).map((d, i) => (
                    <div key={`ev-${i}`} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg text-xs text-amber-300">{d.event}: {d.date}</div>
                  ))}
                  {/* Add new item button in edit mode */}
                  {editMode && (
                    <button onClick={() => addAssessment(w)} className="w-full flex items-center justify-center gap-1.5 p-2.5 border border-dashed border-white/[0.08] hover:border-emerald-500/30 rounded-lg text-xs text-zinc-500 hover:text-emerald-400 transition-all" data-testid={`add-item-week-${w}`}>
                      <Plus size={12} /> Add item to Week {w}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="planner-table-view">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium">Assessment</th>
            <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium">Course</th>
            <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium">Type</th>
            <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium">Due</th>
            <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium">Weight</th>
            <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium">Group</th>
            {editMode && <th className="text-left py-3 px-4 text-zinc-500 text-xs font-medium">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {extraction?.assessments?.map((a, i) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getColour(a) }} />
                  {editMode ? (
                    <input value={a.assessment_title} onChange={(e) => updateAssessment(i, 'assessment_title', e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white w-full" />
                  ) : (
                    <span className="text-white text-xs font-medium">{a.assessment_title}</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-zinc-400 text-xs">{a.course_code !== 'Not stated in document' ? a.course_code : '—'}</td>
              <td className="py-3 px-4 text-zinc-400 text-xs">
                {editMode ? (
                  <select value={a.assessment_type} onChange={(e) => updateAssessment(i, 'assessment_type', e.target.value)} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white">
                    {['Essay', 'Report', 'Exam', 'Quiz', 'Presentation', 'Lab', 'Portfolio', 'Reflection', 'Other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : a.assessment_type}
              </td>
              <td className="py-3 px-4 text-zinc-400 text-xs">
                {editMode ? (
                  <input value={a.due_date !== 'Not stated in document' ? a.due_date : ''} onChange={(e) => updateAssessment(i, 'due_date', e.target.value || 'Not stated in document')} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white w-24" />
                ) : (a.due_date !== 'Not stated in document' ? a.due_date : '—')}
              </td>
              <td className="py-3 px-4 text-zinc-400 text-xs">
                {editMode ? (
                  <input value={String(a.weighting !== 'Not stated in document' ? a.weighting : '').replace(/[^0-9.]/g, '')} onChange={(e) => updateAssessment(i, 'weighting', e.target.value ? e.target.value + '%' : 'Not stated in document')} className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white w-16" placeholder="%" />
                ) : (a.weighting !== 'Not stated in document' ? a.weighting : '—')}
              </td>
              <td className="py-3 px-4 text-xs">{a.is_group_work ? <span className="text-violet-400">Yes</span> : <span className="text-zinc-600">No</span>}</td>
              {editMode && (
                <td className="py-3 px-4">
                  <button onClick={() => deleteAssessment(i)} className="p-1 text-zinc-500 hover:text-red-400 transition-colors" data-testid={`delete-table-row-${i}`}><Trash2 size={14} /></button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {editMode && (
        <button onClick={() => addAssessment(null)} className="w-full flex items-center justify-center gap-1.5 p-3 border border-dashed border-white/[0.08] hover:border-emerald-500/30 rounded-lg text-xs text-zinc-500 hover:text-emerald-400 transition-all mt-3" data-testid="add-item-table">
          <Plus size={12} /> Add new assessment
        </button>
      )}
    </div>
  );

  const BucketView = () => (
    <div className="space-y-6" data-testid="planner-bucket-view">
      {buckets.dueSoon.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-red-400" /><h3 className="font-bold text-white text-sm">Due Soon (within 3 weeks)</h3><span className="text-xs text-red-400 font-mono">{buckets.dueSoon.length}</span></div>
          <div className="space-y-2">{buckets.dueSoon.map((a, i) => <AssessmentCard key={i} a={a} />)}</div>
        </div>
      )}
      {buckets.comingUp.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><Clock size={16} className="text-amber-400" /><h3 className="font-bold text-white text-sm">Coming Up (3-8 weeks)</h3><span className="text-xs text-amber-400 font-mono">{buckets.comingUp.length}</span></div>
          <div className="space-y-2">{buckets.comingUp.map((a, i) => <AssessmentCard key={i} a={a} />)}</div>
        </div>
      )}
      {buckets.plentyOfTime.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><CheckCircle2 size={16} className="text-emerald-400" /><h3 className="font-bold text-white text-sm">Plenty of Time (8+ weeks)</h3><span className="text-xs text-emerald-400 font-mono">{buckets.plentyOfTime.length}</span></div>
          <div className="space-y-2">{buckets.plentyOfTime.map((a, i) => <AssessmentCard key={i} a={a} />)}</div>
        </div>
      )}
      {buckets.ongoing.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3"><Repeat size={16} className="text-teal-400" /><h3 className="font-bold text-white text-sm">Ongoing</h3><span className="text-xs text-teal-400 font-mono">{buckets.ongoing.length}</span></div>
          <div className="space-y-2">{buckets.ongoing.map((a, i) => <AssessmentCard key={i} a={a} />)}</div>
        </div>
      )}
      {!extraction?.assessments?.length && <p className="text-zinc-500 text-sm text-center py-8">We couldn't extract course information from your document. Please check you've uploaded a course outline and try again.</p>}
    </div>
  );

  const DailyView = () => (
    <div className="space-y-4" data-testid="planner-daily-view">
      {studyPlan ? (
        <>
          <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
            <p className="text-sm text-zinc-300 leading-relaxed">{studyPlan.overallAdvice}</p>
          </div>
          {studyPlan.priorityOrder?.length > 0 && (
            <div className="p-4 bg-[#111113] border border-white/[0.06] rounded-xl">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Priority Order</h4>
              <ol className="space-y-1">{studyPlan.priorityOrder.map((p, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-zinc-300"><span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>{p}</li>
              ))}</ol>
            </div>
          )}
          {studyPlan.weeklyPlan?.map((w, i) => (
            <div key={i} className="p-4 bg-[#111113] border border-white/[0.06] rounded-xl">
              <h4 className="text-sm font-bold text-white mb-1">{w.week}</h4>
              <p className="text-xs text-emerald-400 mb-2">{w.focus}</p>
              <ul className="space-y-1 mb-2">{w.tasks?.map((t, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-zinc-400"><CheckCircle2 size={12} className="text-zinc-600 mt-0.5 shrink-0" />{t}</li>
              ))}</ul>
              {w.tip && <p className="text-[10px] text-zinc-500 italic">{w.tip}</p>}
            </div>
          ))}
        </>
      ) : (
        <div className="text-center py-12">
          <BookOpen size={40} className="text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm mb-4">Generate an AI study plan based on your real assessments</p>
          <button onClick={loadStudyPlan} disabled={studyPlanLoading} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-all text-sm disabled:opacity-50" data-testid="generate-study-plan-btn">
            {studyPlanLoading ? <><Loader2 size={16} className="animate-spin inline mr-2" />Generating...</> : <><Sparkles size={16} className="inline mr-2" />Generate AI Study Plan</>}
          </button>
        </div>
      )}
    </div>
  );

  // ===================== MAIN RENDER =====================
  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <GuidedTour steps={tourSteps} storageKey="simplifii_tour_planner" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="planner-heading">Course Planner</h1>
            <button onClick={() => setShowExplainer(true)} className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-emerald-400 transition-all" data-testid="tool-explainer-btn"><HelpCircle size={18} /></button>
          </div>
          <p className="text-lg text-zinc-400 mt-3">See your entire semester at a glance — no more surprise deadlines.</p>
          <ToolExplainerModal open={showExplainer} onClose={() => setShowExplainer(false)} toolName="Course Planner" />
        </div>

        {/* ========= PHASE: UPLOAD ========= */}
        {phase === 'upload' && (
          <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-8" data-testid="planner-upload-zone">
            <form onSubmit={handleExtract} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2 uppercase tracking-wider">Upload Course Documents (PDF, DOCX, TXT — up to 10)</label>
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all bg-[#09090B]/50 ${dragActive ? 'border-emerald-500/60 bg-emerald-500/[0.03]' : 'border-white/[0.08] hover:border-emerald-500/30'}`}
                >
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" multiple onChange={handleFileChange} className="hidden" id="planner-file-input" />
                  <label htmlFor="planner-file-input" className="cursor-pointer">
                    <Upload size={40} className={`mx-auto mb-4 transition-colors ${dragActive ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <p className="text-zinc-300 font-medium mb-2 text-sm">{dragActive ? 'Drop your files here' : 'Click to upload or drag and drop'}</p>
                    <p className="text-xs text-zinc-600">Course outlines, unit guides, assessment schedules — any format from any university</p>
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">{files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                      <FileText size={16} className="text-emerald-400" />
                      <span className="text-sm text-zinc-300 flex-1 truncate">{f.name}</span>
                      <span className="text-xs text-zinc-600">{(f.size / 1024).toFixed(0)} KB</span>
                      <button type="button" onClick={() => removeFile(i)} className="p-1 hover:bg-white/[0.04] rounded text-zinc-500 hover:text-red-400"><X size={14} /></button>
                    </div>
                  ))}</div>
                )}
              </div>
              {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm" data-testid="planner-error">{error}</div>}
              <div className="space-y-3">
                <TicketCostBar toolKey="course-planner" cost={3} />
                <button type="submit" disabled={loading || files.length === 0 || ((user?.credits ?? 0) < 3 && !user?.is_owner)} data-testid="submit-planner-btn"
                  className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 rounded-xl transition-all disabled:opacity-40 text-sm">
                  {loading ? <><Loader2 size={18} className="animate-spin" /> {loadingMsg || 'Extracting...'}</> : <><Eye size={18} /> Extract & Map Everything</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========= PHASE: REVIEW (Phase 1 Output) ========= */}
        {phase === 'review' && extraction && (
          <div className="space-y-6" data-testid="planner-review-phase">
            <div className="flex items-center justify-between">
              <button onClick={() => { setPhase('upload'); setExtraction(null); setFiles([]); }} className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg text-sm"><ArrowLeft size={16} />Upload New</button>
            </div>

            <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>What we found in your documents</h2>
              <p className="text-sm text-zinc-400">Review the data below, then confirm to generate your planner.</p>
            </div>

            {/* Document Intelligence */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-3">Document Intelligence</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'University', value: extraction.document_intelligence?.university },
                  { label: 'Term', value: extraction.document_intelligence?.term_label },
                  { label: 'Semester Start', value: extraction.document_intelligence?.semester_start },
                  { label: 'Total Weeks', value: extraction.document_intelligence?.total_weeks || 'Not stated' },
                ].map((item, i) => (
                  <div key={i} className="p-3 bg-[#09090B] rounded-lg">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{item.label}</p>
                    <p className="text-xs text-white font-medium mt-0.5">{item.value || 'Not stated in document'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Semester Start Prompt */}
            {needsStartDate && (
              <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl" data-testid="semester-start-prompt">
                <h3 className="text-sm font-bold text-amber-300 mb-2">When does your semester start?</h3>
                <p className="text-xs text-zinc-400 mb-3">We couldn't find the exact start date in your documents. Please enter it so we can calculate deadlines.</p>
                <input type="date" value={semesterStart} onChange={(e) => setSemesterStart(e.target.value)}
                  className="px-4 py-2.5 bg-[#09090B] border border-white/[0.08] rounded-lg text-white text-sm focus:ring-2 focus:ring-emerald-500/40"
                  data-testid="semester-start-input" />
              </div>
            )}

            {/* Assessments Table */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden" data-testid="extraction-assessments">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Assessments ({extraction.assessments?.length || 0})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-white/[0.04]">
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Title</th>
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Course</th>
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Type</th>
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Due</th>
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Week</th>
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Weight</th>
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Group</th>
                    <th className="text-left py-2 px-4 text-zinc-500 font-medium">Ongoing</th>
                  </tr></thead>
                  <tbody>{extraction.assessments?.map((a, i) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="py-2 px-4 text-white font-medium">{a.assessment_title}</td>
                      <td className="py-2 px-4 text-zinc-400">{a.course_code !== 'Not stated in document' ? a.course_code : '—'}</td>
                      <td className="py-2 px-4 text-zinc-400">{a.assessment_type}</td>
                      <td className="py-2 px-4 text-zinc-400">{a.due_date !== 'Not stated in document' ? a.due_date : '—'}</td>
                      <td className="py-2 px-4 text-zinc-400">{a.week_number ?? '—'}</td>
                      <td className="py-2 px-4 text-zinc-400">{a.weighting !== 'Not stated in document' ? a.weighting : '—'}</td>
                      <td className="py-2 px-4">{a.is_group_work ? <span className="text-violet-400">Yes</span> : <span className="text-zinc-600">No</span>}</td>
                      <td className="py-2 px-4">{a.is_ongoing ? <span className="text-teal-400">Yes</span> : <span className="text-zinc-600">No</span>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            {/* Scheduled Classes */}
            {extraction.scheduled_classes?.length > 0 && (
              <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Scheduled Classes ({extraction.scheduled_classes.length})</h3>
                <div className="space-y-2">{extraction.scheduled_classes.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#09090B] rounded-lg text-xs flex-wrap">
                    <span className="text-white font-medium">{c.class_type || c.type}</span>
                    {(c.course_code && c.course_code !== 'Not stated in document') && <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[10px]">{c.course_code}</span>}
                    <span className="text-zinc-400">{c.day_of_week || c.day}</span>
                    <span className="text-zinc-500">{c.time}</span>
                    {c.location && c.location !== 'Not stated in document' && <span className="text-zinc-600">{c.location}</span>}
                    {c.frequency && c.frequency !== 'Not stated in document' && <span className="text-zinc-500 text-[10px]">{c.frequency}</span>}
                    {c.week_range && c.week_range !== 'Not stated in document' && <span className="text-zinc-600 text-[10px]">{c.week_range}</span>}
                    {(c.attendance_required || c.is_mandatory) && <span className="text-amber-400 text-[10px]">Mandatory</span>}
                  </div>
                ))}</div>
              </div>
            )}

            {/* Important Dates */}
            {extraction.important_dates?.length > 0 && (
              <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">Important Dates ({extraction.important_dates.length})</h3>
                <div className="space-y-2">{extraction.important_dates.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-[#09090B] rounded-lg text-xs">
                    <span className="text-white">{d.event}</span>
                    <span className="text-zinc-400">{d.date !== 'Not stated in document' ? d.date : '—'}</span>
                  </div>
                ))}</div>
              </div>
            )}

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

            <button onClick={handleConfirm} disabled={loading} data-testid="confirm-extraction-btn"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 rounded-xl transition-all disabled:opacity-40 text-sm">
              {loading ? <><Loader2 size={18} className="animate-spin" />{loadingMsg}</> : <><CheckCircle2 size={18} />Looks good — generate my planner</>}
            </button>
          </div>
        )}

        {/* ========= PHASE: DATE CONFIRMATION ========= */}
        {phase === 'dateConfirm' && (
          <div className="space-y-6" data-testid="planner-date-confirm">
            <div className="p-6 bg-[#111113] rounded-2xl border border-white/[0.06]">
              <h2 className="text-lg font-bold text-white mb-1">Before you save — confirm your dates</h2>
              <p className="text-sm text-gray-400 mb-4">Check these dates match your actual timetable.</p>
              
              <div className="space-y-3 mb-6">
                {confirmedAssessments.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <input
                      data-testid={`confirm-name-${idx}`}
                      value={a.assessment_name}
                      onChange={(e) => updateConfirmedAssessment(idx, 'assessment_name', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30"
                      placeholder="Assessment name"
                    />
                    <input
                      data-testid={`confirm-date-${idx}`}
                      type="text"
                      value={a.due_date}
                      onChange={(e) => updateConfirmedAssessment(idx, 'due_date', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30"
                      placeholder="Due date"
                    />
                    <input
                      data-testid={`confirm-weight-${idx}`}
                      type="number"
                      value={String(a.weighting).replace(/[^0-9.]/g, '')}
                      onChange={(e) => updateConfirmedAssessment(idx, 'weighting', e.target.value + '%')}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30"
                      placeholder="Weight %"
                    />
                    <select
                      data-testid={`confirm-type-${idx}`}
                      value={a.assessment_type}
                      onChange={(e) => updateConfirmedAssessment(idx, 'assessment_type', e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/30"
                    >
                      {['Essay', 'Report', 'Exam', 'Presentation', 'Lab', 'Portfolio', 'Other'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {extraction?.document_intelligence?.semester_start && (
                <div className="mb-4 text-sm text-gray-400">
                  Semester: {extraction.document_intelligence.semester_start} to {extraction.document_intelligence.semester_end || 'TBC'}
                  {!editSemesterDates && (
                    <button onClick={() => setEditSemesterDates(true)} className="ml-2 text-emerald-400 hover:text-emerald-300 underline text-xs">
                      <Edit3 size={12} className="inline mr-1" />Edit these dates
                    </button>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mb-4">{getUniNote()}</p>

              <div className="flex gap-3">
                <button
                  data-testid="dates-confirmed-btn"
                  onClick={handleDatesConfirmed}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Dates look correct — Save my plan
                </button>
                <button
                  data-testid="dates-fix-btn"
                  onClick={() => {}}
                  className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.06] text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Fix the dates
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========= PHASE: OUTPUT (Phase 2) ========= */}
        {phase === 'output' && extraction && (
          <div className="space-y-6" data-testid="planner-output-phase">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button onClick={() => setPhase('review')} className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-lg text-sm"><ArrowLeft size={16} />Back to Review</button>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditMode(!editMode)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${editMode ? 'bg-amber-500 text-black' : 'bg-white/[0.04] hover:bg-white/[0.06] text-zinc-400'}`} data-testid="edit-plan-btn"><Edit3 size={14} />{editMode ? 'Done Editing' : 'Edit Plan'}</button>
                <button onClick={() => { setPhase('upload'); setExtraction(null); setFiles([]); setStudyPlan(null); }} className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-400 rounded-lg text-xs"><RefreshCw size={14} />New Upload</button>
                <button onClick={exportPlannerPdf} className="flex items-center gap-2 px-4 py-2 bg-white/[0.06] hover:bg-white/[0.08] text-zinc-300 rounded-lg text-sm font-medium" data-testid="export-planner-pdf-btn"><Download size={14} />PDF</button>
                <button onClick={exportICS} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-sm font-medium" data-testid="export-ics-btn"><Download size={14} />.ics</button>
              </div>
            </div>

            {/* Summary Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#111113] rounded-xl border-l-4 border-red-500/50 p-4">
                <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-red-400" /><span className="text-xs text-zinc-400">Due Soon</span></div>
                <div className="text-2xl font-bold text-red-400">{buckets.dueSoon.length}</div>
              </div>
              <div className="bg-[#111113] rounded-xl border-l-4 border-amber-500/50 p-4">
                <div className="flex items-center gap-2 mb-1"><Clock size={16} className="text-amber-400" /><span className="text-xs text-zinc-400">Coming Up</span></div>
                <div className="text-2xl font-bold text-amber-400">{buckets.comingUp.length}</div>
              </div>
              <div className="bg-[#111113] rounded-xl border-l-4 border-emerald-500/50 p-4">
                <div className="flex items-center gap-2 mb-1"><CheckCircle2 size={16} className="text-emerald-400" /><span className="text-xs text-zinc-400">Plenty of Time</span></div>
                <div className="text-2xl font-bold text-emerald-400">{buckets.plentyOfTime.length}</div>
              </div>
              <div className="bg-[#111113] rounded-xl border-l-4 border-teal-500/50 p-4">
                <div className="flex items-center gap-2 mb-1"><Repeat size={16} className="text-teal-400" /><span className="text-xs text-zinc-400">Ongoing</span></div>
                <div className="text-2xl font-bold text-teal-400">{buckets.ongoing.length}</div>
              </div>
            </div>

            {/* Colour Legend */}
            {Object.keys(courseColourMap).length > 0 && (
              <div className="flex flex-wrap items-center gap-3 px-1">
                {Object.entries(courseColourMap).map(([code, colour]) => (
                  <div key={code} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colour }} /><span className="text-[10px] text-zinc-400">{code}</span></div>
                ))}
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="text-[10px] text-zinc-400">Exams</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-teal-500" /><span className="text-[10px] text-zinc-400">Ongoing</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-[10px] text-zinc-400">Classes</span></div>
              </div>
            )}

            {/* View Tabs */}
            <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl" data-testid="planner-view-tabs">
              {[
                { id: 'timeline', label: 'Timeline', icon: Calendar },
                { id: 'table', label: 'Table', icon: Table2 },
                { id: 'buckets', label: 'Assessment Focus', icon: Target },
                { id: 'daily', label: 'AI Study Plan', icon: ListChecks },
              ].map(v => (
                <button key={v.id} onClick={() => setActiveView(v.id)} data-testid={`view-${v.id}`}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${activeView === v.id ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <v.icon size={14} />{v.label}
                </button>
              ))}
            </div>

            {/* View Content */}
            <div>
              {activeView === 'timeline' && <TimelineView />}
              {activeView === 'table' && <TableView />}
              {activeView === 'buckets' && <BucketView />}
              {activeView === 'daily' && <DailyView />}
            </div>
            <FeedbackWidget toolName="Course Planner" sessionId={`planner_${Date.now()}`} />
            <NextStepSuggestion toolName="Course Planner" />
            <RecentToolOutputs toolName="Course Planner" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePlanner;
