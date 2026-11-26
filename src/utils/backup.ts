import { BackupPayload, Category, Transaction } from '../types/finance';
import { sortTransactionsDesc } from './analytics';

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[]
): string {
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
  const header = ['Tanggal', 'Jam', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
  const rows = sortTransactionsDesc(transactions).map((tx) => [
    escapeCsvCell(tx.date),
    escapeCsvCell(tx.time),
    escapeCsvCell(tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'),
    escapeCsvCell(categoryMap.get(tx.categoryId) ?? 'Lainnya'),
    escapeCsvCell(tx.amount),
    escapeCsvCell(tx.note),
  ]);

  // UTF-8 BOM so Microsoft Excel on Windows opens Indonesian characters cleanly
  return '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function createBackupPayload(
  transactions: Transaction[],
  customCategories: Category[]
): BackupPayload {
  return {
    app: 'SakuHarian',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    customCategories,
  };
}

export function parseAndValidateBackup(rawText: string): BackupPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('File tidak valid: bukan format JSON yang benar.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Struktur file backup tidak dikenali.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.transactions)) {
    throw new Error('File backup tidak memiliki daftar transaksi.');
  }

  const validTransactions: Transaction[] = [];
  for (const item of obj.transactions) {
    if (!item || typeof item !== 'object') continue;
    const t = item as Record<string, unknown>;
    if (
      typeof t.id !== 'string' ||
      (t.type !== 'income' && t.type !== 'expense') ||
      typeof t.amount !== 'number' ||
      !Number.isFinite(t.amount) ||
      t.amount <= 0 ||
      typeof t.categoryId !== 'string' ||
      typeof t.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(t.date)
    ) {
      continue;
    }

    validTransactions.push({
      id: t.id,
      type: t.type,
      amount: Math.round(t.amount),
      categoryId: t.categoryId,
      note: typeof t.note === 'string' ? t.note : '',
      date: t.date,
      time: typeof t.time === 'string' && /^\d{2}:\d{2}$/.test(t.time) ? t.time : '12:00',
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      updatedAt: typeof t.updatedAt === 'number' ? t.updatedAt : Date.now(),
    });
  }

  const validCustomCategories: Category[] = [];
  if (Array.isArray(obj.customCategories)) {
    for (const item of obj.customCategories) {
      if (!item || typeof item !== 'object') continue;
      const c = item as Record<string, unknown>;
      if (
        typeof c.id !== 'string' ||
        typeof c.name !== 'string' ||
        (c.type !== 'income' && c.type !== 'expense')
      ) {
        continue;
      }
      validCustomCategories.push({
        id: c.id,
        name: c.name.trim(),
        type: c.type,
        icon: typeof c.icon === 'string' ? c.icon : 'Wallet',
        color: typeof c.color === 'string' ? c.color : '#0f766e',
        isCustom: true,
      });
    }
  }

  return {
    app: 'SakuHarian',
    version: 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    transactions: validTransactions,
    customCategories: validCustomCategories,
  };
}

export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
