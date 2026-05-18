import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, CheckCircle2, Sparkles, BookOpen, Eye, Heart } from 'lucide-react';

const toolIcons = {
  brief: FileText,
  rubric: BookOpen,
  essay: CheckCircle2,
  humanise: Sparkles,
  scaffold: FileText,
  concept: Eye,
  planner: BookOpen,
  jargon: BookOpen,
  checkin: Heart,
};

const toolColors = {
  brief: 'text-emerald-400',
  rubric: 'text-cyan-400',
  essay: 'text-violet-400',
  humanise: 'text-amber-400',
  scaffold: 'text-blue-400',
  concept: 'text-violet-400',
  planner: 'text-rose-400',
  jargon: 'text-emerald-400',
  checkin: 'text-pink-400',
};

const toolDots = {
  brief: 'bg-emerald-400',
  rubric: 'bg-cyan-400',
  essay: 'bg-violet-400',
  humanise: 'bg-amber-400',
  scaffold: 'bg-blue-400',
  concept: 'bg-violet-400',
  planner: 'bg-rose-400',
  jargon: 'bg-emerald-400',
  checkin: 'bg-pink-400',
};

const ActivityFeed = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await axios.get(`${API}/activity/feed`);
        setFeed(res.data.feed || []);
      } catch (err) {
        console.error('Failed to fetch activity feed:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, [API]);

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-[#111113] border border-white/[0.06] animate-pulse" data-testid="activity-feed-loading">
        <div className="h-4 bg-white/[0.04] rounded w-48 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-3 bg-white/[0.04] rounded w-full" />)}
        </div>
      </div>
    );
  }

  if (feed.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#111113] border border-white/[0.06] overflow-hidden" data-testid="activity-feed">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
          <Users size={14} className="text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider" style={{ fontFamily: 'Outfit' }}>
          Live Activity
        </h3>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-[10px] text-zinc-600 font-medium">{feed.length} recent</span>
        </div>
      </div>

      <div className="px-5 pb-4 space-y-0">
        {feed.slice(0, 8).map((item, idx) => {
          const Icon = toolIcons[item.tool] || FileText;
          const dotColor = toolDots[item.tool] || 'bg-zinc-500';
          return (
            <div
              key={idx}
              data-testid={`activity-item-${idx}`}
              className="flex items-start gap-3 py-2.5 border-b border-white/[0.03] last:border-0 group"
            >
              <div className="flex flex-col items-center mt-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                {idx < Math.min(feed.length, 8) - 1 && (
                  <div className="w-px h-full bg-white/[0.04] mt-1" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {item.message}
                </p>
              </div>
              <span className="text-[10px] text-zinc-600 whitespace-nowrap flex-shrink-0 mt-0.5">
                {item.time_ago}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
