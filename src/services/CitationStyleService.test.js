/**
 * CitationStyleService.test.js
 *
 * Tests for pure citation formatting functions.
 * No mocks needed: CitationStyleService has no I/O.
 */

import {
  formatInText,
  formatBibliographyEntry,
  formatBibliography,
  detectSuspectedCitations,
  STYLES,
} from './CitationStyleService';

// ─── Shared test fixtures ─────────────────────────────────────────────────────

const SINGLE_AUTHOR = {
  sourceId: 'src_1',
  authors:  ['Terry Cumming'],
  year:     2024,
  title:    'UDL 3.0 Adoption Across Australian Universities',
  doi:      '10.1234/test.2024',
  type:     'pdf',
};

const TWO_AUTHORS = {
  sourceId: 'src_2',
  authors:  ['Terry Cumming', 'Alex Jolly'],
  year:     2023,
  title:    'Inclusive Pedagogy',
  doi:      null,
  type:     'pdf',
};

const THREE_AUTHORS = {
  sourceId: 'src_3',
  authors:  ['Terry Cumming', 'Alex Jolly', 'Aaron Saint-James'],
  year:     2022,
  title:    'Research Methods',
  doi:      null,
  type:     'pdf',
};

const NO_YEAR = {
  sourceId: 'src_4',
  authors:  ['Jane Smith'],
  year:     null,
  title:    'Undated Work',
  doi:      null,
  type:     'pdf',
};

// ─── formatInText ─────────────────────────────────────────────────────────────

describe('formatInText : APA7', () => {
  test('single author parenthetical', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.APA7)).toBe('(Cumming, 2024)');
  });

  test('single author narrative', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.APA7, { narrative: true })).toBe('Cumming (2024)');
  });

  test('single author with page number', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.APA7, { page: 14 })).toBe('(Cumming, 2024, p. 14)');
  });

  test('single author with page range', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.APA7, { pages: '14-16' })).toBe('(Cumming, 2024, pp. 14-16)');
  });

  test('two authors', () => {
    expect(formatInText(TWO_AUTHORS, STYLES.APA7)).toBe('(Cumming & Jolly, 2023)');
  });

  test('three or more authors uses et al.', () => {
    expect(formatInText(THREE_AUTHORS, STYLES.APA7)).toBe('(Cumming et al., 2022)');
  });

  test('no year shows n.d.', () => {
    expect(formatInText(NO_YEAR, STYLES.APA7)).toBe('(Smith, n.d.)');
  });

  test('null source returns placeholder', () => {
    expect(formatInText(null, STYLES.APA7)).toBe('[SOURCE MISSING]');
  });
});

describe('formatInText : HARVARD', () => {
  test('single author parenthetical (no comma before year)', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.HARVARD)).toBe('(Cumming 2024)');
  });

  test('narrative form', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.HARVARD, { narrative: true })).toBe('Cumming (2024)');
  });

  test('two authors', () => {
    expect(formatInText(TWO_AUTHORS, STYLES.HARVARD)).toBe('(Cumming & Jolly 2023)');
  });
});

describe('formatInText : VANCOUVER', () => {
  test('returns numeric bracket with citationNumber', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.VANCOUVER, { citationNumber: 1 })).toBe('[1]');
  });

  test('returns [?] when citationNumber is not provided', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.VANCOUVER)).toBe('[?]');
  });

  test('citationNumber 5 returns [5]', () => {
    expect(formatInText(SINGLE_AUTHOR, STYLES.VANCOUVER, { citationNumber: 5 })).toBe('[5]');
  });
});

// ─── formatBibliographyEntry ──────────────────────────────────────────────────

describe('formatBibliographyEntry : APA7', () => {
  test('formats a journal article with DOI', () => {
    const entry = formatBibliographyEntry(SINGLE_AUTHOR, STYLES.APA7);
    expect(entry).toContain('Cumming, T.');
    expect(entry).toContain('(2024)');
    expect(entry).toContain('UDL 3.0 Adoption');
    expect(entry).toContain('https://doi.org/10.1234/test.2024');
  });

  test('formats two authors with ampersand', () => {
    const entry = formatBibliographyEntry(TWO_AUTHORS, STYLES.APA7);
    expect(entry).toContain('Cumming, T., & Jolly, A.');
  });

  test('no-year entry shows n.d.', () => {
    const entry = formatBibliographyEntry(NO_YEAR, STYLES.APA7);
    expect(entry).toContain('(n.d.)');
  });
});

describe('formatBibliographyEntry : HARVARD', () => {
  test('includes author, year, and title', () => {
    const entry = formatBibliographyEntry(SINGLE_AUTHOR, STYLES.HARVARD);
    expect(entry).toContain('Cumming, T.');
    expect(entry).toContain('2024');
    expect(entry).toContain('UDL 3.0 Adoption');
  });
});

describe('formatBibliographyEntry : VANCOUVER', () => {
  test('formats with citation number prefix', () => {
    const entry = formatBibliographyEntry(SINGLE_AUTHOR, STYLES.VANCOUVER, { citationNumber: 1 });
    expect(entry).toMatch(/^1\./);
    expect(entry).toContain('Cumming T');
  });
});

// ─── formatBibliography ───────────────────────────────────────────────────────

describe('formatBibliography', () => {
  const SOURCES = [
    { ...THREE_AUTHORS, sourceId: 's3' },
    { ...SINGLE_AUTHOR, sourceId: 's1' },
    { ...TWO_AUTHORS,   sourceId: 's2' },
  ];

  test('APA7: returns entries sorted alphabetically by first author last name', () => {
    const entries = formatBibliography(SOURCES, STYLES.APA7);
    expect(entries).toHaveLength(3);
    // All three first authors are "Cumming" so sort by year: 2022, 2023, 2024
    expect(entries[0]).toContain('2022');
    expect(entries[1]).toContain('2023');
    expect(entries[2]).toContain('2024');
  });

  test('VANCOUVER: returns entries in insertion order (numbered 1, 2, 3)', () => {
    const entries = formatBibliography(SOURCES, STYLES.VANCOUVER);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatch(/^1\./);
    expect(entries[1]).toMatch(/^2\./);
    expect(entries[2]).toMatch(/^3\./);
  });

  test('returns empty array for empty sources', () => {
    expect(formatBibliography([], STYLES.APA7)).toHaveLength(0);
  });

  test('returns empty array for non-array input', () => {
    expect(formatBibliography(null, STYLES.APA7)).toHaveLength(0);
  });
});

// ─── detectSuspectedCitations ─────────────────────────────────────────────────

describe('detectSuspectedCitations', () => {
  test('detects a simple APA in-text citation', () => {
    const hits = detectSuspectedCitations('See the findings (Smith, 2023) for detail.');
    expect(hits).toHaveLength(1);
    expect(hits[0].author).toBe('Smith');
    expect(hits[0].year).toBe(2023);
    expect(hits[0].match).toBe('(Smith, 2023)');
  });

  test('detects a citation with page number', () => {
    const hits = detectSuspectedCitations('As argued (Davis, 2024, p. 5) the case is clear.');
    expect(hits).toHaveLength(1);
    expect(hits[0].author).toBe('Davis');
    expect(hits[0].year).toBe(2024);
  });

  test('detects two-author citation', () => {
    const hits = detectSuspectedCitations('Evidence shows (Cumming & Jolly, 2023) a link.');
    expect(hits).toHaveLength(1);
    expect(hits[0].author).toBe('Cumming');
    expect(hits[0].year).toBe(2023);
  });

  test('detects et al. citation', () => {
    const hits = detectSuspectedCitations('The study (Cumming et al., 2022) found no effect.');
    expect(hits).toHaveLength(1);
    expect(hits[0].author).toBe('Cumming');
    expect(hits[0].year).toBe(2022);
  });

  test('detects multiple citations in one block of text', () => {
    const text = 'Research (Smith, 2020) and later work (Jones, 2022) both confirm this.';
    const hits = detectSuspectedCitations(text);
    expect(hits).toHaveLength(2);
    expect(hits[0].author).toBe('Smith');
    expect(hits[1].author).toBe('Jones');
  });

  test('does NOT flag (see Figure 3)', () => {
    const hits = detectSuspectedCitations('Refer to (see Figure 3) for the diagram.');
    expect(hits).toHaveLength(0);
  });

  test('does NOT flag (n = 47)', () => {
    const hits = detectSuspectedCitations('The sample size (n = 47) was sufficient.');
    expect(hits).toHaveLength(0);
  });

  test('does NOT flag (p < .05)', () => {
    const hits = detectSuspectedCitations('Statistical significance (p < .05) was achieved.');
    expect(hits).toHaveLength(0);
  });

  test('does NOT flag a standalone year (2024)', () => {
    const hits = detectSuspectedCitations('In (2024) the policy changed.');
    expect(hits).toHaveLength(0);
  });

  test('returns empty array for empty string', () => {
    expect(detectSuspectedCitations('')).toHaveLength(0);
  });

  test('returns empty array for null input', () => {
    expect(detectSuspectedCitations(null)).toHaveLength(0);
  });

  test('each result includes a character index', () => {
    const hits = detectSuspectedCitations('Text (Smith, 2021) here.');
    expect(typeof hits[0].index).toBe('number');
    expect(hits[0].index).toBeGreaterThan(-1);
  });
});
