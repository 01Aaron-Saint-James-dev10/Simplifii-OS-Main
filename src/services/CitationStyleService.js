/**
 * CitationStyleService.js
 *
 * Pure formatting functions for in-text citations and bibliography entries.
 * No I/O, no state. Every function is deterministic given the same inputs.
 *
 * Supported styles (Sprint 3 v1):
 *   APA7      - APA 7th Edition
 *   HARVARD   - Australian Harvard
 *   CHICAGO   - Chicago 17 author-date
 *   VANCOUVER - Vancouver (numeric, biomedical)
 *
 * Additional styles (AGLC4, MLA9, IEEE, AMA) are Sprint 3 v2.
 *
 * In-text format reference:
 *   APA7:     (Cumming, 2024)   or  Cumming (2024)
 *   HARVARD:  (Cumming 2024)    or  Cumming (2024)
 *   CHICAGO:  (Cumming 2024)    or  Cumming (2024)
 *   VANCOUVER: [1]              (requires citationNumber in options)
 */

// allow-style:file

export const STYLES = {
  APA7:      'APA7',
  HARVARD:   'HARVARD',
  CHICAGO:   'CHICAGO',
  VANCOUVER: 'VANCOUVER',
};

// ─── In-text citation formatters ──────────────────────────────────────────────

/**
 * Formats an in-text citation for the given style.
 *
 * @param {object} source   Source record from CitationService.
 * @param {string} style    One of STYLES.*.
 * @param {object} options
 *   @param {boolean} [options.narrative=false]   True for "Author (Year)" form.
 *   @param {number}  [options.page]              Page number for direct quotes.
 *   @param {string}  [options.pages]             Page range, e.g. "14-16".
 *   @param {number}  [options.citationNumber]    Required for VANCOUVER.
 * @returns {string}
 */
export function formatInText(source, style, options = {}) {
  if (!source) return '[SOURCE MISSING]';

  if (style === STYLES.VANCOUVER) {
    const n = options.citationNumber;
    return n != null ? `[${n}]` : '[?]';
  }

  const authorPart = buildInTextAuthorPart(source.authors || [], style);
  const yearPart   = source.year ? String(source.year) : 'n.d.';
  const pagePart   = buildPagePart(options, style);

  if (options.narrative) {
    // Narrative: Author (Year) or Author (Year, p. X)
    if (pagePart) return `${authorPart} (${yearPart}, ${pagePart})`;
    return `${authorPart} (${yearPart})`;
  }

  // Parenthetical: (Author, Year) or (Author Year) depending on style
  const sep = style === STYLES.APA7 ? ', ' : ' ';
  if (pagePart) {
    return style === STYLES.APA7
      ? `(${authorPart}, ${yearPart}, ${pagePart})`
      : `(${authorPart} ${yearPart}, ${pagePart})`;
  }
  return `(${authorPart}${sep}${yearPart})`;
}

// ─── Bibliography entry formatters ────────────────────────────────────────────

/**
 * Formats a single bibliography entry for the given style.
 *
 * @param {object} source
 * @param {string} style
 * @param {object} options
 *   @param {number} [options.citationNumber]   Required for VANCOUVER.
 * @returns {string}
 */
export function formatBibliographyEntry(source, style, options = {}) {
  if (!source) return '';

  switch (style) {
    case STYLES.APA7:      return formatAPA7Entry(source);
    case STYLES.HARVARD:   return formatHarvardEntry(source);
    case STYLES.CHICAGO:   return formatChicagoEntry(source);
    case STYLES.VANCOUVER: return formatVancouverEntry(source, options.citationNumber);
    default:               return formatAPA7Entry(source);
  }
}

/**
 * Formats and sorts a full bibliography for the given style.
 * APA7, HARVARD, CHICAGO: alphabetical by first author last name.
 * VANCOUVER: numeric order (by citation number, ascending).
 *
 * @param {object[]} sources
 * @param {string}   style
 * @returns {string[]}   Array of formatted entry strings.
 */
export function formatBibliography(sources, style) {
  if (!Array.isArray(sources) || sources.length === 0) return [];

  if (style === STYLES.VANCOUVER) {
    // Vancouver: preserve insertion order (caller is responsible for numbering).
    return sources.map((s, i) => formatVancouverEntry(s, i + 1));
  }

  const sorted = [...sources].sort((a, b) => {
    const aLast = getLastName(a.authors?.[0] || '').toLowerCase();
    const bLast = getLastName(b.authors?.[0] || '').toLowerCase();
    if (aLast < bLast) return -1;
    if (aLast > bLast) return 1;
    return (a.year || 0) - (b.year || 0);
  });

  return sorted.map(s => formatBibliographyEntry(s, style));
}

// ─── Hallucination scanner ────────────────────────────────────────────────────

/**
 * Scans plain text for citation patterns matching (Author, Year) form.
 * Returns each suspected citation for the caller to verify against the corpus.
 *
 * Detects:
 *   (Smith, 2023)
 *   (Smith & Jones, 2023)
 *   (Smith et al., 2023)
 *   (Smith, 2023, p. 14)
 *   (Smith, 2023, pp. 14-16)
 *
 * Does NOT flag:
 *   (see Figure 3)
 *   (n = 47)
 *   (p < .05)
 *   (2024)             : year alone, no author
 *
 * @param {string} text   Plain text from the editor.
 * @returns {Array<{ match: string, author: string, year: number, index: number }>}
 */
export function detectSuspectedCitations(text) {
  if (!text || typeof text !== 'string') return [];

  // Pattern breakdown:
  //   Author block: one or more capitalised words, optionally joined by & or "et al."
  //   Comma separator before year (APA / Harvard style)
  //   Year: 4-digit, 1900-2099, optional letter suffix (2024a)
  //   Optional page: , p. X  or , pp. X-Y
  const CITATION_RE = /\(([A-Z][A-Za-z\u00C0-\u024F-]+(?:(?:,?\s+&\s+|\s+and\s+)[A-Z][A-Za-z\u00C0-\u024F-]+)*(?:\s+et\s+al\.)?),\s*((?:19|20)\d{2}[a-z]?)(?:,\s*pp?\.\s*[\d\u2013-]+)?\)/g;

  const results = [];
  let m;
  CITATION_RE.lastIndex = 0;

  while ((m = CITATION_RE.exec(text)) !== null) {
    const rawAuthor = m[1].trim();
    const year      = parseInt(m[2], 10);

    // Extract the first author last name for corpus lookup.
    // "Smith & Jones" -> "Smith"
    // "Smith et al." -> "Smith"
    const firstAuthorBlock = rawAuthor.split(/,?\s+(?:&|and)\s+|,?\s+et\s+al/i)[0].trim();
    const author = getLastName(firstAuthorBlock);

    results.push({
      match:  m[0],
      author,
      year,
      index:  m.index,
    });
  }

  return results;
}

// ─── Style-specific entry formatters (internal) ───────────────────────────────

function formatAPA7Entry(source) {
  const authors = formatAuthorListAPA(source.authors || []);
  const year    = source.year ? `(${source.year})` : '(n.d.)';
  const title   = source.title || 'Untitled';
  const type    = source.type || 'pdf';

  if (type === 'url') {
    const url = source.url ? ` ${source.url}` : '';
    return `${authors} ${year}. ${title}.${url}`.trim();
  }

  // Default: journal article or book chapter format.
  // doi is appended if present; otherwise url is appended if present.
  const doiOrUrl = source.doi
    ? ` https://doi.org/${source.doi}`
    : (source.url ? ` ${source.url}` : '');

  return `${authors} ${year}. ${title}.${doiOrUrl}`.trim();
}

function formatHarvardEntry(source) {
  const authors = formatAuthorListHarvard(source.authors || []);
  const year    = source.year ? source.year : 'n.d.';
  const title   = source.title || 'Untitled';
  const doiOrUrl = source.doi
    ? ` doi:${source.doi}`
    : (source.url ? ` Available at: ${source.url}` : '');

  return `${authors} ${year}, ${title}.${doiOrUrl}`.trim();
}

function formatChicagoEntry(source) {
  // Chicago 17 author-date style (similar to Harvard).
  const authors = formatAuthorListHarvard(source.authors || []);
  const year    = source.year ? source.year : 'n.d.';
  const title   = source.title ? `"${source.title}"` : '"Untitled"';
  const doiOrUrl = source.doi
    ? ` https://doi.org/${source.doi}.`
    : (source.url ? ` ${source.url}.` : '.');

  return `${authors} ${year}. ${title}${doiOrUrl}`.trim();
}

function formatVancouverEntry(source, number) {
  const n       = number != null ? `${number}. ` : '';
  const authors = formatAuthorListVancouver(source.authors || []);
  const year    = source.year ? source.year : 'n.d.';
  const title   = source.title || 'Untitled';
  const doiOrUrl = source.doi
    ? ` doi:${source.doi}`
    : (source.url ? ` Available from: ${source.url}` : '');

  return `${n}${authors}${title}. ${year}.${doiOrUrl}`.trim();
}

// ─── Author list formatters (internal) ───────────────────────────────────────

/**
 * APA 7 author list: "Cumming, T., Jolly, A., & Saint-James, A."
 * Up to 20 authors. 21+ uses first 19 ... last author.
 */
function formatAuthorListAPA(authors) {
  if (authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return formatAuthorAPA(authors[0]);

  const formatted = authors.map(formatAuthorAPA);

  if (formatted.length > 20) {
    const first19 = formatted.slice(0, 19).join(', ');
    const last    = formatted[formatted.length - 1];
    return `${first19}, ... ${last}`;
  }

  const init = formatted.slice(0, -1).join(', ');
  return `${init}, & ${formatted[formatted.length - 1]}`;
}

/**
 * Harvard / Chicago author list: "Cumming, T, Jolly, A & Saint-James, A"
 */
function formatAuthorListHarvard(authors) {
  if (authors.length === 0) return 'Unknown Author';
  const formatted = authors.map(a => formatAuthorAPA(a));
  if (formatted.length === 1) return formatted[0];

  const init = formatted.slice(0, -1).join(', ');
  return `${init} & ${formatted[formatted.length - 1]}`;
}

/**
 * Vancouver author list: "Cumming T, Jolly A, Saint-James A."
 * Up to 6 authors; beyond 6 truncate with "et al."
 */
function formatAuthorListVancouver(authors) {
  if (authors.length === 0) return 'Unknown Author. ';
  const limit = Math.min(authors.length, 6);
  const formatted = authors.slice(0, limit).map(a => {
    const parts   = String(a || '').trim().split(/\s+/);
    const last    = parts[parts.length - 1] || a;
    const initials = parts.slice(0, -1).map(p => p[0] || '').join('');
    return `${last} ${initials}`.trim();
  });
  const suffix = authors.length > 6 ? ' et al.' : '';
  return `${formatted.join(', ')}${suffix}. `;
}

// ─── Per-author formatters (internal) ────────────────────────────────────────

/**
 * Converts a full name to APA "Last, F." format.
 * "Terry Cumming"      -> "Cumming, T."
 * "John Michael Smith" -> "Smith, J. M."
 */
function formatAuthorAPA(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return fullName || 'Unknown';
  const last     = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => (p[0] || '') + '.').join(' ');
  return initials ? `${last}, ${initials}` : last;
}

// ─── Author part for in-text (internal) ───────────────────────────────────────

function buildInTextAuthorPart(authors, style) {
  if (authors.length === 0) return 'Unknown Author';

  const lastNames = authors.map(getLastName);

  if (lastNames.length === 1) return lastNames[0];
  if (lastNames.length === 2) return `${lastNames[0]} & ${lastNames[1]}`;
  return `${lastNames[0]} et al.`;
}

function buildPagePart(options, style) {
  if (options.pages) return `pp. ${options.pages}`;
  if (options.page != null) return `p. ${options.page}`;
  return null;
}

// ─── Shared helper (duplicated from CitationService to keep this file pure) ──

function getLastName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  return parts[parts.length - 1] || '';
}
