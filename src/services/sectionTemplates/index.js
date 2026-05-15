import {
  essay_critical, essay_comparative, essay_expository, essay_reflective,
  literature_review, annotated_bibliography, research_proposal, case_study,
  report_general,
} from './academic';

import {
  lab_report, clinical_case_report, systematic_review, scientific_poster,
  methodology_paper, field_study, ethics_application,
} from './science';

import {
  business_pitch, business_plan, strategic_analysis, marketing_plan,
  financial_analysis, consulting_report, executive_summary, board_paper,
  case_competition,
} from './business';

import {
  legal_memo, case_note, statutory_interpretation, moot_court,
  contract_drafting, legal_advice, precedent_comparison, compliance_review,
} from './law';

import {
  patient_case_study, care_plan, soap_notes, clinical_reasoning,
  ebp_review, osce_prep, health_promotion, pharmacology_calc,
} from './health';

import {
  lesson_plan, unit_of_work, teaching_philosophy, action_research,
  curriculum_design,
} from './education';

import {
  technical_report, design_brief, failure_analysis, engineering_proposal,
  cad_documentation,
} from './engineering';

import {
  close_reading, creative_piece, script_screenplay, exhibition_catalogue,
} from './creative';

import {
  reflective_practice, case_formulation, intervention_plan,
  ethical_decision_making, counselling_transcript,
} from './psychology';

import {
  oral_presentation, pitch_elevator, interview_job, viva_voce, debate,
  group_discussion, mock_trial, mock_consultation, teaching_demo,
  interview_research, tutorial_leadership,
} from './oral';

export const TEMPLATES = {
  // Universal
  essay_critical, essay_comparative, essay_expository, essay_reflective,
  literature_review, annotated_bibliography, research_proposal, case_study,
  report_general,
  // Science
  lab_report, clinical_case_report, systematic_review, methodology_paper,
  scientific_poster, field_study, ethics_application,
  // Business
  business_pitch, business_plan, strategic_analysis, marketing_plan,
  financial_analysis, consulting_report, executive_summary, board_paper,
  case_competition,
  // Law
  legal_memo, case_note, statutory_interpretation, contract_drafting,
  moot_court, legal_advice, precedent_comparison, compliance_review,
  // Health
  patient_case_study, care_plan, soap_notes, clinical_reasoning,
  ebp_review, osce_prep, health_promotion, pharmacology_calc,
  // Education
  lesson_plan, unit_of_work, teaching_philosophy, action_research,
  curriculum_design,
  // Engineering
  technical_report, design_brief, failure_analysis, engineering_proposal,
  cad_documentation,
  // Arts
  close_reading, creative_piece, script_screenplay, exhibition_catalogue,
  // Social work / Psychology
  reflective_practice, case_formulation, intervention_plan,
  ethical_decision_making, counselling_transcript,
  // Performance
  oral_presentation, pitch_elevator, interview_job, interview_research,
  viva_voce, debate, group_discussion, mock_trial, mock_consultation,
  teaching_demo, tutorial_leadership,
};

// Convenience: list all performance formats
export const PERFORMANCE_FORMATS = Object.values(TEMPLATES)
  .filter(t => t.isPerformance)
  .map(t => t.format);

// Convenience: get display name
export const getFormatDisplayName = (format) =>
  TEMPLATES[format]?.displayName || format?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Essay';

// Convenience: get template or fallback
export const getTemplate = (format) => TEMPLATES[format] || TEMPLATES.essay_critical;
