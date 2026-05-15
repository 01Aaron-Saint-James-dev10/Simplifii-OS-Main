import { s, t, d } from './helpers';

// ============================================================
// HEALTH AND CLINICAL
// ============================================================

const patient_case_study = {
  format: 'patient_case_study',
  displayName: 'Patient Case Study',
  description: 'Patient-focused clinical case study',
  faculty: 'health',
  sections: [
    s('background', 'Patient Background', 15, [t('Demographics and relevant history', 15)], []),
    s('complaint', 'Presenting Complaint', 10, [t('Chief complaint and symptom history', 10)], []),
    s('assessment', 'Assessment', 30, [t('Physical assessment findings', 15), t('Relevant investigations', 15)], []),
    s('diagnosis', 'Diagnosis', 15, [t('Primary and differential diagnoses', 15)], []),
    s('management', 'Management Plan', 30, [t('Treatment plan', 15), t('Patient education', 15)], []),
    s('reflection', 'Reflection', 15, [t('What you learned from this case', 15)], []),
  ],
};

const care_plan = {
  format: 'care_plan',
  displayName: 'Nursing Care Plan',
  description: 'Nursing care plan using ADPIE or similar',
  faculty: 'health',
  sections: [
    s('assessment', 'Assessment', 20, [t('Patient data collection', 20)], []),
    s('diagnoses', 'Nursing Diagnoses', 15, [t('Priority nursing diagnoses with rationale', 15)], []),
    s('goals', 'Goals and Expected Outcomes', 15, [t('SMART goals for each diagnosis', 15)], []),
    s('interventions', 'Interventions', 30, [t('Evidence-based nursing interventions', 30)], []),
    s('evaluation', 'Evaluation', 15, [t('How outcomes will be measured', 15)], []),
  ],
};

const soap_notes = {
  format: 'soap_notes',
  displayName: 'SOAP Notes',
  description: 'SOAP clinical documentation',
  faculty: 'health',
  sections: [
    s('subjective', 'Subjective', 15, [t('Patient reported symptoms and history', 15)], []),
    s('objective', 'Objective', 15, [t('Observable, measurable findings', 15)], []),
    s('assessment', 'Assessment', 15, [t('Clinical interpretation and diagnosis', 15)], []),
    s('plan', 'Plan', 15, [t('Treatment plan and follow-up', 15)], []),
  ],
};

const clinical_reasoning = {
  format: 'clinical_reasoning',
  displayName: 'Clinical Reasoning Task',
  description: 'Clinical reasoning exercise',
  faculty: 'health',
  sections: [
    s('cue_collection', 'Cue Collection', 15, [t('Identify relevant cues from patient data', 15)], []),
    s('processing', 'Information Processing', 20, [t('Interpret cues using clinical knowledge', 20)], []),
    s('hypothesis', 'Hypothesis Generation', 15, [t('Generate and rank differential diagnoses', 15)], []),
    s('evaluation', 'Hypothesis Evaluation', 20, [t('Test hypotheses against available data', 20)], []),
    s('decision', 'Clinical Decision', 15, [t('Decision and rationale', 15)], []),
  ],
};

const ebp_review = {
  format: 'ebp_review',
  displayName: 'Evidence-Based Practice Review',
  description: 'EBP review following PICO',
  faculty: 'health',
  sections: [
    s('clinical_question', 'Clinical Question (PICO)', 15, [t('State the PICO question', 15)], [d('Uses PICO format', 'best_practice')]),
    s('search', 'Search Strategy', 15, [t('Databases, keywords, filters', 15)], []),
    s('appraisal', 'Critical Appraisal', 30, [t('Appraise 2-3 studies', 30)], []),
    s('synthesis', 'Evidence Synthesis', 20, [t('What does the evidence say?', 20)], []),
    s('application', 'Clinical Application', 15, [t('How to apply findings to practice', 15)], []),
  ],
};

const osce_prep = {
  format: 'osce_prep',
  displayName: 'OSCE Preparation',
  description: 'Objective Structured Clinical Examination prep',
  faculty: 'health',
  sections: [
    s('station_overview', 'Station Overview', 10, [t('Scenario and expected tasks', 10)], []),
    s('approach', 'Approach', 15, [t('Opening, introduction, consent', 15)], []),
    s('history', 'History Taking', 20, [t('Structured history framework', 20)], []),
    s('examination', 'Examination', 20, [t('Relevant examination steps', 20)], []),
    s('communication', 'Communication', 15, [t('Explanation and patient education', 15)], []),
    s('summary', 'Summary and Handover', 10, [t('Summarise findings and plan', 10)], []),
  ],
};

const health_promotion = {
  format: 'health_promotion',
  displayName: 'Health Promotion Campaign',
  description: 'Health promotion campaign design',
  faculty: 'health',
  sections: [
    s('needs_assessment', 'Needs Assessment', 20, [t('Target population and health need', 20)], []),
    s('literature', 'Evidence Base', 20, [t('Review of relevant health promotion evidence', 20)], []),
    s('theory', 'Theoretical Framework', 15, [t('Health behaviour theory applied', 15)], []),
    s('campaign', 'Campaign Design', 30, [t('Messages, channels, materials', 30)], []),
    s('evaluation', 'Evaluation Plan', 15, [t('How effectiveness will be measured', 15)], []),
  ],
};

const pharmacology_calc = {
  format: 'pharmacology_calc',
  displayName: 'Pharmacology Calculation',
  description: 'Drug dosage calculation task',
  faculty: 'health',
  sections: [
    s('prescription', 'Prescription Review', 10, [t('Review the order and identify the drug', 10)], []),
    s('calculation', 'Dosage Calculation', 20, [t('Show working using desired/stock formula', 20)], [d('Shows all working', 'best_practice')]),
    s('safety', 'Safety Check', 10, [t('Check against safe dose range', 5), t('Identify contraindications', 5)], []),
    s('administration', 'Administration', 10, [t('Route, rate, equipment', 10)], []),
  ],
};

export {
  patient_case_study,
  care_plan,
  soap_notes,
  clinical_reasoning,
  ebp_review,
  osce_prep,
  health_promotion,
  pharmacology_calc,
};
