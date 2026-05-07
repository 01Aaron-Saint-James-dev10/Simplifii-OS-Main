import React, { createContext, useState, useContext } from 'react';
const SettingsContext = createContext();
export const SettingsProvider = ({ children }) => {
  const [mode, setMode] = useState('standard'); 
  const [eduLevel, setEduLevel] = useState('university');
  const rules = {
    standard: { font: 'Inter', spacing: 'normal' },
    adhd: { font: 'Inter', spacing: 'wide' },
    dyslexia: { font: 'OpenDyslexic', spacing: 'extra-wide' }
  };
  return (
    <SettingsContext.Provider value={{ mode, setMode, eduLevel, setEduLevel, activeRules: rules[mode] }}>
      <div style={{ fontFamily: rules[mode].font }}>{children}</div>
    </SettingsContext.Provider>
  );
};
export const useSettings = () => useContext(SettingsContext);
