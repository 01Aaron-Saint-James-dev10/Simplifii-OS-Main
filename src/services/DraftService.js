/**
 * DraftService.js
 *
 * IndexedDB-backed draft persistence for the writing canvas.
 * Keyed on courseId + assessmentTitle. Autosaved every 2s by CanvasEditor.
 * Each save also triggers a HistoryOfThought event (caller responsibility).
 *
 * Schema v2: stores TipTap JSON doc. Migrates v1 string content on load.
 */

const DB_NAME = 'simplifii_drafts';
const DB_VERSION = 1;
const STORE = 'drafts';
const CURRENT_SCHEMA = 2;

const openDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'key' });
    }
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

function draftKey(courseId, assessmentTitle) {
  return `${courseId}::${assessmentTitle || '__default__'}`;
}

/**
 * Migrate v1 string content to v2 TipTap JSON.
 * Idempotent: running twice on migrated data returns the same result.
 */
function migrateToV2(draft) {
  if (!draft) return null;
  // Already v2
  if (draft.schemaVersion >= 2 && draft.tiptapDoc) return draft;
  // v1: content is a plain string
  const text = typeof draft.content === 'string' ? draft.content : '';
  const paragraphs = text.split('\n').map(line => ({
    type: 'paragraph',
    content: line.trim() ? [{ type: 'text', text: line }] : undefined,
  }));
  return {
    ...draft,
    schemaVersion: CURRENT_SCHEMA,
    tiptapDoc: { type: 'doc', content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph' }] },
    content: text,
  };
}

/**
 * Count words from a TipTap JSON doc by extracting all text nodes.
 */
function countWordsFromDoc(doc) {
  if (!doc || !doc.content) return 0;
  let text = '';
  const walk = (node) => {
    if (node.type === 'text' && node.text) text += node.text + ' ';
    if (node.content) node.content.forEach(walk);
  };
  walk(doc);
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const saveDraft = async (courseId, assessmentTitle, content, tiptapDoc) => {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const key = draftKey(courseId, assessmentTitle);
  const now = Date.now();
  const wordCount = tiptapDoc ? countWordsFromDoc(tiptapDoc) : (content || '').trim().split(/\s+/).filter(Boolean).length;
  store.put({
    key,
    courseId,
    assessmentTitle,
    content: content || '',
    tiptapDoc: tiptapDoc || null,
    schemaVersion: tiptapDoc ? CURRENT_SCHEMA : 1,
    wordCount,
    lastSaved: now,
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const loadDraft = async (courseId, assessmentTitle) => {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  const store = tx.objectStore(STORE);
  const key = draftKey(courseId, assessmentTitle);
  const req = store.get(key);
  return new Promise((resolve, reject) => {
    req.onsuccess = () => {
      const raw = req.result || null;
      resolve(raw ? migrateToV2(raw) : null);
    };
    req.onerror = () => reject(req.error);
  });
};

export const getDraftMeta = async (courseId, assessmentTitle) => {
  const draft = await loadDraft(courseId, assessmentTitle);
  if (!draft) return null;
  return { lastSaved: draft.lastSaved, wordCount: draft.wordCount };
};
