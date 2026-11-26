import { TransactionType } from '../types/finance';

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatRupiah(
  amount: number,
  options?: { compact?: boolean; withSign?: TransactionType; masked?: boolean }
): string {
  if (options?.masked) {
    return 'Rp ••••••';
  }

  const abs = Math.abs(Math.round(amount));
  const prefix =
    options?.withSign === 'income'
      ? '+'
      : options?.withSign === 'expense'
        ? '-'
        : amount < 0
          ? '-'
          : '';

  if (options?.compact) {
    if (abs >= 1_000_000_000) {
      return `${prefix}Rp ${(abs / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    }
    if (abs >= 1_000_000) {
      return `${prefix}Rp ${(abs / 1_000_000).toFixed(1).replace('.', ',')} jt`;
    }
    if (abs >= 1_000) {
      return `${prefix}Rp ${Math.round(abs / 1_000)} rb`;
    }
  }

  return `${prefix}Rp ${rupiahFormatter.format(abs)}`;
}

export function formatNumericInput(rawDigits: string): string {
  const clean = rawDigits.replace(/\D/g, '');
  if (!clean) return '';
  return rupiahFormatter.format(Number(clean));
}

export function parseNumericInput(formatted: string): number {
  const clean = formatted.replace(/\D/g, '');
  if (!clean) return 0;
  return Number(clean);
}

/** Formats local Date to YYYY-MM-DD without UTC timezone shift */
export function formatDateInput(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeInput(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function getDateGroupLabel(dateStr: string, todayStr: string = formatDateInput()): string {
  if (dateStr === todayStr) return 'Hari Ini';

  const today = parseLocalDate(todayStr);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === formatDateInput(yesterday)) return 'Kemarin';

  const target = parseLocalDate(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: target.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  }).format(target);
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}
