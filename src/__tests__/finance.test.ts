import { describe, expect, it, beforeEach } from 'vitest';
import { DEFAULT_CATEGORIES } from '../data/categories';
import {
  getAllTransactions,
  removeTransaction,
  replaceAllTransactions,
  saveTransaction,
} from '../storage/db';
import { Transaction } from '../types/finance';
import {
  calculateSummary,
  filterTransactions,
  getCategoryBreakdown,
  getDailyTrend,
  groupTransactionsByDate,
} from '../utils/analytics';
import {
  createBackupPayload,
  exportTransactionsToCSV,
  parseAndValidateBackup,
} from '../utils/backup';
import {
  formatDateInput,
  formatNumericInput,
  formatRupiah,
  getDateGroupLabel,
  parseNumericInput,
} from '../utils/format';

const sampleTransactions: Transaction[] = [
  {
    id: 'tx-1',
    type: 'income',
    amount: 3000000,
    categoryId: 'salary',
    note: 'Gaji utama',
    date: '2026-11-26',
    time: '09:00',
    createdAt: 1000,
    updatedAt: 1000,
  },
  {
    id: 'tx-2',
    type: 'expense',
    amount: 25000,
    categoryId: 'food',
    note: 'Makan siang',
    date: '2026-11-26',
    time: '12:30',
    createdAt: 2000,
    updatedAt: 2000,
  },
  {
    id: 'tx-3',
    type: 'expense',
    amount: 75000,
    categoryId: 'transport',
    note: 'Bensin, tol',
    date: '2026-11-25',
    time: '17:00',
    createdAt: 3000,
    updatedAt: 3000,
  },
];

describe('format utilities', () => {
  it('formats rupiah values and numeric inputs properly', () => {
    expect(formatRupiah(25000)).toBe('Rp 25.000');
    expect(formatRupiah(25000, { withSign: 'expense' })).toBe('-Rp 25.000');
    expect(formatRupiah(25000, { withSign: 'income' })).toBe('+Rp 25.000');
    expect(formatRupiah(1500000, { compact: true })).toBe('Rp 1,5 jt');
    expect(formatRupiah(50000, { masked: true })).toBe('Rp ••••••');

    expect(formatNumericInput('125000')).toBe('125.000');
    expect(parseNumericInput('125.000')).toBe(125000);
  });

  it('formats local dates and group labels accurately', () => {
    const today = new Date(2026, 10, 26); // 2026-11-26
    expect(formatDateInput(today)).toBe('2026-11-26');
    expect(getDateGroupLabel('2026-11-26', '2026-11-26')).toBe('Hari Ini');
    expect(getDateGroupLabel('2026-11-25', '2026-11-26')).toBe('Kemarin');
  });
});

describe('analytics helpers', () => {
  it('calculates balance, income, and expense summary', () => {
    const summary = calculateSummary(sampleTransactions);
    expect(summary.totalIncome).toBe(3000000);
    expect(summary.totalExpense).toBe(100000);
    expect(summary.balance).toBe(2900000);
    expect(summary.count).toBe(3);
  });

  it('filters transactions by period, type, and search query', () => {
    const refDate = new Date(2026, 10, 26);
    const todayOnly = filterTransactions(sampleTransactions, {
      period: 'today',
      referenceDate: refDate,
      categories: DEFAULT_CATEGORIES,
    });
    expect(todayOnly).toHaveLength(2);

    const searchFood = filterTransactions(sampleTransactions, {
      period: 'all',
      searchQuery: 'makan',
      categories: DEFAULT_CATEGORIES,
      referenceDate: refDate,
    });
    expect(searchFood).toHaveLength(1);
    expect(searchFood[0].id).toBe('tx-2');
  });

  it('computes category breakdown percentages and daily trend', () => {
    const breakdown = getCategoryBreakdown(sampleTransactions, DEFAULT_CATEGORIES, 'expense');
    expect(breakdown).toHaveLength(2);
    expect(breakdown[0].category.id).toBe('transport');
    expect(breakdown[0].percentage).toBe(75);
    expect(breakdown[1].category.id).toBe('food');
    expect(breakdown[1].percentage).toBe(25);

    const grouped = groupTransactionsByDate(sampleTransactions);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].date).toBe('2026-11-26');

    const trend = getDailyTrend(sampleTransactions, 7, new Date(2026, 10, 26));
    expect(trend).toHaveLength(7);
    expect(trend[6].income).toBe(3000000);
    expect(trend[6].expense).toBe(25000);
    expect(trend[5].expense).toBe(75000);
  });
});

describe('backup and CSV export', () => {
  it('exports CSV with proper escaping and creates/parses valid JSON backup', () => {
    const csv = exportTransactionsToCSV(sampleTransactions, DEFAULT_CATEGORIES);
    expect(csv).toContain('Tanggal,Jam,Tipe,Kategori,Nominal,Catatan');
    expect(csv).toContain('"Bensin, tol"');

    const payload = createBackupPayload(sampleTransactions, []);
    const restored = parseAndValidateBackup(JSON.stringify(payload));
    expect(restored.transactions).toHaveLength(3);
    expect(restored.transactions[0].amount).toBe(3000000);
  });

  it('rejects invalid JSON backup payloads', () => {
    expect(() => parseAndValidateBackup('not json')).toThrow();
    expect(() => parseAndValidateBackup('{"foo": 1}')).toThrow();
  });
});

describe('IndexedDB storage layer', () => {
  beforeEach(async () => {
    await replaceAllTransactions([]);
  });

  it('saves, reads, and deletes transactions in IndexedDB', async () => {
    await saveTransaction(sampleTransactions[0]);
    await saveTransaction(sampleTransactions[1]);

    let all = await getAllTransactions();
    expect(all).toHaveLength(2);

    await removeTransaction('tx-1');
    all = await getAllTransactions();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('tx-2');
  });
});
