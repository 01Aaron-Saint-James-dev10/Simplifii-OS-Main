import { s, t, d } from './helpers';

// ============================================================
// CREATIVE AND HUMANITIES
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

export {
  close_reading,
  creative_piece,
  script_screenplay,
  exhibition_catalogue,
};
