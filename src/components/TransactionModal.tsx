import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Trash2, X } from 'lucide-react';
import { Category, Transaction, TransactionType } from '../types/finance';
import {
  formatDateInput,
  formatNumericInput,
  formatTimeInput,
  parseNumericInput,
} from '../utils/format';
import { CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  editingTransaction: Transaction | null;
  categories: Category[];
  defaultType?: TransactionType;
  onClose: () => void;
  onSave: (data: {
    id?: string;
    type: TransactionType;
    amount: number;
    categoryId: string;
    note: string;
    date: string;
    time: string;
  }) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
}

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  editingTransaction,
  categories,
  defaultType = 'expense',
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountInput, setAmountInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(formatDateInput());
  const [time, setTime] = useState(formatTimeInput());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setConfirmDelete(false);
    setSaving(false);

    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountInput(formatNumericInput(String(editingTransaction.amount)));
      setCategoryId(editingTransaction.categoryId);
      setNote(editingTransaction.note);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time);
    } else {
      const now = new Date();
      setType(defaultType);
      setAmountInput('');
      const firstCat = categories.find((c) => c.type === defaultType);
      setCategoryId(firstCat?.id ?? '');
      setNote('');
      setDate(formatDateInput(now));
      setTime(formatTimeInput(now));
    }
  }, [isOpen, editingTransaction, defaultType, categories]);

  useEffect(() => {
    if (!isOpen) return;
    const existsInType = filteredCategories.some((c) => c.id === categoryId);
    if (!existsInType && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type, filteredCategories, categoryId, isOpen]);

  if (!isOpen) return null;

  const currentAmount = parseNumericInput(amountInput);

  const handleAddQuickAmount = (delta: number) => {
    const next = currentAmount + delta;
    setAmountInput(formatNumericInput(String(next)));
    setError('');
  };

  const handleSetToday = () => {
    setDate(formatDateInput(new Date()));
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(formatDateInput(d));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount <= 0) {
      setError('Masukkan nominal lebih dari Rp 0');
      return;
    }
    if (!categoryId) {
      setError('Pilih kategori terlebih dahulu');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        id: editingTransaction?.id,
        type,
        amount: currentAmount,
        categoryId,
        note: note.trim(),
        date: date || formatDateInput(),
        time: time || formatTimeInput(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTransaction || !onDelete) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await onDelete(editingTransaction.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div className="sheet-header">
          <h2>{editingTransaction ? 'Edit Catatan' : 'Catat Transaksi'}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Tutup form"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="sheet-form">
          <div className="type-switcher">
            <button
              type="button"
              className={`type-pill ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => setType('expense')}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              className={`type-pill ${type === 'income' ? 'active income' : ''}`}
              onClick={() => setType('income')}
            >
              Pemasukan
            </button>
          </div>

          <div className="amount-box">
            <label htmlFor="tx-amount" className="field-label">
              Nominal
            </label>
            <div className={`amount-input-wrap ${type}`}>
              <span className="currency-prefix">Rp</span>
              <input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9.]*"
                placeholder="0"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(formatNumericInput(e.target.value));
                  setError('');
                }}
                autoFocus={!editingTransaction}
              />
              {amountInput && (
                <button
                  type="button"
                  className="clear-amount-btn"
                  onClick={() => setAmountInput('')}
                  aria-label="Hapus nominal"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="quick-chips">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  className="quick-chip"
                  onClick={() => handleAddQuickAmount(val)}
                >
                  +{val / 1000}rb
                </button>
              ))}
            </div>
          </div>

          <div className="field-block">
            <span className="field-label">Kategori</span>
            <div className="category-grid">
              {filteredCategories.map((cat) => {
                const selected = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-tile ${selected ? 'selected' : ''}`}
                    style={
                      selected
                        ? {
                            borderColor: cat.color,
                            backgroundColor: `${cat.color}18`,
                          }
                        : undefined
                    }
                    onClick={() => {
                      setCategoryId(cat.id);
                      setError('');
                    }}
                  >
                    <span
                      className="category-badge"
                      style={{
                        backgroundColor: `${cat.color}20`,
                        color: cat.color,
                      }}
                    >
                      <CategoryIcon name={cat.icon} size={18} />
                    </span>
                    <span className="category-name">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field-row-2">
            <div className="field-block">
              <div className="label-with-actions">
                <label htmlFor="tx-date" className="field-label">
                  <Calendar size={13} /> Tanggal
                </label>
                <div className="mini-date-actions">
                  <button type="button" onClick={handleSetToday}>
                    Hari ini
                  </button>
                  <button type="button" onClick={handleSetYesterday}>
                    Kemarin
                  </button>
                </div>
              </div>
              <input
                id="tx-date"
                type="date"
                className="text-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="field-block">
              <label htmlFor="tx-time" className="field-label">
                <Clock size={13} /> Jam
              </label>
              <input
                id="tx-time"
                type="time"
                className="text-input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-block">
            <label htmlFor="tx-note" className="field-label">
              Catatan (opsional)
            </label>
            <input
              id="tx-note"
              type="text"
              className="text-input"
              placeholder={
                type === 'expense' ? 'Misal: Kopi susu, makan siang...' : 'Misal: Bonus project'
              }
              maxLength={100}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="sheet-actions">
            {editingTransaction && onDelete && (
              <button
                type="button"
                className={`btn-delete ${confirmDelete ? 'confirm' : ''}`}
                onClick={handleDelete}
                disabled={saving}
              >
                <Trash2 size={18} />
                <span>{confirmDelete ? 'Yakin Hapus?' : 'Hapus'}</span>
              </button>
            )}
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Menyimpan...' : editingTransaction ? 'Simpan Perubahan' : 'Simpan Catatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
