import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Clock,
  Home,
  Plus,
  Settings,
  WifiOff,
} from 'lucide-react';
import { HistoryView } from './components/HistoryView';
import { HomeView } from './components/HomeView';
import { SettingsView } from './components/SettingsView';
import { StatsView } from './components/StatsView';
import { TransactionModal } from './components/TransactionModal';
import { createDemoTransactions, DEFAULT_CATEGORIES } from './data/categories';
import {
  getAllTransactions,
  getCustomCategories,
  loadSettings,
  removeCustomCategory,
  removeTransaction,
  replaceAllTransactions,
  replaceCustomCategories,
  saveCustomCategory,
  saveSettings,
  saveTransaction,
  saveTransactionsBulk,
} from './storage/db';
import {
  AppSettings,
  Category,
  ThemeMode,
  Transaction,
  TransactionType,
} from './types/finance';
import {
  createBackupPayload,
  downloadTextFile,
  exportTransactionsToCSV,
  parseAndValidateBackup,
} from './utils/backup';
import { formatDateInput } from './utils/format';

type TabKey = 'home' | 'stats' | 'history' | 'settings';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ToastState {
  id: number;
  message: string;
  undoTransaction?: Transaction;
}

const TAB_TITLES: Record<TabKey, string> = {
  home: 'SakuHarian',
  stats: 'Statistik',
  history: 'Riwayat',
  settings: 'Pengaturan',
};

function generateId(prefix = 'tx'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const categories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...customCategories],
    [customCategories]
  );

  const showToast = useCallback((message: string, undoTransaction?: Transaction) => {
    setToast({ id: Date.now(), message, undoTransaction });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.undoTransaction ? 4500 : 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial data load from IndexedDB
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [txs, customCats] = await Promise.all([
          getAllTransactions(),
          getCustomCategories(),
        ]);
        if (!active) return;
        setTransactions(txs);
        setCustomCategories(customCats);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const resolved =
        settings.theme === 'system' ? (media.matches ? 'dark' : 'light') : settings.theme;
      root.dataset.theme = resolved;
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // Online/offline + PWA install detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const standaloneCheck =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standaloneCheck);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      showToast('SakuHarian berhasil dipasang!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [showToast]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const handleOpenNew = useCallback((defaultType: TransactionType = 'expense') => {
    setEditingTx(null);
    setModalDefaultType(defaultType);
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((tx: Transaction) => {
    setEditingTx(tx);
    setModalDefaultType(tx.type);
    setModalOpen(true);
  }, []);

  const handleSaveTransaction = useCallback(
    async (data: {
      id?: string;
      type: TransactionType;
      amount: number;
      categoryId: string;
      note: string;
      date: string;
      time: string;
    }) => {
      const now = Date.now();
      const existing = data.id ? transactions.find((t) => t.id === data.id) : undefined;
      const item: Transaction = {
        id: data.id ?? generateId('tx'),
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        note: data.note,
        date: data.date,
        time: data.time,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      await saveTransaction(item);
      setTransactions((prev) => {
        const filtered = prev.filter((t) => t.id !== item.id);
        return [...filtered, item];
      });
      showToast(existing ? 'Catatan diperbarui' : 'Catatan tersimpan');
    },
    [transactions, showToast]
  );

  const handleDeleteTransaction = useCallback(
    async (id: string) => {
      const target = transactions.find((t) => t.id === id);
      await removeTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (target) {
        showToast('Catatan dihapus', target);
      }
    },
    [transactions, showToast]
  );

  const handleUndoDelete = useCallback(async () => {
    if (!toast?.undoTransaction) return;
    const restored = toast.undoTransaction;
    await saveTransaction(restored);
    setTransactions((prev) => {
      if (prev.some((t) => t.id === restored.id)) return prev;
      return [...prev, restored];
    });
    setToast(null);
  }, [toast]);

  const handleLoadDemoData = useCallback(async () => {
    const demo = createDemoTransactions();
    await saveTransactionsBulk(demo);
    setTransactions((prev) => [...prev, ...demo]);
    showToast(`${demo.length} contoh transaksi ditambahkan`);
  }, [showToast]);

  const handleClearAllData = useCallback(async () => {
    await replaceAllTransactions([]);
    setTransactions([]);
    showToast('Semua data transaksi telah dihapus');
  }, [showToast]);

  const handleAddCategory = useCallback(
    async (cat: Omit<Category, 'id' | 'isCustom'>) => {
      const newCat: Category = {
        ...cat,
        id: generateId('cat'),
        isCustom: true,
      };
      await saveCustomCategory(newCat);
      setCustomCategories((prev) => [...prev, newCat]);
      showToast(`Kategori "${newCat.name}" ditambahkan`);
    },
    [showToast]
  );

  const handleDeleteCategory = useCallback(
    async (id: string) => {
      await removeCustomCategory(id);
      setCustomCategories((prev) => prev.filter((c) => c.id !== id));
      showToast('Kategori dihapus');
    },
    [showToast]
  );

  const handleExportCSV = useCallback(() => {
    const csv = exportTransactionsToCSV(transactions, categories);
    downloadTextFile(
      `sakuharian-laporan-${formatDateInput()}.csv`,
      csv,
      'text/csv;charset=utf-8;'
    );
    showToast('Laporan CSV berhasil diunduh');
  }, [transactions, categories, showToast]);

  const handleExportJSON = useCallback(() => {
    const payload = createBackupPayload(transactions, customCategories);
    downloadTextFile(
      `sakuharian-backup-${formatDateInput()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json'
    );
    showToast('Backup JSON berhasil diunduh');
  }, [transactions, customCategories, showToast]);

  const handleImportJSON = useCallback(
    async (file: File, mode: 'merge' | 'replace') => {
      try {
        const text = await file.text();
        const backup = parseAndValidateBackup(text);

        if (mode === 'replace') {
          await replaceAllTransactions(backup.transactions);
          await replaceCustomCategories(backup.customCategories);
          setTransactions(backup.transactions);
          setCustomCategories(backup.customCategories);
          showToast(`Berhasil memulihkan ${backup.transactions.length} transaksi`);
        } else {
          await saveTransactionsBulk(backup.transactions);
          for (const cat of backup.customCategories) {
            await saveCustomCategory(cat);
          }

          setTransactions((prev) => {
            const map = new Map(prev.map((t) => [t.id, t]));
            for (const item of backup.transactions) map.set(item.id, item);
            return Array.from(map.values());
          });

          setCustomCategories((prev) => {
            const map = new Map(prev.map((c) => [c.id, c]));
            for (const cat of backup.customCategories) map.set(cat.id, cat);
            return Array.from(map.values());
          });

          showToast(`Berhasil menggabungkan ${backup.transactions.length} transaksi`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal membaca file backup.';
        showToast(msg);
      }
    },
    [showToast]
  );

  const handleInstallPWA = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  return (
    <div className="app-viewport">
      <div className="app-shell">
        {/* Top App Bar */}
        <header className="top-bar">
          <div className="top-bar-brand">
            <span className="brand-dot">Rp</span>
            <h1>{TAB_TITLES[activeTab]}</h1>
          </div>

          {!isOnline && (
            <span className="offline-chip" title="Data tetap tersimpan lokal secara offline">
              <WifiOff size={13} /> Offline
            </span>
          )}
        </header>

        {/* Main Scrollable Content */}
        <main className="main-content">
          {loading ? (
            <div className="loading-state">Memuat catatan...</div>
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  transactions={transactions}
                  categories={categories}
                  hideBalance={settings.hideBalance}
                  onToggleHideBalance={() =>
                    updateSettings({ hideBalance: !settings.hideBalance })
                  }
                  onQuickAdd={handleOpenNew}
                  onEditTransaction={handleOpenEdit}
                  onSeeAllHistory={() => setActiveTab('history')}
                  onLoadDemoData={handleLoadDemoData}
                />
              )}

              {activeTab === 'stats' && (
                <StatsView
                  transactions={transactions}
                  categories={categories}
                  hideBalance={settings.hideBalance}
                />
              )}

              {activeTab === 'history' && (
                <HistoryView
                  transactions={transactions}
                  categories={categories}
                  hideBalance={settings.hideBalance}
                  onEditTransaction={handleOpenEdit}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  transactions={transactions}
                  customCategories={customCategories}
                  settings={settings}
                  isOnline={isOnline}
                  canInstallPWA={Boolean(installPrompt)}
                  isStandalone={isStandalone}
                  onInstallPWA={handleInstallPWA}
                  onChangeTheme={(theme: ThemeMode) => updateSettings({ theme })}
                  onExportCSV={handleExportCSV}
                  onExportJSON={handleExportJSON}
                  onImportJSON={handleImportJSON}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onLoadDemoData={handleLoadDemoData}
                  onClearAllData={handleClearAllData}
                />
              )}
            </>
          )}
        </main>

        {/* Toast Notification */}
        {toast && (
          <div className="toast-banner" role="status" aria-live="polite">
            <span>{toast.message}</span>
            {toast.undoTransaction && (
              <button type="button" className="toast-undo" onClick={handleUndoDelete}>
                Urungkan
              </button>
            )}
          </div>
        )}

        {/* Fixed Bottom Navigation + Center FAB */}
        <nav className="bottom-nav" aria-label="Navigasi utama">
          <button
            type="button"
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Home size={20} />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={20} />
            <span>Statistik</span>
          </button>

          <div className="nav-fab-slot">
            <button
              type="button"
              className="fab-button"
              onClick={() => handleOpenNew('expense')}
              aria-label="Catat transaksi baru"
            >
              <Plus size={26} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={20} />
            <span>Riwayat</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Atur</span>
          </button>
        </nav>

        {/* Quick-Add / Edit Bottom Sheet */}
        <TransactionModal
          isOpen={modalOpen}
          editingTransaction={editingTx}
          categories={categories}
          defaultType={modalDefaultType}
          onClose={() => setModalOpen(false)}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
        />
      </div>
    </div>
  );
};

export default App;
