import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types/finance';
import { calculateSummary, filterTransactions } from '../utils/analytics';
import { formatMonthLabel, formatRupiah, getMonthKey } from '../utils/format';
import { TransactionList } from './TransactionList';

interface HistoryViewProps {
  transactions: Transaction[];
  categories: Category[];
  hideBalance: boolean;
  onEditTransaction: (tx: Transaction) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  categories,
  hideBalance,
  onEditTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const availableMonths = useMemo(() => {
    const keys = new Set<string>();
    for (const tx of transactions) {
      keys.add(getMonthKey(tx.date));
    }
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filtered = useMemo(
    () =>
      filterTransactions(transactions, {
        monthKey: monthFilter === 'all' ? undefined : monthFilter,
        period: 'all',
        type: typeFilter,
        categoryId: categoryFilter,
        searchQuery,
        categories,
      }),
    [transactions, monthFilter, typeFilter, categoryFilter, searchQuery, categories]
  );

  const summary = useMemo(() => calculateSummary(filtered), [filtered]);

  return (
    <div className="view-stack">
      {/* Search Bar */}
      <div className="search-box">
        <Search size={17} className="search-icon" />
        <input
          type="search"
          placeholder="Cari catatan, kategori, atau nominal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Hapus pencarian"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filter-controls">
        <div className="period-pills">
          {(
            [
              { value: 'all', label: 'Semua' },
              { value: 'expense', label: 'Pengeluaran' },
              { value: 'income', label: 'Pemasukan' },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              className={`pill-btn ${typeFilter === item.value ? 'active' : ''}`}
              onClick={() => setTypeFilter(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="select-row">
          <select
            aria-label="Filter bulan"
            className="select-input"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">Semua Bulan</option>
            {availableMonths.map((mk) => (
              <option key={mk} value={mk}>
                {formatMonthLabel(mk)}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter kategori"
            className="select-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            {categories
              .filter((c) => typeFilter === 'all' || c.type === typeFilter)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Filtered Summary Bar */}
      <div className="card filtered-summary">
        <span>{summary.count} transaksi ditemukan</span>
        <div className="filtered-summary-nums">
          <span className="text-income">
            +{formatRupiah(summary.totalIncome, { compact: true, masked: hideBalance })}
          </span>
          <span className="text-expense">
            -{formatRupiah(summary.totalExpense, { compact: true, masked: hideBalance })}
          </span>
        </div>
      </div>

      <TransactionList
        transactions={filtered}
        categories={categories}
        masked={hideBalance}
        onSelect={onEditTransaction}
        emptyTitle="Tidak ada hasil yang cocok"
        emptySubtitle="Coba ubah kata kunci pencarian atau filter di atas."
      />
    </div>
  );
};
