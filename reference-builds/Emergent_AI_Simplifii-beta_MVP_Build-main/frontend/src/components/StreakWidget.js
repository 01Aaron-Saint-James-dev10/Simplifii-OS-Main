import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Flame, Calendar } from 'lucide-react';

const StreakWidget = () => {
  const [streak, setStreak] = useState(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const res = await axios.get(`${API}/streak`, { withCredentials: true });
        setStreak(res.data);
      } catch (err) {
        console.error('Failed to fetch streak:', err);
      }
    };
    fetchStreak();
  }, [API]);

  if (!streak) return null;

  return (
    <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06]" data-testid="streak-widget">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={18} className={streak.current_streak > 0 ? 'text-amber-400' : 'text-zinc-600'} />
          <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Study Streak</span>
        </div>
        <Link to="/weekly-digest" className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors">
          Weekly Digest
        </Link>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit' }} data-testid="streak-count">
          {streak.current_streak}
        </span>
        <span className="text-sm text-zinc-500 mb-1">{streak.current_streak === 1 ? 'day' : 'days'}</span>
      </div>

      {/* Mini heatmap - last 14 days */}
      <div className="flex gap-1 mb-2" data-testid="streak-heatmap">
        {streak.streak_dates.map((d, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${d.active ? 'bg-emerald-500' : 'bg-white/[0.04]'}`}
            title={d.date}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-600">Last 14 days</span>
        <span className="text-[10px] text-zinc-600">Best: {streak.longest_streak}d</span>
      </div>
      {!streak.checked_in_today && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[11px] text-amber-400">Check in today to keep your streak alive!</p>
        </div>
      )}
    </div>
  );
};

export default StreakWidget;
