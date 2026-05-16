/**
 * demoCourse.js
 *
 * Pre-built sample course for "Just exploring" users.
 * Loaded immediately so they can see the full tool without uploading.
 */

export const DEMO_COURSE = {
  name: 'Biology 101',
  code: 'BIO101',
  tier: 'secondary',
  extractionData: {
    documentType: 'brief',
    assessmentBriefs: [
      {
        id: 'demo_essay',
        title: 'Cell Division Essay',
        body: `Assessment Task: Written Essay
Topic: Explain the process of mitosis and its importance in living organisms.

You must:
- Describe the stages of mitosis (prophase, metaphase, anaphase, telophase)
- Explain why cell division is necessary for growth and repair
- Include at least one diagram (hand-drawn or digital)
- Use at least 3 scientific references (textbook or journal articles)
- Write in formal scientific register

Word count: 800-1000 words
Due date: 2 weeks from today
Weight: 20% of your final grade

Marking Rubric:
- Scientific accuracy (30%): correct description of all stages
- Depth of explanation (25%): clear reasoning about why mitosis matters
- Use of evidence (20%): references integrated into your argument
- Communication (15%): formal register, clear structure, diagrams labelled
- Referencing (10%): APA 7 format, minimum 3 sources`,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        wordCountGoal: 1000,
        weight: '20%',
        source: 'demo',
      },
    ],
    rubricCriteria: [
      { criterion: 'Scientific accuracy', weight: '30%' },
      { criterion: 'Depth of explanation', weight: '25%' },
      { criterion: 'Use of evidence', weight: '20%' },
      { criterion: 'Communication', weight: '15%' },
      { criterion: 'Referencing', weight: '10%' },
    ],
    paretoSteps: [
      'Write the 4 stages of mitosis in your own words (targets Scientific accuracy, 30%)',
      'Explain WHY cells divide: growth, repair, replacement (targets Depth, 25%)',
      'Find 3 sources and write one sentence about what each says (targets Evidence, 20%)',
      'Write an introduction and conclusion that link mitosis to real life (targets Communication, 15%)',
      'Format all references in APA 7 (targets Referencing, 10%)',
    ],
    primaryRawText: `Assessment Task: Written Essay - Cell Division
Topic: Explain the process of mitosis and its importance in living organisms.
Stages: prophase, metaphase, anaphase, telophase.
Why: growth, repair, replacement of damaged cells.
Requirements: 800-1000 words, formal scientific register, 3+ references APA 7, one diagram.
Rubric: Scientific accuracy 30%, Depth 25%, Evidence 20%, Communication 15%, Referencing 10%.`,
    detectedLevel: 'secondary',
    shadow: false,
  },
};
