const DB_NAME = 'SimplifiiOS_Vault';
const DB_VERSION = 4;

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
      console.warn('[IndexedDBService] upgrade blocked by another tab. Reloading.');
      window.location.reload();
    };

    request.onerror = (e) => {
      const err = request.error;
      // Version downgrade attempt: clear and recover automatically.
      if (err && err.name === 'VersionError') {
        console.warn('[IndexedDBService] version conflict: resetting vault and reloading.');
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
      if (!db.objectStoreNames.contains('history_of_thought_events')) {
        const s = db.createObjectStore('history_of_thought_events', { keyPath: 'event_id' });
        s.createIndex('by_user', 'user_id');
        s.createIndex('by_stream', 'stream_id');
        s.createIndex('by_timestamp', 'timestamp_iso');
        s.createIndex('by_type', 'event_type');
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
