/**
 * editzz — persistência local (IndexedDB)
 * Guarda os arquivos de mídia e os projetos salvos no próprio navegador,
 * para que um projeto continue editável depois de recarregar a página.
 */

const DB_NAME = "editzz-db";
const DB_VERSION = 1;
const STORE_MEDIA = "media";
const STORE_PROJECTS = "projects";

export interface StoredProject {
  id: string;
  name: string;
  updatedAt: number;
  thumb?: string;
  json: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB indisponível"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_MEDIA)) db.createObjectStore(STORE_MEDIA);
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) db.createObjectStore(STORE_PROJECTS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | null> {
  return open()
    .then(
      (db) =>
        new Promise<T | null>((resolve) => {
          try {
            const t = db.transaction(store, mode);
            const req = fn(t.objectStore(store));
            req.onsuccess = () => resolve(req.result as T);
            req.onerror = () => resolve(null);
          } catch {
            resolve(null);
          }
        })
    )
    .catch(() => null);
}

export const putMedia = (id: string, blob: Blob, meta: unknown) =>
  tx(STORE_MEDIA, "readwrite", (s) => s.put({ blob, meta }, id));
export const getMedia = (id: string) =>
  tx<{ blob: Blob; meta: unknown }>(STORE_MEDIA, "readonly", (s) => s.get(id));
export const deleteMedia = (id: string) => tx(STORE_MEDIA, "readwrite", (s) => s.delete(id));

export const saveProjectRecord = (rec: StoredProject) => tx(STORE_PROJECTS, "readwrite", (s) => s.put(rec, rec.id));
export const listProjectRecords = () =>
  tx<StoredProject[]>(STORE_PROJECTS, "readonly", (s) => s.getAll()).then((r) => (r ?? []).sort((a, b) => b.updatedAt - a.updatedAt));
export const deleteProjectRecord = (id: string) => tx(STORE_PROJECTS, "readwrite", (s) => s.delete(id));
export const readProjectRecord = (id: string) => tx<StoredProject>(STORE_PROJECTS, "readonly", (s) => s.get(id));

/** Cache síncrono de URLs de mídia restauradas do banco. */
export const restoredUrls = new Map<string, string>();
