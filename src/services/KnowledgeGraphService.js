/**
 * KnowledgeGraphService.js
 *
 * Lightweight semantic-entity surface. The previous version returned a
 * hardcoded biology mock ('Cellular Metabolism', 'ATP Synthesis') that
 * leaked into every tagging panel regardless of what the student actually
 * uploaded. This version derives entities directly from the text:
 *   1. Capitalised multi-word noun phrases (e.g. 'Cognitive Load Theory')
 *   2. Acronyms of two or more letters (e.g. 'UDL', 'ADHD', 'BABS1201')
 * Both lanes are de-duplicated case-insensitively, frequency-ranked, and
 * capped so the tag panel is not overwhelmed.
 *
 * No network, no auth, no mock. The student's real text drives the tags.
 */

const STOP_PHRASES = new Set([
  'The', 'This', 'That', 'These', 'Those', 'A', 'An', 'And', 'Or', 'But',
  'In', 'On', 'At', 'By', 'For', 'With', 'From', 'To', 'Of', 'As',
  'Is', 'Are', 'Was', 'Were', 'Be', 'Been', 'Being',
  'It', 'They', 'We', 'You', 'He', 'She',
  'University', 'Course', 'Subject', 'Unit', 'Semester', 'Week',
  'Page', 'Section', 'Chapter', 'Figure', 'Table'
]);

const tokeniseCapitalisedPhrases = (text) => {
  const phraseRegex = /\b(?:[A-Z][a-z]{2,}(?:\s+(?:of|and|the|in|for)\s+[A-Z][a-z]{2,}|\s+[A-Z][a-z]{2,}){0,4})\b/g;
  const counts = new Map();
  for (const match of text.matchAll(phraseRegex)) {
    const phrase = match[0].trim();
    const firstWord = phrase.split(/\s+/)[0];
    if (STOP_PHRASES.has(firstWord)) continue;
    const key = phrase.toLowerCase();
    counts.set(key, { phrase, count: (counts.get(key)?.count || 0) + 1 });
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
};

const tokeniseAcronyms = (text) => {
  const acronymRegex = /\b([A-Z]{2,}\d*|[A-Z]{2,}\d{3,5})\b/g;
  const counts = new Map();
  for (const match of text.matchAll(acronymRegex)) {
    const acronym = match[1];
    if (acronym.length < 2 || acronym.length > 12) continue;
    counts.set(acronym, (counts.get(acronym) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([acronym, count]) => ({ acronym, count }))
    .sort((a, b) => b.count - a.count);
};

export const extractSemanticEntities = async (text /* , authToken */) => {
  if (!text || !text.trim()) return [];

  const phrases = tokeniseCapitalisedPhrases(text).slice(0, 6);
  const acronyms = tokeniseAcronyms(text).slice(0, 4);

  const entities = [];
  phrases.forEach((p, i) => {
    entities.push({
      id: `phrase_${i}`,
      label: p.phrase,
      type: 'Concept',
      confidence: Math.min(0.99, 0.6 + p.count * 0.05)
    });
  });
  acronyms.forEach((a, i) => {
    entities.push({
      id: `acronym_${i}`,
      label: a.acronym,
      type: /^[A-Z]{2,5}\d{3,5}$/.test(a.acronym) ? 'Course Code' : 'Acronym',
      confidence: Math.min(0.99, 0.7 + a.count * 0.05)
    });
  });

  if (entities.length === 0) {
    entities.push({ id: 'e0', label: 'Academic Source', type: 'Document', confidence: 1.0 });
  }
  return entities;
};
