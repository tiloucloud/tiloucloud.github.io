/*
 * Local storage: documents in IndexedDB (blobs stay on the device), settings in localStorage.
 * Nothing is ever uploaded.
 */
(function () {
  'use strict';
  const DB_NAME = 'waraqa-scan';
  const STORE = 'docs';
  let dbPromise = null;
  const memory = new Map(); // fallback when IndexedDB is unavailable (private mode, sandboxed frames)
  let useMemory = false;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      let req;
      try { req = indexedDB.open(DB_NAME, 1); } catch (e) { useMemory = true; resolve(null); return; }
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => { useMemory = true; resolve(null); };
    });
    return dbPromise;
  }

  async function tx(mode, fn) {
    const db = await open();
    if (!db || useMemory) return fn(null);
    return new Promise((resolve, reject) => {
      const t = db.transaction(STORE, mode);
      const store = t.objectStore(STORE);
      let result;
      Promise.resolve(fn(store)).then((r) => { result = r; });
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  }

  const reqP = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  const Store = {
    async all() {
      const list = await tx('readonly', (s) => (s ? reqP(s.getAll()) : [...memory.values()]));
      return (list || []).sort((a, b) => b.updated - a.updated);
    },
    async get(id) {
      return tx('readonly', (s) => (s ? reqP(s.get(id)) : memory.get(id)));
    },
    async put(doc) {
      doc.updated = Date.now();
      return tx('readwrite', (s) => (s ? reqP(s.put(doc)) : memory.set(doc.id, doc)));
    },
    async remove(id) {
      return tx('readwrite', (s) => (s ? reqP(s.delete(id)) : memory.delete(id)));
    },
    isPersistent() { return !useMemory; }
  };

  const Settings = {
    get(key, fallback) {
      try { const v = localStorage.getItem('waraqa.' + key); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return Settings._mem[key] !== undefined ? Settings._mem[key] : fallback; }
    },
    set(key, value) {
      Settings._mem[key] = value;
      try { localStorage.setItem('waraqa.' + key, JSON.stringify(value)); } catch (e) { /* ignore */ }
    },
    _mem: {}
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  window.Store = Store;
  window.Settings = Settings;
  window.uid = uid;
})();
