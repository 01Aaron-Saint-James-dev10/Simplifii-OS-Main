/**
 * sectionTemplates.js
 *
 * 50+ assessment format templates. Each format has sections with sub-tasks
 * and Definition of Done criteria. Used by ScaffolderToolService and SectionRail.
 *
 * Reference: docs/ASSESSMENT_FORMAT_LIBRARY.md
 */

// Helper to build a section object
const s = (id, title, estimatedMinutes, defaultSubtasks = [], definitionOfDone = []) => ({
  id, title, estimatedMinutes, defaultSubtasks, definitionOfDone,
});

// Helper to build a sub-task
const t = (label, estimatedMinutes) => ({ label, estimatedMinutes });

// Helper to build a DoD criterion
const d = (criterion, source = 'best_practice', autoCheck = null) => ({ criterion, source, autoCheck });

// ============================================================
// UNIVERSAL ACADEMIC
// ============================================================

const essay_critical = {
  format: 'essay_critical',
  displayName: 'Critical Essay',
  description: 'Thesis-driven argumentative essay',
  faculty: 'universal',
  sections: [
    s('intro_thesis', 'Introduction with Thesis', 30, [
      t('Write a hook sentence that introduces the topic', 10),
      t('Provide background context in 2-3 sentences', 10),
      t('State your thesis as a clear, arguable claim', 10),
    ], [
      d('Contains a clear thesis statement', 'best_practice', { type: 'mentions_phrase', phrases: ['argue', 'contend', 'this essay', 'thesis'] }),
      d('Introduction is 150-300 words', 'best_practice', { type: 'word_count_range', min: 150, max: 300 }),
    ]),
    s('argument_1', 'Argument 1 + Evidence', 60, [
      t('Write a topic sentence stating the first argument', 10),
      t('Add evidence from one primary source', 15),
      t('Explain how the evidence supports your thesis', 15),
      t('Add a second piece of evidence or counter-point', 20),
    ], [
      d('Topic sentence links back to thesis', 'best_practice'),
      d('At least 2 pieces of evidence cited', 'best_practice', { type: 'citation_count_min', min: 2 }),
    ]),
    s('argument_2', 'Argument 2 + Evidence', 60, [
      t('Write a topic sentence for the second argument', 10),
      t('Add evidence from a different source', 15),
      t('Analyse the evidence critically', 20),
      t('Transition sentence linking to next section', 15),
    ], [
      d('Uses different sources from Argument 1', 'best_practice'),
      d('Contains critical analysis, not just summary', 'best_practice'),
    ]),
    s('counter_argument', 'Counter-argument', 30, [
      t('Identify the strongest opposing view', 10),
      t('Present the counter-argument fairly', 10),
      t('Rebut it with evidence or reasoning', 10),
    ], [
      d('Acknowledges opposing view', 'best_practice', { type: 'mentions_phrase', phrases: ['however', 'conversely', 'critics argue', 'opposing', 'counter'] }),
    ]),
    s('conclusion', 'Conclusion', 15, [
      t('Restate thesis in different words', 5),
      t('Summarise key arguments', 5),
      t('End with a broader implication or call to action', 5),
    ], [
      d('Does not introduce new evidence', 'best_practice'),
      d('Restates the thesis', 'best_practice'),
    ]),
    s('references', 'References', 30, [
      t('Collect all in-text citations into a list', 10),
      t('Format each reference in the required style', 15),
      t('Cross-check every in-text citation has a reference entry', 5),
    ], [
      d('All in-text citations have corresponding reference entries', 'best_practice', { type: 'citation_count_min', min: 1 }),
    ]),
  ],
};

const essay_comparative = {
  format: 'essay_comparative',
  displayName: 'Comparative Essay',
  description: 'Compare and contrast two or more subjects',
  faculty: 'universal',
  sections: [
    s('intro_criteria', 'Introduction and Criteria', 30, [
      t('Introduce both subjects', 10),
      t('State the criteria for comparison', 10),
      t('Thesis: what the comparison reveals', 10),
    ], [
      d('Both subjects named in introduction', 'best_practice'),
      d('Criteria for comparison stated', 'best_practice'),
    ]),
    s('subject_a', 'Subject A Analysis', 45, [
      t('Describe Subject A against each criterion', 30),
      t('Provide evidence for each point', 15),
    ], [d('Covers all comparison criteria for Subject A', 'best_practice')]),
    s('subject_b', 'Subject B Analysis', 45, [
      t('Describe Subject B against each criterion', 30),
      t('Provide evidence for each point', 15),
    ], [d('Covers all comparison criteria for Subject B', 'best_practice')]),
    s('comparison', 'Direct Comparison', 45, [
      t('Compare similarities', 15),
      t('Contrast differences', 15),
      t('Evaluate which is stronger and why', 15),
    ], [d('Explicitly compares, not just describes side by side', 'best_practice')]),
    s('conclusion', 'Conclusion', 15, [t('Summarise what the comparison reveals', 10), t('Broader implications', 5)], []),
    s('references', 'References', 30, [t('Format reference list', 20), t('Cross-check citations', 10)], []),
  ],
};

const essay_expository = {
  format: 'essay_expository',
  displayName: 'Expository Essay',
  description: 'Explain or inform about a topic',
  faculty: 'universal',
  sections: [
    s('introduction', 'Introduction', 20, [t('Hook and context', 10), t('Thesis or purpose statement', 10)], []),
    s('body_1', 'Explanation 1', 30, [t('Topic sentence', 5), t('Explain with evidence', 20), t('Transition', 5)], []),
    s('body_2', 'Explanation 2', 30, [t('Topic sentence', 5), t('Explain with evidence', 20), t('Transition', 5)], []),
    s('body_3', 'Explanation 3', 30, [t('Topic sentence', 5), t('Explain with evidence', 20), t('Transition', 5)], []),
    s('conclusion', 'Conclusion', 15, [t('Summarise key points', 10), t('Closing thought', 5)], []),
    s('references', 'References', 20, [t('Format reference list', 15), t('Cross-check', 5)], []),
  ],
};

const essay_reflective = {
  format: 'essay_reflective',
  displayName: 'Reflective Essay',
  description: 'Reflection using Gibbs or similar framework',
  faculty: 'universal',
  sections: [
    s('description', 'Description of Experience', 20, [t('What happened? Set the scene.', 10), t('Who was involved? What was your role?', 10)], [d('Describes a specific event or experience', 'best_practice')]),
    s('feelings', 'Feelings', 15, [t('What were you feeling at the time?', 10), t('What are you feeling now looking back?', 5)], []),
    s('evaluation', 'Evaluation', 30, [t('What went well?', 15), t('What did not go well?', 15)], [d('Identifies both positives and negatives', 'best_practice')]),
    s('analysis', 'Analysis', 45, [t('Why did things go well or badly?', 15), t('What theory or framework helps explain this?', 15), t('What could you have done differently?', 15)], [d('Links experience to theory or literature', 'best_practice')]),
    s('conclusion', 'Conclusion and Action Plan', 30, [t('What did you learn?', 10), t('What will you do differently next time?', 10), t('Set a specific goal', 10)], [d('Includes a concrete action plan', 'best_practice')]),
  ],
};

const literature_review = {
  format: 'literature_review',
  displayName: 'Literature Review',
  description: 'Systematic review and synthesis of existing research',
  faculty: 'universal',
  sections: [
    s('intro_scope', 'Introduction and Scope', 30, [t('Define the topic and scope of the review', 15), t('State the research question or objective', 15)], [d('Research question is clearly stated', 'best_practice', { type: 'has_question' })]),
    s('search_strategy', 'Search Strategy', 15, [t('List databases searched', 5), t('Describe keywords and inclusion/exclusion criteria', 10)], []),
    s('themes', 'Themes Identified', 60, [t('Identify 3-5 major themes from the literature', 20), t('Group sources by theme', 20), t('Write a summary paragraph per theme', 20)], [d('At least 3 themes identified', 'best_practice')]),
    s('synthesis', 'Synthesis', 45, [t('Compare and contrast findings across themes', 20), t('Identify areas of agreement and disagreement', 15), t('Weigh the evidence', 10)], [d('Synthesises, not just summarises source by source', 'best_practice')]),
    s('gaps_critique', 'Gaps and Critique', 30, [t('Identify gaps in the literature', 15), t('Critique methodology of key studies', 15)], [d('Identifies at least one gap', 'best_practice')]),
    s('conclusion', 'Conclusion', 15, [t('Summarise the state of knowledge', 10), t('Implications for future research', 5)], []),
    s('references', 'References', 30, [t('Format all references', 20), t('Cross-check citations', 10)], [d('All cited sources in reference list', 'best_practice', { type: 'citation_count_min', min: 5 })]),
  ],
};

const annotated_bibliography = {
  format: 'annotated_bibliography',
  displayName: 'Annotated Bibliography',
  description: 'Annotated list of sources with critical summaries',
  faculty: 'universal',
  sections: [
    s('source_1', 'Source 1 Annotation', 45, [t('Full bibliographic reference', 5), t('Summary of the source (3-4 sentences)', 15), t('Evaluation: credibility, methodology', 15), t('Relevance to your research question', 10)], [d('Includes summary, evaluation, and relevance', 'best_practice')]),
    s('source_2', 'Source 2 Annotation', 45, [t('Full reference', 5), t('Summary', 15), t('Evaluation', 15), t('Relevance', 10)], []),
    s('source_3', 'Source 3 Annotation', 45, [t('Full reference', 5), t('Summary', 15), t('Evaluation', 15), t('Relevance', 10)], []),
    s('source_4', 'Source 4 Annotation', 45, [t('Full reference', 5), t('Summary', 15), t('Evaluation', 15), t('Relevance', 10)], []),
    s('source_5', 'Source 5 Annotation', 45, [t('Full reference', 5), t('Summary', 15), t('Evaluation', 15), t('Relevance', 10)], []),
    s('reflection', 'Reflection Statement', 30, [t('How do these sources relate to each other?', 15), t('What gaps remain?', 15)], []),
  ],
};

const research_proposal = {
  format: 'research_proposal',
  displayName: 'Research Proposal',
  description: 'Proposal for a research project or thesis',
  faculty: 'universal',
  sections: [
    s('introduction', 'Introduction', 30, [t('Background and significance', 15), t('Research problem', 15)], []),
    s('lit_review', 'Literature Review', 60, [t('Review key literature', 30), t('Identify the gap your research fills', 30)], [d('Identifies a clear gap', 'best_practice')]),
    s('research_questions', 'Research Questions', 15, [t('State primary research question', 5), t('State secondary questions if applicable', 10)], [d('Contains at least one research question', 'best_practice', { type: 'has_question' })]),
    s('methodology', 'Methodology', 60, [t('Research design (qualitative/quantitative/mixed)', 15), t('Data collection methods', 15), t('Sampling strategy', 15), t('Analysis approach', 15)], [d('Specifies research design', 'best_practice')]),
    s('significance', 'Significance', 15, [t('Why does this research matter?', 10), t('Who benefits?', 5)], []),
    s('timeline', 'Timeline', 15, [t('Break the project into phases with dates', 15)], []),
    s('ethics', 'Ethics', 15, [t('Ethical considerations', 10), t('Informed consent, privacy, risk', 5)], []),
    s('references', 'References', 30, [t('Format references', 20), t('Cross-check', 10)], []),
  ],
};

const case_study = {
  format: 'case_study',
  displayName: 'Case Study',
  description: 'Analysis of a specific case or scenario',
  faculty: 'universal',
  sections: [
    s('overview', 'Case Overview', 20, [t('Summarise the case', 10), t('Identify key stakeholders', 10)], []),
    s('problem', 'Problem Identification', 20, [t('What is the central problem?', 10), t('Why does it matter?', 10)], [d('Central problem clearly stated', 'best_practice')]),
    s('analysis', 'Analysis', 60, [t('Apply relevant theory or framework', 20), t('Analyse causes and contributing factors', 20), t('Consider multiple perspectives', 20)], [d('Applies at least one theory or framework', 'best_practice')]),
    s('recommendations', 'Recommendations', 30, [t('Propose 2-3 specific solutions', 15), t('Evaluate feasibility of each', 15)], [d('Recommendations are specific and actionable', 'best_practice')]),
    s('implementation', 'Implementation', 15, [t('How would recommendations be implemented?', 10), t('Timeline and resources needed', 5)], []),
    s('conclusion', 'Conclusion', 10, [t('Summarise key findings and recommendations', 10)], []),
    s('references', 'References', 20, [t('Format references', 15), t('Cross-check', 5)], []),
  ],
};

const report_general = {
  format: 'report_general',
  displayName: 'General Report',
  description: 'Structured report with findings and recommendations',
  faculty: 'universal',
  sections: [
    s('exec_summary', 'Executive Summary', 15, [t('One-page summary of the entire report', 15)], [d('Summarises findings and recommendations', 'best_practice')]),
    s('introduction', 'Introduction', 20, [t('Background and purpose', 10), t('Scope and limitations', 10)], []),
    s('methodology', 'Methodology', 20, [t('How data was collected or research conducted', 20)], []),
    s('findings', 'Findings', 60, [t('Present findings clearly with evidence', 30), t('Use headings, tables, or figures where appropriate', 30)], []),
    s('discussion', 'Discussion', 30, [t('Interpret the findings', 15), t('Compare with existing literature', 15)], []),
    s('recommendations', 'Recommendations', 20, [t('Specific, actionable recommendations', 20)], []),
    s('conclusion', 'Conclusion', 10, [t('Summarise', 10)], []),
    s('references', 'References', 20, [t('Format references', 15), t('Cross-check', 5)], []),
  ],
};

// ============================================================
// SCIENCE / HEALTH
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

// ============================================================
// BUSINESS
// ============================================================

const business_pitch = {
  format: 'business_pitch',
  displayName: 'Business Pitch',
  description: 'Pitch deck or elevator pitch',
  faculty: 'business',
  sections: [
    s('hook', 'Hook', 10, [t('One-sentence problem statement', 5), t('Why it matters now', 5)], []),
    s('problem', 'Problem', 15, [t('Describe the pain point', 10), t('Who experiences it', 5)], []),
    s('solution', 'Solution', 15, [t('Your product or service', 10), t('How it solves the problem', 5)], []),
    s('market', 'Market', 15, [t('Target market size', 5), t('Customer segment', 5), t('Growth potential', 5)], []),
    s('business_model', 'Business Model', 15, [t('Revenue model', 10), t('Pricing strategy', 5)], []),
    s('team', 'Team', 10, [t('Key team members and expertise', 10)], []),
    s('ask', 'The Ask', 10, [t('What you need (funding, partnership, etc.)', 5), t('What you offer in return', 5)], []),
    s('close', 'Close', 5, [t('Memorable closing statement', 5)], []),
  ],
};

const business_plan = {
  format: 'business_plan',
  displayName: 'Business Plan',
  description: 'Comprehensive business plan',
  faculty: 'business',
  sections: [
    s('exec_summary', 'Executive Summary', 30, [t('Business overview, mission, vision', 15), t('Key financials and funding needs', 15)], []),
    s('company', 'Company Description', 20, [t('Legal structure, history, location', 10), t('Mission and values', 10)], []),
    s('market_analysis', 'Market Analysis', 45, [t('Industry overview', 15), t('Target market', 15), t('Competitive analysis', 15)], []),
    s('organisation', 'Organisation and Management', 20, [t('Org structure', 10), t('Key personnel', 10)], []),
    s('products', 'Products and Services', 20, [t('Offerings', 10), t('Value proposition', 10)], []),
    s('marketing', 'Marketing and Sales', 30, [t('Marketing strategy', 15), t('Sales process', 15)], []),
    s('financials', 'Financial Projections', 45, [t('Revenue projections', 15), t('Expense forecast', 15), t('Break-even analysis', 15)], []),
    s('appendix', 'Appendix', 15, [t('Supporting documents, charts, data', 15)], []),
  ],
};

const strategic_analysis = {
  format: 'strategic_analysis',
  displayName: 'Strategic Analysis',
  description: 'SWOT, PESTLE, Porter\'s Five Forces analysis',
  faculty: 'business',
  sections: [
    s('context', 'Context', 20, [t('Company or situation background', 10), t('Scope of analysis', 10)], []),
    s('framework', 'Framework Application', 60, [t('Apply the chosen framework systematically', 30), t('Support each element with evidence', 30)], [d('Framework applied to all elements', 'best_practice')]),
    s('findings', 'Key Findings', 30, [t('Summarise insights from the analysis', 15), t('Prioritise by impact', 15)], []),
    s('recommendations', 'Strategic Recommendations', 30, [t('Specific, actionable recommendations', 15), t('Link each to a finding', 15)], []),
    s('implementation', 'Implementation Roadmap', 20, [t('Timeline, resources, responsibilities', 20)], []),
    s('references', 'References', 15, [t('Format references', 10), t('Cross-check', 5)], []),
  ],
};

const marketing_plan = {
  format: 'marketing_plan',
  displayName: 'Marketing Plan',
  description: 'Marketing strategy document',
  faculty: 'business',
  sections: [
    s('exec_summary', 'Executive Summary', 15, [t('One-page summary', 15)], []),
    s('situation', 'Situation Analysis', 30, [t('Internal analysis', 15), t('External analysis (PESTLE/competitor)', 15)], []),
    s('target_market', 'Target Market', 20, [t('Customer segments and personas', 20)], []),
    s('objectives', 'Marketing Objectives', 15, [t('SMART objectives', 15)], []),
    s('strategy', 'Marketing Strategy', 30, [t('Positioning and messaging', 15), t('4Ps or 7Ps application', 15)], []),
    s('tactics', 'Tactics and Channels', 20, [t('Specific marketing activities', 20)], []),
    s('budget', 'Budget', 15, [t('Cost breakdown by channel', 15)], []),
    s('measurement', 'Measurement and KPIs', 15, [t('How success will be measured', 15)], []),
  ],
};

const financial_analysis = {
  format: 'financial_analysis',
  displayName: 'Financial Analysis',
  description: 'Financial modelling or analysis report',
  faculty: 'business',
  sections: [
    s('introduction', 'Introduction', 15, [t('Company/investment overview', 10), t('Purpose of analysis', 5)], []),
    s('data', 'Financial Data', 30, [t('Key financial statements', 15), t('Ratios and metrics', 15)], []),
    s('analysis', 'Analysis', 45, [t('Trend analysis', 15), t('Ratio interpretation', 15), t('Comparison with industry', 15)], []),
    s('valuation', 'Valuation', 30, [t('Valuation methodology', 15), t('Calculations', 15)], []),
    s('recommendations', 'Recommendations', 15, [t('Investment or strategic recommendations', 15)], []),
    s('references', 'References', 10, [t('Data sources', 10)], []),
  ],
};

const consulting_report = {
  format: 'consulting_report',
  displayName: 'Consulting Report',
  description: 'Management consulting style report',
  faculty: 'business',
  sections: [
    s('exec_summary', 'Executive Summary', 20, [t('Key findings and recommendations in one page', 20)], []),
    s('background', 'Background', 15, [t('Client context and engagement scope', 15)], []),
    s('issue', 'Issue Definition', 15, [t('Core problem statement', 15)], [d('Problem statement is clear and specific', 'best_practice')]),
    s('analysis', 'Analysis', 60, [t('Data analysis and framework application', 30), t('Root cause identification', 30)], []),
    s('recommendations', 'Recommendations', 30, [t('Prioritised recommendations', 15), t('Implementation approach per recommendation', 15)], []),
    s('risks', 'Risks and Mitigation', 15, [t('Key risks and mitigation strategies', 15)], []),
    s('appendix', 'Appendix', 15, [t('Supporting data, models, interview notes', 15)], []),
  ],
};

const executive_summary = {
  format: 'executive_summary',
  displayName: 'Executive Summary',
  description: 'Standalone executive summary document',
  faculty: 'business',
  sections: [
    s('context', 'Context and Purpose', 10, [t('Why this document exists', 10)], []),
    s('key_findings', 'Key Findings', 20, [t('3-5 bullet point findings', 20)], []),
    s('recommendations', 'Recommendations', 15, [t('Prioritised action items', 15)], []),
    s('next_steps', 'Next Steps', 10, [t('Immediate actions required', 10)], []),
  ],
};

const board_paper = {
  format: 'board_paper',
  displayName: 'Board Paper',
  description: 'Board or executive briefing paper',
  faculty: 'business',
  sections: [
    s('purpose', 'Purpose', 5, [t('State the decision or information required', 5)], []),
    s('background', 'Background', 15, [t('Context for the board', 15)], []),
    s('analysis', 'Analysis and Options', 30, [t('Present options with pros/cons', 30)], []),
    s('recommendation', 'Recommendation', 10, [t('Preferred option with rationale', 10)], []),
    s('financial', 'Financial Impact', 15, [t('Cost and benefit analysis', 15)], []),
    s('risk', 'Risk Assessment', 10, [t('Key risks and mitigations', 10)], []),
    s('resolution', 'Proposed Resolution', 5, [t('Specific motion for the board', 5)], []),
  ],
};

const case_competition = {
  format: 'case_competition',
  displayName: 'Case Competition Entry',
  description: 'Time-pressured case competition submission',
  faculty: 'business',
  sections: [
    s('problem', 'Problem Statement', 10, [t('Restate the case problem clearly', 10)], []),
    s('analysis', 'Analysis', 30, [t('Apply frameworks to the case data', 30)], []),
    s('solution', 'Proposed Solution', 20, [t('Creative, feasible solution', 20)], []),
    s('implementation', 'Implementation Plan', 15, [t('Steps, timeline, resources', 15)], []),
    s('impact', 'Expected Impact', 10, [t('Quantify the benefit', 10)], []),
  ],
};

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

// ============================================================
// MEDICINE / NURSING / ALLIED HEALTH
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

// ============================================================
// EDUCATION
// ============================================================

const lesson_plan = {
  format: 'lesson_plan',
  displayName: 'Lesson Plan',
  description: 'Single lesson plan',
  faculty: 'education',
  sections: [
    s('objectives', 'Learning Objectives', 10, [t('2-3 measurable objectives using Bloom\'s taxonomy', 10)], [d('Uses action verbs from Bloom\'s taxonomy', 'best_practice')]),
    s('curriculum', 'Curriculum Links', 10, [t('Link to syllabus outcomes', 10)], []),
    s('materials', 'Materials and Resources', 5, [t('List all materials needed', 5)], []),
    s('structure', 'Lesson Structure', 30, [t('Engagement (hook)', 5), t('Exploration (activities)', 10), t('Explanation (teaching)', 10), t('Elaboration (extension)', 5)], []),
    s('differentiation', 'Differentiation', 10, [t('Adjustments for diverse learners', 10)], [d('Addresses at least one learner diversity need', 'best_practice')]),
    s('assessment', 'Assessment', 10, [t('How learning will be assessed', 10)], []),
    s('reflection', 'Reflection', 10, [t('Post-lesson reflection prompts', 10)], []),
  ],
};

const unit_of_work = {
  format: 'unit_of_work',
  displayName: 'Unit of Work',
  description: 'Multi-lesson unit plan',
  faculty: 'education',
  sections: [
    s('overview', 'Unit Overview', 15, [t('Topic, year level, duration', 10), t('Rationale', 5)], []),
    s('outcomes', 'Syllabus Outcomes', 15, [t('Mapped outcomes and content descriptors', 15)], []),
    s('scope', 'Scope and Sequence', 30, [t('Week-by-week lesson summaries', 30)], []),
    s('assessment', 'Assessment Plan', 20, [t('Formative and summative assessment tasks', 20)], []),
    s('resources', 'Resources', 10, [t('Key resources and materials', 10)], []),
    s('differentiation', 'Differentiation and Inclusion', 15, [t('Adjustments for diverse learners', 15)], []),
    s('evaluation', 'Unit Evaluation', 10, [t('How the unit will be evaluated', 10)], []),
  ],
};

const teaching_philosophy = {
  format: 'teaching_philosophy',
  displayName: 'Teaching Philosophy',
  description: 'Teaching philosophy statement',
  faculty: 'education',
  sections: [
    s('beliefs', 'Beliefs About Learning', 20, [t('What you believe about how students learn', 20)], []),
    s('goals', 'Goals for Students', 15, [t('What you want students to achieve', 15)], []),
    s('methods', 'Teaching Methods', 20, [t('How you teach and why', 20)], []),
    s('assessment_approach', 'Assessment Approach', 15, [t('How you assess learning', 15)], []),
    s('growth', 'Continuing Professional Growth', 10, [t('How you continue to develop as a teacher', 10)], []),
  ],
};

const action_research = {
  format: 'action_research',
  displayName: 'Action Research',
  description: 'Classroom action research project',
  faculty: 'education',
  sections: [
    s('context', 'Context and Problem', 20, [t('Classroom context and the problem identified', 20)], []),
    s('lit_review', 'Literature Review', 30, [t('What research says about this problem', 30)], []),
    s('intervention', 'Intervention Design', 20, [t('What you implemented and why', 20)], []),
    s('data', 'Data Collection', 20, [t('How you collected evidence of impact', 20)], []),
    s('analysis', 'Analysis', 20, [t('What the data showed', 20)], []),
    s('reflection', 'Reflection and Next Steps', 15, [t('What you learned and what you would change', 15)], []),
  ],
};

const curriculum_design = {
  format: 'curriculum_design',
  displayName: 'Curriculum Design',
  description: 'Curriculum design or redesign document',
  faculty: 'education',
  sections: [
    s('rationale', 'Rationale', 15, [t('Why this curriculum is needed', 15)], []),
    s('framework', 'Curriculum Framework', 20, [t('Theoretical underpinning', 20)], []),
    s('content', 'Content Selection', 30, [t('What will be taught and why', 30)], []),
    s('pedagogy', 'Pedagogical Approach', 20, [t('How it will be taught', 20)], []),
    s('assessment', 'Assessment Design', 20, [t('How learning will be assessed', 20)], []),
    s('evaluation', 'Curriculum Evaluation', 15, [t('How effectiveness will be measured', 15)], []),
  ],
};

// ============================================================
// ENGINEERING
// ============================================================

const technical_report = {
  format: 'technical_report',
  displayName: 'Technical Report',
  description: 'Engineering technical report',
  faculty: 'engineering',
  sections: [
    s('summary', 'Summary', 15, [t('Brief overview of the project and findings', 15)], []),
    s('introduction', 'Introduction', 20, [t('Background, objectives, scope', 20)], []),
    s('theory', 'Theory and Background', 30, [t('Relevant engineering theory', 30)], []),
    s('methodology', 'Methodology', 30, [t('Equipment, procedures, standards', 30)], []),
    s('results', 'Results', 30, [t('Data presentation, tables, figures', 30)], []),
    s('analysis', 'Analysis and Discussion', 45, [t('Interpret results against theory', 25), t('Error analysis', 20)], [d('Includes error or uncertainty analysis', 'best_practice')]),
    s('conclusion', 'Conclusion', 10, [t('Key findings and recommendations', 10)], []),
    s('references', 'References', 15, [t('Format references', 10), t('Cross-check', 5)], []),
  ],
};

const design_brief = {
  format: 'design_brief',
  displayName: 'Design Brief',
  description: 'Engineering design brief',
  faculty: 'engineering',
  sections: [
    s('problem', 'Problem Statement', 10, [t('Define the design problem', 10)], []),
    s('requirements', 'Requirements and Constraints', 20, [t('Functional requirements', 10), t('Constraints (cost, time, materials)', 10)], []),
    s('concept', 'Concept Development', 30, [t('Generate concepts', 15), t('Evaluate against criteria', 15)], []),
    s('selected', 'Selected Design', 20, [t('Detailed description of chosen design', 20)], []),
    s('feasibility', 'Feasibility', 15, [t('Technical and economic feasibility', 15)], []),
  ],
};

const failure_analysis = {
  format: 'failure_analysis',
  displayName: 'Failure Analysis',
  description: 'Engineering failure analysis report',
  faculty: 'engineering',
  sections: [
    s('background', 'Background', 15, [t('Component/system that failed', 10), t('Operating conditions', 5)], []),
    s('investigation', 'Investigation', 30, [t('Visual inspection', 10), t('Testing and analysis', 20)], []),
    s('root_cause', 'Root Cause', 30, [t('Identify the failure mechanism', 15), t('Contributing factors', 15)], [d('Identifies a specific root cause', 'best_practice')]),
    s('recommendations', 'Recommendations', 15, [t('Corrective actions', 10), t('Preventive measures', 5)], []),
  ],
};

const engineering_proposal = {
  format: 'engineering_proposal',
  displayName: 'Engineering Proposal',
  description: 'Engineering project proposal',
  faculty: 'engineering',
  sections: [
    s('introduction', 'Introduction', 15, [t('Project overview', 10), t('Objectives', 5)], []),
    s('background', 'Background and Literature', 20, [t('Existing solutions and gap', 20)], []),
    s('approach', 'Technical Approach', 30, [t('Proposed methodology', 15), t('Tools and technologies', 15)], []),
    s('timeline', 'Project Plan', 15, [t('Milestones and Gantt chart', 15)], []),
    s('budget', 'Budget', 10, [t('Cost estimate', 10)], []),
    s('risks', 'Risk Assessment', 10, [t('Technical and project risks', 10)], []),
  ],
};

// ============================================================
// ARTS / HUMANITIES
// ============================================================

const close_reading = {
  format: 'close_reading',
  displayName: 'Close Reading',
  description: 'Close reading or textual analysis',
  faculty: 'arts',
  sections: [
    s('context', 'Context', 15, [t('Author, period, genre', 10), t('Place in the larger work', 5)], []),
    s('summary', 'Summary', 10, [t('Brief summary of the passage', 10)], []),
    s('language', 'Language Analysis', 30, [t('Diction, tone, imagery', 15), t('Rhetorical devices', 15)], []),
    s('structure', 'Structure Analysis', 20, [t('Form, rhythm, organisation', 20)], []),
    s('interpretation', 'Interpretation', 30, [t('What does the passage mean?', 15), t('How does it relate to broader themes?', 15)], [d('Goes beyond surface meaning', 'best_practice')]),
    s('conclusion', 'Conclusion', 10, [t('Significance of the passage', 10)], []),
  ],
};

const creative_piece = {
  format: 'creative_piece',
  displayName: 'Creative Piece with Reflection',
  description: 'Creative writing with accompanying critical reflection',
  faculty: 'arts',
  sections: [
    s('synopsis', 'Synopsis or Outline', 15, [t('Brief outline of the creative piece', 15)], []),
    s('draft', 'Creative Draft', 120, [t('Write the creative piece', 90), t('Revise for voice and style', 30)], []),
    s('reflection', 'Critical Reflection', 45, [t('What creative choices did you make and why?', 15), t('Which writers or works influenced you?', 15), t('What would you change with more time?', 15)], [d('Links creative choices to theory or influences', 'best_practice')]),
  ],
};

const script_screenplay = {
  format: 'script_screenplay',
  displayName: 'Script or Screenplay',
  description: 'Dramatic script for screen or stage',
  faculty: 'arts',
  sections: [
    s('treatment', 'Treatment or Synopsis', 20, [t('Story summary in prose', 20)], []),
    s('characters', 'Character Descriptions', 15, [t('Key characters with motivations', 15)], []),
    s('act_1', 'Act 1: Setup', 30, [t('Establish the world and characters', 15), t('Inciting incident', 15)], []),
    s('act_2', 'Act 2: Confrontation', 45, [t('Rising action and complications', 30), t('Midpoint turn', 15)], []),
    s('act_3', 'Act 3: Resolution', 30, [t('Climax', 15), t('Resolution and denouement', 15)], []),
  ],
};

const exhibition_catalogue = {
  format: 'exhibition_catalogue',
  displayName: 'Exhibition Catalogue',
  description: 'Catalogue essay for art exhibition',
  faculty: 'arts',
  sections: [
    s('introduction', 'Introduction', 15, [t('Exhibition theme and curatorial vision', 15)], []),
    s('works', 'Works Analysis', 45, [t('Discuss 3-5 key works', 30), t('Material, technique, meaning', 15)], []),
    s('context', 'Historical and Cultural Context', 20, [t('Situate the work in art history', 20)], []),
    s('significance', 'Significance', 10, [t('Why this exhibition matters', 10)], []),
  ],
};

// ============================================================
// SOCIAL WORK / PSYCHOLOGY
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

// ============================================================
// PERFORMANCE (Practice Mode placeholders)
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

const cad_documentation = {
  format: 'cad_documentation',
  displayName: 'CAD Documentation',
  description: 'CAD project documentation and drawings',
  faculty: 'engineering',
  sections: [
    s('overview', 'Project Overview', 10, [t('Design intent and constraints', 10)], []),
    s('drawings', 'Drawing Set', 30, [t('Assembly drawings', 10), t('Detail drawings', 10), t('Bill of materials', 10)], []),
    s('specifications', 'Specifications', 15, [t('Dimensions, tolerances, materials', 15)], []),
    s('notes', 'Design Notes', 10, [t('Design decisions and alternatives considered', 10)], []),
  ],
};

// ============================================================
// EXPORT: all templates as a flat map
// ============================================================

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
