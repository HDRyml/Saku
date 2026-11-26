import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FolderPlus,
  Monitor,
  Moon,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { CATEGORY_COLOR_OPTIONS, CATEGORY_ICON_OPTIONS } from '../data/categories';
import { AppSettings, Category, ThemeMode, Transaction, TransactionType } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';

interface SettingsViewProps {
  transactions: Transaction[];
  customCategories: Category[];
  settings: AppSettings;
  isOnline: boolean;
  canInstallPWA: boolean;
  isStandalone: boolean;
  onInstallPWA: () => Promise<void>;
  onChangeTheme: (theme: ThemeMode) => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File, mode: 'merge' | 'replace') => Promise<void>;
  onAddCategory: (cat: Omit<Category, 'id' | 'isCustom'>) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onLoadDemoData: () => Promise<void>;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  transactions,
  customCategories,
  settings,
  isOnline,
  canInstallPWA,
  isStandalone,
  onInstallPWA,
  onChangeTheme,
  onExportCSV,
  onExportJSON,
  onImportJSON,
  onAddCategory,
  onDeleteCategory,
  onLoadDemoData,
  onClearAllData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [confirmClear, setConfirmClear] = useState(false);

  // Custom category creator state
  const [showAddCat, setShowAddCat] = useState(false);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<TransactionType>('expense');
  const [catIcon, setCatIcon] = useState<string>(CATEGORY_ICON_OPTIONS[0]);
  const [catColor, setCatColor] = useState<string>(CATEGORY_COLOR_OPTIONS[0]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onImportJSON(file, importMode);
    e.target.value = '';
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await onAddCategory({
      name: catName.trim(),
      type: catType,
      icon: catIcon,
      color: catColor,
    });
    setCatName('');
    setShowAddCat(false);
  };

  return (
    <div className="view-stack">
      {/* PWA & Mobile Status */}
      <section className="card">
        <div className="card-header-row">
          <h3>Aplikasi Mobile (PWA)</h3>
          <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? 'Online' : 'Offline Ready'}
          </span>
        </div>

        {isStandalone ? (
          <div className="pwa-installed-box">
            <CheckCircle2 size={18} />
            <span>SakuHarian sudah berjalan sebagai aplikasi terpasang.</span>
          </div>
        ) : (
          <div className="pwa-guide">
            <p className="muted-text">
              Buka aplikasi ini di browser HP untuk dipasang ke layar utama (home screen) dan
              digunakan tanpa koneksi internet.
            </p>
            {canInstallPWA ? (
              <button type="button" className="btn-primary full-width" onClick={onInstallPWA}>
                <Smartphone size={17} /> Install ke Layar Utama
              </button>
            ) : (
              <div className="install-steps">
                <div>
                  <strong>Android (Chrome):</strong> Ketuk menu ⋮ → <em>Tambahkan ke layar utama</em>
                </div>
                <div>
                  <strong>iPhone (Safari):</strong> Ketuk tombol Share ⬆ → <em>Add to Home Screen</em>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Appearance */}
      <section className="card">
        <h3 className="card-title">Tampilan</h3>
        <div className="theme-options">
          {(
            [
              { id: 'system', label: 'Sistem', icon: Monitor },
              { id: 'light', label: 'Terang', icon: Sun },
              { id: 'dark', label: 'Gelap', icon: Moon },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`theme-btn ${settings.theme === id ? 'active' : ''}`}
              onClick={() => onChangeTheme(id)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Custom Categories */}
      <section className="card">
        <div className="card-header-row">
          <h3>Kategori Kustom</h3>
          <button
            type="button"
            className="text-link"
            onClick={() => setShowAddCat((v) => !v)}
          >
            <FolderPlus size={15} /> {showAddCat ? 'Tutup' : 'Tambah'}
          </button>
        </div>

        {showAddCat && (
          <form onSubmit={handleCreateCategory} className="custom-cat-form">
            <div className="type-switcher compact">
              <button
                type="button"
                className={`type-pill ${catType === 'expense' ? 'active expense' : ''}`}
                onClick={() => setCatType('expense')}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                className={`type-pill ${catType === 'income' ? 'active income' : ''}`}
                onClick={() => setCatType('income')}
              >
                Pemasukan
              </button>
            </div>

            <input
              type="text"
              className="text-input"
              placeholder="Nama kategori baru (mis. Ngopi, Parkir)"
              maxLength={24}
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              required
            />

            <div className="color-picker-row">
              {CATEGORY_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${catColor === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCatColor(c)}
                  aria-label={`Pilih warna ${c}`}
                />
              ))}
            </div>

            <div className="icon-picker-row">
              {CATEGORY_ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  className={`icon-swatch ${catIcon === icon ? 'selected' : ''}`}
                  onClick={() => setCatIcon(icon)}
                  aria-label={`Pilih ikon ${icon}`}
                >
                  <CategoryIcon name={icon} size={17} />
                </button>
              ))}
            </div>

            <button type="submit" className="btn-primary full-width">
              Simpan Kategori
            </button>
          </form>
        )}

        {customCategories.length === 0 ? (
          <p className="muted-text">
            Belum ada kategori kustom. Kategori bawaan sudah tersedia otomatis.
          </p>
        ) : (
          <div className="custom-cat-list">
            {customCategories.map((cat) => (
              <div key={cat.id} className="custom-cat-item">
                <div className="custom-cat-left">
                  <span
                    className="tx-icon small"
                    style={{ backgroundColor: `${cat.color}1e`, color: cat.color }}
                  >
                    <CategoryIcon name={cat.icon} size={16} />
                  </span>
                  <span>{cat.name}</span>
                  <span className="mini-tag">
                    {cat.type === 'expense' ? 'Keluar' : 'Masuk'}
                  </span>
                </div>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => onDeleteCategory(cat.id)}
                  aria-label={`Hapus kategori ${cat.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Export & Backup */}
      <section className="card">
        <h3 className="card-title">Backup & Ekspor Data</h3>
        <p className="muted-text">
          Semua data tersimpan lokal di perangkatmu ({transactions.length} transaksi). Ekspor
          secara berkala agar aman.
        </p>

        <div className="action-stack">
          <button
            type="button"
            className="btn-outline"
            onClick={onExportCSV}
            disabled={transactions.length === 0}
          >
            <FileSpreadsheet size={17} />
            <span>Ekspor Laporan CSV (Excel)</span>
          </button>

          <button type="button" className="btn-outline" onClick={onExportJSON}>
            <Download size={17} />
            <span>Unduh Backup Lengkap (JSON)</span>
          </button>

          <div className="import-box">
            <div className="import-mode-row">
              <span>Mode Impor:</span>
              <label>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                />{' '}
                Gabungkan
              </label>
              <label>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                />{' '}
                Timpa semua
              </label>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn-secondary full-width"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={17} />
              <span>Pulihkan dari File Backup (.json)</span>
            </button>
          </div>
        </div>
      </section>

      {/* Danger Zone / Demo */}
      <section className="card">
        <h3 className="card-title">Kelola Data</h3>
        <div className="action-stack">
          <button type="button" className="btn-secondary full-width" onClick={onLoadDemoData}>
            <Sparkles size={17} />
            <span>Tambahkan Contoh Data Transaksi</span>
          </button>

          <button
            type="button"
            className={`btn-danger-outline full-width ${confirmClear ? 'confirm' : ''}`}
            onClick={async () => {
              if (!confirmClear) {
                setConfirmClear(true);
                return;
              }
              await onClearAllData();
              setConfirmClear(false);
            }}
          >
            <Trash2 size={17} />
            <span>
              {confirmClear ? 'Ketuk Sekali Lagi untuk Hapus Semua Data' : 'Hapus Semua Transaksi'}
            </span>
          </button>
        </div>
      </section>
    </div>
  );
};
