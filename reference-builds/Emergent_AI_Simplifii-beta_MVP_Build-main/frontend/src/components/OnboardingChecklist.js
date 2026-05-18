import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Circle, X, PartyPopper } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = [
  { id: 'brief', label: 'Upload your most confusing assessment brief to Brief Simplifier', link: '/brief-simplifier' },
  { id: 'pdf', label: 'Download your week-by-week plan as PDF', link: '/saved-outputs' },
  { id: 'rubric', label: 'Check your rubric with Rubric Simplifier', link: '/rubric-simplifier' },
  { id: 'referral', label: 'Share your referral code with one friend', link: '/settings' },
  { id: 'promo', label: 'Add your promo code if you have one', link: '/credits' },
];

const OnboardingChecklist = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [checked, setChecked] = useState({});
  const [sessionCount, setSessionCount] = useState(null);

  useEffect(() => {
    if (!user) return;
    // Check if user has dismissed or is a returning user
    const stored = localStorage.getItem(`simplifii_onboarding_${user.user_id}`);
    if (stored === 'dismissed') { setDismissed(true); return; }
    if (stored) { try { setChecked(JSON.parse(stored)); } catch {} }

    // Check session count
    (async () => {
      try {
        const res = await axios.get(`${API}/history?limit=50`, { withCredentials: true });
        const count = res.data?.entries?.length || 0;
        setSessionCount(count);
      } catch { setSessionCount(0); }
    })();
  }, [user]);

  if (!user || dismissed || sessionCount === null || sessionCount >= 3) return null;

  const completedCount = Object.values(checked).filter(Boolean).length;
  const allDone = completedCount === STEPS.length;

  const toggleStep = (id) => {
    const updated = { ...checked, [id]: !checked[id] };
    setChecked(updated);
    localStorage.setItem(`simplifii_onboarding_${user.user_id}`, JSON.stringify(updated));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(`simplifii_onboarding_${user.user_id}`, 'dismissed');
  };

  return (
    <div className="mb-8 p-5 bg-[#111113] border border-emerald-500/10 rounded-2xl" data-testid="onboarding-checklist">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-white" style={{ fontFamily: 'Outfit' }}>Your first 5 minutes with Simplifii</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Complete these steps to get the most out of your free tickets</p>
        </div>
        <button onClick={handleDismiss} className="p-1 text-zinc-600 hover:text-zinc-400 transition-colors" data-testid="dismiss-onboarding">
          <X size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/[0.04] rounded-full mb-4">
        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${(completedCount / STEPS.length) * 100}%` }} />
      </div>
      <p className="text-[10px] text-zinc-600 mb-3">{completedCount} of {STEPS.length} complete</p>

      {allDone ? (
        <div className="text-center py-4">
          <PartyPopper size={24} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-white mb-1">You're all set!</p>
          <p className="text-xs text-zinc-400 mb-3">Simplifii is ready to support you this semester.</p>
          <button onClick={handleDismiss} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-sm font-medium transition-colors" data-testid="onboarding-done-btn">
            Got it — let's go
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {STEPS.map(step => (
            <div key={step.id} className="flex items-center gap-3 group">
              <button onClick={() => toggleStep(step.id)} className="flex-shrink-0" data-testid={`onboarding-step-${step.id}`}>
                {checked[step.id]
                  ? <CheckCircle2 size={18} className="text-emerald-500" />
                  : <Circle size={18} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                }
              </button>
              <Link to={step.link} className={`text-sm transition-colors ${checked[step.id] ? 'text-zinc-600 line-through' : 'text-zinc-300 hover:text-emerald-400'}`}>
                {step.label}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingChecklist;
