import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SemesterProgress = () => {
  const { user } = useAuth();
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${API}/user/quick-win`, { withCredentials: true });
        if (res.data.has_data) setPlanner(res.data);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  // No course planner data
  if (!planner) {
    return (
      <div className="p-5 bg-[#111113] rounded-2xl border border-white/[0.06]" data-testid="semester-progress-empty">
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={18} className="text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Semester Progress</h3>
        </div>
        <p className="text-xs text-zinc-400 mb-3">Set up your semester plan to see your progress here.</p>
        <Link to="/course-planner" className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors">
          Open Course Planner <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  // Calculate days to next deadline
  const dueStr = planner.due || '';
  let daysLeft = null;
  let urgencyColor = 'text-emerald-400';
  let urgencyBg = 'bg-emerald-500/10 border-emerald-500/20';

  if (dueStr && dueStr !== 'Not stated in document') {
    const weekMatch = dueStr.match(/week\s*(\d+)/i);
    if (weekMatch) {
      // Rough estimate: assume ~7 days per week from now
      daysLeft = parseInt(weekMatch[1]) * 7 - 14; // approximate
    } else {
      try {
        const dueDate = new Date(dueStr);
        if (!isNaN(dueDate.getTime())) {
          daysLeft = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        }
      } catch {}
    }
  }

  if (daysLeft !== null) {
    if (daysLeft < 7) { urgencyColor = 'text-red-400'; urgencyBg = 'bg-red-500/10 border-red-500/20'; }
    else if (daysLeft < 28) { urgencyColor = 'text-amber-400'; urgencyBg = 'bg-amber-500/10 border-amber-500/20'; }
  }

  const uni = user?.university || '';
  const termLabel = uni.includes('UNSW') ? 'Term' : 'Semester';

  return (
    <div className={`p-5 rounded-2xl border ${urgencyBg}`} data-testid="semester-progress">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Calendar size={18} className={urgencyColor} />
          <h3 className="text-sm font-bold text-white">Next Deadline</h3>
        </div>
        {daysLeft !== null && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${urgencyBg} ${urgencyColor}`}>
            {daysLeft <= 0 ? 'Overdue' : `${daysLeft} days`}
          </span>
        )}
      </div>
      <p className="text-sm text-white font-medium">{planner.assessment}</p>
      <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
        {planner.course && <span>{planner.course}</span>}
        {planner.weighting && <span>{planner.weighting}</span>}
        {dueStr && dueStr !== 'Not stated in document' && (
          <span className="flex items-center gap-1"><Clock size={10} />{dueStr}</span>
        )}
      </div>
      <div className="mt-3">
        <Link
          to={`/${planner.recommended_tool}`}
          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
          data-testid="semester-progress-action"
        >
          {planner.action} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default SemesterProgress;
