import { s, t, d } from './helpers';

// ============================================================
// SCIENCE AND RESEARCH
// ============================================================

const lab_report = {
  format: 'lab_report',
  displayName: 'Lab Report',
  description: 'Experimental scientific report',
  faculty: 'science',
  sections: [
    s('aim_hypothesis', 'Aim and Hypothesis', 15, [t('State the research question clearly', 5), t('Write your hypothesis as a testable prediction', 10)], [d('Research question is one sentence', 'best_practice', { type: 'sentence_count_max', max: 2 }), d('Hypothesis is testable', 'best_practice', { type: 'mentions_phrase', phrases: ['hypothesis', 'predict', 'expect', 'if', 'then'] })]),
    s('materials', 'Materials', 10, [t('List all materials and equipment used', 10)], []),
    s('method', 'Method', 30, [t('Outline what you measured or observed', 10), t('Describe sample size and selection', 10), t('Write the procedure step by step', 10)], [d('Written in past tense', 'best_practice'), d('Sufficiently detailed for replication', 'best_practice')]),
    s('results', 'Results', 45, [t('List key findings as bullet points', 10), t('Write one paragraph per finding with data', 20), t('Reference tables or figures', 15)], [d('Presents data without interpretation', 'best_practice')]),
    s('discussion', 'Discussion', 60, [t('Restate the main finding', 10), t('Compare with two published studies', 20), t('Explain unexpected results', 15), t('State one limitation and one future direction', 15)], [d('Compares results to at least one published study', 'best_practice', { type: 'citation_count_min', min: 1 }), d('Identifies limitations', 'best_practice', { type: 'mentions_phrase', phrases: ['limitation', 'limited', 'future research', 'further study'] })]),
    s('conclusion', 'Conclusion', 15, [t('Summarise whether the hypothesis was supported', 10), t('State the significance of the findings', 5)], []),
    s('references', 'References', 30, [t('Collect all in-text citations', 10), t('Format in required style', 15), t('Cross-check', 5)], [d('All citations have reference entries', 'best_practice', { type: 'citation_count_min', min: 3 })]),
  ],
};

const clinical_case_report = {
  format: 'clinical_case_report',
  displayName: 'Clinical Case Report',
  description: 'Clinical case presentation and analysis',
  faculty: 'health',
  sections: [
    s('presentation', 'Patient Presentation', 20, [t('Demographics and presenting complaint', 10), t('Relevant history', 10)], []),
    s('history', 'History', 20, [t('Past medical, family, social history', 20)], []),
    s('examination', 'Examination', 20, [t('Physical examination findings', 10), t('Relevant systems review', 10)], []),
    s('investigations', 'Investigations', 20, [t('List investigations ordered and results', 20)], []),
    s('diagnosis', 'Diagnosis', 15, [t('Differential diagnoses considered', 10), t('Final diagnosis with reasoning', 5)], [d('Includes differential diagnosis', 'best_practice')]),
    s('management', 'Management', 30, [t('Treatment plan', 15), t('Medications, interventions, referrals', 15)], []),
    s('outcome', 'Outcome and Follow-up', 15, [t('Patient outcome', 10), t('Follow-up plan', 5)], []),
    s('discussion', 'Discussion', 30, [t('Link to literature', 15), t('Learning points', 15)], []),
  ],
};

const systematic_review = {
  format: 'systematic_review',
  displayName: 'Systematic Review',
  description: 'Systematic literature review following PRISMA or similar',
  faculty: 'science',
  sections: [
    s('introduction', 'Introduction', 30, [t('Background and rationale', 15), t('Research question (PICO format)', 15)], []),
    s('methods', 'Methods', 45, [t('Search strategy and databases', 15), t('Inclusion/exclusion criteria', 15), t('Quality assessment tool', 15)], [d('Search strategy documented', 'best_practice')]),
    s('results', 'Results', 60, [t('PRISMA flow diagram description', 15), t('Study characteristics table', 20), t('Synthesis of findings', 25)], []),
    s('discussion', 'Discussion', 45, [t('Summary of evidence', 15), t('Strengths and limitations', 15), t('Implications', 15)], []),
    s('conclusion', 'Conclusion', 15, [t('Answer the research question', 10), t('Recommendations', 5)], []),
    s('references', 'References', 30, [t('Format references', 20), t('Cross-check', 10)], []),
  ],
};

const scientific_poster = {
  format: 'scientific_poster',
  displayName: 'Scientific Poster',
  description: 'One-page research poster',
  faculty: 'science',
  sections: [
    s('title_authors', 'Title and Authors', 5, [t('Concise title', 3), t('Author names and affiliations', 2)], []),
    s('introduction', 'Introduction', 15, [t('Background in 3-4 sentences', 10), t('Research question', 5)], []),
    s('methods', 'Methods', 15, [t('Brief methods (1 paragraph)', 15)], []),
    s('results', 'Results', 20, [t('Key findings with one figure or table', 20)], []),
    s('discussion', 'Discussion', 15, [t('Interpretation in 2-3 sentences', 10), t('Limitations', 5)], []),
    s('conclusion', 'Conclusion', 5, [t('One-sentence takeaway', 5)], []),
    s('references', 'References', 10, [t('3-5 key references', 10)], []),
  ],
};

const methodology_paper = {
  format: 'methodology_paper',
  displayName: 'Methodology Paper',
  description: 'Research methodology description and justification',
  faculty: 'science',
  sections: [
    s('introduction', 'Introduction', 20, [t('Research context', 10), t('Purpose of the methodology', 10)], []),
    s('research_design', 'Research Design', 30, [t('Qualitative, quantitative, or mixed', 10), t('Justification for chosen design', 20)], []),
    s('data_collection', 'Data Collection', 30, [t('Methods of data collection', 15), t('Instruments used', 15)], []),
    s('sampling', 'Sampling', 20, [t('Population and sample', 10), t('Sampling strategy and justification', 10)], []),
    s('analysis', 'Data Analysis', 30, [t('Analysis approach', 15), t('Software or tools used', 15)], []),
    s('validity', 'Validity and Reliability', 20, [t('Measures to ensure rigour', 20)], []),
    s('ethics', 'Ethical Considerations', 15, [t('Ethics approval, consent, privacy', 15)], []),
    s('references', 'References', 20, [t('Format references', 15), t('Cross-check', 5)], []),
  ],
};

const field_study = {
  format: 'field_study',
  displayName: 'Field Study Report',
  description: 'Report on fieldwork or observational study',
  faculty: 'science',
  sections: [
    s('introduction', 'Introduction', 20, [t('Purpose and context of fieldwork', 10), t('Research questions', 10)], []),
    s('site_description', 'Site Description', 15, [t('Location, conditions, access', 15)], []),
    s('methods', 'Methods', 30, [t('Data collection procedures', 15), t('Instruments and sampling', 15)], []),
    s('observations', 'Observations and Data', 45, [t('Record observations systematically', 30), t('Include maps, photos, or data tables', 15)], []),
    s('analysis', 'Analysis', 30, [t('Patterns and themes from data', 20), t('Compare with existing literature', 10)], []),
    s('conclusion', 'Conclusion', 15, [t('Key findings and implications', 10), t('Limitations of fieldwork', 5)], []),
    s('references', 'References', 15, [t('Format references', 10), t('Cross-check', 5)], []),
  ],
};

const ethics_application = {
  format: 'ethics_application',
  displayName: 'Ethics Application',
  description: 'Ethics committee research application',
  faculty: 'science',
  sections: [
    s('project_summary', 'Project Summary', 15, [t('Brief description of the research', 15)], []),
    s('methodology', 'Methodology', 20, [t('Research design and procedures', 20)], []),
    s('participants', 'Participants', 20, [t('Who, how recruited, inclusion/exclusion', 20)], []),
    s('risks', 'Risks and Benefits', 20, [t('Identify potential risks', 10), t('Describe benefits', 5), t('Risk mitigation strategies', 5)], []),
    s('consent', 'Informed Consent', 15, [t('Consent process and information sheet', 15)], []),
    s('privacy', 'Data Privacy and Storage', 15, [t('How data will be stored, who has access, retention period', 15)], []),
    s('declarations', 'Declarations', 10, [t('Conflicts of interest, funding sources', 10)], []),
  ],
};

export {
  lab_report,
  clinical_case_report,
  systematic_review,
  scientific_poster,
  methodology_paper,
  field_study,
  ethics_application,
};
