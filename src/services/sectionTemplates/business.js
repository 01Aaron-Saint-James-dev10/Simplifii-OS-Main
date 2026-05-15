import { s, t, d } from './helpers';

// ============================================================
// BUSINESS AND MANAGEMENT
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

export {
  business_pitch,
  business_plan,
  strategic_analysis,
  marketing_plan,
  financial_analysis,
  consulting_report,
  executive_summary,
  board_paper,
  case_competition,
};
