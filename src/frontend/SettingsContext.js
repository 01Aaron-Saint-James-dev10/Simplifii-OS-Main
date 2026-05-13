import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('simplifii:lod-change', { detail: { lodLevel } }));
    }
  }, [mode, eduLevel, highContrast, reducedMotion, darkMode, persona, overlayTint, fontScale, lineSpacing, isRulerActive, isBionicActive, bionicIntensity, isDriveAttached, isZenMode, isLeftCollapsed, isRightCollapsed, isLiteralMode, scaffoldingLevel, gritLevel, lodLevel]);

  const rules = {
    sequential: { font: 'Inter', spacing: 'normal', lineHeight: 'normal', letterSpacing: 'normal' },
    nonlinear: { font: 'Inter', spacing: 'wide', lineHeight: 'normal', letterSpacing: 'normal' },
    lexical: { font: 'OpenDyslexic', spacing: 'extra-wide', lineHeight: '1.8', letterSpacing: '0.15em' }
  };

  return (
    <SettingsContext.Provider value={{ 
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
      activeRules: rules[mode]
    }}>
      <div 
        style={{ 
          fontFamily: rules[mode].font,
          lineHeight: rules[mode].lineHeight,
          letterSpacing: rules[mode].letterSpacing
        }}
        className={`${highContrast ? 'contrast-125 saturate-150' : ''} ${reducedMotion ? 'motion-reduce' : ''} ${!darkMode ? 'invert hue-rotate-180' : ''} h-full transition-all duration-500`}
      >
        {children}
      </div>
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
