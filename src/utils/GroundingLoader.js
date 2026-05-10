/**
 * GroundingLoader
 *
 * Build-time enumeration of PDFs in `src/grounding/active/` via webpack
 * `require.context`. Runtime fetch + Blob conversion so each PDF can be
 * fed into `DocumentAIService.processDocumentWithGCP` exactly like a
 * browser file input.
 *
 * Used by the "Ingest Grounding Folder" button in the cockpit top nav.
 * The PDFs are committed to the repo so they ship with the build; they
 * are NOT uploaded over the wire. require.context resolves each
 * file to a static URL bundled by CRA's default file pipeline, and
 * `fetch` pulls the bytes from the local dev / production static
 * server.
 *
 * Why require.context (not a manual array): the grounding folder is
 * the canonical source of truth. Hard-coding filenames here would
 * silently rot the moment the student adds or removes a PDF.
 *
 * Returns File objects (Blob with .name set) so downstream code can
 * treat them identically to user-uploaded files.
 */

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
      console.warn('[GroundingLoader] require.context unavailable; the loader will return zero PDFs. Build under CRA or webpack.', err && err.message);
    }
  }
  __pdfModules = modules;
  return __pdfModules;
};

// Lightweight inspector. Returns [{ name, url }].
export const listGroundingPdfs = () => loadModules().slice();

// Fetch each PDF and return File-shaped Blobs. Failures on individual
// PDFs are logged and skipped; the caller still gets the survivors.
// One rejected fetch must never abort the whole ingestion.
export const fetchGroundingPdfs = async () => {
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
      if (typeof console !== 'undefined') console.warn('[GroundingLoader] failed to load', m.name, err && err.message);
    }
  }
  return out;
};
