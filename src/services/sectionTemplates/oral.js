import { s, t, d } from './helpers';

// ============================================================
// ORAL AND PERFORMANCE
// ============================================================

const oral_presentation = {
  format: 'oral_presentation',
  displayName: 'Oral Presentation',
  description: 'Presentation preparation and script',
  faculty: 'universal',
  isPerformance: true,
  sections: [
    s('hook', 'Hook and Opening', 15, [t('Attention-grabbing opening', 10), t('State what you will cover', 5)], []),
    s('point_1', 'Key Point 1', 30, [t('Main idea', 10), t('Evidence or example', 10), t('Transition to next point', 10)], []),
    s('point_2', 'Key Point 2', 30, [t('Main idea', 10), t('Evidence or example', 10), t('Transition', 10)], []),
    s('point_3', 'Key Point 3', 30, [t('Main idea', 10), t('Evidence or example', 10), t('Transition to close', 10)], []),
    s('qa_prep', 'Q&A Preparation', 15, [t('Anticipate 3-5 likely questions', 10), t('Prepare concise answers', 5)], []),
    s('close', 'Close and Call to Action', 15, [t('Summarise key points', 5), t('Memorable closing statement', 5), t('Call to action or takeaway', 5)], []),
  ],
};

const pitch_elevator = {
  format: 'pitch_elevator',
  displayName: 'Elevator Pitch',
  description: '60-90 second elevator pitch',
  faculty: 'business',
  isPerformance: true,
  sections: [
    s('hook', 'Hook (10s)', 5, [t('One-sentence attention grabber', 5)], []),
    s('problem', 'Problem (15s)', 5, [t('The pain point in one sentence', 5)], []),
    s('solution', 'Solution (20s)', 10, [t('Your solution in plain language', 10)], []),
    s('proof', 'Proof (15s)', 5, [t('One statistic or testimonial', 5)], []),
    s('ask', 'Ask (10s)', 5, [t('Clear next step or request', 5)], []),
  ],
};

const interview_job = {
  format: 'interview_job',
  displayName: 'Job Interview Prep',
  description: 'Structured job interview preparation',
  faculty: 'universal',
  isPerformance: true,
  sections: [
    s('about_me', 'Tell Me About Yourself', 15, [t('2-minute personal pitch', 15)], []),
    s('why_role', 'Why This Role', 10, [t('Link your skills to the job description', 10)], []),
    s('star_1', 'STAR Story 1', 15, [t('Situation', 3), t('Task', 3), t('Action', 5), t('Result', 4)], []),
    s('star_2', 'STAR Story 2', 15, [t('Situation', 3), t('Task', 3), t('Action', 5), t('Result', 4)], []),
    s('star_3', 'STAR Story 3', 15, [t('Situation', 3), t('Task', 3), t('Action', 5), t('Result', 4)], []),
    s('strengths', 'Strengths and Growth Areas', 10, [t('2 strengths with examples', 5), t('1 growth area with what you\'re doing about it', 5)], []),
    s('questions', 'Your Questions', 10, [t('3-5 thoughtful questions for the interviewer', 10)], []),
  ],
};

const viva_voce = {
  format: 'viva_voce',
  displayName: 'Viva Voce Defence',
  description: 'Thesis viva defence preparation',
  faculty: 'universal',
  isPerformance: true,
  sections: [
    s('opening', 'Opening Statement', 20, [t('Summary of thesis in 5 minutes', 15), t('Key contributions', 5)], []),
    s('methodology', 'Methodology Defence', 30, [t('Why this methodology', 15), t('Anticipated criticisms and responses', 15)], []),
    s('findings', 'Findings Discussion', 30, [t('Summarise key findings', 15), t('Defend interpretation', 15)], []),
    s('limitations', 'Limitations', 15, [t('Honest assessment of limitations', 10), t('How they were mitigated', 5)], []),
    s('contributions', 'Contributions', 15, [t('Theoretical and practical contributions', 15)], []),
    s('future', 'Future Work', 10, [t('Research agenda going forward', 10)], []),
    s('questions', 'Anticipated Questions', 20, [t('Prepare answers to 10 likely questions', 20)], []),
  ],
};

const debate = {
  format: 'debate',
  displayName: 'Debate',
  description: 'Formal debate preparation',
  faculty: 'universal',
  isPerformance: true,
  sections: [
    s('position', 'Position Statement', 10, [t('Clear statement of your side', 10)], []),
    s('argument_1', 'First Argument', 15, [t('Strongest argument with evidence', 15)], []),
    s('argument_2', 'Second Argument', 15, [t('Supporting argument', 15)], []),
    s('rebuttal', 'Anticipated Rebuttals', 15, [t('Counter the opposition\'s likely arguments', 15)], []),
    s('conclusion', 'Closing Statement', 10, [t('Summarise and reinforce position', 10)], []),
  ],
};

const group_discussion = {
  format: 'group_discussion',
  displayName: 'Group Discussion',
  description: 'Assessed group discussion preparation',
  faculty: 'universal',
  isPerformance: true,
  sections: [
    s('preparation', 'Topic Preparation', 20, [t('Research the topic', 15), t('Form your initial position', 5)], []),
    s('key_points', 'Key Points to Make', 15, [t('3-4 contributions planned', 15)], []),
    s('questions', 'Questions to Ask Others', 10, [t('Thoughtful questions that advance discussion', 10)], []),
    s('listening', 'Active Listening Notes', 10, [t('Template for noting others\' points', 10)], []),
  ],
};

const mock_trial = {
  format: 'mock_trial',
  displayName: 'Mock Trial',
  description: 'Mock trial preparation',
  faculty: 'law',
  isPerformance: true,
  sections: [
    s('opening', 'Opening Statement', 15, [t('Theory of the case', 10), t('Preview of evidence', 5)], []),
    s('examination', 'Direct Examination', 30, [t('Questions for your witnesses', 20), t('Anticipated answers', 10)], []),
    s('cross', 'Cross-Examination', 30, [t('Questions for opposing witnesses', 20), t('Impeachment strategy', 10)], []),
    s('closing', 'Closing Argument', 20, [t('Summarise evidence', 10), t('Apply law to facts', 10)], []),
  ],
};

const mock_consultation = {
  format: 'mock_consultation',
  displayName: 'Mock Consultation',
  description: 'Simulated clinical consultation',
  faculty: 'health',
  isPerformance: true,
  sections: [
    s('opening', 'Opening and Rapport', 10, [t('Introduction and setting the agenda', 10)], []),
    s('history', 'History Taking', 20, [t('Structured history questions', 20)], []),
    s('examination', 'Examination Plan', 15, [t('Relevant examination steps', 15)], []),
    s('explanation', 'Explanation and Planning', 15, [t('Explain diagnosis in plain language', 10), t('Shared decision-making', 5)], []),
    s('close', 'Safety Netting and Close', 10, [t('Red flags to return for', 5), t('Follow-up plan', 5)], []),
  ],
};

const teaching_demo = {
  format: 'teaching_demo',
  displayName: 'Teaching Demonstration',
  description: 'Observed teaching demonstration',
  faculty: 'education',
  isPerformance: true,
  sections: [
    s('plan', 'Lesson Plan', 15, [t('Objectives and structure', 15)], []),
    s('engagement', 'Student Engagement Strategy', 10, [t('How you will engage learners', 10)], []),
    s('delivery', 'Delivery Notes', 20, [t('Key explanations', 10), t('Activity instructions', 10)], []),
    s('assessment', 'In-lesson Assessment', 10, [t('How you check understanding', 10)], []),
    s('reflection', 'Post-lesson Reflection', 10, [t('What worked, what to adjust', 10)], []),
  ],
};

const interview_research = {
  format: 'interview_research',
  displayName: 'Research Interview Prep',
  description: 'Preparation for conducting research interviews',
  faculty: 'universal',
  isPerformance: true,
  sections: [
    s('protocol', 'Interview Protocol', 15, [t('Opening script', 5), t('Ethics statement and consent', 10)], []),
    s('questions', 'Interview Questions', 30, [t('Core questions (5-8)', 15), t('Probing follow-up questions', 15)], []),
    s('logistics', 'Logistics', 10, [t('Recording equipment, location, timing', 10)], []),
    s('analysis_plan', 'Analysis Plan', 10, [t('How data will be analysed', 10)], []),
  ],
};

const tutorial_leadership = {
  format: 'tutorial_leadership',
  displayName: 'Tutorial Leadership',
  description: 'Leading a tutorial or seminar',
  faculty: 'education',
  isPerformance: true,
  sections: [
    s('preparation', 'Content Preparation', 15, [t('Key concepts to cover', 10), t('Discussion questions', 5)], []),
    s('activities', 'Activities', 15, [t('Engagement activities planned', 15)], []),
    s('facilitation', 'Facilitation Notes', 10, [t('How to manage discussion flow', 10)], []),
    s('summary', 'Summary and Wrap-up', 5, [t('Key takeaways for students', 5)], []),
  ],
};

export {
  oral_presentation,
  pitch_elevator,
  interview_job,
  viva_voce,
  debate,
  group_discussion,
  mock_trial,
  mock_consultation,
  teaching_demo,
  interview_research,
  tutorial_leadership,
};
