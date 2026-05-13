/**
 * EvidenceFormulaService
 *
 * Pure functions extracted from ResourceIngestor.js for use across v2 screens.
 * The ResourceIngestor component is deleted in Commit 4; this service carries
 * the formula slot, URL validation, and scrape/extract pipeline forward.
 */

import { translateToEnglish } from './TranslationService';
import { extractSemanticEntities } from './KnowledgeGraphService';

/**
 * Builds the evidence slot array from an evidenceFormula spec.
 * Falls back to three generic source slots when no formula is provided.
 * @param {Array<{type: string, label: string, count: number}>} evidenceFormula
 * @returns {Array<{type: string, label: string}>}
 */
export const buildSlotsFromFormula = (evidenceFormula = []) => {
  if (evidenceFormula && evidenceFormula.length > 0) {
    const slots = [];
    evidenceFormula.forEach(f => {
      for (let i = 0; i < f.count; i++) {
        slots.push({ type: f.type, label: `${f.label} ${i + 1}` });
      }
    });
    return slots;
  }
  return [
    { type: 'generic', label: 'Academic Source 1' },
    { type: 'generic', label: 'Academic Source 2' },
    { type: 'generic', label: 'Academic Source 3' }
  ];
};

/**
 * Validates a URL against the expected source type.
 * @param {string} url
 * @param {string} type - slot type (e.g. 'primary', 'generic')
 * @returns {string} error message, or '' if valid
 */
export const validateUrl = (url, type) => {
  if (!url) return '';
  const lowerUrl = url.toLowerCase();
  if (type === 'primary') {
    const validDomains = ['.gov', '.edu', 'nature.com', 'ncbi.nlm.nih.gov', 'sciencedirect.com', 'plos.org'];
    const isValid = validDomains.some(domain => lowerUrl.includes(domain));
    if (!isValid) return 'Rejected: URL does not appear to be from a recognized primary research publisher (.gov, .edu, nature, ncbi, etc.).';
  }
  return '';
};

/**
 * Scrapes URLs, applies translation and entity extraction, and returns
 * an array of extraction objects ready for the evidence ledger.
 * @param {string[]} urls - raw URL inputs (may include empty strings)
 * @param {Array<{type: string, label: string}>} slots - parallel slot array
 * @returns {Promise<Array>}
 */
export const scrapeAndExtract = async (urls, slots) => {
  const focus = localStorage.getItem('simplifii_inferred_focus') || 'General Academic Topic';
  const pairs = urls.map((url, i) => ({ url, slot: slots[i] })).filter(({ url }) => url);
  return Promise.all(pairs.map(async ({ url }, index) => {
    const domainMatch = url.match(/:\/\/(www\.)?([^/]+)/);
    const source = domainMatch ? domainMatch[2] : 'Academic Database';
    const rawContent = `Foreign/Raw finding regarding ${focus}: Specific conditions activate key molecular pathways.`;
    const translatedContent = await translateToEnglish(rawContent, 'mock_jwt_token_xyz123');
    const entities = await extractSemanticEntities(translatedContent, 'mock_jwt_token_xyz123');
    const entityTags = entities
      .map(e => `<span class="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-[10px] uppercase font-bold">${e.label}</span>`)
      .join(' ');
    return {
      id: `ev_${Date.now()}_${index}`,
      type: 'link',
      source,
      content: `${translatedContent}<br/><div class="mt-2 flex gap-1 flex-wrap">${entityTags}</div>`,
      entities,
      timestamp: Date.now()
    };
  }));
};
