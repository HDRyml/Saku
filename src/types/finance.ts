export type TransactionType = 'income' | 'expense';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  /** Local date in YYYY-MM-DD format */
  date: string;
  /** Local time in HH:mm format */
  time: string;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  hideBalance: boolean;
}

export interface BackupPayload {
  app: 'SakuHarian';
  version: 1;
  exportedAt: string;
  transactions: Transaction[];
  customCategories: Category[];
}

export type PeriodFilter = 'today' | 'week' | 'month' | 'all';
