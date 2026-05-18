import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import AccessibilityToolbar from '../components/AccessibilityToolbar';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, TrendingUp, Heart, Flame, Target, ArrowRight, Loader2 } from 'lucide-react';

const moodEmoji = { great: 'bg-emerald-500/20 text-emerald-400', okay: 'bg-blue-500/20 text-blue-400', struggling: 'bg-amber-500/20 text-amber-400', overwhelmed: 'bg-red-500/20 text-red-400' };
const moodLabels = { great: 'Great', okay: 'Okay', struggling: 'Struggling', overwhelmed: 'Overwhelmed' };

const WeeklyDigest = () => {
  const { user } = useAuth();
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchDigest = async () => {
      try {
        const res = await axios.get(`${API}/digest/weekly`, { withCredentials: true });
        setDigest(res.data);
      } catch (err) {
        console.error('Failed to fetch digest:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDigest();
  }, [API]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B]">
        <Navigation />
        <AccessibilityToolbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="animate-spin text-emerald-400" size={32} /></div>
      </div>
    );
  }

  if (!digest) return null;

  return (
    <div className="min-h-screen bg-[#09090B]">
      <Navigation />
      <AccessibilityToolbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Calendar size={20} className="text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="digest-title">
                Your Week in Review
              </h1>
              <p className="text-sm text-zinc-500">{digest.period}</p>
            </div>
          </div>
        </div>

        {/* Motivational Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 mb-8" data-testid="digest-motivation">
          <p className="text-lg text-white font-medium" style={{ fontFamily: 'Outfit' }}>{digest.motivational_message}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-2xl bg-[#111113] border border-white/[0.06] text-center">
            <Flame size={20} className="text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="digest-streak">{digest.current_streak}</div>
            <div className="text-xs text-zinc-500">Day Streak</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#111113] border border-white/[0.06] text-center">
            <Target size={20} className="text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="digest-tasks">{digest.tasks_completed_this_week}</div>
            <div className="text-xs text-zinc-500">Tasks Done</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#111113] border border-white/[0.06] text-center">
            <Heart size={20} className="text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="digest-checkins">{digest.checkins_count}</div>
            <div className="text-xs text-zinc-500">Check-ins</div>
          </div>
          <div className="p-4 rounded-2xl bg-[#111113] border border-white/[0.06] text-center">
            <TrendingUp size={20} className="text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="digest-new-briefs">{digest.new_briefs.length}</div>
            <div className="text-xs text-zinc-500">New Briefs</div>
          </div>
        </div>

        {/* Mood Summary */}
        {digest.checkins_count > 0 && (
          <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06] mb-6" data-testid="digest-mood-summary">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Mood This Week</h3>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(digest.mood_summary).filter(([_, v]) => v > 0).map(([mood, count]) => (
                <div key={mood} className={`px-4 py-2 rounded-xl ${moodEmoji[mood]} text-sm font-medium`}>
                  {moodLabels[mood]}: {count}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Brief Progress */}
        {digest.briefs_progress.length > 0 && (
          <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06] mb-6" data-testid="digest-briefs-progress">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Assessment Progress</h3>
            <div className="space-y-4">
              {digest.briefs_progress.map((brief, idx) => (
                <Link key={idx} to={`/results/${brief.brief_id}`} className="block group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-white group-hover:text-emerald-400 transition-colors">{brief.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{brief.tasks_done}/{brief.tasks_total}</span>
                      <span className={`text-xs font-semibold ${brief.progress_pct === 100 ? 'text-emerald-400' : 'text-zinc-400'}`}>{brief.progress_pct}%</span>
                      <ArrowRight size={12} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${brief.progress_pct === 100 ? 'bg-emerald-500' : brief.progress_pct >= 50 ? 'bg-cyan-500' : 'bg-amber-500'}`} style={{ width: `${brief.progress_pct}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link to="/dashboard" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WeeklyDigest;
