import { createLogger } from './logger';

const log = createLogger('GroundingLoader');

/**
 * GroundingLoader
 *
 * Two-source PDF loader for the Simplifii-OS ingestion pipeline:
 *
 *   1. Build-time (baked-in): PDFs in src/grounding/active/ enumerated
 *      via webpack require.context. Ship with the build; no upload needed.
 *
 *   2. Runtime (user-uploaded): PDFs stored in IndexedDB by the learner.
 *      Never sent to any server. Zero-Disclosure: stays on the device.
 *
 * fetchGroundingPdfs() merges both sources into a single File[] array
 * so handleIngestGrounding treats them identically.
 *
 * Returns File objects (Blob with .name set) so downstream code can
 * treat them identically regardless of source.
 */

import { listUploadedPdfs } from '../services/IndexedDBService';

let __pdfModules = null;

const loadModules = () => {
  if (__pdfModules) return __pdfModules;
  let modules = [];
  try {
    // eslint-disable-next-line no-undef
    const ctx = require.context('../grounding/active', false, /\.pdf$/);
    modules = ctx.keys().map((key) => ({
      name: key.replace(/^\.\//, ''),
      url: ctx(key)
    }));
  } catch (err) {
    if (typeof console !== 'undefined') {
      log.warn('require.context unavailable; the loader will return zero PDFs. Build under CRA or webpack.', err && err.message);
    }
  }
  __pdfModules = modules;
  return __pdfModules;
};

// Lightweight inspector. Returns [{ name, url }] for baked-in only.
export const listGroundingPdfs = () => loadModules().slice();

// Fetch baked-in PDFs from the static bundle.
const fetchBakedPdfs = async () => {
  const modules = loadModules();
  if (modules.length === 0) return [];
  const out = [];
  for (const m of modules) {
    try {
      const resolvedUrl = typeof m.url === 'string' ? m.url : (m.url && (m.url.default || m.url.src)) || m.url;
      const res = await fetch(resolvedUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = (typeof File === 'function')
        ? new File([blob], m.name, { type: 'application/pdf' })
        : Object.assign(blob, { name: m.name });
      out.push(file);
    } catch (err) {
      log.warn(' failed to load', m.name, err && err.message);
    }
  }
  return out;
};

// Fetch user-uploaded PDFs from IndexedDB. Each record has { id, name, blob }.
const fetchUploadedPdfs = async () => {
  try {
    const records = await listUploadedPdfs();
    return records
      .filter(r => r.blob)
      .map(r => {
        if (r.blob instanceof File) return r.blob;
        return (typeof File === 'function')
          ? new File([r.blob], r.name, { type: 'application/pdf' })
          : Object.assign(r.blob, { name: r.name });
      });
  } catch (err) {
    log.warn(' IndexedDB upload read failed:', err && err.message);
    return [];
  }
};

// Merge baked-in + user-uploaded PDFs. Deduplicates by filename (uploaded
// wins if both sources have a file with the same name, so the learner
// can override a baked-in PDF with a newer version).
export const fetchGroundingPdfs = async () => {
  const [baked, uploaded] = await Promise.all([fetchBakedPdfs(), fetchUploadedPdfs()]);
  const uploadedNames = new Set(uploaded.map(f => f.name));
  const deduped = baked.filter(f => !uploadedNames.has(f.name));
  return [...deduped, ...uploaded];
};
