export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SimplifiiOS_Vault', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('blockHistory')) {
        db.createObjectStore('blockHistory', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('ghostAssets')) {
        db.createObjectStore('ghostAssets', { keyPath: 'id' });
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
