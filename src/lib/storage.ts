// Bonus "save and reopen": the whole project (including file bytes) is kept in this browser's IndexedDB.
const DB = 'tender-package-builder'
const STORE = 'state'
const KEY = 'project'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<unknown> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const req = fn(tx.objectStore(STORE))
        tx.oncomplete = () => resolve(req ? req.result : undefined)
        tx.onerror = () => reject(tx.error)
      }),
  )
}

export const saveProject = (p: unknown) => run('readwrite', (s) => s.put(p, KEY)).catch(() => undefined)
export const loadProject = <T,>() => run('readonly', (s) => s.get(KEY)).then((v) => v as T | undefined).catch(() => undefined)
export const clearProject = () => run('readwrite', (s) => s.delete(KEY)).catch(() => undefined)
