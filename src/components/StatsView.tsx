import React, { useMemo, useState } from 'react';
import { Category, PeriodFilter, Transaction, TransactionType } from '../types/finance';
import {
  calculateSummary,
  filterTransactions,
  getCategoryBreakdown,
  getDailyTrend,
} from '../utils/analytics';
import { formatRupiah } from '../utils/format';
import { CategoryIcon } from './CategoryIcon';
import { DailyTrendChart, DonutChart } from './Charts';

interface StatsViewProps {
  transactions: Transaction[];
  categories: Category[];
  hideBalance: boolean;
}

const PERIOD_OPTIONS: Array<{ value: PeriodFilter; label: string }> = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: '7 Hari' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'all', label: 'Semua' },
];

export const StatsView: React.FC<StatsViewProps> = ({
  transactions,
  categories,
  hideBalance,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [focusType, setFocusType] = useState<TransactionType>('expense');

  const filtered = useMemo(
    () => filterTransactions(transactions, { period }),
    [transactions, period]
  );

  const summary = useMemo(() => calculateSummary(filtered), [filtered]);

  const breakdown = useMemo(
    () => getCategoryBreakdown(filtered, categories, focusType),
    [filtered, categories, focusType]
  );

  const trendPoints = useMemo(
    () => getDailyTrend(transactions, 7),
    [transactions]
  );

  const focusTotal = focusType === 'expense' ? summary.totalExpense : summary.totalIncome;

  return (
    <div className="view-stack">
      <div className="period-pills" role="tablist" aria-label="Pilih periode">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={period === opt.value}
            className={`pill-btn ${period === opt.value ? 'active' : ''}`}
            onClick={() => setPeriod(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* KPI Row */}
      <div className="kpi-grid">
        <div className="card kpi-card">
          <span className="kpi-label">Pemasukan</span>
          <strong className="kpi-value text-income">
            {formatRupiah(summary.totalIncome, { compact: true, masked: hideBalance })}
          </strong>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Pengeluaran</span>
          <strong className="kpi-value text-expense">
            {formatRupiah(summary.totalExpense, { compact: true, masked: hideBalance })}
          </strong>
        </div>
        <div className="card kpi-card">
          <span className="kpi-label">Selisih</span>
          <strong
            className={`kpi-value ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}
          >
            {formatRupiah(summary.balance, { compact: true, masked: hideBalance })}
          </strong>
        </div>
      </div>

      {/* Daily Trend */}
      <section className="card">
        <div className="card-header-row">
          <h3>Tren 7 Hari Terakhir</h3>
          <span className="card-hint">Ketuk batang untuk detail</span>
        </div>
        <DailyTrendChart points={trendPoints} masked={hideBalance} />
      </section>

      {/* Category Breakdown */}
      <section className="card">
        <div className="card-header-row">
          <h3>Per Kategori</h3>
          <div className="mini-toggle">
            <button
              type="button"
              className={focusType === 'expense' ? 'active' : ''}
              onClick={() => setFocusType('expense')}
            >
              Keluar
            </button>
            <button
              type="button"
              className={focusType === 'income' ? 'active' : ''}
              onClick={() => setFocusType('income')}
            >
              Masuk
            </button>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="empty-inline">
            Belum ada data {focusType === 'expense' ? 'pengeluaran' : 'pemasukan'} pada periode ini.
          </div>
        ) : (
          <>
            <DonutChart
              items={breakdown}
              total={focusTotal}
              label={focusType === 'expense' ? 'Total Keluar' : 'Total Masuk'}
              masked={hideBalance}
            />

            <div className="breakdown-list">
              {breakdown.map((item) => (
                <div key={item.category.id} className="breakdown-row">
                  <div className="breakdown-top">
                    <div className="breakdown-cat">
                      <span
                        className="breakdown-icon"
                        style={{
                          backgroundColor: `${item.category.color}1e`,
                          color: item.category.color,
                        }}
                      >
                        <CategoryIcon name={item.category.icon} size={16} />
                      </span>
                      <div>
                        <span className="breakdown-name">{item.category.name}</span>
                        <span className="breakdown-count">{item.count}x transaksi</span>
                      </div>
                    </div>

                    <div className="breakdown-right">
                      <strong>
                        {formatRupiah(item.amount, { masked: hideBalance })}
                      </strong>
                      <span>{item.percentage}%</span>
                    </div>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.max(item.percentage, 3)}%`,
                        backgroundColor: item.category.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
