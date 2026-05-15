// Helper to build a section object
export const s = (id, title, estimatedMinutes, defaultSubtasks = [], definitionOfDone = []) => ({
  id, title, estimatedMinutes, defaultSubtasks, definitionOfDone,
});

// Helper to build a sub-task
export const t = (label, estimatedMinutes) => ({ label, estimatedMinutes });

// Helper to build a DoD criterion
export const d = (criterion, source = 'best_practice', autoCheck = null) => ({ criterion, source, autoCheck });
