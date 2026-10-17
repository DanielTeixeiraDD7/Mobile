const DB_NAME = 'budget';
const DB_VERSION = 1;
export const STORES = ['transactions', 'categories', 'settings'];

let dbPromise;

export function open() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('transactions', { keyPath: 'id' }).createIndex('date', 'date');
      db.createObjectStore('categories', { keyPath: 'id' });
      db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function run(stores, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    const req = fn(tx);
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const getAll = store => run(store, 'readonly', tx => tx.objectStore(store).getAll());
export const put = (store, value) => run(store, 'readwrite', tx => tx.objectStore(store).put(value));
export const remove = (store, key) => run(store, 'readwrite', tx => tx.objectStore(store).delete(key));

export const putMany = (store, values) => run(store, 'readwrite', tx => {
  const os = tx.objectStore(store);
  values.forEach(v => os.put(v));
});

export const replaceAll = data => run(STORES, 'readwrite', tx => {
  for (const store of STORES) {
    const os = tx.objectStore(store);
    os.clear();
    (data[store] || []).forEach(v => os.put(v));
  }
});
