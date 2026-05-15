import { s, t, d } from './helpers';

// ============================================================
// LAW
// ============================================================

const legal_memo = {
  format: 'legal_memo',
  displayName: 'Legal Memo (IRAC)',
  description: 'IRAC-structured legal memorandum',
  faculty: 'law',
  sections: [
    s('issue', 'Issue', 15, [t('Identify the legal issue as a question', 10), t('Narrow the scope', 5)], [d('Issue stated as a question', 'best_practice', { type: 'has_question' })]),
    s('rule', 'Rule', 30, [t('State the relevant legal rules, statutes, and case law', 20), t('Explain how courts have interpreted the rule', 10)], [d('Cites relevant legislation or case law', 'best_practice', { type: 'citation_count_min', min: 2 })]),
    s('application', 'Application', 45, [t('Apply the rule to the facts of the case', 20), t('Consider both sides of the argument', 15), t('Use analogies from case law', 10)], [d('Applies rule to specific facts', 'best_practice')]),
    s('conclusion', 'Conclusion', 10, [t('State the likely legal outcome', 5), t('Note any qualifications or uncertainties', 5)], []),
    s('references', 'References', 20, [t('Format case citations and legislation', 15), t('Check pinpoint references', 5)], []),
  ],
};

const case_note = {
  format: 'case_note',
  displayName: 'Case Note',
  description: 'Case analysis or case note on a judicial decision',
  faculty: 'law',
  sections: [
    s('citation', 'Citation', 5, [t('Full case citation', 5)], []),
    s('facts', 'Facts', 15, [t('Material facts of the case', 15)], []),
    s('issue', 'Issue', 10, [t('Legal issue(s) before the court', 10)], []),
    s('decision', 'Decision', 10, [t('What the court decided', 10)], []),
    s('reasoning', 'Reasoning', 30, [t('How the court reached its decision', 20), t('Key legal principles applied', 10)], []),
    s('analysis', 'Critical Analysis', 30, [t('Strengths and weaknesses of the reasoning', 15), t('Implications for future cases', 15)], [d('Contains critical analysis, not just summary', 'best_practice')]),
  ],
};

const statutory_interpretation = {
  format: 'statutory_interpretation',
  displayName: 'Statutory Interpretation',
  description: 'Statutory interpretation exercise',
  faculty: 'law',
  sections: [
    s('provision', 'Statutory Provision', 10, [t('Identify the relevant statute and section', 10)], []),
    s('literal', 'Literal Rule', 20, [t('Plain meaning of the words', 20)], []),
    s('purposive', 'Purposive Approach', 20, [t('Legislative intent and purpose', 20)], []),
    s('context', 'Contextual Analysis', 20, [t('Surrounding provisions and Acts Interpretation Act', 20)], []),
    s('application', 'Application to Facts', 20, [t('How the statute applies to the problem', 20)], []),
    s('conclusion', 'Conclusion', 10, [t('Likely interpretation', 10)], []),
  ],
};

const moot_court = {
  format: 'moot_court',
  displayName: 'Moot Court Submission',
  description: 'Moot court or advocacy submission',
  faculty: 'law',
  sections: [
    s('preliminary', 'Preliminary Matters', 10, [t('Jurisdiction and standing', 10)], []),
    s('ground_1', 'Ground 1', 30, [t('State the ground', 5), t('Legal argument with authorities', 20), t('Apply to facts', 5)], []),
    s('ground_2', 'Ground 2', 30, [t('State the ground', 5), t('Legal argument', 20), t('Apply to facts', 5)], []),
    s('remedy', 'Remedy Sought', 10, [t('What orders are sought', 10)], []),
    s('bibliography', 'List of Authorities', 15, [t('Cases, legislation, secondary sources', 15)], []),
  ],
};

const contract_drafting = {
  format: 'contract_drafting',
  displayName: 'Contract Drafting',
  description: 'Drafting a legal contract or agreement',
  faculty: 'law',
  sections: [
    s('parties', 'Parties and Recitals', 10, [t('Identify the parties', 5), t('Background recitals', 5)], []),
    s('definitions', 'Definitions', 15, [t('Define key terms', 15)], []),
    s('obligations', 'Operative Clauses', 30, [t('Draft the core obligations', 30)], []),
    s('consideration', 'Consideration and Payment', 15, [t('Payment terms, schedule', 15)], []),
    s('termination', 'Termination and Breach', 15, [t('Termination events and remedies', 15)], []),
    s('general', 'General Provisions', 10, [t('Governing law, dispute resolution, notices', 10)], []),
    s('execution', 'Execution', 5, [t('Signature block', 5)], []),
  ],
};

const legal_advice = {
  format: 'legal_advice',
  displayName: 'Legal Advice',
  description: 'Legal advice letter or opinion',
  faculty: 'law',
  sections: [
    s('summary', 'Summary of Advice', 10, [t('Key advice in plain language', 10)], []),
    s('facts', 'Statement of Facts', 15, [t('Facts as understood from the client', 15)], []),
    s('issues', 'Legal Issues', 10, [t('Identify the legal questions', 10)], []),
    s('law', 'Applicable Law', 30, [t('Relevant legislation and case law', 30)], []),
    s('analysis', 'Analysis', 30, [t('Apply the law to the facts', 30)], []),
    s('recommendations', 'Recommendations', 15, [t('Practical advice and next steps', 15)], []),
  ],
};

const precedent_comparison = {
  format: 'precedent_comparison',
  displayName: 'Precedent Comparison',
  description: 'Compare and analyse legal precedents',
  faculty: 'law',
  sections: [
    s('cases', 'Cases Identified', 15, [t('List cases with full citations', 15)], []),
    s('facts_comparison', 'Facts Comparison', 20, [t('Compare material facts across cases', 20)], []),
    s('ratio', 'Ratio Decidendi', 25, [t('Extract the ratio from each case', 25)], []),
    s('analysis', 'Comparative Analysis', 30, [t('How the cases relate', 15), t('Evolution of the legal principle', 15)], []),
    s('application', 'Application', 15, [t('How these precedents apply to the current problem', 15)], []),
  ],
};

const compliance_review = {
  format: 'compliance_review',
  displayName: 'Compliance Review',
  description: 'Regulatory compliance assessment',
  faculty: 'law',
  sections: [
    s('scope', 'Scope', 10, [t('What is being reviewed and against which regulations', 10)], []),
    s('framework', 'Regulatory Framework', 20, [t('Relevant laws, regulations, standards', 20)], []),
    s('assessment', 'Compliance Assessment', 40, [t('Assess each requirement', 40)], []),
    s('findings', 'Findings', 20, [t('Compliant and non-compliant areas', 20)], []),
    s('recommendations', 'Recommendations', 15, [t('Remediation actions', 15)], []),
  ],
};

export {
  legal_memo,
  case_note,
  statutory_interpretation,
  moot_court,
  contract_drafting,
  legal_advice,
  precedent_comparison,
  compliance_review,
};
