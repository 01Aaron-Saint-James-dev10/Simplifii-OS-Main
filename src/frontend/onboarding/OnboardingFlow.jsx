import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import TierPickerStep from './TierPickerStep';
import AccessibilityStep from './AccessibilityStep';
import ProfilerStep from './ProfilerStep';
import SecondaryDetailsStep from './SecondaryDetailsStep';
import PainPointsStep from './PainPointsStep';
import AiDisclaimerFooter from '../components/disclaimers/AiDisclaimerFooter';
import {
  SURFACE_BASE, SURFACE_RAISED,
  TEXT_FAINT,
  FONT_SYSTEM,
} from '../../theme/tokens';

const MQ_REDUCE = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const defaultPrefs = {
  font: 'inter',
  bionic: 'off',
  reducedMotion: MQ_REDUCE,
  highContrast: false,
};

const slideVariants = MQ_REDUCE
  ? { enter: {}, centre: {}, exit: {} }
  : {
      enter: { opacity: 0, x: 60 },
      centre: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -60 },
    };

function applyPrefsToLocalStorage(prefs) {
  if (prefs.font && prefs.font !== 'inter') {
    localStorage.setItem('simplifii_editor_font', prefs.font);
  }
  if (prefs.bionic === 'light') {
    localStorage.setItem('isBionicActive', 'true');
    localStorage.setItem('bionicIntensity', '2');
  } else if (prefs.bionic === 'medium') {
    localStorage.setItem('isBionicActive', 'true');
    localStorage.setItem('bionicIntensity', '3');
  } else {
    localStorage.setItem('isBionicActive', 'false');
  }
  localStorage.setItem('reducedMotion', String(prefs.reducedMotion));
  localStorage.setItem('highContrast', String(prefs.highContrast));
  if (prefs.homeLanguage) localStorage.setItem('simplifii_home_language', prefs.homeLanguage);
  if (prefs.easyRead) localStorage.setItem('simplifii_easy_read', 'true');
}

// Steps are dynamic based on tier. Secondary tier gets extra steps.
// Non-secondary: tier -> accessibility -> profiler
// Secondary:     tier -> secondaryDetails -> accessibility -> painPoints -> profiler
const STEP_NAMES = {
  tier: 'Who you are',
  secondaryDetails: 'Your school details',
  accessibility: 'How you learn best',
  painPoints: 'What gets in the way',
  profiler: 'Your strengths',
};

function buildSteps(tier) {
  const steps = ['tier'];
  if (tier === 'secondary') steps.push('secondaryDetails');
  steps.push('accessibility');
  if (tier === 'secondary') steps.push('painPoints');
  steps.push('profiler');
  return steps;
}

export default function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [tier, setTier] = useState(null);
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [profilerData, setProfilerData] = useState(null);
  const [secondaryData, setSecondaryData] = useState({});
  const [painPoints, setPainPoints] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const steps = buildSteps(tier);
  const currentStep = steps[stepIndex] || 'tier';
  const totalSteps = steps.length;

  const next = () => setStepIndex(i => Math.min(i + 1, totalSteps - 1));

  const finish = async (accessibilityPrefs) => {
    setSaving(true);
    setSaveError('');
    try {
      const mergedPrefs = { ...accessibilityPrefs, profiler: profilerData || null };
      const update = {
        tier,
        onboarding_completed: true,
        preferences: mergedPrefs,
      };
      if (secondaryData.yearLevel) update.year_level = secondaryData.yearLevel;
      if (secondaryData.state) update.state = secondaryData.state;
      if (painPoints.length > 0) update.pain_points = painPoints;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(update)
        .eq('id', user.id);
      if (updateErr) throw updateErr;
      applyPrefsToLocalStorage(accessibilityPrefs);
      navigate('/app', { replace: true });
    } catch (err) {
      console.error('[OnboardingFlow] Save failed:', err);
      setSaveError('Could not save your preferences. Check your connection and try again.');
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: SURFACE_BASE, display: 'flex', flexDirection: 'column' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '32px 24px 0' }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} style={{ width: 48, height: 3, borderRadius: 2, background: stepIndex >= i ? '#10b981' : SURFACE_RAISED, transition: 'background 0.3s' }} aria-hidden="true" />
        ))}
      </div>
      <p style={{ textAlign: 'center', fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, letterSpacing: '0.06em', margin: '8px 0 0' }}>
        Step {stepIndex + 1} of {totalSteps}: {STEP_NAMES[currentStep] || ''}
      </p>

      {/* Skip onboarding */}
      {stepIndex > 0 && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <button type="button"
            onClick={() => finish(prefs)}
            disabled={saving}
            style={{ fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3, padding: '4px 8px' }}>
            Skip for now (you can update these later in Settings)
          </button>
        </div>
      )}

      {/* Save error toast */}
      {saveError && (
        <div role="alert" style={{ margin: '0 auto', maxWidth: 440, padding: '12px 20px', background: SURFACE_RAISED, borderRadius: 8, textAlign: 'center' }}>
          <p style={{ fontFamily: FONT_SYSTEM, fontSize: 13, color: '#ef4444', margin: '0 0 8px' }}>{saveError}</p>
          <button type="button" onClick={() => finish(prefs)} disabled={saving}
            style={{ fontFamily: FONT_SYSTEM, fontSize: 12, fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            {saving ? 'Retrying...' : 'Try again'}
          </button>
        </div>
      )}

      {/* Steps */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0 80px' }}>
        <AnimatePresence mode="wait">
          {currentStep === 'tier' && (
            <motion.div key="tier" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <TierPickerStep selected={tier} onSelect={setTier} onContinue={next} />
            </motion.div>
          )}
          {currentStep === 'secondaryDetails' && (
            <motion.div key="secDetails" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <SecondaryDetailsStep
                onContinue={(data) => { setSecondaryData(data); next(); }}
                onSkip={next}
              />
            </motion.div>
          )}
          {currentStep === 'accessibility' && (
            <motion.div key="a11y" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <AccessibilityStep
                prefs={prefs}
                onPrefsChange={setPrefs}
                onSave={next}
                onSkip={next}
              />
            </motion.div>
          )}
          {currentStep === 'painPoints' && (
            <motion.div key="painPoints" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <PainPointsStep
                onContinue={(pts) => { setPainPoints(pts); next(); }}
                onSkip={next}
              />
            </motion.div>
          )}
          {currentStep === 'profiler' && (
            <motion.div key="profiler" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <ProfilerStep
                onComplete={(data) => { setProfilerData(data); finish(prefs); }}
                onSkip={() => finish(prefs)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer badge */}
      <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 50, borderTop: `1px solid ${SURFACE_RAISED}`, borderLeft: `1px solid ${SURFACE_RAISED}`, background: SURFACE_BASE, borderTopLeftRadius: 4 }}>
        <AiDisclaimerFooter />
      </div>
    </div>
  );
}
