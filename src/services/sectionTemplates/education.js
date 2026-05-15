import { s, t, d } from './helpers';

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

export {
  lesson_plan,
  unit_of_work,
  teaching_philosophy,
  action_research,
  curriculum_design,
};
