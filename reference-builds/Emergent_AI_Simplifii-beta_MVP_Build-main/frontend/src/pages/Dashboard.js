import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import ActivityFeed from '../components/ActivityFeed';
import StreakWidget from '../components/StreakWidget';
import UniIntel from '../components/UniIntel';
import SemesterProgress from '../components/SemesterProgress';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { LabSidebarCard, LabSuggestModal, LabReportModal } from '../pages/LabPage';
import axios from 'axios';
import { FileText, Upload, Sparkles, ArrowRight, CheckCircle2, BookOpen, CreditCard, Timer, BookMarked, Bell, AlertTriangle, Star, TrendingUp, Eye, Zap, Clock, ChevronRight, X, Brain, Play, MessageSquare, GraduationCap } from 'lucide-react';
import { UNIVERSITY_GROUPS, STUDY_YEARS } from '../utils/universities';

const toolColorMap = {
  'Brief Simplifier': 'text-emerald-400 bg-emerald-500/10',
  'Rubric Simplifier': 'text-cyan-400 bg-cyan-500/10',
  'Essay Scorer': 'text-violet-400 bg-violet-500/10',
  'Humaniser': 'text-amber-400 bg-amber-500/10',
  'Assessment Scaffolder': 'text-blue-400 bg-blue-500/10',
  'Hidden Curriculum Decoder': 'text-emerald-400 bg-emerald-500/10',
  'Executive Function Planner': 'text-cyan-400 bg-cyan-500/10',
  'Concept Visualiser': 'text-violet-400 bg-violet-500/10',
  'Course Planner': 'text-rose-400 bg-rose-500/10',
};

const RecentActivity = () => {
  const [entries, setEntries] = useState([]);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await axios.get(`${API}/history?limit=5`, { withCredentials: true });
        setEntries(res.data.entries || []);
      } catch (err) { /* no history yet */ }
    };
    fetchRecent();
  }, [API]);

  if (entries.length === 0) return null;

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
    catch { return iso; }
  };

  return (
    <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6" data-testid="recent-activity">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-zinc-500" />
          <h2 className="text-sm font-bold text-white" style={{ fontFamily: 'Outfit' }}>Recent Activity</h2>
        </div>
        <Link to="/saved-outputs" className="text-xs text-emerald-400 hover:underline">View all</Link>
      </div>
      <div className="space-y-2">
        {entries.map((e) => (
          <Link key={e.history_id} to={`/saved-outputs/${e.history_id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all group" data-testid={`recent-${e.history_id}`}>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${toolColorMap[e.tool_name] || 'text-zinc-400 bg-zinc-500/10'}`}>{e.tool_name}</span>
            <span className="text-sm text-zinc-400 truncate flex-1">{e.input_summary}</span>
            <span className="text-[10px] text-zinc-600 whitespace-nowrap">{formatDate(e.created_at)}</span>
            <ChevronRight size={12} className="text-zinc-700 group-hover:text-zinc-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};

const tools = [
  { name: 'Brief Simplifier', desc: 'Upload your assessment brief and get a week-by-week action plan', path: '/brief-simplifier', icon: Upload, accent: 'emerald' },
  { name: 'Rubric Simplifier', desc: 'Translate grading criteria into plain language', path: '/rubric-simplifier', icon: FileText, accent: 'cyan' },
  { name: 'Essay Scorer', desc: 'Get formative feedback with score estimates', path: '/essay-scorer', icon: CheckCircle2, accent: 'violet' },
  { name: 'Humaniser', desc: 'Rewrite AI text to sound natural and human', path: '/humaniser', icon: Sparkles, accent: 'amber' },
  { name: 'Assessment Scaffolder', desc: 'Get structure breakdown and word allocation', path: '/assessment-scaffolder', icon: FileText, accent: 'blue' },
  { name: 'Course Planner', desc: 'Create unified semester calendar from multiple briefs', path: '/course-planner', icon: BookOpen, accent: 'rose' },
  { name: 'Hidden Curriculum Decoder', desc: 'Decode academic jargon and hidden expectations', path: '/hidden-curriculum', icon: BookMarked, accent: 'emerald' },
  { name: 'Executive Planner', desc: 'Pomodoro timer, task lists, and cognitive load tracking', path: '/executive-planner', icon: Timer, accent: 'cyan' },
  { name: 'Concept Visualiser', desc: 'Visual explanations with analogies, quizzes, and related concepts', path: '/concept-visualiser', icon: Eye, accent: 'violet' },
];

const accentMap = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', hover: 'hover:border-emerald-500/30', arrow: 'group-hover:text-emerald-400' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', hover: 'hover:border-cyan-500/30', arrow: 'group-hover:text-cyan-400' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', hover: 'hover:border-violet-500/30', arrow: 'group-hover:text-violet-400' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', hover: 'hover:border-amber-500/30', arrow: 'group-hover:text-amber-400' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', hover: 'hover:border-blue-500/30', arrow: 'group-hover:text-blue-400' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', hover: 'hover:border-rose-500/30', arrow: 'group-hover:text-rose-400' },
};

const notifIcons = {
  nudge: AlertTriangle,
  encouragement: TrendingUp,
  celebration: Star,
  complete: CheckCircle2,
  welcome: Bell,
};

const notifColors = {
  nudge: 'border-amber-500/20 bg-amber-500/5',
  encouragement: 'border-blue-500/20 bg-blue-500/5',
  celebration: 'border-emerald-500/20 bg-emerald-500/5',
  complete: 'border-emerald-500/20 bg-emerald-500/5',
  welcome: 'border-violet-500/20 bg-violet-500/5',
};

const notifIconColors = {
  nudge: 'text-amber-400',
  encouragement: 'text-blue-400',
  celebration: 'text-emerald-400',
  complete: 'text-emerald-400',
  welcome: 'text-violet-400',
};

const onboardingSteps = [
  { title: 'Upload Your Brief', desc: 'Start by uploading your assessment brief, rubric, or essay. Our AI reads the document and breaks it down for you.', icon: Upload },
  { title: 'Tell Us About You', desc: 'Select your university and year level so we can use the right terminology and grade scales in every output.', icon: GraduationCap, isForm: true },
  { title: 'Choose a Tool', desc: 'Pick the right tool for your task — simplify a rubric, scaffold your essay, decode hidden expectations, or score your draft.', icon: Sparkles },
  { title: 'Get Structured Output', desc: 'Every tool gives you clear, actionable, strengths-first output designed for how neurodivergent brains actually process information.', icon: CheckCircle2 },
  { title: 'Export & Track Progress', desc: 'Export your results as branded PDFs, track your saved outputs, and build momentum with streaks and celebrations.', icon: Star },
];

const OnboardingModal = ({ onClose, onSaveProfile }) => {
  const [step, setStep] = useState(0);
  const [university, setUniversity] = useState('');
  const [studyYear, setStudyYear] = useState('');
  const [faculty, setFaculty] = useState('');
  const current = onboardingSteps[step];
  const Icon = current.icon;

  const handleFinish = () => {
    if (university || studyYear || faculty) {
      onSaveProfile({ university, studyYear, faculty });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" data-testid="onboarding-modal">
      <div className="relative w-full max-w-md mx-4 bg-[#111113] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors" data-testid="onboarding-close">
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          {!current.isForm ? (
            <>
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Icon size={28} className="text-emerald-400" />
              </div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Step {step + 1} of {onboardingSteps.length}</div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }}>{current.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{current.desc}</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                <Icon size={28} className="text-violet-400" />
              </div>
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Step {step + 1} of {onboardingSteps.length}</div>
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }}>{current.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-5">{current.desc}</p>
              <div className="text-left space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">University</label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    data-testid="onboarding-university"
                    className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500/40 appearance-none"
                  >
                    <option value="">Select your university...</option>
                    {UNIVERSITY_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((uni) => (
                          <option key={uni} value={uni}>{uni}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Year Level</label>
                  <select
                    value={studyYear}
                    onChange={(e) => setStudyYear(e.target.value)}
                    data-testid="onboarding-year"
                    className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white text-sm focus:ring-2 focus:ring-violet-500/40 appearance-none"
                  >
                    <option value="">Select year...</option>
                    {STUDY_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Faculty / School</label>
                  <input
                    type="text"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    data-testid="onboarding-faculty"
                    placeholder="e.g. Business, Arts, Engineering..."
                    className="w-full px-4 py-3 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-2 focus:ring-violet-500/40"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 justify-center pb-3">
          {onboardingSteps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-400' : 'w-1.5 bg-white/[0.08]'}`} />
          ))}
        </div>

        <div className="flex gap-3 px-8 pb-8">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.06] text-zinc-300 rounded-xl text-sm font-medium transition-all" data-testid="onboarding-prev">
              Back
            </button>
          )}
          {step < onboardingSteps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-semibold transition-all" data-testid="onboarding-next">
              Next
            </button>
          ) : (
            <button onClick={handleFinish} className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-sm font-semibold transition-all" data-testid="onboarding-finish">
              Get Started
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const PainPointCard = ({ onSubmit, existingAnswer }) => {
  const [selected, setSelected] = useState(existingAnswer || '');
  const [submitted, setSubmitted] = useState(!!existingAnswer);
  const options = [
    'Understanding what markers want',
    'Getting started on assignments',
    'Managing my time across subjects',
    'Writing in the academic tone expected',
    'Knowing if my work is good enough',
  ];

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit(selected);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-[#111113] rounded-2xl border border-emerald-500/20 p-6" data-testid="pain-point-card">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Thanks! We'll tailor your experience.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111113] rounded-2xl border border-white/[0.06] p-6" data-testid="pain-point-card">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={16} className="text-violet-400" />
        <h3 className="text-sm font-semibold text-white" style={{ fontFamily: 'Outfit' }}>What's your biggest uni challenge right now?</h3>
      </div>
      <div className="space-y-2 mb-4">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => setSelected(opt)}
            data-testid={`pain-option-${opt.substring(0, 20).replace(/\s/g, '-').toLowerCase()}`}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
              selected === opt
                ? 'bg-violet-500/10 border border-violet-500/30 text-white'
                : 'bg-white/[0.02] border border-white/[0.04] text-zinc-400 hover:bg-white/[0.04]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={!selected}
        data-testid="pain-point-submit"
        className="w-full px-4 py-3 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Submit
      </button>
    </div>
  );
};

const ExplainerVideoCard = () => (
  <div className="bg-[#111113] rounded-2xl border border-white/[0.06] overflow-hidden" data-testid="explainer-video-card">
    <div className="relative aspect-video bg-gradient-to-br from-emerald-500/5 to-violet-500/5 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
          <Play size={28} className="text-emerald-400 ml-1" />
        </div>
        <p className="text-sm text-zinc-500">Explainer video coming soon</p>
      </div>
    </div>
    <div className="p-5">
      <h3 className="text-sm font-semibold text-white mb-1" style={{ fontFamily: 'Outfit' }}>How Simplifii Works</h3>
      <p className="text-xs text-zinc-500">A 90-second walkthrough of all 9 tools and how to get the most from your tickets.</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [savedBriefs, setSavedBriefs] = useState([]);
  const [recommendedTool, setRecommendedTool] = useState(null);
  const [quickWin, setQuickWin] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [recentOutputs, setRecentOutputs] = useState([]);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notifRes, briefsRes, goalsRes, quickWinRes] = await Promise.all([
          axios.get(`${API}/notifications`, { withCredentials: true }),
          axios.get(`${API}/briefs/history`, { withCredentials: true }),
          axios.get(`${API}/user/onboarding-goals`, { withCredentials: true }).catch(() => ({ data: {} })),
          axios.get(`${API}/user/quick-win`, { withCredentials: true }).catch(() => ({ data: {} })),
        ]);
        setNotifications(notifRes.data.notifications || []);
        setSavedBriefs(briefsRes.data || []);
        if (goalsRes.data.recommendation) setRecommendedTool(goalsRes.data.recommendation);
        if (quickWinRes.data.has_data) setQuickWin(quickWinRes.data);

        // Fetch last 3 outputs across all tools
        try {
          const histRes = await axios.get(`${API}/history`, { withCredentials: true });
          setRecentOutputs((histRes.data.entries || []).slice(0, 3));
        } catch {}
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchData();
  }, [API]);

  // Show onboarding modal for new users
  useEffect(() => {
    if (user && !user.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleCloseOnboarding = async () => {
    setShowOnboarding(false);
    try {
      await axios.post(`${API}/user/complete-onboarding`, {}, { withCredentials: true });
      await checkAuth();
    } catch { /* silent */ }
  };

  const handleSaveOnboardingProfile = async (profile) => {
    try {
      await axios.put(`${API}/user/profile`, profile, { withCredentials: true });
      await checkAuth();
    } catch { /* silent */ }
  };

  const handlePainPoint = async (painPoint) => {
    try {
      await axios.post(`${API}/user/pain-point`, { painPoint }, { withCredentials: true });
    } catch { /* silent */ }
  };

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} onSaveProfile={handleSaveOnboardingProfile} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome */}
        <div className="mb-8">
          <h1
            className="text-4xl sm:text-5xl font-bold text-white mb-3"
            style={{ fontFamily: 'Outfit' }}
            data-testid="dashboard-welcome"
          >
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-lg text-zinc-500">Ready to simplify your next assessment?</p>
        </div>

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* Welcome tickets banner for new users */}
        {user?.credits === 5 && !user?.has_purchased && savedBriefs.length === 0 && (
          <div className="mb-8 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl" data-testid="welcome-tickets-banner">
            <p className="text-sm text-emerald-400">
              Your 5 welcome tickets are ready to use &#127915; Start with the Brief Simplifier — it's our most popular tool.
            </p>
          </div>
        )}

        {/* Continue where you left off */}
        {recentOutputs.length > 0 && (
          <div className="mb-8" data-testid="continue-section">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Continue where you left off</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentOutputs.map(e => {
                const toolColors = { 'Brief Simplifier': 'text-blue-400', 'Rubric Simplifier': 'text-purple-400', 'Essay Scorer': 'text-amber-400', 'Humaniser': 'text-emerald-400', 'Assessment Scaffolder': 'text-cyan-400', 'Hidden Curriculum Decoder': 'text-rose-400', 'Concept Visualiser': 'text-orange-400', 'Executive Function Planner': 'text-teal-400', 'Course Planner': 'text-indigo-400' };
                const rawSummary = (e.input_summary || '').replace(/[^\x20-\x7E\u00C0-\u024F]/g, ' ').trim();
                const isUrl = /^https?:\/\//.test(rawSummary);
                const displayTitle = isUrl
                  ? `${e.tool_name} — ${(() => { try { return new Date(e.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); } catch { return 'Recent'; } })()}`
                  : (rawSummary.substring(0, 60) || `${e.tool_name} output`);
                return (
                  <button key={e.history_id} onClick={() => navigate(`/saved-outputs/${e.history_id}`)} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all text-left group" data-testid={`continue-${e.history_id}`}>
                    <p className={`text-xs font-medium ${toolColors[e.tool_name] || 'text-gray-400'} mb-1`}>{e.tool_name}</p>
                    <p className="text-sm text-gray-300 truncate">{displayTitle}</p>
                    <p className="text-xs text-gray-600 mt-1">{(() => { try { return new Date(e.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }); } catch { return ''; } })()}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Tool */}
        {recommendedTool && savedBriefs.length === 0 && (
          <Link
            to={`/${recommendedTool.tool}`}
            className="block mb-8 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/10 transition-all group"
            data-testid="recommended-tool-card"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles size={16} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Recommended for you</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{recommendedTool.name}</h3>
            <p className="text-sm text-zinc-400">{recommendedTool.reason}</p>
            <div className="flex items-center gap-1 mt-2 text-emerald-400 text-sm font-medium">
              Get started <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* Quick Win — nearest deadline recommendation */}
        {quickWin && quickWin.has_data && quickWin.recommended_tool && (
          <Link
            to={`/${quickWin.recommended_tool}`}
            className="block mb-8 p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl hover:bg-amber-500/10 transition-all group"
            data-testid="quick-win-card"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={16} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Quick Win</span>
            </div>
            <h3 className="text-base font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{quickWin.assessment}{quickWin.course ? ` (${quickWin.course})` : ''}</h3>
            <p className="text-sm text-zinc-400">{quickWin.action}</p>
            {quickWin.due && <p className="text-xs text-zinc-500 mt-1">Due: {quickWin.due}{quickWin.weighting ? ` — ${quickWin.weighting}` : ''}</p>}
            <div className="flex items-center gap-1 mt-2 text-amber-400 text-sm font-medium">
              Open {quickWin.recommended_name} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        )}

        {/* Semester Progress */}
        <div className="mb-8">
          <SemesterProgress />
        </div>

        {/* Smart Notifications */}
        {notifications.length > 0 && (
          <div className="mb-8 space-y-2" data-testid="smart-notifications">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Notifications</h2>
            </div>
            {notifications.slice(0, 3).map((notif, idx) => {
              const Icon = notifIcons[notif.type] || Bell;
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${notifColors[notif.type] || 'border-white/[0.06] bg-[#111113]'} ${notif.brief_id ? 'cursor-pointer hover:bg-white/[0.02]' : ''}`}
                  onClick={() => notif.brief_id && navigate(`/results/${notif.brief_id}`)}
                  data-testid={`notification-${idx}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon size={18} className={notifIconColors[notif.type] || 'text-zinc-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{notif.title}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{notif.message}</div>
                    {notif.progress_pct > 0 && notif.progress_pct < 100 && (
                      <div className="mt-2 w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${notif.progress_pct}%` }} />
                      </div>
                    )}
                  </div>
                  {notif.brief_id && <ArrowRight size={14} className="text-zinc-600 flex-shrink-0 mt-1" />}
                </div>
              );
            })}
          </div>
        )}

        {/* Saved Briefs */}
        {savedBriefs.length > 0 && (
          <div className="mb-8" data-testid="saved-briefs-section">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={16} className="text-zinc-500" />
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Your Saved Briefs</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedBriefs.slice(0, 6).map((brief) => {
                const progress = brief.progress || {};
                const output = brief.output_json || {};
                const weeks = output.weeks || [];
                const weeklyPlan = output.weeklyPlan || {};
                const totalTasks = weeks.length > 0
                  ? weeks.reduce((sum, w) => sum + (w.beginning?.length || 0) + (w.throughout?.length || 0) + (w.end?.length || 0), 0)
                  : Object.values(weeklyPlan).reduce((sum, tasks) => sum + tasks.length, 0);
                const completedTasks = Object.values(progress).filter(Boolean).length;
                const pct = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;

                return (
                  <div
                    key={brief.brief_id}
                    onClick={() => navigate(`/results/${brief.brief_id}`)}
                    className="p-4 bg-[#111113] border border-white/[0.06] rounded-xl hover:border-emerald-500/30 cursor-pointer transition-all duration-200 group"
                    data-testid={`saved-brief-${brief.brief_id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">{brief.assessment_title}</div>
                        <div className="text-xs text-zinc-600">{brief.assessment_type}</div>
                      </div>
                      <ArrowRight size={14} className="text-zinc-700 group-hover:text-emerald-400 transition-colors mt-1 flex-shrink-0" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-cyan-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-zinc-500">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity Feed + Tools */}
        <div className="grid lg:grid-cols-4 gap-4 mb-8">
          <div className="lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => {
              const Icon = tool.icon;
              const colors = accentMap[tool.accent];
              return (
                <Link
                  key={tool.path}
                  to={tool.path}
                  data-testid={`start-${tool.name.toLowerCase().replace(/\s/g, '-')}`}
                  className={`group p-5 rounded-2xl bg-[#111113] border border-white/[0.06] ${colors.hover} transition-all duration-300 cursor-pointer hover:bg-[#141416]`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={20} className={colors.text} />
                    </div>
                    <ArrowRight size={16} className={`text-zinc-700 ${colors.arrow} transition-all duration-200 group-hover:translate-x-0.5`} />
                  </div>
                  <h2 className="text-base font-semibold text-white mb-1" style={{ fontFamily: 'Outfit' }}>
                    {tool.name}
                  </h2>
                  <p className="text-xs text-zinc-500">{tool.desc}</p>
                </Link>
              );
            })}
          </div>
          <div className="lg:col-span-1 space-y-4">
            {!user?.painPoint && <PainPointCard onSubmit={handlePainPoint} existingAnswer={user?.painPoint} />}
            <ExplainerVideoCard />
            <StreakWidget />
            <LabSidebarCard onSuggest={() => setShowSuggestModal(true)} onReport={() => setShowReportModal(true)} />
            <UniIntel />
            <ActivityFeed />
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl leading-none">&#127915;</span>
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Tickets</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1" data-testid="tickets-display" style={{ fontFamily: 'Outfit' }}>{user?.credits}</div>
            <Link to="/credits" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Grab more &rarr;</Link>
          </div>
          <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={18} className="text-violet-400" />
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Output Modes</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>5</div>
            <div className="text-xs text-zinc-600">Structured, Visual, Simple, Deep, Interactive</div>
          </div>
          <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06]">
            <div className="flex items-center gap-3 mb-2">
              <FileText size={18} className="text-cyan-400" />
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Upload</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>10</div>
            <div className="text-xs text-zinc-600">PDFs per session</div>
          </div>
        </div>
      </div>
      <LabSuggestModal open={showSuggestModal} onClose={() => setShowSuggestModal(false)} />
      <LabReportModal open={showReportModal} onClose={() => setShowReportModal(false)} />
    </div>
  );
};

export default Dashboard;
