# SakuHarian — Aplikasi Pencatatan Uang Harian (Mobile-First PWA)

Aplikasi pencatatan pemasukan dan pengeluaran harian berbasis web yang dirancang mobile-first, ringan, dapat di-install ke layar utama HP (PWA), dan bekerja secara offline.

## Fitur Utama

- **Catat Cepat Pemasukan & Pengeluaran**: Form bottom-sheet dengan format Rupiah otomatis, preset nominal cepat, pilihan kategori berikon, dan shortcut tanggal.
- **Ringkasan Saldo & Aktivitas Harian**: Total saldo bersih, pemasukan & pengeluaran bulan berjalan, fitur sembunyikan saldo, serta daftar transaksi dikelompokkan per tanggal.
- **Statistik & Grafik Interaktif**: Filter periode (`Hari Ini`, `7 Hari`, `Bulan Ini`, `Semua`), grafik tren 7 hari terakhir, dan donut chart per kategori.
- **Riwayat & Filter**: Pencarian catatan/nominal serta filter berdasarkan tipe, bulan, dan kategori.
- **Penyimpanan Lokal & Backup**: Data tersimpan di IndexedDB perangkat (dengan fallback `localStorage`), lengkap dengan ekspor CSV (Excel), backup/restore JSON, dan kategori kustom.
- **PWA & Offline Ready**: Dilengkapi web app manifest dan service worker Workbox (`autoUpdate`).

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

## Perintah Lainnya

```bash
npm run typecheck   # Cek tipe TypeScript
npm test            # Jalankan unit test (Vitest)
npm run build       # Build produksi + PWA
npm run preview     # Pratinjau build produksi
```
