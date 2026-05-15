import { s, t, d } from './helpers';

// ============================================================
// ENGINEERING AND TECHNOLOGY
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

export {
  technical_report,
  design_brief,
  failure_analysis,
  engineering_proposal,
  cad_documentation,
};
