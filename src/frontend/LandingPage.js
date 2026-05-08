import React, { useState } from 'react';
import { Brain, Shield, FileText, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { mockGoogleAuth, fetchContextualHistory } from '../services/AuthService';
import { useSettings } from './SettingsContext';
import { Personas } from '../services/PersonaEngine';

export default function LandingPage({ onGetStarted }) {
  const [step, setStep] = useState(0); // 0: hero, 1: auth, 2: persona, 3: confirm
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncData, setSyncData] = useState(null);
  const { setEduLevel, setPersona } = useSettings();

  const handleGoogleSync = async () => {
    setIsSyncing(true);
    try {
      const auth = await mockGoogleAuth();
      const history = await fetchContextualHistory(auth.token);
      setSyncData({ user: auth.user, history });
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const selectPersona = (personaKey) => {
    setPersona(personaKey);
    setEduLevel(syncData?.history?.inferredTier || 'tertiary');
    setStep(3);
  };

  const handleLaunch = () => {
    // Pass the inferred focus to local storage so the OS can utilize it
    if (syncData) {
      localStorage.setItem('simplifii_inferred_focus', syncData.history.inferredFocus);
      localStorage.setItem('simplifii_user_name', syncData.user.name);
    }
    onGetStarted();
  };

  return (
    <div className="min-h-screen bg-[#07080D] text-white font-sans overflow-hidden relative flex flex-col items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      {step === 0 && (
        <div className="text-center max-w-4xl mx-auto z-10 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="bg-emerald-500 p-4 rounded-3xl shadow-glow-emerald-lg">
              <Brain size={48} className="text-black" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-tight">
            The World's First<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Cognitive Partner.</span>
          </h1>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed mb-12 max-w-2xl mx-auto">
            Not just an app. A neuro-adaptive operating system that syncs with your digital brain.
          </p>
          <button 
            onClick={() => setStep(1)}
            className="px-10 py-5 rounded-full bg-emerald-500 text-black font-black text-lg uppercase tracking-widest hover:shadow-glow-emerald-lg hover:bg-emerald-400 transition-all flex items-center gap-3 mx-auto group cursor-pointer"
          >
            Initiate Cognitive Sync 
            <ArrowRight className="transform group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="text-center max-w-2xl mx-auto z-10 animate-fade-in">
          <h2 className="text-4xl font-black mb-6">Step 1: Digital Context</h2>
          <p className="text-zinc-400 mb-10 text-lg">
            Connect your Google account to allow the MasterEngine to pre-scan your YouTube research history and calendar. 
            We pull context so you don't have to fill forms.
          </p>
          <button 
            onClick={handleGoogleSync}
            disabled={isSyncing}
            className="w-full bg-white text-black hover:bg-gray-100 font-black uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg"
          >
            {isSyncing ? <Loader2 className="animate-spin" /> : <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-6 h-6" />}
            {isSyncing ? 'Scraping YouTube & Calendar...' : 'Sync with Google'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="text-center max-w-4xl mx-auto z-10 animate-fade-in w-full px-6">
          <h2 className="text-4xl font-black mb-4">Step 2: Choose Your Executive Partner</h2>
          <p className="text-zinc-400 mb-10">Select the persona that best fits your current cognitive needs.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(Personas).map(([key, persona]) => (
              <div 
                key={key} 
                onClick={() => selectPersona(key)}
                className="bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500 hover:shadow-glow-emerald p-8 rounded-3xl cursor-pointer transition-all flex flex-col text-left group"
              >
                <h3 className="text-2xl font-black mb-2 text-white group-hover:text-emerald-400">{persona.name}</h3>
                <div className="text-xs font-black text-emerald-500/70 uppercase tracking-widest mb-6">
                  {persona.tone}
                </div>
                <p className="text-zinc-400 font-medium italic mb-4 flex-1">
                  "{persona.greetings[0]}"
                </p>
                <div className="text-xs font-black uppercase text-zinc-500 group-hover:text-emerald-500 flex items-center gap-2">
                  Select Persona <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && syncData && (
        <div className="text-center max-w-2xl mx-auto z-10 animate-fade-in bg-zinc-900/80 border border-zinc-800 p-10 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <CheckCircle2 size={64} className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]" />
          </div>
          <h2 className="text-3xl font-black mb-2">Sync Complete</h2>
          <p className="text-zinc-400 mb-8">Welcome back, {syncData.user.name}.</p>
          
          <div className="bg-black/50 rounded-2xl p-6 text-left border border-zinc-800 mb-8 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Inferred Focus</span>
              <span className="text-emerald-400 font-bold">{syncData.history.inferredFocus}</span>
            </div>
            <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
              <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Education Tier</span>
              <span className="text-emerald-400 font-bold uppercase">{syncData.history.inferredTier}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-zinc-500 tracking-widest">Upcoming Deadline</span>
              <span className="text-emerald-400 font-bold">{syncData.history.calendarScrape[0]?.event}</span>
            </div>
          </div>

          <button 
            onClick={handleLaunch}
            className="w-full px-8 py-4 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-glow-emerald"
          >
            Enter Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
