import { createLogger } from '../utils/logger';

const log = createLogger('IndexedDB');

const DB_NAME = 'SimplifiiOS_Vault';
const DB_VERSION = 8; // v8: sync with HistoryOfThought to prevent VersionError

// Wipes the database and reloads the page. Call this if a version conflict
// leaves the vault in an unrecoverable state.
export const resetLocalSovereignVault = () => {
  try {
    const del = indexedDB.deleteDatabase(DB_NAME);
    del.onsuccess = () => { window.location.reload(); };
    del.onerror = () => { window.location.reload(); };
  } catch {
    window.location.reload();
  }
};

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onblocked = () => {
      log.warn(' upgrade blocked by another tab. Reloading.');
      window.location.reload();
    };

    request.onerror = (e) => {
      const err = request.error;
      // Version downgrade attempt: clear and recover automatically.
      if (err && err.name === 'VersionError') {
        log.warn(' version conflict: resetting vault and reloading.');
        resetLocalSovereignVault();
        return;
      }
      reject(err);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('blockHistory')) {
        db.createObjectStore('blockHistory', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('ghostAssets')) {
        db.createObjectStore('ghostAssets', { keyPath: 'id' });
      }
      // history_of_thought_events is owned by HistoryOfThought.js but must
      // be declared here too so that whichever module wins the upgrade race,
      // all three stores are created in the same transaction.
      // Sprint 9.1a: local-first PDF vault. Uploaded PDFs are stored as
      // blobs in IndexedDB. Never sent to any server. Zero-Disclosure.
      if (!db.objectStoreNames.contains('uploaded_pdfs')) {
        const s = db.createObjectStore('uploaded_pdfs', { keyPath: 'id' });
        s.createIndex('by_name', 'name');
      }
      if (!db.objectStoreNames.contains('history_of_thought_events')) {
        const s = db.createObjectStore('history_of_thought_events', { keyPath: 'event_id' });
        s.createIndex('by_user', 'user_id');
        s.createIndex('by_stream', 'stream_id');
        s.createIndex('by_timestamp', 'timestamp_iso');
        s.createIndex('by_type', 'event_type');
      }
      // Sprint 3: Citation Integrity Engine. Corpus sources per project.
      // Never sent to any server. Stored locally, verified by the user.
      if (!db.objectStoreNames.contains('project_sources')) {
        const ps = db.createObjectStore('project_sources', { keyPath: 'sourceId' });
        ps.createIndex('by_project', 'projectId');
        ps.createIndex('by_citation_key', 'citationKey');
        ps.createIndex('by_verified', 'verified');
      }
      // Sprint 4: Sovereign Research container stores.
      if (!db.objectStoreNames.contains('research_projects')) {
        db.createObjectStore('research_projects', { keyPath: 'projectId' });
      }
      if (!db.objectStoreNames.contains('phases')) {
        const s = db.createObjectStore('phases', { keyPath: 'phaseId' });
        s.createIndex('by_project', 'projectId');
      }
      if (!db.objectStoreNames.contains('strands')) {
        const s = db.createObjectStore('strands', { keyPath: 'strandId' });
        s.createIndex('by_project', 'projectId');
        s.createIndex('by_phase', 'phaseId');
      }
      if (!db.objectStoreNames.contains('chapters')) {
        const s = db.createObjectStore('chapters', { keyPath: 'chapterId' });
        s.createIndex('by_project', 'projectId');
        s.createIndex('by_phase', 'phaseId');
      }
      if (!db.objectStoreNames.contains('methodology_log')) {
        const s = db.createObjectStore('methodology_log', { keyPath: 'entryId' });
        s.createIndex('by_project', 'projectId');
      }
      if (!db.objectStoreNames.contains('reflexivity_log')) {
        const s = db.createObjectStore('reflexivity_log', { keyPath: 'entryId' });
        s.createIndex('by_project', 'projectId');
      }
      if (!db.objectStoreNames.contains('supervisor_feedback')) {
        const s = db.createObjectStore('supervisor_feedback', { keyPath: 'feedbackId' });
        s.createIndex('by_project', 'projectId');
        s.createIndex('by_status', 'status');
      }
    };
  });
};

export const saveBlockSnapshot = async (blockId, content) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blockHistory', 'readwrite');
    const store = tx.objectStore('blockHistory');
    const request = store.add({ blockId, content, timestamp: Date.now() });
    
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
};

export const getBlockHistory = async (blockId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('blockHistory', 'readonly');
    const store = tx.objectStore('blockHistory');
    const request = store.getAll();
    request.onsuccess = () => {
      const history = request.result
        .filter(item => item.blockId === blockId)
        .sort((a, b) => a.timestamp - b.timestamp);
      resolve(history);
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveGhostAsset = async (asset) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ghostAssets', 'readwrite');
    const store = tx.objectStore('ghostAssets');
    const request = store.put(asset);
    
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
};

export const getAllGhostAssets = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('ghostAssets', 'readonly');
    const store = tx.objectStore('ghostAssets');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// ============================================================
// Sprint 9.1a: Uploaded PDF vault (Zero-Disclosure, local-first)
// PDFs are stored as blobs in IndexedDB. Never sent to any server.
// ============================================================

export const saveUploadedPdf = async (file) => {
  const db = await initDB();
  const id = `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    name: file.name,
    size: file.size,
    blob: file,
    uploadedAt: new Date().toISOString()
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction('uploaded_pdfs', 'readwrite');
    tx.objectStore('uploaded_pdfs').put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
};

export const listUploadedPdfs = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('uploaded_pdfs', 'readonly');
    const request = tx.objectStore('uploaded_pdfs').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const deleteUploadedPdf = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('uploaded_pdfs', 'readwrite');
    tx.objectStore('uploaded_pdfs').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const clearAllUploadedPdfs = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('uploaded_pdfs', 'readwrite');
    tx.objectStore('uploaded_pdfs').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// ============================================================
// Sprint 3: Citation Integrity Engine : project_sources store
// Local-first corpus. Never sent to any server.
// ============================================================

export const saveSource = async (source) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('project_sources', 'readwrite');
    tx.objectStore('project_sources').put(source);
    tx.oncomplete = () => resolve(source);
    tx.onerror = () => reject(tx.error);
  });
};

export const getSourceById = async (sourceId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('project_sources', 'readonly');
    const req = tx.objectStore('project_sources').get(sourceId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
};

export const listSourcesByProject = async (projectId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('project_sources', 'readonly');
    const index = tx.objectStore('project_sources').index('by_project');
    const req = index.getAll(projectId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const deleteSourceById = async (sourceId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('project_sources', 'readwrite');
    tx.objectStore('project_sources').delete(sourceId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// ============================================================
// Sprint 4: Sovereign Research store helpers
// ============================================================

function putRecord(storeName, record) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror  = () => reject(tx.error);
  }));
}

function getAllByIndex(storeName, indexName, key) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).index(indexName).getAll(key);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror  = () => reject(req.error);
  }));
}

function getByKey(storeName, key) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror  = () => reject(req.error);
  }));
}

function deleteByKey(storeName, key) {
  return initDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror  = () => reject(tx.error);
  }));
}

// research_projects
export const saveResearchProject     = (r) => putRecord('research_projects', r);
export const getResearchProjectById  = (id) => getByKey('research_projects', id);
export const deleteResearchProject   = (id) => deleteByKey('research_projects', id);
export const getAllResearchProjects   = () =>
  initDB().then(db => new Promise((res, rej) => {
    const req = db.transaction('research_projects', 'readonly').objectStore('research_projects').getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror  = () => rej(req.error);
  }));

// phases
export const savePhase           = (r) => putRecord('phases', r);
export const getPhasesByProject  = (id) => getAllByIndex('phases', 'by_project', id);

// strands
export const saveStrand          = (r) => putRecord('strands', r);
export const getStrandsByProject = (id) => getAllByIndex('strands', 'by_project', id);
export const getStrandsByPhase   = (id) => getAllByIndex('strands', 'by_phase', id);

// chapters
export const saveChapter            = (r) => putRecord('chapters', r);
export const getChaptersByProject   = (id) => getAllByIndex('chapters', 'by_project', id);
export const getChapterById         = (id) => getByKey('chapters', id);

// methodology_log
export const saveMethodologyEntry              = (r) => putRecord('methodology_log', r);
export const getMethodologyEntriesByProject    = (id) => getAllByIndex('methodology_log', 'by_project', id);

// reflexivity_log
export const saveReflexivityEntry             = (r) => putRecord('reflexivity_log', r);
export const getReflexivityEntriesByProject   = (id) => getAllByIndex('reflexivity_log', 'by_project', id);

// supervisor_feedback
export const saveSupervisorFeedback          = (r) => putRecord('supervisor_feedback', r);
export const updateSupervisorFeedbackRecord  = (r) => putRecord('supervisor_feedback', r);
export const getSupervisorFeedbackByProject  = (id) => getAllByIndex('supervisor_feedback', 'by_project', id);
