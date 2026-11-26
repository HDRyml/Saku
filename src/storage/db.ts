import { AppSettings, Category, Transaction } from '../types/finance';

const DB_NAME = 'sakuharian-db';
const DB_VERSION = 1;
const STORE_TRANSACTIONS = 'transactions';
const STORE_CATEGORIES = 'categories';
const STORE_META = 'meta';

const FALLBACK_TX_KEY = 'sakuharian_transactions_v1';
const FALLBACK_CAT_KEY = 'sakuharian_categories_v1';
const SETTINGS_KEY = 'sakuharian_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  hideBalance: false,
};

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_TRANSACTIONS)) {
        db.createObjectStore(STORE_TRANSACTIONS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const req = operation(store);
    let resultValue: T;

    if (req) {
      req.onsuccess = () => {
        resultValue = req.result;
      };
    }

    tx.oncomplete = () => {
      db.close();
      resolve(resultValue);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

function readLocalFallback<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalFallback<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors in fallback
  }
}

export async function getAllTransactions(): Promise<Transaction[]> {
  if (!hasIndexedDB()) {
    return readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
  }
  try {
    const rows = await withStore<Transaction[]>(STORE_TRANSACTIONS, 'readonly', (store) =>
      store.getAll()
    );
    return rows ?? [];
  } catch {
    return readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
  }
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  if (!hasIndexedDB()) {
    const current = readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
    const next = current.filter((t) => t.id !== transaction.id);
    next.push(transaction);
    writeLocalFallback(FALLBACK_TX_KEY, next);
    return;
  }
  try {
    await withStore(STORE_TRANSACTIONS, 'readwrite', (store) => store.put(transaction));
  } catch {
    const current = readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
    const next = current.filter((t) => t.id !== transaction.id);
    next.push(transaction);
    writeLocalFallback(FALLBACK_TX_KEY, next);
  }
}

export async function saveTransactionsBulk(transactions: Transaction[]): Promise<void> {
  if (!hasIndexedDB()) {
    const current = readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
    const map = new Map(current.map((t) => [t.id, t]));
    for (const tx of transactions) map.set(tx.id, tx);
    writeLocalFallback(FALLBACK_TX_KEY, Array.from(map.values()));
    return;
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      for (const item of transactions) {
        store.put(item);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    const current = readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
    const map = new Map(current.map((t) => [t.id, t]));
    for (const item of transactions) map.set(item.id, item);
    writeLocalFallback(FALLBACK_TX_KEY, Array.from(map.values()));
  }
}

export async function removeTransaction(id: string): Promise<void> {
  if (!hasIndexedDB()) {
    const current = readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
    writeLocalFallback(
      FALLBACK_TX_KEY,
      current.filter((t) => t.id !== id)
    );
    return;
  }
  try {
    await withStore(STORE_TRANSACTIONS, 'readwrite', (store) => store.delete(id));
  } catch {
    const current = readLocalFallback<Transaction[]>(FALLBACK_TX_KEY, []);
    writeLocalFallback(
      FALLBACK_TX_KEY,
      current.filter((t) => t.id !== id)
    );
  }
}

export async function replaceAllTransactions(transactions: Transaction[]): Promise<void> {
  if (!hasIndexedDB()) {
    writeLocalFallback(FALLBACK_TX_KEY, transactions);
    return;
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_TRANSACTIONS, 'readwrite');
      const store = tx.objectStore(STORE_TRANSACTIONS);
      store.clear();
      for (const item of transactions) {
        store.put(item);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    writeLocalFallback(FALLBACK_TX_KEY, transactions);
  }
}

export async function getCustomCategories(): Promise<Category[]> {
  if (!hasIndexedDB()) {
    return readLocalFallback<Category[]>(FALLBACK_CAT_KEY, []);
  }
  try {
    const rows = await withStore<Category[]>(STORE_CATEGORIES, 'readonly', (store) =>
      store.getAll()
    );
    return rows ?? [];
  } catch {
    return readLocalFallback<Category[]>(FALLBACK_CAT_KEY, []);
  }
}

export async function saveCustomCategory(category: Category): Promise<void> {
  if (!hasIndexedDB()) {
    const current = readLocalFallback<Category[]>(FALLBACK_CAT_KEY, []);
    const next = current.filter((c) => c.id !== category.id);
    next.push(category);
    writeLocalFallback(FALLBACK_CAT_KEY, next);
    return;
  }
  try {
    await withStore(STORE_CATEGORIES, 'readwrite', (store) => store.put(category));
  } catch {
    const current = readLocalFallback<Category[]>(FALLBACK_CAT_KEY, []);
    const next = current.filter((c) => c.id !== category.id);
    next.push(category);
    writeLocalFallback(FALLBACK_CAT_KEY, next);
  }
}

export async function replaceCustomCategories(categories: Category[]): Promise<void> {
  if (!hasIndexedDB()) {
    writeLocalFallback(FALLBACK_CAT_KEY, categories);
    return;
  }
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CATEGORIES, 'readwrite');
      const store = tx.objectStore(STORE_CATEGORIES);
      store.clear();
      for (const item of categories) {
        store.put(item);
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
    });
  } catch {
    writeLocalFallback(FALLBACK_CAT_KEY, categories);
  }
}

export async function removeCustomCategory(id: string): Promise<void> {
  if (!hasIndexedDB()) {
    const current = readLocalFallback<Category[]>(FALLBACK_CAT_KEY, []);
    writeLocalFallback(
      FALLBACK_CAT_KEY,
      current.filter((c) => c.id !== id)
    );
    return;
  }
  try {
    await withStore(STORE_CATEGORIES, 'readwrite', (store) => store.delete(id));
  } catch {
    const current = readLocalFallback<Category[]>(FALLBACK_CAT_KEY, []);
    writeLocalFallback(
      FALLBACK_CAT_KEY,
      current.filter((c) => c.id !== id)
    );
  }
}

export function loadSettings(): AppSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...readLocalFallback<Partial<AppSettings>>(SETTINGS_KEY, {}),
  };
}

export function saveSettings(settings: AppSettings): void {
  writeLocalFallback(SETTINGS_KEY, settings);
}
