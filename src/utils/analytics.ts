import { Category, PeriodFilter, Transaction, TransactionType } from '../types/finance';
import { formatDateInput, getMonthKey, parseLocalDate } from './format';

export interface FinancialSummary {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  count: number;
}

export interface CategoryBreakdownItem {
  category: Category;
  amount: number;
  count: number;
  percentage: number;
}

export interface DailyTrendPoint {
  date: string;
  shortLabel: string;
  income: number;
  expense: number;
}

export interface TransactionGroup {
  date: string;
  transactions: Transaction[];
  netAmount: number;
  totalExpense: number;
  totalIncome: number;
}

export function calculateSummary(transactions: Transaction[]): FinancialSummary {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else {
      totalExpense += tx.amount;
    }
  }

  return {
    balance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    count: transactions.length,
  };
}

export function isDateInPeriod(
  dateStr: string,
  period: PeriodFilter,
  referenceDate: Date = new Date()
): boolean {
  if (period === 'all') return true;
  const todayStr = formatDateInput(referenceDate);

  if (period === 'today') {
    return dateStr === todayStr;
  }

  if (period === 'month') {
    return getMonthKey(dateStr) === getMonthKey(todayStr);
  }

  // 'week': last 7 days including today
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  start.setDate(start.getDate() - 6);
  const startStr = formatDateInput(start);
  return dateStr >= startStr && dateStr <= todayStr;
}

export function filterTransactions(
  transactions: Transaction[],
  options: {
    period?: PeriodFilter;
    monthKey?: string;
    type?: TransactionType | 'all';
    categoryId?: string | 'all';
    searchQuery?: string;
    categories?: Category[];
    referenceDate?: Date;
  }
): Transaction[] {
  const {
    period = 'all',
    monthKey,
    type = 'all',
    categoryId = 'all',
    searchQuery = '',
    categories = [],
    referenceDate = new Date(),
  } = options;

  const query = searchQuery.trim().toLowerCase();
  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name.toLowerCase()]));

  return transactions.filter((tx) => {
    if (monthKey) {
      if (getMonthKey(tx.date) !== monthKey) return false;
    } else if (!isDateInPeriod(tx.date, period, referenceDate)) {
      return false;
    }

    if (type !== 'all' && tx.type !== type) return false;
    if (categoryId !== 'all' && tx.categoryId !== categoryId) return false;

    if (query) {
      const catName = categoryNameMap.get(tx.categoryId) ?? '';
      const noteMatch = tx.note.toLowerCase().includes(query);
      const catMatch = catName.includes(query);
      const amountMatch = String(tx.amount).includes(query);
      if (!noteMatch && !catMatch && !amountMatch) return false;
    }

    return true;
  });
}

export function sortTransactionsDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    if (a.time !== b.time) return b.time.localeCompare(a.time);
    return b.createdAt - a.createdAt;
  });
}

export function groupTransactionsByDate(transactions: Transaction[]): TransactionGroup[] {
  const sorted = sortTransactionsDesc(transactions);
  const map = new Map<string, TransactionGroup>();

  for (const tx of sorted) {
    let group = map.get(tx.date);
    if (!group) {
      group = {
        date: tx.date,
        transactions: [],
        netAmount: 0,
        totalExpense: 0,
        totalIncome: 0,
      };
      map.set(tx.date, group);
    }
    group.transactions.push(tx);
    if (tx.type === 'income') {
      group.totalIncome += tx.amount;
      group.netAmount += tx.amount;
    } else {
      group.totalExpense += tx.amount;
      group.netAmount -= tx.amount;
    }
  }

  return Array.from(map.values());
}

export function getCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: TransactionType
): CategoryBreakdownItem[] {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const fallbackCategory: Category = {
    id: type === 'expense' ? 'other-expense' : 'other-income',
    name: 'Lainnya',
    type,
    icon: type === 'expense' ? 'MoreHorizontal' : 'PlusCircle',
    color: '#64748b',
  };

  const totals = new Map<string, { category: Category; amount: number; count: number }>();
  let grandTotal = 0;

  for (const tx of transactions) {
    if (tx.type !== type) continue;
    const category = categoryMap.get(tx.categoryId) ?? fallbackCategory;
    const existing = totals.get(category.id) ?? { category, amount: 0, count: 0 };
    existing.amount += tx.amount;
    existing.count += 1;
    totals.set(category.id, existing);
    grandTotal += tx.amount;
  }

  return Array.from(totals.values())
    .sort((a, b) => b.amount - a.amount)
    .map((item) => ({
      ...item,
      percentage: grandTotal > 0 ? Math.round((item.amount / grandTotal) * 1000) / 10 : 0,
    }));
}

export function getDailyTrend(
  transactions: Transaction[],
  days = 7,
  referenceDate: Date = new Date()
): DailyTrendPoint[] {
  const dayBuckets = new Map<string, { income: number; expense: number }>();
  const points: DailyTrendPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    d.setDate(d.getDate() - i);
    const key = formatDateInput(d);
    dayBuckets.set(key, { income: 0, expense: 0 });
    const shortLabel = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: days > 7 ? 'numeric' : undefined,
      weekday: days <= 7 ? 'short' : undefined,
    }).format(parseLocalDate(key));

    points.push({ date: key, shortLabel, income: 0, expense: 0 });
  }

  for (const tx of transactions) {
    const bucket = dayBuckets.get(tx.date);
    if (!bucket) continue;
    if (tx.type === 'income') bucket.income += tx.amount;
    else bucket.expense += tx.amount;
  }

  return points.map((p) => {
    const b = dayBuckets.get(p.date)!;
    return { ...p, income: b.income, expense: b.expense };
  });
}
