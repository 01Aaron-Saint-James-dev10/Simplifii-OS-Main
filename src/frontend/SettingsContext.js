import React, { createContext, useState, useContext, useEffect } from 'react';
import { TIER_UNDERGRAD } from '../services/TierService';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // EAL/D language preference
  const [homeLanguage, setHomeLanguage] = useState(
    localStorage.getItem('simplifii_home_language') || 'en'
  );
  useEffect(() => { localStorage.setItem('simplifii_home_language', homeLanguage); }, [homeLanguage]);

  // Matrix rain background animation toggle
  const [matrixRain, setMatrixRain] = useState(
    localStorage.getItem('simplifii_matrix_rain') !== 'false'
  );
  useEffect(() => { localStorage.setItem('simplifii_matrix_rain', String(matrixRain)); }, [matrixRain]);

  // Easy Read mode for intellectual disability support
  const [easyRead, setEasyRead] = useState(
    localStorage.getItem('simplifii_easy_read') === 'true'
  );
  useEffect(() => { localStorage.setItem('simplifii_easy_read', String(easyRead)); }, [easyRead]);

  // Active tier: canonical tier constant from TierService.
  // Persisted as 'simplifii_tier'. Defaults to TIER_UNDERGRAD so existing
  // users land where they always have.
  const [activeTier, setActiveTierState] = useState(
    localStorage.getItem('simplifii_tier') || TIER_UNDERGRAD
  );
  const setActiveTier = (tier) => {
    localStorage.setItem('simplifii_tier', tier);
    setActiveTierState(tier);
  };

  const [mode, setMode] = useState(localStorage.getItem('mode') || 'sequential');
  const [eduLevel, setEduLevel] = useState(localStorage.getItem('eduLevel') || 'university');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('highContrast') === 'true');
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem('reducedMotion') === 'true');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') !== 'false');
  const [persona, setPersona] = useState(localStorage.getItem('persona') || 'Socratic');
  
  // Accessibility Vault State
  const [overlayTint, setOverlayTint] = useState(localStorage.getItem('overlayTint') || 'none'); // 'none', 'mint', 'cream', 'skyblue'
  const [fontScale, setFontScale] = useState(localStorage.getItem('fontScale') || 'normal'); // 'normal', 'large', 'xl'
  const [lineSpacing, setLineSpacing] = useState(localStorage.getItem('lineSpacing') || 'normal'); // 'normal', 'relaxed', 'loose'
  const [isRulerActive, setIsRulerActive] = useState(localStorage.getItem('isRulerActive') === 'true');
  const [isBionicActive, setIsBionicActive] = useState(localStorage.getItem('isBionicActive') === 'true');
  const [bionicIntensity, setBionicIntensity] = useState(Number(localStorage.getItem('bionicIntensity')) || 3); // 1 to 5
  const [fontPreference, setFontPreference] = useState(localStorage.getItem('simplifii_editor_font') || 'inter');
  const [isDriveAttached, setIsDriveAttached] = useState(localStorage.getItem('isDriveAttached') === 'true');

  // Cockpit layout flags (lifted from MasterDashboard so any view can react)
  const [isZenMode, setIsZenMode] = useState(localStorage.getItem('isZenMode') === 'true');
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(localStorage.getItem('isLeftCollapsed') === 'true');
  const [isRightCollapsed, setIsRightCollapsed] = useState(localStorage.getItem('isRightCollapsed') === 'true');
  const [isLiteralMode, setIsLiteralMode] = useState(localStorage.getItem('isLiteralMode') === 'true');

  // Steering Drawer dials. The student adjusts these to tune how the
  // OS scaffolds, paces, and explains. Persisted to localStorage so
  // the cockpit re-opens with the same settings. CLAUDE.md "Steering
  // and Transparency" rule 3 requires every AI prompt to read these
  // before composing output.
  //   scaffoldingLevel: 'heavy' | 'balanced' | 'light'
  //   gritLevel:        'literal' | 'balanced' | 'socratic'
  //   lodLevel:         'compass' | 'sprint' | 'map'
  const [scaffoldingLevel, setScaffoldingLevel] = useState(localStorage.getItem('scaffoldingLevel') || 'balanced');
  const [gritLevel, setGritLevel] = useState(localStorage.getItem('gritLevel') || 'balanced');
  const [lodLevel, setLodLevel] = useState(localStorage.getItem('lodLevel') || 'compass');

  // Display preferences for Home screen layout.
  // Spec: PRODUCT_SPEC_STATUS_AND_PREFERENCES.md Section 2.3
  const [display, setDisplay] = useState(() => {
    try {
      const raw = localStorage.getItem('simplifii_display');
      return raw ? { ...{ timeline: true, upNext: true, cardDensity: 'standard', bodyDoubling: true, overdueTally: true }, ...JSON.parse(raw) } : { timeline: true, upNext: true, cardDensity: 'standard', bodyDoubling: true, overdueTally: true };
    } catch { return { timeline: true, upNext: true, cardDensity: 'standard', bodyDoubling: true, overdueTally: true }; }
  });
  const updateDisplay = (patch) => setDisplay(prev => ({ ...prev, ...patch }));

  // Canvas theme: 'dark' | 'light' | 'highContrast'. Migrates from boolean highContrast.
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('simplifii_theme');
    if (stored) return stored;
    // Migrate from boolean highContrast
    return highContrast ? 'highContrast' : 'dark';
  });
  useEffect(() => { localStorage.setItem('simplifii_theme', theme); }, [theme]);

  // Accessibility profile
  const [accessibilityProfile, setAccessibilityProfile] = useState(
    localStorage.getItem('simplifii_accessibility_profile') || 'standard'
  );

  // Autism-first features (7 features, individually toggleable)
  const [autismFirstEnabled, setAutismFirstEnabled] = useState(localStorage.getItem('simplifii_autism_first') === 'true');
  const [sensoryLevel, setSensoryLevel] = useState(Number(localStorage.getItem('simplifii_sensory_level')) || 5);
  const [predictabilityAnnouncements, setPredictabilityAnnouncements] = useState(localStorage.getItem('simplifii_predictability') !== 'false');
  const [specialInterests, setSpecialInterests] = useState(() => {
    try { return JSON.parse(localStorage.getItem('simplifii_special_interests') || '[]'); } catch { return []; }
  });
  const [ambientPreference, setAmbientPreference] = useState(localStorage.getItem('simplifii_ambient') || 'none');

  // Exam questions per energy ball: denominator N where each question costs 1/N of a ball.
  // Default 5 means 5 questions per orb. Student can change to 6, 14, etc.
  const [examQuestionsPerBall, setExamQuestionsPerBallState] = useState(() => {
    const stored = localStorage.getItem('simplifii_exam_q_per_ball');
    return stored !== null ? Number(stored) : 5;
  });
  const setExamQuestionsPerBall = (n) => {
    localStorage.setItem('simplifii_exam_q_per_ball', String(n));
    setExamQuestionsPerBallState(n);
  };

  // Exam extra time: percentage of additional time granted by school (0, 10, 25, or custom).
  // null = not yet set (triggers first-time prompt in ExamTimer).
  const [examExtraTimePercent, setExamExtraTimePercentState] = useState(() => {
    const stored = localStorage.getItem('simplifii_exam_extra_time');
    return stored !== null ? Number(stored) : null;
  });
  const setExamExtraTimePercent = (pct) => {
    localStorage.setItem('simplifii_exam_extra_time', String(pct));
    setExamExtraTimePercentState(pct);
  };

  // Sprint 6.0: Bio-Sovereignty. Transient stress signal; not persisted.
  // Set to true via the "Simulate Stress" DevTools toggle or by NeuralService
  // when HRV drops below threshold. Causes the Vibe Meter to pulse red and
  // auto-routes the cockpit into a reduced cognitive-load state.
  const [isStressed, setIsStressed] = useState(false);

  // Dispatch stress signal to NeuralService listeners and the executive spine.
  // When stress is detected, the OS reduces cognitive load: LOD drops to compass,
  // and the Vibe Meter signals the state shift in red.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isStressed) {
      window.dispatchEvent(new CustomEvent('simplifii:stress-detected', {
        detail: { source: 'simulate', timestamp: new Date().toISOString() }
      }));
    }
  }, [isStressed]);

  // Dispatch STEERING_UPDATE whenever the three AI-behaviour dials change.
  // EventBus picks this up and writes a steering_adjusted event to the
  // History of Thought log so the Authenticity Report can prove the student
  // manually adjusted the AI rather than relying on defaults.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('simplifii:steering-update', {
      detail: { gritLevel, scaffoldingLevel, isLiteralMode }
    }));
  }, [gritLevel, scaffoldingLevel, isLiteralMode]);

  // Sync font preference when CanvasSettingsOverlay changes it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => setFontPreference(e.detail?.font || 'inter');
    window.addEventListener('simplifii:font-change', handler);
    return () => window.removeEventListener('simplifii:font-change', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('mode', mode);
    localStorage.setItem('eduLevel', eduLevel);
    localStorage.setItem('highContrast', highContrast);
    localStorage.setItem('reducedMotion', reducedMotion);
    localStorage.setItem('darkMode', darkMode);
    localStorage.setItem('persona', persona);
    localStorage.setItem('overlayTint', overlayTint);
    localStorage.setItem('fontScale', fontScale);
    localStorage.setItem('lineSpacing', lineSpacing);
    localStorage.setItem('isRulerActive', isRulerActive);
    localStorage.setItem('isBionicActive', isBionicActive);
    localStorage.setItem('bionicIntensity', bionicIntensity);
    localStorage.setItem('isDriveAttached', isDriveAttached);
    localStorage.setItem('isZenMode', isZenMode);
    localStorage.setItem('isLeftCollapsed', isLeftCollapsed);
    localStorage.setItem('isRightCollapsed', isRightCollapsed);
    localStorage.setItem('isLiteralMode', isLiteralMode);
    localStorage.setItem('scaffoldingLevel', scaffoldingLevel);
    localStorage.setItem('gritLevel', gritLevel);
    localStorage.setItem('lodLevel', lodLevel);
    localStorage.setItem('simplifii_display', JSON.stringify(display));
    localStorage.setItem('simplifii_accessibility_profile', accessibilityProfile);
    localStorage.setItem('simplifii_autism_first', String(autismFirstEnabled));
    localStorage.setItem('simplifii_sensory_level', String(sensoryLevel));
    localStorage.setItem('simplifii_predictability', String(predictabilityAnnouncements));
    localStorage.setItem('simplifii_special_interests', JSON.stringify(specialInterests));
    localStorage.setItem('simplifii_ambient', ambientPreference);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simplifii:lod-change', { detail: { lodLevel } }));
    }
  }, [mode, eduLevel, highContrast, reducedMotion, darkMode, persona, overlayTint, fontScale, lineSpacing, isRulerActive, isBionicActive, bionicIntensity, isDriveAttached, isZenMode, isLeftCollapsed, isRightCollapsed, isLiteralMode, scaffoldingLevel, gritLevel, lodLevel, display, accessibilityProfile, autismFirstEnabled, sensoryLevel, predictabilityAnnouncements, specialInterests, ambientPreference]);

  const rules = {
    sequential: { font: 'Inter', spacing: 'normal', lineHeight: 'normal', letterSpacing: 'normal' },
    nonlinear: { font: 'Inter', spacing: 'wide', lineHeight: 'normal', letterSpacing: 'normal' },
    lexical: { font: 'OpenDyslexic', spacing: 'extra-wide', lineHeight: '1.8', letterSpacing: '0.15em' }
  };

  return (
    <SettingsContext.Provider value={{
      homeLanguage, setHomeLanguage,
      easyRead, setEasyRead,
      matrixRain, setMatrixRain,
      activeTier, setActiveTier,
      mode, setMode,
      eduLevel, setEduLevel, 
      highContrast, setHighContrast,
      reducedMotion, setReducedMotion,
      darkMode, setDarkMode,
      persona, setPersona,
      overlayTint, setOverlayTint,
      fontScale, setFontScale,
      lineSpacing, setLineSpacing,
      isRulerActive, setIsRulerActive,
      isBionicActive, setIsBionicActive,
      bionicIntensity, setBionicIntensity,
      isDriveAttached, setIsDriveAttached,
      isZenMode, setIsZenMode,
      isLeftCollapsed, setIsLeftCollapsed,
      isRightCollapsed, setIsRightCollapsed,
      isLiteralMode, setIsLiteralMode,
      scaffoldingLevel, setScaffoldingLevel,
      gritLevel, setGritLevel,
      lodLevel, setLodLevel,
      isStressed, setIsStressed,
      display, updateDisplay,
      theme, setTheme,
      accessibilityProfile, setAccessibilityProfile,
      autismFirstEnabled, setAutismFirstEnabled,
      sensoryLevel, setSensoryLevel,
      predictabilityAnnouncements, setPredictabilityAnnouncements,
      specialInterests, setSpecialInterests,
      ambientPreference, setAmbientPreference,
      examExtraTimePercent, setExamExtraTimePercent,
      examQuestionsPerBall, setExamQuestionsPerBall,
      activeRules: rules[mode]
    }}>
      <div
        style={{
          fontFamily: rules[mode].font,
          lineHeight: rules[mode].lineHeight,
          letterSpacing: rules[mode].letterSpacing
        }}
        data-bionic={isBionicActive ? 'true' : 'false'}
        data-font={fontPreference}
        className={`${highContrast ? 'contrast-125 saturate-150' : ''} ${reducedMotion ? 'motion-reduce' : ''} ${!darkMode ? 'invert hue-rotate-180' : ''} h-full transition-all duration-500`}
      >
        {children}
      </div>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
