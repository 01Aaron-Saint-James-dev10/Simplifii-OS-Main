import { s, t, d } from './helpers';

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

export {
  essay_critical,
  essay_comparative,
  essay_expository,
  essay_reflective,
  literature_review,
  annotated_bibliography,
  research_proposal,
  case_study,
  report_general,
};
