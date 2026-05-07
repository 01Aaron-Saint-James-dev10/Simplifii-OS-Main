import React, { createContext, useState, useContext } from 'react';
const ProjectContext = createContext();
export const ProjectProvider = ({ children }) => {
  const [project, setProject] = useState({ currentDraft: '', integrityLog: [] });
  const updateDraft = (newText) => {
    setProject(prev => ({
      ...prev,
      currentDraft: newText,
      integrityLog: [...prev.integrityLog, { length: newText.length }]
    }));
  };
  return (
    <ProjectContext.Provider value={{ project, updateDraft }}>{children}</ProjectContext.Provider>
  );
};
export const useProject = () => useContext(ProjectContext);
