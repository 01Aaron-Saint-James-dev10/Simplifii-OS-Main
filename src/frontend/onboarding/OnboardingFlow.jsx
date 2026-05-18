import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import TierPickerStep from './TierPickerStep';
import WhatBringsYouStep from './WhatBringsYouStep';
import MeetAuraStep from './MeetAuraStep';
import { DEMO_COURSE } from '../../data/demoCourse';
import AccessibilityStep from './AccessibilityStep';
import ProfilerStep from './ProfilerStep';
import SecondaryDetailsStep from './SecondaryDetailsStep';
import PainPointsStep from './PainPointsStep';
import AiDisclaimerFooter from '../components/disclaimers/AiDisclaimerFooter';
import {
  SURFACE_BASE, SURFACE_RAISED,
  TEXT_FAINT,
  FONT_SYSTEM,
  ACCENT_GLASS_SUBTLE,
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
  whatBringsYou: 'What brings you here',
  meetAura: 'Meet AURA',
  tier: 'Your level',
  secondaryDetails: 'Your school details',
  parentalConsent: 'Parent or guardian consent',
  accessibility: 'How you learn best',
  painPoints: 'What gets in the way',
  profiler: 'Your strengths',
};

function buildSteps(tier) {
  const steps = ['whatBringsYou', 'meetAura'];
  if (!tier) steps.push('tier');
  if (tier === 'helper') {
    steps.push('accessibility');
    return steps;
  }
  if (tier === 'secondary') {
    steps.push('secondaryDetails');
    steps.push('parentalConsent');
  }
  steps.push('accessibility');
  if (tier === 'secondary') steps.push('painPoints');
  steps.push('profiler');
  return steps;
}

function ParentalConsentStep({ onConsent }) {
  const [checked, setChecked] = React.useState(false);
  return (
    <div style={{ maxWidth: 440, padding: '0 24px', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'var(--font-system, system-ui)', fontSize: 20, fontWeight: 700, color: '#f4f4f5', margin: '0 0 12px' }}>
        Parent or guardian consent
      </h2>
      <p style={{ fontFamily: 'var(--font-body, system-ui)', fontSize: 13, color: '#a1a1aa', lineHeight: 1.6, margin: '0 0 20px' }}>
        Because you are a secondary school student, Australian privacy law requires consent from a parent or guardian before we collect anonymised usage data for education research.
      </p>
      <p style={{ fontFamily: 'var(--font-body, system-ui)', fontSize: 12, color: '#71717a', lineHeight: 1.6, margin: '0 0 20px' }}>
        Your work, identity, and patterns are never shared with your school, teachers, or anyone else. Only anonymised, de-identified statistics are used for research. You can export or delete your data at any time.
      </p>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', cursor: 'pointer', padding: '12px 16px', border: '1px solid #27272a', borderRadius: 8, background: checked ? ACCENT_GLASS_SUBTLE : 'transparent' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => setChecked(c => !c)}
          style={{ marginTop: 3, accentColor: '#10b981' }}
        />
        <span style={{ fontFamily: 'var(--font-body, system-ui)', fontSize: 12, color: '#d4d4d8', lineHeight: 1.5 }}>
          I am the parent or guardian of this student and I consent to anonymised usage data being collected for education research purposes.
        </span>
      </label>
      <button
        type="button"
        onClick={onConsent}
        disabled={!checked}
        style={{
          marginTop: 20, width: '100%', padding: '14px 0', borderRadius: 8,
          fontFamily: 'var(--font-system, system-ui)', fontSize: 15, fontWeight: 700,
          background: checked ? '#10b981' : '#27272a', border: 'none',
          color: checked ? '#09090b' : '#71717a', cursor: checked ? 'pointer' : 'default',
        }}
      >
        Continue
      </button>
    </div>
  );
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
          {currentStep === 'whatBringsYou' && (
            <motion.div key="whatBringsYou" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <WhatBringsYouStep onSelect={async (t) => {
                setTier(t);
                if (t === 'explorer') {
                  // Skip all onboarding, load demo course, go to app
                  try {
                    await supabase.from('profiles').update({ tier: 'tertiary', onboarding_completed: true }).eq('id', user.id);
                    // Store demo course in localStorage for ProjectContext to pick up
                    const demoId = `demo_${Date.now()}`;
                    const courses = JSON.parse(localStorage.getItem('simplifii_courses_v1') || '{}');
                    courses[demoId] = DEMO_COURSE;
                    localStorage.setItem('simplifii_courses_v1', JSON.stringify(courses));
                  } catch { /* non-blocking */ }
                  navigate('/app');
                  return;
                }
                next();
              }} />
            </motion.div>
          )}
          {currentStep === 'meetAura' && (
            <motion.div key="meetAura" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <MeetAuraStep onContinue={next} />
            </motion.div>
          )}
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
          {currentStep === 'parentalConsent' && (
            <motion.div key="consent" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <ParentalConsentStep
                userId={user?.id}
                onConsent={async () => {
                  try {
                    await supabase.from('profiles').update({ parental_consent_at: new Date().toISOString() }).eq('id', user.id);
                  } catch { /* non-blocking */ }
                  next();
                }}
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
