import React, { useState } from 'react';
import { CategoryBreakdownItem, DailyTrendPoint } from '../utils/analytics';
import { formatRupiah } from '../utils/format';

interface DonutChartProps {
  items: CategoryBreakdownItem[];
  total: number;
  label: string;
  masked?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  items,
  total,
  label,
  masked = false,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const size = 184;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const activeItem = items.find((i) => i.category.id === activeId) ?? null;

  let cumulativeOffset = 0;

  return (
    <div className="donut-wrap">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="donut-svg"
        role="img"
        aria-label={`Grafik ${label}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
        />

        {total > 0 &&
          items.map((item) => {
            const fraction = item.amount / total;
            const dashLength = Math.max(fraction * circumference - 2, 2);
            const dashOffset = -cumulativeOffset;
            cumulativeOffset += fraction * circumference;
            const isActive = activeId === item.category.id;

            return (
              <circle
                key={item.category.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.category.color}
                strokeWidth={isActive ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ cursor: 'pointer', transition: 'stroke-width 0.15s ease' }}
                onClick={() =>
                  setActiveId((prev) => (prev === item.category.id ? null : item.category.id))
                }
              />
            );
          })}
      </svg>

      <div className="donut-center">
        <span className="donut-center-label">
          {activeItem ? activeItem.category.name : label}
        </span>
        <strong className="donut-center-value">
          {formatRupiah(activeItem ? activeItem.amount : total, {
            compact: true,
            masked,
          })}
        </strong>
        {activeItem && <span className="donut-center-sub">{activeItem.percentage}%</span>}
      </div>
    </div>
  );
};

interface DailyTrendChartProps {
  points: DailyTrendPoint[];
  masked?: boolean;
}

export const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  points,
  masked = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    points.length > 0 ? points.length - 1 : null
  );

  const maxVal = Math.max(
    1,
    ...points.flatMap((p) => [p.income, p.expense])
  );

  const selectedPoint =
    selectedIndex !== null && points[selectedIndex] ? points[selectedIndex] : null;

  return (
    <div className="trend-chart">
      {selectedPoint && (
        <div className="trend-tooltip">
          <span className="trend-tooltip-date">{selectedPoint.shortLabel}</span>
          <div className="trend-tooltip-vals">
            <span className="text-income">
              +{formatRupiah(selectedPoint.income, { compact: true, masked })}
            </span>
            <span className="text-expense">
              -{formatRupiah(selectedPoint.expense, { compact: true, masked })}
            </span>
          </div>
        </div>
      )}

      <div className="trend-bars">
        {points.map((p, idx) => {
          const incomeH = p.income > 0 ? Math.max((p.income / maxVal) * 100, 6) : 0;
          const expenseH = p.expense > 0 ? Math.max((p.expense / maxVal) * 100, 6) : 0;
          const isSelected = selectedIndex === idx;

          return (
            <button
              key={p.date}
              type="button"
              className={`trend-col ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(idx)}
            >
              <div className="trend-bar-pair">
                <div
                  className="trend-bar income"
                  style={{ height: `${incomeH}%` }}
                  title={`Pemasukan: ${formatRupiah(p.income)}`}
                />
                <div
                  className="trend-bar expense"
                  style={{ height: `${expenseH}%` }}
                  title={`Pengeluaran: ${formatRupiah(p.expense)}`}
                />
              </div>
              <span className="trend-label">{p.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <div className="trend-legend">
        <span>
          <i className="dot income" /> Pemasukan
        </span>
        <span>
          <i className="dot expense" /> Pengeluaran
        </span>
      </div>
    </div>
  );
};
