import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { checkTemporalAlignment } from '../services/TemporalFilter';
import { appendThinkingLog } from '../services/SheetsService';

const ProjectContext = createContext();

const initialProjectState = {
  blocks: [
    { id: 1, type: 'Informative Title', content: '' },
    { id: 2, type: 'Introduction & Context', content: '' },
    { id: 3, type: 'Primary Article 1 Summary', content: '' },
    { id: 4, type: 'Primary Article 2 Summary', content: '' },
    { id: 5, type: 'Review Article Synthesis', content: '' },
    { id: 6, type: 'Conclusion & Future Directions', content: '' },
    { id: 7, type: 'Research Process Documentation', content: '' }
  ],
  integrityLog: [],
  verifications: [],
  inbox: []
};

export const ProjectProvider = ({ children }) => {
  const [project, setProject] = useState(() => {
    const saved = localStorage.getItem('simplifii_project_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialProjectState;
      }
    }
    return initialProjectState;
  });

  useEffect(() => {
    localStorage.setItem('simplifii_project_state', JSON.stringify(project));
  }, [project]);

  const lastSyncIndex = useRef(0);

  useEffect(() => {
    const syncInterval = setInterval(() => {
      const logsToSync = project.integrityLog.slice(lastSyncIndex.current);
      if (logsToSync.length > 0) {
        appendThinkingLog(logsToSync, 'mock_jwt_token_xyz123');
        lastSyncIndex.current = project.integrityLog.length;
      }
    }, 60000); // 60 seconds

    return () => clearInterval(syncInterval);
  }, [project.integrityLog]);

  const appendToBlock = (type, content) => {
    setProject(prev => {
      const existing = prev.blocks.find(b => b.type.toLowerCase().includes(type.toLowerCase()));
      if (existing) {
        return {
          ...prev,
          blocks: prev.blocks.map(b => b.id === existing.id ? { ...b, content: b.content ? `${b.content}\n\n${content}` : content } : b)
        };
      }
      return prev;
    });
  };

  const receiveMessage = (msg) => {
    setProject(prev => ({ ...prev, inbox: [msg, ...prev.inbox] }));
  };

  const clearMessage = (id) => {
    setProject(prev => ({ ...prev, inbox: prev.inbox.filter(m => m.id !== id) }));
  };

  const updateBlock = (id, newContent) => {
    setProject(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === id ? { ...b, content: newContent } : b),
    }));
  };

  const logEffort = (blockId, metrics) => {
    const now = Date.now();
    const temporalMatch = checkTemporalAlignment(now);

    setProject(prev => {
      const newVerifications = [...(prev.verifications || [])];
      
      if (temporalMatch.aligned && !newVerifications.find(v => v.week === temporalMatch.event.week)) {
        newVerifications.push({
          week: temporalMatch.event.week,
          topic: temporalMatch.event.topic,
          type: temporalMatch.event.type,
          verifiedAt: now,
          method: 'Passive Activity'
        });
      }

      return {
        ...prev,
        integrityLog: [...prev.integrityLog, { blockId, softVerified: temporalMatch.aligned, ...metrics }],
        verifications: newVerifications
      };
    });
  };

  const setBlocks = (newBlocks) => {
    setProject(prev => ({
      ...prev,
      blocks: newBlocks,
      integrityLog: [],
      verifications: [],
      inbox: []
    }));
  };

  return (
    <ProjectContext.Provider value={{ project, updateBlock, appendToBlock, receiveMessage, clearMessage, setBlocks, logEffort }}>{children}</ProjectContext.Provider>
  );
};

export const useProject = () => useContext(ProjectContext);
