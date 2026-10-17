const DB_NAME = 'budget';
const DB_VERSION = 2;
export const STORES = ['transactions', 'categories', 'settings'];

let dbPromise;

export function open() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = req.result;
      if (e.oldVersion < 1) {
        db.createObjectStore('transactions', { keyPath: 'id' }).createIndex('date', 'date');
        db.createObjectStore('categories', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (e.oldVersion < 2) {
        db.createObjectStore('sync', { keyPath: 'key' });
        db.createObjectStore('outbox', { keyPath: 'key' });
      }
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

export const get = (store, key) => run(store, 'readonly', tx => tx.objectStore(store).get(key));
export const getAll = store => run(store, 'readonly', tx => tx.objectStore(store).getAll());
export const put = (store, value) => run(store, 'readwrite', tx => tx.objectStore(store).put(value));
export const remove = (store, key) => run(store, 'readwrite', tx => tx.objectStore(store).delete(key));
export const clear = store => run(store, 'readwrite', tx => tx.objectStore(store).clear());

export const putMany = (store, values) => run(store, 'readwrite', tx => {
  const os = tx.objectStore(store);
  values.forEach(v => os.put(v));
});

export const removeMany = (store, keys) => run(store, 'readwrite', tx => {
  const os = tx.objectStore(store);
  keys.forEach(k => os.delete(k));
});

export const replaceAll = (data, stores = STORES) => run(stores, 'readwrite', tx => {
  for (const store of stores) {
    const os = tx.objectStore(store);
    os.clear();
    (data[store] || []).forEach(v => os.put(v));
  }
});
