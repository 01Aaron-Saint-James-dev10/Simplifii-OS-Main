import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import TierPickerStep from './TierPickerStep';
import AccessibilityStep from './AccessibilityStep';
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
}

export default function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [tier, setTier] = useState(null);
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saving, setSaving] = useState(false);

  const finish = async (accessibilityPrefs) => {
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          tier: tier,
          onboarding_completed: true,
          preferences: accessibilityPrefs,
        })
        .eq('id', user.id);
      applyPrefsToLocalStorage(accessibilityPrefs);
    } catch (err) {
      console.error('[OnboardingFlow] Save failed:', err);
    }
    navigate('/app', { replace: true });
  };

  return (
    <div style={{ minHeight: '100vh', background: SURFACE_BASE, display: 'flex', flexDirection: 'column' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '32px 24px 0' }}>
        {[0, 1].map(i => (
          <div key={i} style={{ width: 48, height: 3, borderRadius: 2, background: step >= i ? '#10b981' : SURFACE_RAISED, transition: 'background 0.3s' }} aria-hidden="true" />
        ))}
      </div>
      <p style={{ textAlign: 'center', fontFamily: FONT_SYSTEM, fontSize: 10, color: TEXT_FAINT, letterSpacing: '0.06em', margin: '8px 0 0' }}>
        Step {step + 1} of 2
      </p>

      {/* Steps */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0 80px' }}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="tier" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <TierPickerStep selected={tier} onSelect={setTier} onContinue={() => setStep(1)} />
            </motion.div>
          )}
          {step === 1 && (
            <motion.div key="a11y" variants={slideVariants} initial="enter" animate="centre" exit="exit" transition={{ duration: 0.3 }}>
              <AccessibilityStep
                prefs={prefs}
                onPrefsChange={setPrefs}
                onSave={() => finish(prefs)}
                onSkip={() => finish(defaultPrefs)}
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
