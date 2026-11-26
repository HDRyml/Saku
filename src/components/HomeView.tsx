import React, { useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Plus,
  Sparkles,
} from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types/finance';
import { calculateSummary, filterTransactions, sortTransactionsDesc } from '../utils/analytics';
import { formatMonthLabel, formatRupiah, getMonthKey, formatDateInput } from '../utils/format';
import { TransactionList } from './TransactionList';

interface HomeViewProps {
  transactions: Transaction[];
  categories: Category[];
  hideBalance: boolean;
  onToggleHideBalance: () => void;
  onQuickAdd: (defaultType: TransactionType) => void;
  onEditTransaction: (tx: Transaction) => void;
  onSeeAllHistory: () => void;
  onLoadDemoData: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  transactions,
  categories,
  hideBalance,
  onToggleHideBalance,
  onQuickAdd,
  onEditTransaction,
  onSeeAllHistory,
  onLoadDemoData,
}) => {
  const todayStr = formatDateInput();
  const currentMonthKey = getMonthKey(todayStr);

  const overallSummary = useMemo(() => calculateSummary(transactions), [transactions]);

  const monthSummary = useMemo(() => {
    const monthly = filterTransactions(transactions, { monthKey: currentMonthKey });
    return calculateSummary(monthly);
  }, [transactions, currentMonthKey]);

  const todaySummary = useMemo(() => {
    const todayTx = filterTransactions(transactions, { period: 'today' });
    return calculateSummary(todayTx);
  }, [transactions]);

  const recentTransactions = useMemo(
    () => sortTransactionsDesc(transactions).slice(0, 12),
    [transactions]
  );

  return (
    <div className="view-stack">
      {/* Hero Balance Card */}
      <section className="hero-card">
        <div className="hero-top-row">
          <div>
            <span className="hero-subtitle">Saldo Bersih</span>
            <h2 className="hero-balance">
              {formatRupiah(overallSummary.balance, { masked: hideBalance })}
            </h2>
          </div>
          <button
            type="button"
            className="hero-eye-btn"
            onClick={onToggleHideBalance}
            aria-label={hideBalance ? 'Tampilkan saldo' : 'Sembunyikan saldo'}
          >
            {hideBalance ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="hero-month-label">{formatMonthLabel(currentMonthKey)}</div>

        <div className="hero-metrics">
          <div className="hero-metric">
            <span className="metric-badge income">
              <ArrowDownLeft size={15} />
            </span>
            <div>
              <span className="metric-label">Pemasukan</span>
              <strong className="metric-value">
                {formatRupiah(monthSummary.totalIncome, { masked: hideBalance })}
              </strong>
            </div>
          </div>

          <div className="hero-metric">
            <span className="metric-badge expense">
              <ArrowUpRight size={15} />
            </span>
            <div>
              <span className="metric-label">Pengeluaran</span>
              <strong className="metric-value">
                {formatRupiah(monthSummary.totalExpense, { masked: hideBalance })}
              </strong>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Buttons */}
      <section className="quick-actions-row">
        <button
          type="button"
          className="quick-action-btn expense"
          onClick={() => onQuickAdd('expense')}
        >
          <Plus size={18} />
          <span>Catat Pengeluaran</span>
        </button>
        <button
          type="button"
          className="quick-action-btn income"
          onClick={() => onQuickAdd('income')}
        >
          <Plus size={18} />
          <span>Catat Pemasukan</span>
        </button>
      </section>

      {/* Today's Snapshot */}
      <section className="card today-strip">
        <div className="today-strip-left">
          <span className="today-title">Aktivitas Hari Ini</span>
          <span className="today-count">{todaySummary.count} transaksi tercatat</span>
        </div>
        <div className="today-strip-right">
          <span className="text-expense">
            -{formatRupiah(todaySummary.totalExpense, { masked: hideBalance })}
          </span>
          {todaySummary.totalIncome > 0 && (
            <span className="text-income">
              +{formatRupiah(todaySummary.totalIncome, { masked: hideBalance })}
            </span>
          )}
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="section-block">
        <div className="section-header">
          <h3>Catatan Terbaru</h3>
          {transactions.length > 0 && (
            <button type="button" className="text-link" onClick={onSeeAllHistory}>
              Lihat semua <ChevronRight size={15} />
            </button>
          )}
        </div>

        <TransactionList
          transactions={recentTransactions}
          categories={categories}
          masked={hideBalance}
          onSelect={onEditTransaction}
          emptyAction={
            <div className="empty-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => onQuickAdd('expense')}
              >
                <Plus size={17} /> Catat Transaksi Pertama
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onLoadDemoData}
              >
                <Sparkles size={16} /> Muat Contoh Data
              </button>
            </div>
          }
        />
      </section>
    </div>
  );
};
