import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSettings } from './SettingsContext';

const ThemeToggle = ({ className = '' }) => {
  const { darkMode, setDarkMode } = useSettings();

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <button
      onClick={toggleTheme}
      className={`relative p-2 rounded-lg transition-all duration-200 
        bg-secondary hover:bg-muted
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${className}`}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={darkMode}
      type="button"
    >
      <span className="sr-only">
        {darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      </span>
      {darkMode ? (
        <Sun className="w-5 h-5 text-foreground transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Moon className="w-5 h-5 text-foreground transition-transform duration-200 hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;
