/**
 * DraftService.js
 *
 * IndexedDB-backed draft persistence for the writing canvas.
 * Keyed on courseId + assessmentTitle. Autosaved every 2s by CanvasEditor.
 * Each save also triggers a HistoryOfThought event (caller responsibility).
 */

const DB_NAME = 'simplifii_drafts';
const DB_VERSION = 1;
const STORE = 'drafts';

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

export const saveDraft = async (courseId, assessmentTitle, content) => {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const key = draftKey(courseId, assessmentTitle);
  const now = Date.now();
  store.put({
    key,
    courseId,
    assessmentTitle,
    content,
    wordCount: (content || '').trim().split(/\s+/).filter(Boolean).length,
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
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

export const getDraftMeta = async (courseId, assessmentTitle) => {
  const draft = await loadDraft(courseId, assessmentTitle);
  if (!draft) return null;
  return { lastSaved: draft.lastSaved, wordCount: draft.wordCount };
};
