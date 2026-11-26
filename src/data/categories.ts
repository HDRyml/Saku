import { Category, Transaction } from '../types/finance';
import { formatDateInput } from '../utils/format';

export const DEFAULT_CATEGORIES: Category[] = [
  // Pengeluaran
  { id: 'food', name: 'Makan & Minum', type: 'expense', icon: 'Utensils', color: '#f97316' },
  { id: 'transport', name: 'Transportasi', type: 'expense', icon: 'Car', color: '#3b82f6' },
  { id: 'shopping', name: 'Belanja', type: 'expense', icon: 'ShoppingBag', color: '#ec4899' },
  { id: 'bills', name: 'Tagihan & Pulsa', type: 'expense', icon: 'Receipt', color: '#8b5cf6' },
  { id: 'home', name: 'Rumah Tangga', type: 'expense', icon: 'Home', color: '#eab308' },
  { id: 'health', name: 'Kesehatan', type: 'expense', icon: 'HeartPulse', color: '#ef4444' },
  { id: 'fun', name: 'Hiburan', type: 'expense', icon: 'Gamepad2', color: '#06b6d4' },
  { id: 'education', name: 'Pendidikan', type: 'expense', icon: 'GraduationCap', color: '#6366f1' },
  { id: 'other-expense', name: 'Lainnya', type: 'expense', icon: 'MoreHorizontal', color: '#64748b' },

  // Pemasukan
  { id: 'salary', name: 'Gaji', type: 'income', icon: 'Wallet', color: '#10b981' },
  { id: 'business', name: 'Usaha / Jualan', type: 'income', icon: 'Store', color: '#0d9488' },
  { id: 'bonus', name: 'Bonus & Hadiah', type: 'income', icon: 'Gift', color: '#22c55e' },
  { id: 'invest', name: 'Investasi', type: 'income', icon: 'TrendingUp', color: '#0ea5e9' },
  { id: 'other-income', name: 'Lainnya', type: 'income', icon: 'PlusCircle', color: '#64748b' },
];

export const CATEGORY_ICON_OPTIONS = [
  'Utensils',
  'Coffee',
  'Car',
  'ShoppingBag',
  'Receipt',
  'Home',
  'HeartPulse',
  'Gamepad2',
  'GraduationCap',
  'Wallet',
  'Store',
  'Gift',
  'TrendingUp',
  'Smartphone',
  'Briefcase',
  'PiggyBank',
] as const;

export const CATEGORY_COLOR_OPTIONS = [
  '#0f766e',
  '#10b981',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#06b6d4',
] as const;

export function createDemoTransactions(now: Date = new Date()): Transaction[] {
  const shiftDate = (daysAgo: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return formatDateInput(d);
  };

  const baseTime = now.getTime();
  const items: Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>> = [
    { type: 'income', amount: 4500000, categoryId: 'salary', note: 'Gaji bulanan', date: shiftDate(5), time: '09:00' },
    { type: 'expense', amount: 28000, categoryId: 'food', note: 'Nasi goreng & es teh', date: shiftDate(0), time: '12:15' },
    { type: 'expense', amount: 18000, categoryId: 'food', note: 'Kopi susu pagi', date: shiftDate(0), time: '08:30' },
    { type: 'expense', amount: 25000, categoryId: 'transport', note: 'Isi bensin motor', date: shiftDate(0), time: '07:50' },
    { type: 'expense', amount: 125000, categoryId: 'shopping', note: 'Sabun, odol & kebutuhan harian', date: shiftDate(1), time: '18:40' },
    { type: 'expense', amount: 50000, categoryId: 'bills', note: 'Paket data internet', date: shiftDate(1), time: '10:12' },
    { type: 'income', amount: 350000, categoryId: 'business', note: 'Pembayaran project freelance', date: shiftDate(2), time: '15:20' },
    { type: 'expense', amount: 45000, categoryId: 'food', note: 'Makan malam bareng teman', date: shiftDate(2), time: '19:45' },
    { type: 'expense', amount: 65000, categoryId: 'fun', note: 'Tiket bioskop', date: shiftDate(3), time: '20:00' },
    { type: 'expense', amount: 85000, categoryId: 'health', note: 'Vitamin & obat flu', date: shiftDate(4), time: '16:10' },
  ];

  return items.map((item, idx) => ({
    ...item,
    id: `demo-${baseTime}-${idx}`,
    createdAt: baseTime - idx * 60000,
    updatedAt: baseTime - idx * 60000,
  }));
}
