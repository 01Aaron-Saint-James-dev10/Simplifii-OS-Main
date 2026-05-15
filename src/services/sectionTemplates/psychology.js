import { s, t, d } from './helpers';

// ============================================================
// PSYCHOLOGY AND SOCIAL WORK
// ============================================================

const reflective_practice = {
  format: 'reflective_practice',
  displayName: 'Reflective Practice Journal',
  description: 'Structured reflective practice entry',
  faculty: 'social_work',
  sections: [
    s('experience', 'Experience', 15, [t('Describe the practice experience', 15)], []),
    s('feelings', 'Feelings and Reactions', 10, [t('Your emotional response', 10)], []),
    s('theory', 'Theory Connection', 20, [t('Link to relevant theory or framework', 20)], [d('References at least one theory', 'best_practice')]),
    s('analysis', 'Critical Analysis', 25, [t('What went well, what could improve', 15), t('Power dynamics and ethics', 10)], []),
    s('action_plan', 'Action Plan', 10, [t('What will you do differently', 10)], [d('Includes specific actions', 'best_practice')]),
  ],
};

const case_formulation = {
  format: 'case_formulation',
  displayName: 'Case Formulation',
  description: 'Psychological case formulation',
  faculty: 'social_work',
  sections: [
    s('presenting', 'Presenting Problems', 15, [t('Client concerns and symptoms', 15)], []),
    s('predisposing', 'Predisposing Factors', 15, [t('Background factors contributing to current difficulties', 15)], []),
    s('precipitating', 'Precipitating Factors', 10, [t('Triggers for current episode', 10)], []),
    s('perpetuating', 'Perpetuating Factors', 15, [t('What maintains the difficulties', 15)], []),
    s('protective', 'Protective Factors', 10, [t('Strengths and resources', 10)], []),
    s('formulation', 'Integrated Formulation', 20, [t('How all factors connect', 20)], [d('Integrates all factor types', 'best_practice')]),
    s('plan', 'Treatment Plan', 15, [t('Recommended interventions with rationale', 15)], []),
  ],
};

const intervention_plan = {
  format: 'intervention_plan',
  displayName: 'Intervention Plan',
  description: 'Social work or psychology intervention plan',
  faculty: 'social_work',
  sections: [
    s('assessment', 'Client Assessment', 20, [t('Needs, strengths, risks', 20)], []),
    s('goals', 'Goals and Objectives', 15, [t('SMART goals with client input', 15)], [d('Goals are SMART', 'best_practice')]),
    s('interventions', 'Planned Interventions', 25, [t('Evidence-based interventions', 15), t('Rationale for each', 10)], []),
    s('timeline', 'Timeline', 10, [t('Session plan and milestones', 10)], []),
    s('evaluation', 'Evaluation', 10, [t('Outcome measures', 10)], []),
    s('ethics', 'Ethical Considerations', 10, [t('Confidentiality, consent, duty of care', 10)], []),
  ],
};

const ethical_decision_making = {
  format: 'ethical_decision_making',
  displayName: 'Ethical Decision-Making',
  description: 'Ethical dilemma analysis',
  faculty: 'social_work',
  sections: [
    s('dilemma', 'Ethical Dilemma', 15, [t('Describe the situation and competing values', 15)], []),
    s('stakeholders', 'Stakeholders', 10, [t('Who is affected and how', 10)], []),
    s('codes', 'Professional Codes', 15, [t('Relevant codes of ethics', 15)], []),
    s('options', 'Options Analysis', 20, [t('Possible courses of action with pros/cons', 20)], []),
    s('decision', 'Decision and Justification', 15, [t('Chosen action with ethical justification', 15)], [d('Links decision to professional code', 'best_practice')]),
    s('reflection', 'Reflection', 10, [t('Personal learning from the dilemma', 10)], []),
  ],
};

const counselling_transcript = {
  format: 'counselling_transcript',
  displayName: 'Counselling Transcript Analysis',
  description: 'Analysis of a counselling session transcript',
  faculty: 'social_work',
  sections: [
    s('context', 'Session Context', 10, [t('Client background and session number', 10)], []),
    s('transcript', 'Annotated Transcript', 40, [t('Transcript with skill identification', 40)], []),
    s('skills', 'Skills Analysis', 20, [t('Which counselling skills were used', 10), t('Effectiveness of each', 10)], []),
    s('theory', 'Theoretical Alignment', 15, [t('Which theoretical approach was used', 15)], []),
    s('reflection', 'Self-Reflection', 15, [t('What went well and what to improve', 15)], []),
  ],
};

export {
  reflective_practice,
  case_formulation,
  intervention_plan,
  ethical_decision_making,
  counselling_transcript,
};
