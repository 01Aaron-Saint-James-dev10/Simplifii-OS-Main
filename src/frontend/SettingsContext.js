import React, { createContext, useState, useContext, useEffect } from 'react';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [mode, setMode] = useState(localStorage.getItem('mode') || 'sequential'); 
  const [eduLevel, setEduLevel] = useState(localStorage.getItem('eduLevel') || 'university');
  const [highContrast, setHighContrast] = useState(localStorage.getItem('highContrast') === 'true');
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem('reducedMotion') === 'true');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') !== 'false');

  useEffect(() => {
    localStorage.setItem('mode', mode);
    localStorage.setItem('eduLevel', eduLevel);
    localStorage.setItem('highContrast', highContrast);
    localStorage.setItem('reducedMotion', reducedMotion);
    localStorage.setItem('darkMode', darkMode);
  }, [mode, eduLevel, highContrast, reducedMotion, darkMode]);

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
