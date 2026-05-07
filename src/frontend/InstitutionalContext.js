import React, { createContext, useContext, useState } from 'react';

const InstitutionalContext = createContext();

export const InstitutionalProvider = ({ children }) => {
  const [institutionalData, setInstitutionalData] = useState({
    learningOutcomes: [],
    referencingStyle: 'Harvard',
    rubricCriteria: []
  });

  return (
    <InstitutionalContext.Provider value={{ institutionalData, setInstitutionalData }}>
      {children}
    </InstitutionalContext.Provider>
  );
};

export const useInstitution = () => useContext(InstitutionalContext);
