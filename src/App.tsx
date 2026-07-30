import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  BookOpenCheck, 
  Users, 
  FilePieChart, 
  BriefcaseBusiness,
  BookText,
  Banknote,
  Settings, 
  LogOut, 
  LogIn,
  Menu, 
  X, 
  Database,
  RefreshCw,
  Info,
  ShieldCheck
} from 'lucide-react';

// Service API
import { api, isDemoMode } from './utils/api';
import { User, Transaksi, UtangPiutang, KasAnggota, PenerimaanDana, PerjalananDinas } from './types';
// Components
import Login from './components/Login';
const Dashboard = lazy(() => import('./components/Dashboard'));
const TransaksiComponent = lazy(() => import('./components/Transaksi'));
const UtangPiutangComponent = lazy(() => import('./components/UtangPiutang'));
const KasAnggotaComponent = lazy(() => import('./components/KasAnggota'));
const PenerimaanDanaComponent = lazy(() => import('./components/PenerimaanDana'));
const PerjalananDinasComponent = lazy(() => import('./components/PerjalananDinas'));
const PembukuanComponent = lazy(() => import('./components/Pembukuan'));
const LaporanComponent = lazy(() => import('./components/Laporan'));

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('kas_dkc_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error(e);
      }
    }
    return {
      email: 'anggota@dkc.org',
      nama: 'Anggota DKC',
      role: 'Anggota'
    };
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  // Data States
  const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
  const [utangPiutang, setUtangPiutang] = useState<UtangPiutang[]>([]);
  const [kasAnggota, setKasAnggota] = useState<KasAnggota[]>([]);
  const [penerimaanDana, setPenerimaanDana] = useState<PenerimaanDana[]>([]);
  const [perjalananDinas, setPerjalananDinas] = useState<PerjalananDinas[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Quick Action Form Modal
  const [quickTxType, setQuickTxType] = useState<'Pemasukan' | 'Pengeluaran' | null>(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickKategori, setQuickKategori] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  // Settings State (Konfigurasi GAS URL)
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [gasUrlInput, setGasUrlInput] = useState<string>(import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbx6hipxrU7VFxEpdoNaoMoVVqcEJyb4P1ZWVqZ9N11ePn4WmXaUQm_ZtvbaVPbQrQxHOA/exec');



  // Fetch seluruh data jika user telah login
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getAllData();
      setTransaksi(data.transaksi);
      setUtangPiutang(data.utangPiutang);
      setKasAnggota(data.kasAnggota);
      setPenerimaanDana(data.penerimaanDana || []);
      setPerjalananDinas(data.perjalananDinas || []);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal mengambil data dari Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('kas_dkc_user');
    setUser({
      email: 'anggota@dkc.org',
      nama: 'Anggota DKC',
      role: 'Anggota'
    });
    setActiveTab('dashboard');
  };

  // TAMBAH TRANSAKSI
  const handleAddTransaksi = async (txData: Omit<Transaksi, 'id' | 'inputOleh'>) => {
    if (!user) return;
    try {
      const added = await api.addTransaksi({
        ...txData,
        inputOleh: user.nama
      });
      // Update local state untuk interaksi instan
      setTransaksi(prev => [added, ...prev]);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menyimpan transaksi');
    }
  };

  // EDIT TRANSAKSI
  const handleEditTransaksi = async (txData: Transaksi) => {
    try {
      const updated = await api.editTransaksi(txData);
      setTransaksi(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal mengubah transaksi');
    }
  };

  // HAPUS TRANSAKSI
  const handleDeleteTransaksi = async (id: string) => {
    try {
      await api.deleteTransaksi(id);
      setTransaksi(prev => prev.filter(t => t.id !== id));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menghapus transaksi');
    }
  };

  // TAMBAH UTANG PIUTANG
  const handleAddUtangPiutang = async (upData: Omit<UtangPiutang, 'id' | 'status'>) => {
    try {
      const added = await api.addUtangPiutang(upData);
      setUtangPiutang(prev => [added, ...prev]);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menyimpan utang/piutang');
    }
  };

  // PELUNASAN UTANG PIUTANG
  const handleBayarUtangPiutang = async (id: string, tanggalLunas: string, nominalBayar: number, mode: 'Lunas' | 'Cicil', buktiTransaksi?: string) => {
    try {
      const updated = await api.bayarUtangPiutang(id, tanggalLunas, nominalBayar, mode, buktiTransaksi);
      // Update local state utang piutang
      setUtangPiutang(prev => prev.map(item => item.id === id ? updated : item));
      // Refresh transaksi karena pelunasan menambah record transaksi baru secara otomatis
      fetchData();
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal memproses pelunasan');
    }
  };

  // UPDATE KAS ANGGOTA
  const handleUpdateKasAnggota = async (nama: string, tahun: number, bulan: string, jumlah: number, tanggalBayar: string, metodeBayar: 'Transfer' | 'Offline') => {
    try {
      const updatedList = await api.updateKasAnggota(nama, tahun, bulan, jumlah, tanggalBayar, metodeBayar);
      setKasAnggota(updatedList);
      fetchData();
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal mencatat kas');
    }
  };

  // TAMBAH ANGGOTA BARU
  const handleAddAnggota = async (nama: string, tahunMasuk: string | number, jabatan: string) => {
    try {
      const updatedList = await api.addAnggota(nama, tahunMasuk, jabatan);
      setKasAnggota(updatedList);
      // Refresh transaksi karena input kas menambahkan pemasukan kas baru otomatis
      fetchData();
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal mencatat kas');
    }
  };

  // UPDATE STATUS ANGGOTA
  const handleUpdateStatusAnggota = async (nama: string, tahunMasuk: number, statusAktif: 'Aktif' | 'Tidak Aktif') => {
    try {
      const updatedList = await api.updateStatusAnggota(nama, tahunMasuk, statusAktif);
      setKasAnggota(updatedList);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal memperbarui status');
    }
  };

  // PENERIMAAN DANA
  const handleAddPenerimaanDana = async (pdData: Omit<PenerimaanDana, 'id' | 'inputOleh'>) => {
    if (!user) return;
    try {
      const added = await api.addPenerimaanDana({ ...pdData, inputOleh: user.nama });
      setPenerimaanDana(prev => [added, ...prev]);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menyimpan penerimaan dana');
    }
  };

  const handleEditPenerimaanDana = async (pdData: PenerimaanDana) => {
    try {
      const updated = await api.editPenerimaanDana(pdData);
      setPenerimaanDana(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal mengubah penerimaan dana');
    }
  };

  const handleDeletePenerimaanDana = async (id: string) => {
    try {
      await api.deletePenerimaanDana(id);
      setPenerimaanDana(prev => prev.filter(p => p.id !== id));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menghapus penerimaan dana');
    }
  };

  // PERJALANAN DINAS
  const handleAddPerjalananDinas = async (pdData: Omit<PerjalananDinas, 'id' | 'inputOleh'>) => {
    if (!user) return;
    try {
      const added = await api.addPerjalananDinas({ ...pdData, inputOleh: user.nama });
      setPerjalananDinas(prev => [added, ...prev]);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menyimpan SPPD');
    }
  };

  const handleEditPerjalananDinas = async (pdData: PerjalananDinas) => {
    try {
      const updated = await api.editPerjalananDinas(pdData);
      setPerjalananDinas(prev => prev.map(p => p.id === updated.id ? updated : p));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal mengubah SPPD');
    }
  };

  const handleDeletePerjalananDinas = async (id: string) => {
    try {
      await api.deletePerjalananDinas(id);
      setPerjalananDinas(prev => prev.filter(p => p.id !== id));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Gagal menghapus SPPD');
    }
  };

  // QUICK TRANSACTION SUBMIT
  const handleQuickTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTxType || !quickKategori || !quickAmount || !quickDesc || !user) return;

    setQuickLoading(true);
    try {
      await handleAddTransaksi({
        tanggal: new Date().toISOString().split('T')[0],
        jenis: quickTxType,
        kategori: quickKategori,
        jumlah: parseFloat(quickAmount),
        keterangan: quickDesc
      });
      // Reset
      setQuickAmount('');
      setQuickKategori('');
      setQuickDesc('');
      setQuickTxType(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menambah transaksi cepat');
    } finally {
      setQuickLoading(false);
    }
  };

  // SIMPAN GAS URL DI LOCALSTORAGE
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (gasUrlInput) {
      // Untuk fleksibilitas deployment, kita simpan URL ini di localStorage agar bisa langsung diuji tanpa rebuild
      localStorage.setItem('kas_dkc_gas_url_override', gasUrlInput);
      alert('URL Apps Script disimpan! Halaman akan dimuat ulang.');
      window.location.reload();
    } else {
      localStorage.removeItem('kas_dkc_gas_url_override');
      alert('Menggunakan URL default dari file konfigurasi. Halaman dimuat ulang.');
      window.location.reload();
    }
  };

  // Reset Demo Data
  const handleResetDemo = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data simulasi (demo) kembali ke setelan awal?')) {
      api.resetDemoData();
      alert('Data demo berhasil direset!');
      fetchData();
    }
  };

  // RENDER SCREEN JIKA BELUM LOGIN
  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  // TABS NAVIGATION MAP
  const tabs = [
    { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'transaksi', label: 'Transaksi', icon: ReceiptText },
    { id: 'utang-piutang', label: 'Utang & Piutang', icon: BookOpenCheck },
    { id: 'kas-anggota', label: 'Kas Anggota', icon: Users },
    { id: 'laporan', label: 'Rekap & Laporan', icon: FilePieChart },
    { id: 'penerimaan-dana', label: 'Penerimaan Dana', icon: Banknote },
    { id: 'perjalanan-dinas', label: 'Perjalanan Dinas', icon: BriefcaseBusiness },
    { id: 'pembukuan', label: 'Buku Besar', icon: BookText },
  ];

  return (
    <div className="h-screen flex bg-gradient-to-br from-violet-50/70 via-pink-50/30 to-sky-50/50 overflow-hidden font-sans">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 z-30 select-none shadow-sm">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-100 border border-violet-200/80 rounded-xl flex items-center justify-center shadow-inner">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-violet-600 fill-none stroke-current" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L9 9H15L12 2Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22C12 22 6 17 6 12C6 9 8 8 12 8C16 8 18 9 18 12C18 17 12 22 12 22Z" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-display font-bold tracking-widest text-slate-800 block">KAS DKC</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest font-semibold">Dewan Kerja Cabang Cilacap</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition rounded-r-xl ${
                  isActive 
                    ? 'bg-violet-100/90 border-l-4 border-violet-500 text-violet-700 shadow-xs' 
                    : 'text-slate-600 hover:bg-violet-50/70 hover:text-slate-900'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-violet-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Settings Button */}
        <div className="p-4 border-t border-slate-200/70 bg-violet-50/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-violet-100 border border-violet-200 flex items-center justify-center text-xs font-bold text-violet-700 shadow-xs">
              {user.nama.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.nama}</p>
              <p className="text-[9px] text-slate-500 truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
            <button
              onClick={() => setShowSettings(true)}
              className="py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center gap-1.5 uppercase font-bold rounded-xl shadow-xs transition"
            >
              <Settings size={12} className="text-slate-500" />
              Setup
            </button>
            {user.role === 'Bendahara' ? (
              <button
                onClick={handleLogout}
                className="py-2 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 text-rose-700 flex items-center justify-center gap-1.5 uppercase font-bold rounded-xl transition"
              >
                <LogOut size={12} />
                Keluar
              </button>
            ) : (
              <button
                onClick={() => setUser(null)}
                className="py-2 bg-violet-50 border border-violet-200/80 hover:bg-violet-100 text-violet-700 flex items-center justify-center gap-1.5 uppercase font-bold rounded-xl transition"
              >
                <LogIn size={12} />
                Masuk
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile Navigation */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden">
          <div className="w-64 h-full bg-white border-r border-slate-200 flex flex-col p-5 shadow-2xl">
            <div className="flex justify-between items-center pb-5 border-b border-slate-200">
              <span className="text-xs font-display font-bold tracking-widest text-slate-800">KAS DKC OUTLET</span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 py-6 space-y-1.5 overflow-y-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition rounded-r-xl ${
                      isActive 
                        ? 'bg-violet-100/90 border-l-4 border-violet-500 text-violet-700' 
                        : 'text-slate-600 hover:bg-violet-50/70'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-slate-200 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-violet-100 border border-violet-200 rounded-xl flex items-center justify-center text-xs font-bold text-violet-700">
                  {user.nama.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">{user.nama}</p>
                  <p className="text-[9px] text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                <button
                  onClick={() => { setShowSettings(true); setSidebarOpen(false); }}
                  className="py-2 bg-white border border-slate-200 text-slate-700 flex items-center justify-center gap-1.5 uppercase font-bold rounded-xl"
                >
                  <Settings size={12} />
                  Setup
                </button>
                {user.role === 'Bendahara' ? (
                  <button
                    onClick={handleLogout}
                    className="py-2 bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center gap-1.5 uppercase font-bold rounded-xl"
                  >
                    <LogOut size={12} />
                    Keluar
                  </button>
                ) : (
                  <button
                    onClick={() => { setUser(null); setSidebarOpen(false); }}
                    className="py-2 bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center gap-1.5 uppercase font-bold rounded-xl"
                  >
                    <LogIn size={12} />
                    Masuk
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-200/70 flex items-center justify-between px-4 sm:px-6 bg-white/70 backdrop-blur-md z-20 no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl lg:hidden focus:outline-none"
            >
              <Menu size={18} />
            </button>
            <h2 className="text-xs font-display font-bold uppercase tracking-wider text-slate-700 hidden sm:block">
              Sistem Manajemen Keuangan Terpadu
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline/Demo mode notice */}
            {isDemoMode() ? (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Info size={12} className="text-amber-600" />
                <span>Simulasi Lokal (Demo)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Google Sheets Terkoneksi</span>
              </div>
            )}

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition focus:outline-none disabled:opacity-50 shadow-xs"
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-violet-600' : ''} />
            </button>
          </div>
        </header>

        {/* App Main Area (Scrollable content) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/40 geo-grid relative">
          
          {/* Warning Banner if Demo Mode */}
          {isDemoMode() && activeTab === 'dashboard' && (
            <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200/90 text-amber-900 text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print relative rounded-2xl shadow-xs">
              <div className="space-y-1">
                <h4 className="font-bold flex items-center gap-1.5 text-amber-900 uppercase tracking-wider">
                  <Database size={14} className="text-amber-600" /> Aplikasi Berjalan Tanpa Database Sheets
                </h4>
                <p className="text-[11px] text-amber-800/90 leading-relaxed max-w-2xl">
                  Saat ini aplikasi menyimpan data ke penyimpanan lokal browser Anda (**LocalStorage**). Untuk menghubungkan aplikasi ini secara permanen ke Google Sheets Anda, klik tombol **Setup Google Sheets** untuk menempelkan URL Apps Script.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold uppercase tracking-wider text-[10px] rounded-xl shadow-xs transition"
                >
                  Setup Sekarang
                </button>
                <button
                  onClick={handleResetDemo}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] rounded-xl transition"
                >
                  Reset Data Uji
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center justify-between no-print">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-rose-600 hover:underline font-bold">Tutup</button>
            </div>
          )}

          {/* ACTIVE TAB VIEWS */}
          {loading && transaksi.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
              <RefreshCw className="animate-spin text-violet-600" size={24} />
              <span className="text-xs uppercase tracking-widest font-bold text-slate-600">Sinkronisasi Data Google Sheets...</span>
            </div>
          ) : (
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
                <RefreshCw className="animate-spin text-violet-600" size={24} />
                <span className="text-xs uppercase tracking-widest font-bold text-slate-600">Memuat Halaman...</span>
              </div>
            }>
              {activeTab === 'dashboard' && (
                <Dashboard
                  role={user.role}
                  transaksi={transaksi}
                  utangPiutang={utangPiutang}
                  penerimaanDana={penerimaanDana}
                  kasAnggota={kasAnggota}
                  perjalananDinas={perjalananDinas}
                  onNavigate={(tab: string) => setActiveTab(tab)}
                  onOpenQuickTx={(jenis: 'Pemasukan' | 'Pengeluaran') => setQuickTxType(jenis)}
                />
              )}

              {activeTab === 'perjalanan-dinas' && (
                <PerjalananDinasComponent
                  role={user.role}
                  perjalananDinas={perjalananDinas}
                  onAdd={handleAddPerjalananDinas}
                  onEdit={handleEditPerjalananDinas}
                  onDelete={handleDeletePerjalananDinas}
                />
              )}

              {activeTab === 'transaksi' && (
                <TransaksiComponent
                  role={user.role}
                  transaksi={transaksi}
                  onEditTransaksi={handleEditTransaksi}
                  onDeleteTransaksi={handleDeleteTransaksi}
                  onAddTransaksi={handleAddTransaksi}
                />
              )}

              {activeTab === 'utang-piutang' && (
                <UtangPiutangComponent
                  role={user.role}
                  utangPiutang={utangPiutang}
                  onAddUtangPiutang={handleAddUtangPiutang}
                  onBayarUtangPiutang={handleBayarUtangPiutang}
                />
              )}

              {activeTab === 'kas-anggota' && (
                <KasAnggotaComponent
                  role={user.role}
                  kasAnggota={kasAnggota}
                  onAddAnggota={handleAddAnggota}
                  onUpdateKasAnggota={handleUpdateKasAnggota}
                  onUpdateStatusAnggota={handleUpdateStatusAnggota}
                  onAddTransaksi={handleAddTransaksi}
                />
              )}

              {activeTab === 'laporan' && (
                <LaporanComponent
                  transaksi={transaksi}
                  utangPiutang={utangPiutang}
                />
              )}

              {activeTab === 'penerimaan-dana' && (
                <PenerimaanDanaComponent
                  role={user.role}
                  penerimaanDana={penerimaanDana}
                  onAdd={handleAddPenerimaanDana}
                  onEdit={handleEditPenerimaanDana}
                  onDelete={handleDeletePenerimaanDana}
                />
              )}

              {activeTab === 'pembukuan' && (
                <PembukuanComponent
                  transaksi={transaksi}
                  utangPiutang={utangPiutang}
                  penerimaanDana={penerimaanDana}
                />
              )}
            </Suspense>
          )}
        </main>
      </div>

      {/* QUICK TRANSACTION MODAL (Bendahara Only) */}
      {quickTxType && user.role === 'Bendahara' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-200/80 p-6 relative rounded-3xl shadow-xl shadow-purple-900/10 geo-corner-decor">
            <button
              onClick={() => setQuickTxType(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${quickTxType === 'Pemasukan' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              Entri Cepat {quickTxType}
            </h3>

            <form onSubmit={handleQuickTxSubmit} className="space-y-4">
              {/* Jumlah Nominal */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Nominal Uang (IDR) *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-bold font-display text-xs">Rp</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 50000"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                  />
                </div>
              </div>

              {/* Kategori */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Kategori *</label>
                <select
                  required
                  value={quickKategori}
                  onChange={(e) => setQuickKategori(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {(quickTxType === 'Pemasukan' 
                    ? ['Iuran Kas', 'Sponsorship', 'Donasi', 'Pencairan Dana Kwarcab', 'Lain-lain']
                    : ['Konsumsi', 'Perlengkapan', 'Kesekretariatan', 'Atribut', 'Operasional Kegiatan', 'Lain-lain']
                  ).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Keterangan Singkat *</label>
                <input
                  type="text"
                  required
                  placeholder="Rincian peruntukan..."
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setQuickTxType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-display text-[10px] font-bold uppercase tracking-wider rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={quickLoading}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 rounded-xl shadow-md shadow-violet-500/20"
                >
                  {quickLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETUP SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200/80 p-6 relative rounded-3xl shadow-xl shadow-purple-900/10 geo-corner-decor">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <Database className="text-violet-600" size={16} />
              Setup Google Sheets API URL
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Tempelkan **Web App URL** yang didapatkan setelah mendeploy **Google Apps Script** Anda ke dalam input di bawah ini. Aplikasi akan beralih secara otomatis dari mode simulasi lokal ke database online Google Sheets.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbzffJiiU-VmD9cz6rMTkXWawayAksAhNyj6eZZ9obUQ74URi31qLJORp7laqnxARx41Pw/exec"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-violet-400 focus:bg-white font-sans rounded-xl"
                />
              </div>

              <div className="text-[10px] bg-slate-50 p-3 text-slate-600 border border-slate-200 rounded-xl space-y-1.5">
                <p className="font-semibold text-slate-800 uppercase tracking-wider">Langkah Deployment Script:</p>
                <p>1. Copy kode dari file `google-apps-script.js` proyek ini.</p>
                <p>2. Di Google Sheets, buka menu **Extensions &gt; Apps Script**.</p>
                <p>3. Paste kodenya, simpan, lalu pilih **Deploy &gt; New Deployment**.</p>
                <p>4. Konfigurasikan akses sebagai **"Anyone"**, lalu salin URL yang dihasilkan.</p>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('kas_dkc_gas_url_override');
                    alert('URL Apps Script dihapus. Halaman dimuat ulang.');
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-display text-[10px] font-bold uppercase tracking-wider rounded-xl transition"
                >
                  Reset URL
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-display text-[10px] font-bold uppercase tracking-wider rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md shadow-violet-500/20 transition"
                >
                  Simpan URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
