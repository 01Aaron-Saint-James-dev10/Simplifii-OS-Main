/**
 * CitationService.test.js
 *
 * Tests for the corpus librarian and hallucination gate.
 *
 * The hallucination-prevention tests use verifyFromSources and searchSources,
 * the pure (no I/O) versions of verifyCorpusSource and searchCorpus. Testing
 * pure functions is faster, deterministic, and requires no IndexedDB mock.
 *
 * The async DB functions (addSource, verifySource, deleteSource) are covered
 * by integration tests once a test IndexedDB environment is wired up.
 */

import {
  createSourceRecord,
  generateCitationKey,
  getLastName,
  verifyFromSources,
  searchSources,
} from './CitationService';

// ─── Shared fixture ───────────────────────────────────────────────────────────

const PROJECT = 'proj_moat';

function makeSource(overrides = {}) {
  return createSourceRecord(PROJECT, {
    authors: ['Terry Cumming'],
    year:    2024,
    title:   'UDL Adoption Across Australian Universities',
    ...overrides,
  });
}

// ─── createSourceRecord ───────────────────────────────────────────────────────

describe('createSourceRecord', () => {
  test('always sets verified: false', () => {
    const rec = createSourceRecord(PROJECT, { title: 'Test', authors: ['Terry Cumming'], year: 2024 });
    expect(rec.verified).toBe(false);
  });

  test('generates a sourceId when none is provided', () => {
    const rec = createSourceRecord(PROJECT, {});
    expect(typeof rec.sourceId).toBe('string');
    expect(rec.sourceId.length).toBeGreaterThan(0);
  });

  test('uses the provided sourceId when given', () => {
    const rec = createSourceRecord(PROJECT, { sourceId: 'my-id-123' });
    expect(rec.sourceId).toBe('my-id-123');
  });

  test('wraps a string authors value in an array', () => {
    const rec = createSourceRecord(PROJECT, { authors: 'Terry Cumming' });
    expect(rec.authors).toEqual(['Terry Cumming']);
  });

  test('sets projectId correctly', () => {
    const rec = createSourceRecord('proj_abc', { title: 'T' });
    expect(rec.projectId).toBe('proj_abc');
  });

  test('converts year to a number', () => {
    const rec = createSourceRecord(PROJECT, { year: '2024' });
    expect(rec.year).toBe(2024);
  });

  test('sets verifiedAt to null on creation', () => {
    const rec = createSourceRecord(PROJECT, { authors: ['A'], year: 2020 });
    expect(rec.verifiedAt).toBeNull();
  });
});

// ─── generateCitationKey ──────────────────────────────────────────────────────

describe('generateCitationKey', () => {
  test('produces lastname_year from a standard record', () => {
    const key = generateCitationKey({ authors: ['Terry Cumming'], year: 2024 });
    expect(key).toBe('cumming_2024');
  });

  test('uses the first author when multiple authors are present', () => {
    const key = generateCitationKey({ authors: ['Terry Cumming', 'Alex Jolly'], year: 2023 });
    expect(key).toBe('cumming_2023');
  });

  test('uses nd when year is absent', () => {
    const key = generateCitationKey({ authors: ['Terry Cumming'] });
    expect(key).toBe('cumming_nd');
  });

  test('uses unknown when authors array is empty', () => {
    const key = generateCitationKey({ authors: [], year: 2024 });
    expect(key).toBe('unknown_2024');
  });

  test('handles hyphenated last names', () => {
    const key = generateCitationKey({ authors: ['Aaron Saint-James'], year: 2026 });
    expect(key).toBe('saint_james_2026');
  });
});

// ─── getLastName ──────────────────────────────────────────────────────────────

describe('getLastName', () => {
  test('extracts last name from "First Last"', () => {
    expect(getLastName('Terry Cumming')).toBe('Cumming');
  });

  test('extracts last name from "First Middle Last"', () => {
    expect(getLastName('John Michael Smith')).toBe('Smith');
  });

  test('returns a single token as-is', () => {
    expect(getLastName('Cumming')).toBe('Cumming');
  });

  test('returns empty string for empty input', () => {
    expect(getLastName('')).toBe('');
  });
});

// ─── verifyFromSources (THE HALLUCINATION GATE) ───────────────────────────────

describe('verifyFromSources', () => {
  test('returns found: true, verified: true for a known verified source', () => {
    const source = { ...makeSource(), verified: true };
    const result = verifyFromSources([source], { author: 'Cumming', year: 2024 });
    expect(result.found).toBe(true);
    expect(result.verified).toBe(true);
    expect(result.source).toMatchObject({ year: 2024 });
  });

  test('returns found: true, verified: false for an unverified source', () => {
    const source = makeSource(); // verified: false by default
    const result = verifyFromSources([source], { author: 'Cumming', year: 2024 });
    expect(result.found).toBe(true);
    expect(result.verified).toBe(false);
  });

  test('HALLUCINATION GATE: returns found: false for an author not in corpus', () => {
    const source = makeSource(); // Only Cumming in corpus
    const result = verifyFromSources([source], { author: 'Davis', year: 2024 });
    expect(result.found).toBe(false);
    expect(result.verified).toBe(false);
    expect(result.source).toBeNull();
  });

  test('HALLUCINATION GATE: wrong year returns found: false', () => {
    const source = { ...makeSource(), verified: true };
    const result = verifyFromSources([source], { author: 'Cumming', year: 2020 });
    expect(result.found).toBe(false);
  });

  test('HALLUCINATION GATE: empty corpus always returns found: false', () => {
    const result = verifyFromSources([], { author: 'Anyone', year: 2024 });
    expect(result.found).toBe(false);
  });

  test('author matching is case-insensitive', () => {
    const source = { ...makeSource(), verified: true };
    const result = verifyFromSources([source], { author: 'cumming', year: 2024 });
    expect(result.found).toBe(true);
  });

  test('matches without year when year is not provided', () => {
    const source = { ...makeSource(), verified: true };
    const result = verifyFromSources([source], { author: 'Cumming' });
    expect(result.found).toBe(true);
  });

  test('returns found: false when author param is missing', () => {
    const source = makeSource();
    const result = verifyFromSources([source], { year: 2024 });
    expect(result.found).toBe(false);
  });

  test('returns found: false when sources is not an array', () => {
    const result = verifyFromSources(null, { author: 'Cumming', year: 2024 });
    expect(result.found).toBe(false);
  });

  test('matches the first valid source in a multi-source corpus', () => {
    const sources = [
      makeSource({ authors: ['Alex Jolly'], year: 2021 }),
      { ...makeSource({ authors: ['Terry Cumming'], year: 2024 }), verified: true },
    ];
    const result = verifyFromSources(sources, { author: 'Cumming', year: 2024 });
    expect(result.found).toBe(true);
    expect(result.verified).toBe(true);
  });
});

// ─── searchSources ────────────────────────────────────────────────────────────

describe('searchSources', () => {
  function makeSources() {
    return [
      createSourceRecord(PROJECT, { authors: ['Terry Cumming'], year: 2024, title: 'UDL Adoption', tags: ['UDL'] }),
      createSourceRecord(PROJECT, { authors: ['Alex Jolly'], year: 2023, title: 'Reflexivity in Research', tags: ['methodology'] }),
      createSourceRecord(PROJECT, { authors: ['Jane Smith'], year: 2021, title: 'Inclusive Education', tags: ['equity'] }),
    ];
  }

  test('returns matches on author name (case-insensitive)', () => {
    const results = searchSources(makeSources(), 'cumming');
    expect(results).toHaveLength(1);
    expect(results[0].authors[0]).toBe('Terry Cumming');
  });

  test('returns matches on year as string', () => {
    const results = searchSources(makeSources(), '2023');
    expect(results).toHaveLength(1);
    expect(results[0].authors[0]).toBe('Alex Jolly');
  });

  test('returns matches on title substring', () => {
    const results = searchSources(makeSources(), 'inclusive');
    expect(results).toHaveLength(1);
    expect(results[0].authors[0]).toBe('Jane Smith');
  });

  test('returns matches on tag', () => {
    const results = searchSources(makeSources(), 'methodology');
    expect(results).toHaveLength(1);
    expect(results[0].tags).toContain('methodology');
  });

  test('returns empty array for a query with no matches', () => {
    const results = searchSources(makeSources(), 'nonexistent author xyz');
    expect(results).toHaveLength(0);
  });

  test('returns empty array when sources array is empty', () => {
    const results = searchSources([], 'cumming');
    expect(results).toHaveLength(0);
  });

  test('returns empty array when query is empty', () => {
    const results = searchSources(makeSources(), '');
    expect(results).toHaveLength(0);
  });

  test('returns empty array when sources is null', () => {
    const results = searchSources(null, 'cumming');
    expect(results).toHaveLength(0);
  });

  test('caps results at 20', () => {
    const many = Array.from({ length: 25 }, (_, i) =>
      createSourceRecord(PROJECT, { authors: [`Author${i}`], year: 2020, title: 'Same Title' })
    );
    const results = searchSources(many, 'Same Title');
    expect(results.length).toBeLessThanOrEqual(20);
  });
});
