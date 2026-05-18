// src/services/TemporalFilter.js
//
// Schedule alignment surface. Returns empty until a real syllabus parser
// populates the weekly schedule. The previous version shipped a hardcoded
// BABS1201 mock (Lecture, Laboratory: Osmosis, Literature Review, Final
// Exam) which leaked false 'verified at week N' badges onto every block
// regardless of which course the student was actually working on. Empty
// schedule = no false positives = sovereign clean state.

const MOCK_SCHEDULE = [];

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
