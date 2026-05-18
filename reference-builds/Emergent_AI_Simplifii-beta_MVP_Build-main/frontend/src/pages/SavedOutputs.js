import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { exportToPdf } from '../components/PdfExport';
import axios from 'axios';
import { ArrowLeft, Download, Clock, FileText, ChevronRight, RotateCcw, Trash2, CheckCircle2, AlertTriangle, Brain, Target, BookOpen, Lightbulb, Star, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TOOL_PATHS = {
  'Brief Simplifier': '/brief-simplifier',
  'Rubric Simplifier': '/rubric-simplifier',
  'Essay Scorer': '/essay-scorer',
  'Humaniser': '/humaniser',
  'Assessment Scaffolder': '/assessment-scaffolder',
  'Hidden Curriculum Decoder': '/hidden-curriculum',
  'Concept Visualiser': '/concept-visualiser',
  'Executive Function Planner': '/executive-planner',
  'Course Planner': '/course-planner',
};

const TOOL_COLORS = {
  'Brief Simplifier': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Rubric Simplifier': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Essay Scorer': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Humaniser': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Assessment Scaffolder': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Hidden Curriculum Decoder': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'Concept Visualiser': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Executive Function Planner': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Course Planner': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

const sanitize = (t) => (t || '').replace(/[^\x20-\x7E\u00C0-\u024F]/g, ' ').replace(/\s+/g, ' ').trim();
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

/* ────────── Tool-specific renderers ────────── */

const RubricOutput = ({ data }) => (
  <div className="space-y-4">
    {data.assessmentTitle && <h3 className="text-lg font-semibold text-white">{data.assessmentTitle}</h3>}
    {(data.criteria || []).map((c, i) => (
      <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h4 className="text-sm font-semibold text-white mb-2">{c.criterionName} {c.totalMarks ? `(${c.totalMarks})` : ''}</h4>
        {c.plainEnglish && <p className="text-xs text-gray-400 mb-3">{c.plainEnglish}</p>}
        <div className="space-y-2 mb-3">
          {(c.gradeBands || []).map((b, j) => (
            <div key={j} className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-xs font-semibold text-emerald-400">{b.band}</span>
              <p className="text-xs text-gray-300 mt-0.5">{b.whatItLooksLike || b.description || ''}</p>
            </div>
          ))}
        </div>
        {c.microTaskChecklist && (
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">Micro-tasks:</p>
            <ul className="space-y-0.5">{c.microTaskChecklist.map((t, k) => <li key={k} className="text-xs text-gray-400 flex items-start gap-1.5"><CheckCircle2 size={10} className="text-emerald-500 mt-0.5 flex-shrink-0" />{t}</li>)}</ul>
          </div>
        )}
      </div>
    ))}
    {data.normalisingMessage && <p className="text-xs text-gray-400 italic p-3 rounded-lg bg-white/[0.01] border border-white/5">{data.normalisingMessage}</p>}
  </div>
);

const EssayOutput = ({ data }) => (
  <div className="space-y-4">
    {data.overallFeedback && (
      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <p className="text-sm text-white font-semibold mb-1">Overall: {data.overallFeedback.overallBand}</p>
        <p className="text-xs text-gray-400">{data.overallFeedback.strongestAspect}</p>
      </div>
    )}
    {(data.criteriaScores || []).map((c, i) => (
      <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white font-medium">{c.criterionName}</span>
          <span className="text-xs text-emerald-400 font-semibold">{c.score}/{c.maxScore}</span>
        </div>
        <p className="text-xs text-gray-400">{c.feedback}</p>
      </div>
    ))}
  </div>
);

const HumaniserOutput = ({ data }) => (
  <div className="space-y-4">
    {data.whyThisMatters && <p className="text-sm text-gray-300 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">{data.whyThisMatters}</p>}
    {data.originalAiRisk != null && (
      <div className="flex items-center justify-center gap-4 py-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Original</p>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl border-2 text-xl font-bold ${data.originalAiRisk > 70 ? 'bg-red-500/10 border-red-500/30 text-red-400' : data.originalAiRisk >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>{data.originalAiRisk}%</div>
        </div>
        <ArrowRight size={20} className="text-emerald-400 mt-4" />
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">After</p>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl border-2 text-xl font-bold ${data.humanisedAiRisk > 70 ? 'bg-red-500/10 border-red-500/30 text-red-400' : data.humanisedAiRisk >= 40 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>{data.humanisedAiRisk}%</div>
        </div>
      </div>
    )}
    {data.humanised && (
      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h4 className="text-xs text-gray-500 font-semibold mb-2">Humanised Version</h4>
        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{data.humanised}</p>
      </div>
    )}
    {(data.changesTable || []).length > 0 && (
      <div className="space-y-2">
        <h4 className="text-xs text-gray-500 font-semibold">Changes Made</h4>
        {data.changesTable.map((c, i) => (
          <div key={i} className="p-2 rounded-lg bg-white/[0.01] border border-white/5 text-xs">
            <span className="text-red-400 line-through">{c.originalPhrase}</span> <span className="text-emerald-400">{c.humanisedVersion}</span>
            <p className="text-gray-500 mt-0.5">{c.reason}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ScaffolderOutput = ({ data }) => (
  <div className="space-y-3">
    {data.assignmentType && <p className="text-sm text-gray-400">{data.assignmentType}: {data.topic}</p>}
    {(data.suggestedStructure || []).map((s, i) => (
      <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white font-medium">{s.section}</span>
          <span className="text-xs text-emerald-400">{s.wordCount} words</span>
        </div>
        <p className="text-xs text-gray-400">{s.purpose || s.guidance || ''}</p>
      </div>
    ))}
  </div>
);

const GenericOutput = ({ data }) => {
  const renderValue = (key, val, depth = 0) => {
    if (val === null || val === undefined) return null;
    if (Array.isArray(val)) {
      return (
        <div key={key} className={depth === 0 ? 'mb-3' : 'ml-3'}>
          {depth === 0 && <h4 className="text-xs text-gray-500 font-semibold mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>}
          <ul className="space-y-1">
            {val.map((item, i) => (
              <li key={i} className="text-xs text-gray-300">
                {typeof item === 'object' ? <div className="p-2 rounded bg-white/[0.01] border border-white/5">{Object.entries(item).map(([k, v]) => <p key={k}><span className="text-gray-500">{k}:</span> {String(v)}</p>)}</div> : `- ${item}`}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    if (typeof val === 'object') {
      return (
        <div key={key} className={depth === 0 ? 'mb-3 p-3 rounded-lg border border-white/5 bg-white/[0.01]' : 'ml-3'}>
          {depth === 0 && <h4 className="text-xs text-gray-500 font-semibold mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>}
          {Object.entries(val).map(([k, v]) => renderValue(k, v, depth + 1))}
        </div>
      );
    }
    return <p key={key} className="text-xs text-gray-300 mb-1"><span className="text-gray-500">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(val)}</p>;
  };
  return <div>{Object.entries(data).map(([k, v]) => renderValue(k, v, 0))}</div>;
};

const BriefOutput = ({ data }) => (
  <div className="space-y-4">
    {data.assessment && <h3 className="text-lg font-semibold text-white">{data.assessment}</h3>}
    {data.simpleSummary && <p className="text-sm text-gray-300 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">{data.simpleSummary}</p>}
    {data.dueDate && <p className="text-xs text-gray-400">Due: <span className="text-white">{data.dueDate}</span></p>}
    {(data.keyRequirements || []).length > 0 && (
      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <h4 className="text-xs text-gray-500 font-semibold mb-2">Key Requirements</h4>
        <ul className="space-y-1">{data.keyRequirements.map((r, i) => <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5"><CheckCircle2 size={10} className="text-emerald-500 mt-0.5 flex-shrink-0" />{r}</li>)}</ul>
      </div>
    )}
    {(data.weeks || []).map((w, i) => (
      <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h4 className="text-sm font-semibold text-white mb-2">Week {w.weekNumber}: {w.theme}</h4>
        {['beginning', 'throughout', 'end'].map(phase => (w[phase] || []).length > 0 && (
          <div key={phase} className="mb-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{phase}</p>
            {w[phase].map((t, j) => (
              <div key={j} className="text-xs text-gray-300 mb-1">
                <span className="font-medium">{t.task}</span>
                {(t.subTasks || []).length > 0 && <ul className="ml-3 mt-0.5 space-y-0.5">{t.subTasks.map((s, k) => <li key={k} className="text-gray-500">{s}</li>)}</ul>}
              </div>
            ))}
          </div>
        ))}
      </div>
    ))}
    {(data.glossary || []).length > 0 && (
      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <h4 className="text-xs text-gray-500 font-semibold mb-2">Glossary</h4>
        {data.glossary.map((g, i) => <p key={i} className="text-xs text-gray-300 mb-1"><span className="text-emerald-400 font-medium">{g.term}:</span> {g.definition}</p>)}
      </div>
    )}
    {(data.finalChecklist || []).length > 0 && (
      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <h4 className="text-xs text-gray-500 font-semibold mb-2">Final Checklist</h4>
        <ul className="space-y-0.5">{data.finalChecklist.map((c, i) => <li key={i} className="text-xs text-gray-300 flex items-start gap-1.5"><CheckCircle2 size={10} className="text-emerald-500 mt-0.5 flex-shrink-0" />{c}</li>)}</ul>
      </div>
    )}
  </div>
);

const CoursePlannerOutput = ({ data }) => (
  <div className="space-y-4">
    {data.document_intelligence && (
      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <h4 className="text-xs text-gray-500 font-semibold mb-2">Course Information</h4>
        <p className="text-sm text-white">{data.document_intelligence.course_name || 'Course Plan'}</p>
        {data.document_intelligence.semester_start && <p className="text-xs text-gray-400">Semester: {data.document_intelligence.semester_start} — {data.document_intelligence.semester_end || 'TBC'}</p>}
      </div>
    )}
    {(data.assessments || []).length > 0 && (
      <div>
        <h4 className="text-xs text-gray-500 font-semibold mb-2">Assessments ({data.assessments.length})</h4>
        <div className="space-y-2">
          {data.assessments.map((a, i) => (
            <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div>
                <span className="text-sm text-white font-medium">{a.assessment_title}</span>
                <div className="flex gap-2 mt-0.5">
                  {a.course_code && a.course_code !== 'Not stated in document' && <span className="text-[10px] text-indigo-400">{a.course_code}</span>}
                  <span className="text-[10px] text-gray-500">{a.assessment_type}</span>
                  {a.weighting && a.weighting !== 'Not stated in document' && <span className="text-[10px] text-blue-400">{a.weighting}</span>}
                </div>
              </div>
              {a.due_date && a.due_date !== 'Not stated in document' && <span className="text-xs text-gray-400">{a.due_date}</span>}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const DecoderOutput = ({ data }) => (
  <div className="space-y-4">
    {data.normalisingMessage && <p className="text-sm text-emerald-300 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 italic">{data.normalisingMessage}</p>}
    {(data.decodedTerms || data.jargonDecoded || []).map((t, i) => (
      <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <span className="text-sm text-rose-400 font-medium">{t.term || t.phrase || t.jargon}</span>
        <p className="text-xs text-gray-300 mt-1">{t.meaning || t.translation || t.explanation || t.plainEnglish}</p>
      </div>
    ))}
    {(data.hiddenExpectations || []).map((h, i) => (
      <div key={i} className="p-3 rounded-lg border border-amber-500/10 bg-amber-500/5">
        <span className="text-xs text-amber-400 font-semibold">{h.expectation || h.rule || h.title}</span>
        <p className="text-xs text-gray-300 mt-0.5">{h.explanation || h.detail || h.description || ''}</p>
      </div>
    ))}
  </div>
);

const ConceptOutput = ({ data }) => (
  <div className="space-y-4">
    {data.concept && <h3 className="text-lg font-semibold text-white">{data.concept}</h3>}
    {data.simpleExplanation && (
      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h4 className="text-xs text-emerald-400 font-semibold mb-2 flex items-center gap-1.5"><Lightbulb size={12} /> Simple Explanation</h4>
        <p className="text-sm text-gray-300 leading-relaxed">{data.simpleExplanation}</p>
      </div>
    )}
    {data.whereItBreaksDown && (
      <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/5">
        <h4 className="text-xs text-amber-400 font-semibold mb-2 flex items-center gap-1.5"><AlertTriangle size={12} /> Where That Breaks Down</h4>
        <p className="text-sm text-gray-300 leading-relaxed">{data.whereItBreaksDown}</p>
      </div>
    )}
    {data.accurateVersion && (
      <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
        <h4 className="text-xs text-blue-400 font-semibold mb-2 flex items-center gap-1.5"><Brain size={12} /> Full Accurate Version</h4>
        <p className="text-sm text-gray-300 leading-relaxed">{data.accurateVersion}</p>
      </div>
    )}
    {(data.thinkingQuestions || data.deeperQuestions || []).length > 0 && (
      <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01]">
        <h4 className="text-xs text-gray-500 font-semibold mb-2">Thinking Questions</h4>
        <ul className="space-y-1">{(data.thinkingQuestions || data.deeperQuestions).map((q, i) => <li key={i} className="text-xs text-gray-300">- {q}</li>)}</ul>
      </div>
    )}
  </div>
);

const PlannerOutput = ({ data }) => (
  <div className="space-y-3">
    {(data.tasks || data.sessions || []).map((t, i) => (
      <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.01] flex items-center justify-between">
        <div>
          <span className="text-sm text-white">{t.task || t.name || t.title}</span>
          {t.duration && <span className="text-[10px] text-gray-500 ml-2">{t.duration} min</span>}
        </div>
        {t.priority && <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.priority === 'high' ? 'bg-red-500/10 text-red-400' : t.priority === 'medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{t.priority}</span>}
      </div>
    ))}
  </div>
);

const renderToolOutput = (toolName, data) => {
  if (!data) return <p className="text-sm text-gray-500">No output data</p>;
  if (toolName === 'Brief Simplifier') return <BriefOutput data={data} />;
  if (toolName === 'Rubric Simplifier') return <RubricOutput data={data} />;
  if (toolName === 'Essay Scorer') return <EssayOutput data={data} />;
  if (toolName === 'Humaniser') return <HumaniserOutput data={data} />;
  if (toolName === 'Assessment Scaffolder') return <ScaffolderOutput data={data} />;
  if (toolName === 'Hidden Curriculum Decoder') return <DecoderOutput data={data} />;
  if (toolName === 'Concept Visualiser') return <ConceptOutput data={data} />;
  if (toolName === 'Executive Function Planner') return <PlannerOutput data={data} />;
  if (toolName === 'Course Planner') return <CoursePlannerOutput data={data} />;
  return <GenericOutput data={data} />;
};

/* ────────── Single saved output view ────────── */
const SavedOutputDetail = () => {
  const { historyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/history/${historyId}`, { withCredentials: true });
        setEntry(res.data);
      } catch { }
      setLoading(false);
    })();
  }, [historyId]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a]"><Navigation /><div className="flex items-center justify-center h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" /></div></div>
  );
  if (!entry) return (
    <div className="min-h-screen bg-[#0a0a0a]"><Navigation /><div className="max-w-4xl mx-auto px-4 py-16 text-center"><p className="text-gray-400">Output not found</p><Link to="/saved-outputs" className="text-emerald-400 hover:underline text-sm mt-2 inline-block">Back to all outputs</Link></div></div>
  );

  const toolName = entry.tool_name || 'Unknown Tool';
  const toolPath = TOOL_PATHS[toolName] || '/dashboard';
  const output = entry.full_output || {};

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6 p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-between" data-testid="saved-output-banner">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Clock size={14} className="text-emerald-400" />
            <span>Saved output from {fmtDate(entry.created_at)}</span>
          </div>
          <Link to={toolPath} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1">
            Go to tool to run again <ArrowRight size={14} />
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/saved-outputs')} className="text-gray-400 hover:text-white"><ArrowLeft size={20} /></button>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${TOOL_COLORS[toolName] || 'bg-white/5 text-gray-400 border-white/10'}`}>{toolName}</span>
          <span className="text-sm text-gray-500">{sanitize(entry.input_summary)}</span>
        </div>

        <div className="mb-4 flex gap-2">
          <button onClick={() => exportToPdf({ studentName: user?.name, toolName, date: fmtDate(entry.created_at), rawOutput: output })} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white transition-colors" data-testid="export-saved-btn">
            <Download size={12} /> Export PDF
          </button>
        </div>

        {renderToolOutput(toolName, output)}
      </div>
    </div>
  );
};

/* ────────── All saved outputs list ────────── */
const SavedOutputsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/history`, { withCredentials: true });
        setEntries(res.data.entries || []);
      } catch { }
      setLoading(false);
    })();
  }, []);

  const toolNames = ['All', ...new Set(entries.map(e => e.tool_name).filter(Boolean))];
  const filtered = filter === 'All' ? entries : entries.filter(e => e.tool_name === filter);

  // Group by tool
  const grouped = {};
  filtered.forEach(e => {
    const t = e.tool_name || 'Other';
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(e);
  });

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/history/${id}`, { withCredentials: true });
      setEntries(prev => prev.filter(e => e.history_id !== id));
    } catch { }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="saved-outputs-page">
      <Navigation />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>My Outputs</h1>
          <span className="text-sm text-gray-500">{entries.length} saved</span>
        </div>

        {toolNames.length > 2 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {toolNames.map(t => (
              <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-all ${filter === t ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/[0.02] text-gray-400 border-white/10 hover:border-white/20'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" /></div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16">
            <FileText size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No saved outputs yet</p>
            <p className="text-gray-600 text-xs mt-1">Run any tool and your outputs will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([tool, items]) => (
              <div key={tool}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{tool}</h2>
                <div className="space-y-2">
                  {items.map(e => (
                    <div key={e.history_id} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border flex-shrink-0 ${TOOL_COLORS[tool] || 'bg-white/5 text-gray-400 border-white/10'}`}>{tool.split(' ')[0]}</span>
                      <button onClick={() => navigate(`/saved-outputs/${e.history_id}`)} className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-gray-300 truncate">{sanitize(e.input_summary) || 'Untitled'}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{fmtDate(e.created_at)}</p>
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(TOOL_PATHS[tool] || '/dashboard')} className="p-1.5 text-gray-500 hover:text-emerald-400" title="Re-run"><RotateCcw size={14} /></button>
                        <button onClick={() => handleDelete(e.history_id)} className="p-1.5 text-gray-500 hover:text-red-400" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ────────── Route wrapper ────────── */
const SavedOutputs = () => {
  const { historyId } = useParams();
  return historyId ? <SavedOutputDetail /> : <SavedOutputsList />;
};

export default SavedOutputs;
