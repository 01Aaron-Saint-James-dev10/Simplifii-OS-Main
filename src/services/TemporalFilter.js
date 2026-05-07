// src/services/TemporalFilter.js

// Mock parsed schedule for BABS1201 (this would be scraped from the outline in reality)
const MOCK_SCHEDULE = [
  { week: 1, type: 'Lecture', topic: 'Scientific Literature', timestamp: Date.now() - 86400000 * 7 }, 
  { week: 4, type: 'Laboratory', topic: 'Osmosis', timestamp: Date.now() - 86400000 }, 
  { week: 5, type: 'Literature Review', topic: 'Drafting', timestamp: Date.now() }, 
  { week: 10, type: 'Final Exam', topic: 'Review', timestamp: Date.now() + 86400000 * 35 } 
];

export const buildWeeklySchedule = (rawText) => {
  return MOCK_SCHEDULE;
};

export const checkTemporalAlignment = (currentTimestamp, schedule = MOCK_SCHEDULE) => {
  const TWENTY_FOUR_HOURS = 86400000;
  
  const activeEvent = schedule.find(event => {
    const diff = Math.abs(currentTimestamp - event.timestamp);
    return diff <= TWENTY_FOUR_HOURS;
  });

  if (activeEvent) {
    return {
      aligned: true,
      event: activeEvent
    };
  }
  
  return { aligned: false, event: null };
};

export const analyzeFileMetadata = (file) => {
  const lastModified = file.lastModified || Date.now();
  return checkTemporalAlignment(lastModified);
};
