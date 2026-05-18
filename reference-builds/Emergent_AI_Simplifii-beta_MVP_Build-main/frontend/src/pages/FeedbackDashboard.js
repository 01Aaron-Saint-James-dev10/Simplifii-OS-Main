import React, { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, ThumbsUp, Minus, ThumbsDown, Users, Search, MessageSquare, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import { Navigate } from 'react-router-dom';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ADMIN_EMAIL = 'aaronbugge@gmail.com';

const FeedbackDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      fetchSummary();
    }
  }, [user]);

  const fetchSummary = async () => {
    try {
      const res = await axios.get(`${API}/feedback/summary`, { withCredentials: true });
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load feedback summary', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <Navigation />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
        </div>
      </div>
    );
  }

  const s = summary || {};
  const totalWeek = s.totalThisWeek || 0;
  const trend = s.weekTrend || 0;
  const breakdown = s.reactionBreakdown || { positive: 0, neutral: 0, negative: 0 };
  const total = breakdown.positive + breakdown.neutral + breakdown.negative || 1;
  const toolScores = s.perToolSatisfaction || [];
  const recentTexts = s.recentOpenTexts || [];
  const uniBreakdown = s.universityBreakdown || [];
  const waitlistCount = s.waitlistCount || 0;
  const topWords = s.topWords || [];

  const filteredTexts = recentTexts.filter(t =>
    (t.text || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.toolName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a]" data-testid="feedback-dashboard">
      <Navigation />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="text-emerald-400" size={28} />
          <h1 className="text-2xl font-bold text-white">Feedback Dashboard</h1>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">This Week</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-white" data-testid="total-week">{totalWeek}</span>
              {trend !== 0 && (
                <span className={`flex items-center text-xs ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Positive</p>
            <span className="text-3xl font-bold text-emerald-400" data-testid="positive-pct">{Math.round((breakdown.positive / total) * 100)}%</span>
          </div>

          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Neutral</p>
            <span className="text-3xl font-bold text-amber-400" data-testid="neutral-pct">{Math.round((breakdown.neutral / total) * 100)}%</span>
          </div>

          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Negative</p>
            <span className="text-3xl font-bold text-red-400" data-testid="negative-pct">{Math.round((breakdown.negative / total) * 100)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Per-tool satisfaction */}
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-emerald-400" /> Per-Tool Satisfaction</h2>
            <div className="space-y-3">
              {toolScores.map((t) => (
                <div key={t.tool} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-40 truncate">{t.tool}</span>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${t.score}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">{t.score}%</span>
                </div>
              ))}
              {toolScores.length === 0 && <p className="text-xs text-gray-500">No feedback yet</p>}
            </div>
          </div>

          {/* University breakdown */}
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-sm font-semibold text-white mb-4">University Breakdown</h2>
            <div className="space-y-2">
              {uniBreakdown.map((u) => (
                <div key={u.university} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{u.university || 'Unknown'}</span>
                  <span className="text-gray-500">{u.count} entries</span>
                </div>
              ))}
              {uniBreakdown.length === 0 && <p className="text-xs text-gray-500">No data yet</p>}
            </div>
          </div>
        </div>

        {/* Co-design waitlist */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] mb-8 flex items-center gap-3">
          <Users size={20} className="text-emerald-400" />
          <span className="text-sm text-gray-300">Co-design waitlist:</span>
          <span className="text-lg font-bold text-white" data-testid="waitlist-count">{waitlistCount}</span>
          <span className="text-sm text-gray-500">students</span>
        </div>

        {/* Top words */}
        {topWords.length > 0 && (
          <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] mb-8">
            <h2 className="text-sm font-semibold text-white mb-3">Top 10 Words from Open Text</h2>
            <div className="flex flex-wrap gap-2">
              {topWords.map((w) => (
                <span key={w.word} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-300">
                  {w.word} <span className="text-gray-500">({w.count})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recent open texts */}
        <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquare size={16} className="text-emerald-400" /> Recent Open Text Responses</h2>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                data-testid="feedback-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/30"
              />
            </div>
          </div>
          <div className="space-y-3">
            {filteredTexts.slice(0, 5).map((t, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-emerald-400">{t.toolName}</span>
                  <span className="text-xs text-gray-600">{t.reaction}</span>
                  <span className="text-xs text-gray-600 ml-auto">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-300">{t.text}</p>
              </div>
            ))}
            {filteredTexts.length === 0 && <p className="text-xs text-gray-500">No open text responses yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
