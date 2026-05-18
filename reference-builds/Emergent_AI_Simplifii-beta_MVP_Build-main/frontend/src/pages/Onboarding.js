import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { GraduationCap, Brain, Zap, Eye, Heart, Puzzle, Check, Search, ArrowRight, Loader2, Sparkles } from 'lucide-react';

const NEUROTYPES = [
  { id: 'adhd', name: 'ADHD Brain', icon: Zap, color: 'violet', description: 'Hyperfocus mode, gamified progress, dopamine-hit micro-rewards', preferences: { showOneTaskAtTime: true, gamification: true, frequentBreaks: true, visualProgress: true } },
  { id: 'dyslexic', name: 'Dyslexic Brain', icon: Eye, color: 'blue', description: 'OpenDyslexic font always on, colour overlays, text-to-speech default', preferences: { font: 'OpenDyslexic', lineHeight: 1.8, ttsAutoplay: true } },
  { id: 'autistic', name: 'Autistic Brain', icon: Puzzle, color: 'emerald', description: 'Predictable structure, clear rules & patterns, no ambiguity', preferences: { consistentLayout: true, explicitInstructions: true, structuredData: true } },
  { id: 'anxious', name: 'Anxious Brain', icon: Heart, color: 'amber', description: 'No red urgency colours, reassurance prompts, positive framing', preferences: { hideDeadlineWarnings: true, reassuranceMessages: true, calmColors: true } },
  { id: 'multiple', name: 'Multiple / Not Sure', icon: Brain, color: 'cyan', description: 'Adaptive learning — AI personalises over time based on your usage', preferences: { adaptive: true, multiModal: true } },
];

const colorMap = {
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', ring: 'ring-violet-500/30' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', ring: 'ring-blue-500/30' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', ring: 'ring-amber-500/30' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', ring: 'ring-cyan-500/30' },
};

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [universities, setUniversities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUni, setSelectedUni] = useState(null);
  const [selectedNeurotype, setSelectedNeurotype] = useState(null);
  const [saving, setSaving] = useState(false);
  const [biggestChallenge, setBiggestChallenge] = useState('');
  const [successVision, setSuccessVision] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await axios.get(`${API}/universities`);
        setUniversities(res.data.universities);
      } catch (e) { console.error(e); }
    };
    fetchUniversities();
  }, [API]);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const res = await axios.get(`${API}/user/profile`, { withCredentials: true });
        if (res.data.onboarding_complete) navigate('/dashboard', { replace: true });
        else if (res.data.university) { setSelectedUni(res.data.university); setStep(2); }
      } catch (e) { console.error(e); }
    };
    checkProfile();
  }, [API, navigate]);

  const go8 = universities.filter(u => u.group === 'Go8');
  const others = universities.filter(u => u.group !== 'Go8');
  const filtered = searchQuery
    ? universities.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleUniSelect = async (uniName) => {
    setSelectedUni(uniName);
    try {
      await axios.post(`${API}/user/university`, { university: uniName }, { withCredentials: true });
    } catch (e) { console.error(e); }
  };

  const handleNeurotypeSelect = async (neurotype) => {
    setSelectedNeurotype(neurotype.id);
    setSaving(true);
    try {
      await axios.post(`${API}/user/neurotype`, { neurotype: neurotype.id, preferences: neurotype.preferences }, { withCredentials: true });
      setSaving(false);
      setStep(3);
    } catch (e) { console.error(e); setSaving(false); }
  };

  const handleGoalsSubmit = async () => {
    setSaving(true);
    try {
      const resp = await axios.post(`${API}/user/onboarding-goals`, {
        biggest_challenge: biggestChallenge,
        success_vision: successVision,
      }, { withCredentials: true });
      setRecommendation(resp.data.recommendation);
      await checkAuth();
      setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleSkip = async () => {
    if (step === 1) {
      await axios.post(`${API}/user/university`, { university: 'not_specified' }, { withCredentials: true });
      setStep(2);
    } else if (step === 2) {
      await axios.post(`${API}/user/neurotype`, { neurotype: 'multiple', preferences: { adaptive: true } }, { withCredentials: true });
      setStep(3);
    } else {
      await checkAuth();
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[100px]" />

      <div className="w-full max-w-3xl relative">
        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-emerald-500 text-black' : 'bg-white/[0.04] text-zinc-600'}`}>1</div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-emerald-500' : 'bg-white/[0.08]'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-emerald-500 text-black' : 'bg-white/[0.04] text-zinc-600'}`}>2</div>
          <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-emerald-500' : 'bg-white/[0.08]'}`} />
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-emerald-500 text-black' : 'bg-white/[0.04] text-zinc-600'}`}>3</div>
        </div>

        {/* Step 1: University */}
        {step === 1 && (
          <div className="fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
                Welcome to Simplifii, {user?.name?.split(' ')[0]}
              </h1>
              <p className="text-zinc-400">Which university are you studying at?</p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
              <input
                data-testid="university-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search universities..."
                className="w-full pl-11 pr-4 py-3 bg-[#111113] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 text-sm"
              />
              {searchQuery && filtered.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-[#111113] border border-white/[0.08] rounded-xl max-h-60 overflow-y-auto z-10 shadow-2xl">
                  {filtered.map((uni) => (
                    <button key={uni.id} onClick={() => { handleUniSelect(uni.name); setSearchQuery(''); }} className="w-full text-left px-4 py-3 hover:bg-white/[0.04] text-zinc-300 text-sm border-b border-white/[0.04] last:border-0 flex items-center justify-between">
                      <span>{uni.name}</span>
                      {uni.group && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">{uni.group}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Go8 Featured */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Group of Eight (Go8)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {go8.map((uni) => (
                  <button key={uni.id} onClick={() => handleUniSelect(uni.name)} data-testid={`uni-${uni.id}`}
                    className={`p-3 rounded-xl border text-left text-sm transition-all ${selectedUni === uni.name ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-white/[0.06] bg-[#111113] text-zinc-400 hover:border-white/[0.12]'}`}>
                    <div className="font-medium text-xs">{uni.name.replace('University of ', 'U of ').replace('Australian National University', 'ANU')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Others */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">All Universities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {others.map((uni) => (
                  <button key={uni.id} onClick={() => handleUniSelect(uni.name)} data-testid={`uni-${uni.id}`}
                    className={`p-3 rounded-xl border text-left text-sm transition-all ${selectedUni === uni.name ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300' : 'border-white/[0.06] bg-[#111113] text-zinc-400 hover:border-white/[0.12]'}`}>
                    <div className="font-medium text-xs">{uni.name}</div>
                    {uni.group && <div className="text-[10px] text-zinc-600 mt-0.5">{uni.group}</div>}
                  </button>
                ))}
              </div>
            </div>

            {selectedUni && (
              <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mb-4">
                <div className="flex items-center gap-2">
                  <Check size={18} className="text-emerald-400" />
                  <span className="text-emerald-300 text-sm font-medium">{selectedUni}</span>
                </div>
                <button onClick={() => setStep(2)} data-testid="continue-to-neurotype" className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-all">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            )}

            <button onClick={handleSkip} className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 py-2 transition-colors" data-testid="skip-university">
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2: Neurotype */}
        {step === 2 && (
          <div className="fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain size={32} className="text-violet-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
                How does your brain work best?
              </h1>
              <p className="text-zinc-400">Choose your neurotype for a personalised experience</p>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-6">
              {NEUROTYPES.map((type) => {
                const Icon = type.icon;
                const c = colorMap[type.color];
                const isSelected = selectedNeurotype === type.id;
                return (
                  <button key={type.id} onClick={() => handleNeurotypeSelect(type)} disabled={saving} data-testid={`neurotype-${type.id}`}
                    className={`text-left p-5 rounded-xl border-2 transition-all duration-200 disabled:opacity-50 ${isSelected ? `${c.border} ${c.bg} ring-2 ${c.ring}` : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.12]'}`}>
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center`}>
                        <Icon size={20} className={c.text} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Outfit' }}>{type.name}</h3>
                        {isSelected && <span className="inline-block px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full mt-1">Selected</span>}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{type.description}</p>
                  </button>
                );
              })}
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm mb-4">
                <Loader2 size={16} className="animate-spin" /> Setting up your personalised experience...
              </div>
            )}

            <button onClick={handleSkip} className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 py-2 transition-colors" data-testid="skip-neurotype">
              Skip for now
            </button>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart size={32} className="text-emerald-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit' }}>
                Let's personalise your experience
              </h1>
              <p className="text-zinc-400">No wrong answers — this helps us recommend where to start.</p>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">What's your biggest challenge right now?</label>
                <textarea
                  data-testid="challenge-input"
                  value={biggestChallenge}
                  onChange={(e) => setBiggestChallenge(e.target.value)}
                  placeholder="e.g., I struggle with time management, understanding what assessments actually want, getting started on essays..."
                  className="w-full h-24 px-4 py-3 bg-[#111113] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 resize-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">What would success look like for you this semester?</label>
                <textarea
                  data-testid="success-input"
                  value={successVision}
                  onChange={(e) => setSuccessVision(e.target.value)}
                  placeholder="e.g., Passing all my units, feeling less overwhelmed, submitting assignments on time..."
                  className="w-full h-24 px-4 py-3 bg-[#111113] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 focus:ring-2 focus:ring-emerald-500/40 resize-none text-sm"
                />
              </div>
            </div>

            {recommendation && (
              <div className="mb-6 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl fade-in" data-testid="tool-recommendation">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">Your recommended first tool</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit' }}>{recommendation.name}</h3>
                <p className="text-sm text-zinc-400">{recommendation.reason}</p>
                <p className="text-xs text-zinc-600 mt-2">Redirecting to your dashboard...</p>
              </div>
            )}

            {!recommendation && (
              <button
                onClick={handleGoalsSubmit}
                disabled={saving || (!biggestChallenge.trim() && !successVision.trim())}
                data-testid="submit-goals-btn"
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-4 rounded-xl transition-all disabled:opacity-40 text-sm"
              >
                {saving ? <><Loader2 size={18} className="animate-spin" /> Personalising...</> : <><ArrowRight size={18} /> Take me to my dashboard</>}
              </button>
            )}

            <button onClick={handleSkip} className="w-full text-center text-sm text-zinc-600 hover:text-zinc-400 py-2 transition-colors mt-3" data-testid="skip-goals">
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
