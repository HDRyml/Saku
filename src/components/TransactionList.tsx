import React, { useMemo } from 'react';
import { Category, Transaction } from '../types/finance';
import { groupTransactionsByDate } from '../utils/analytics';
import { formatRupiah, getDateGroupLabel } from '../utils/format';
import { CategoryIcon } from './CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  masked?: boolean;
  onSelect: (tx: Transaction) => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: React.ReactNode;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  categories,
  masked = false,
  onSelect,
  emptyTitle = 'Belum ada catatan transaksi',
  emptySubtitle = 'Ketuk tombol + di bawah untuk mencatat pemasukan atau pengeluaran harianmu.',
  emptyAction,
}) => {
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const groups = useMemo(() => groupTransactionsByDate(transactions), [transactions]);

  if (groups.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-illustration">Rp</div>
        <h3>{emptyTitle}</h3>
        <p>{emptySubtitle}</p>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="tx-groups">
      {groups.map((group) => (
        <section key={group.date} className="tx-group">
          <div className="tx-group-header">
            <span className="tx-group-date">{getDateGroupLabel(group.date)}</span>
            <span className="tx-group-total">
              {group.totalExpense > 0 && (
                <span className="text-expense">
                  -{formatRupiah(group.totalExpense, { masked })}
                </span>
              )}
              {group.totalIncome > 0 && (
                <span className="text-income">
                  {group.totalExpense > 0 ? ' · ' : ''}+{formatRupiah(group.totalIncome, { masked })}
                </span>
              )}
            </span>
          </div>

          <div className="tx-card-list">
            {group.transactions.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              const color = cat?.color ?? '#64748b';
              return (
                <button
                  key={tx.id}
                  type="button"
                  className="tx-item"
                  onClick={() => onSelect(tx)}
                >
                  <span
                    className="tx-icon"
                    style={{
                      backgroundColor: `${color}1c`,
                      color,
                    }}
                  >
                    <CategoryIcon name={cat?.icon ?? 'Wallet'} size={19} />
                  </span>

                  <span className="tx-info">
                    <span className="tx-title">
                      {tx.note || cat?.name || 'Transaksi'}
                    </span>
                    <span className="tx-meta">
                      {cat?.name ?? 'Lainnya'} · {tx.time}
                    </span>
                  </span>

                  <span className={`tx-amount ${tx.type}`}>
                    {formatRupiah(tx.amount, { withSign: tx.type, masked })}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};
