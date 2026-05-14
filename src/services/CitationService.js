/**
 * CitationService.js
 *
 * The corpus librarian for Simplifii-OS.
 * Manages every source a learner adds to a project and provides the
 * hallucination gate used by every other layer in the OS.
 *
 * Hard rules enforced here:
 *   1. verifyCorpusSource is the single source of truth for hallucination
 *      prevention. If a source is not in the corpus AND verified, it does
 *      not exist as far as the AI layers are concerned.
 *   2. Corpus data never comes from inference. Every field is set by the
 *      user or by an ingestion pipeline that the user then verifies.
 *   3. verified: false sources are shown to the user in amber. They must
 *      not appear in AI suggestions until verified: true.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  saveSource,
  getSourceById,
  listSourcesByProject,
  deleteSourceById,
} from './IndexedDBService';

// ─── Source schema ─────────────────────────────────────────────────────────────

/**
 * Creates a new source record with safe defaults.
 * All fields from the spec schema are present; unset fields are null.
 *
 * @param {string} projectId
 * @param {object} data   Partial source fields from the caller.
 * @returns {object}      Complete source record ready for IndexedDB.
 */
export function createSourceRecord(projectId, data = {}) {
  const authors = Array.isArray(data.authors) ? data.authors : (data.authors ? [data.authors] : []);
  const year    = data.year ? Number(data.year) : null;
  const citationKey = data.citationKey || generateCitationKey({ authors, year });

  return {
    sourceId:             data.sourceId || uuidv4(),
    projectId,
    type:                 data.type || 'pdf',
    title:                data.title || '',
    authors,
    year,
    doi:                  data.doi || null,
    url:                  data.url || null,
    filePath:             data.filePath || null,
    rawText:              data.rawText || null,
    aiSummary:            data.aiSummary || null,
    methodology:          data.methodology || null,
    keyFindings:          data.keyFindings || null,
    relevanceToChapters:  data.relevanceToChapters || {},
    citationKey,
    tags:                 Array.isArray(data.tags) ? data.tags : [],
    pinnedNotes:          Array.isArray(data.pinnedNotes) ? data.pinnedNotes : [],
    verified:             false, // Always false on creation. User must confirm metadata.
    addedAt:              data.addedAt || new Date().toISOString(),
    verifiedAt:           null,
  };
}

// ─── Citation key ─────────────────────────────────────────────────────────────

/**
 * Generates a canonical citation key from a source record.
 * Format: lastname_year (lowercase, alphanumeric only).
 * Examples: cumming_2024, saint_james_2024, unknown_source
 *
 * @param {object} source   Must have authors (array) and year (number).
 * @returns {string}
 */
export function generateCitationKey(source) {
  const authors = Array.isArray(source.authors) ? source.authors : [];
  const firstAuthor = authors[0] || '';
  const lastName = getLastName(firstAuthor)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '')
    || 'unknown';
  const year = source.year ? String(source.year) : 'nd';
  return `${lastName}_${year}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Adds a new source to the corpus. Always sets verified: false.
 * The user must open the source panel and confirm metadata before
 * the source is used in AI suggestions.
 *
 * @param {string} projectId
 * @param {object} data   Partial source fields.
 * @returns {Promise<object>}   The saved source record.
 */
export async function addSource(projectId, data = {}) {
  if (!projectId) throw new Error('CitationService.addSource: projectId is required');
  const record = createSourceRecord(projectId, data);
  await saveSource(record);
  return record;
}

/**
 * Retrieves a single source by its ID.
 *
 * @param {string} sourceId
 * @returns {Promise<object|null>}
 */
export async function getSource(sourceId) {
  if (!sourceId) return null;
  return getSourceById(sourceId);
}

/**
 * Lists all sources for a project, sorted by author then year.
 *
 * @param {string} projectId
 * @returns {Promise<object[]>}
 */
export async function listSources(projectId) {
  if (!projectId) return [];
  const sources = await listSourcesByProject(projectId);
  return sources.sort((a, b) => {
    const aKey = (a.authors[0] || '').toLowerCase();
    const bKey = (b.authors[0] || '').toLowerCase();
    if (aKey < bKey) return -1;
    if (aKey > bKey) return 1;
    return (a.year || 0) - (b.year || 0);
  });
}

/**
 * Sets verified: true on a source and records the verification timestamp.
 * This is the only path that can set verified to true.
 *
 * @param {string} sourceId
 * @returns {Promise<object>}   The updated source record.
 */
export async function verifySource(sourceId) {
  const existing = await getSourceById(sourceId);
  if (!existing) throw new Error(`CitationService.verifySource: source "${sourceId}" not found`);
  const updated = { ...existing, verified: true, verifiedAt: new Date().toISOString() };
  await saveSource(updated);
  return updated;
}

/**
 * Updates mutable metadata fields on a source.
 * Cannot set verified: true directly (use verifySource instead).
 *
 * @param {string} sourceId
 * @param {object} patch    Fields to update.
 * @returns {Promise<object>}
 */
export async function updateSource(sourceId, patch = {}) {
  const existing = await getSourceById(sourceId);
  if (!existing) throw new Error(`CitationService.updateSource: source "${sourceId}" not found`);
  // Strip verified from patch: callers must use verifySource.
  const { verified: _v, verifiedAt: _va, sourceId: _id, projectId: _pid, ...safePatch } = patch;
  const updated = { ...existing, ...safePatch };
  // Regenerate citation key if authors or year changed.
  updated.citationKey = generateCitationKey(updated);
  await saveSource(updated);
  return updated;
}

/**
 * Removes a source from the corpus permanently.
 *
 * @param {string} sourceId
 * @returns {Promise<void>}
 */
export async function deleteSource(sourceId) {
  await deleteSourceById(sourceId);
}

// ─── Pure matching helpers (exported for unit testing) ───────────────────────

/**
 * Performs the hallucination check against an in-memory array of sources.
 * Pure function: no I/O. Used by verifyCorpusSource and directly in tests.
 *
 * @param {object[]} sources    Array of source records.
 * @param {{ author: string, year?: number|string }} params
 * @returns {{ found: boolean, verified: boolean, source: object|null }}
 */
export function verifyFromSources(sources, { author, year } = {}) {
  if (!author || !Array.isArray(sources)) {
    return { found: false, verified: false, source: null };
  }

  const needle  = String(author).trim().toLowerCase();
  const yearNum = year ? Number(year) : null;

  for (const source of sources) {
    const firstAuthor = source.authors?.[0] || '';
    const lastName    = getLastName(firstAuthor).toLowerCase();

    const authorMatch = lastName === needle;
    const yearMatch   = yearNum === null || source.year === yearNum;

    if (authorMatch && yearMatch) {
      return { found: true, verified: source.verified === true, source };
    }
  }

  return { found: false, verified: false, source: null };
}

/**
 * Filters sources by query string. Pure function: no I/O.
 * Matches on author names, title, year (as string), and tags.
 * Returns up to 20 results.
 *
 * @param {object[]} sources
 * @param {string}   query
 * @returns {object[]}
 */
export function searchSources(sources, query) {
  if (!Array.isArray(sources) || !query || !query.trim()) return [];
  const needle = query.trim().toLowerCase();

  return sources.filter(s => {
    if (String(s.year || '').includes(needle)) return true;
    if ((s.title || '').toLowerCase().includes(needle)) return true;
    if ((s.tags || []).some(t => t.toLowerCase().includes(needle))) return true;
    if ((s.authors || []).some(a => a.toLowerCase().includes(needle))) return true;
    return false;
  }).slice(0, 20);
}

// ─── Hallucination gate ───────────────────────────────────────────────────────

/**
 * THE single source of truth for hallucination prevention.
 *
 * Loads the project corpus from IndexedDB, then delegates to the pure
 * verifyFromSources function. Callers (CanvasEditor scanner, AI layers,
 * export pipeline) MUST call this before displaying, inserting, or
 * exporting any citation. If verified is false, the citation must be
 * shown in amber. If found is false, the citation must be flagged.
 *
 * @param {{ author: string, year?: number|string }} params
 * @param {string} projectId
 * @returns {Promise<{ found: boolean, verified: boolean, source: object|null }>}
 */
export async function verifyCorpusSource(params = {}, projectId) {
  if (!projectId || !params.author) {
    return { found: false, verified: false, source: null };
  }
  const sources = await listSourcesByProject(projectId);
  return verifyFromSources(sources || [], params);
}

// ─── Corpus search ────────────────────────────────────────────────────────────

/**
 * Typeahead search across the project corpus.
 * Delegates to the pure searchSources function after loading from IndexedDB.
 *
 * @param {string} projectId
 * @param {string} query
 * @returns {Promise<object[]>}
 */
export async function searchCorpus(projectId, query) {
  if (!projectId || !query || !query.trim()) return [];
  const sources = await listSourcesByProject(projectId);
  return searchSources(sources || [], query);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the last name from a full name string.
 * "Terry Cumming"  -> "Cumming"
 * "A. B. Smith"    -> "Smith"
 * "Cumming"        -> "Cumming"
 *
 * @param {string} fullName
 * @returns {string}
 */
export function getLastName(fullName) {
  const parts = String(fullName || '').trim().split(/\s+/);
  return parts[parts.length - 1] || '';
}
