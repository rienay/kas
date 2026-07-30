import React, { useState } from 'react';
import { Search, Plus, Calendar, Tag, AlertCircle, FileText, Upload, X, Eye, Printer, Download } from 'lucide-react';
import { Transaksi, UserRole } from '../types';

interface TransaksiProps {
  role: UserRole;
  transaksi: Transaksi[];
  onEditTransaksi: (t: Transaksi) => Promise<void>;
  onDeleteTransaksi: (id: string) => Promise<void>;
  onAddTransaksi: (t: Omit<Transaksi, 'id' | 'inputOleh'>) => Promise<void>;
}

export default function TransaksiComponent({ role, transaksi, onEditTransaksi, onDeleteTransaksi, onAddTransaksi }: TransaksiProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJenis, setFilterJenis] = useState<'Semua' | 'Pemasukan' | 'Pengeluaran'>('Semua');
  const [filterKategori, setFilterKategori] = useState('Semua');
  
  // State Form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jenis, setJenis] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [kategori, setKategori] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [buktiBase64, setBuktiBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Detail Modal State
  const [selectedTx, setSelectedTx] = useState<Transaksi | null>(null);

  // Kategori default
  const kategoriPemasukan = ['Kas', 'Sponsorship', 'Donasi', 'Pencairan Dana Kwarcab', 'sisa kegiatan', 'SPPD', 'Iuran', 'konsumsi anggota', 'Subsidi', 'Lain-lain'];
  const kategoriPengeluaran = ['Konsumsi', 'Perlengkapan', 'Kesekretariatan', 'Atribut', 'Operasional Kegiatan', 'ATK', 'Replace', 'Kuota', 'Service Barang', 'Kebersihan', 'Payment', 'GT',  'Lain-lain'];

  // Konversi file gambar ke Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) { // Limit 20MB
        setFormError('Ukuran file maksimal adalah 20MB');
        return;
      }
      
      const reader = new FileReader();
      // Jika bukan gambar (misal File PDF), skip proses kompresi
      if (!file.type.startsWith('image/')) {
        reader.onloadend = () => setBuktiBase64(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }

      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }

          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Kompres menjadi JPEG dengan kualitas 70%
          setBuktiBase64(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        setFormError('Gagal membaca file gambar');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kategori || !jumlah || !keterangan) {
      setFormError('Mohon isi seluruh field yang wajib');
      return;
    }

    const nominal = parseFloat(jumlah);
    if (isNaN(nominal) || nominal <= 0) {
      setFormError('Nominal transaksi tidak valid');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      if (editId) {
        await onEditTransaksi({
          id: editId,
          tanggal,
          jenis,
          kategori,
          jumlah: nominal,
          keterangan,
          buktiTransaksi: buktiBase64 || undefined,
          inputOleh: '' // Opsional, dihandle oleh backend
        });
      } else {
        await onAddTransaksi({
          tanggal,
          jenis,
          kategori,
          jumlah: nominal,
          keterangan,
          buktiTransaksi: buktiBase64 || undefined
        });
      }

      // Reset form
      setKategori('');
      setJumlah('');
      setKeterangan('');
      setBuktiBase64('');
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  const openEditForm = (t: Transaksi) => {
    setEditId(t.id || null);
    setTanggal(t.tanggal);
    setJenis(t.jenis);
    setKategori(t.kategori);
    setJumlah(t.jumlah.toString());
    setKeterangan(t.keterangan);
    setBuktiBase64(t.buktiTransaksi || '');
    setShowForm(true);
    setSelectedTx(null);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Yakin menghapus transaksi ini? Data akan hilang permanen.')) {
      try {
        await onDeleteTransaksi(id);
        setSelectedTx(null);
      } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal menghapus transaksi'); }
    }
  };

  // Ambil daftar kategori unik dari data transaksi untuk filter
  const allCategories = Array.from(new Set(transaksi.map(t => t.kategori)));

  // Filter & Search Data
  const filteredData = transaksi.filter(t => {
    const matchSearch = t.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.inputOleh.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchJenis = filterJenis === 'Semua' || t.jenis === filterJenis;
    const matchKategori = filterKategori === 'Semua' || t.kategori === filterKategori;

    return matchSearch && matchJenis && matchKategori;
  });

  const BULAN_MAP: Record<number, string> = {
    0: 'Januari', 1: 'Februari', 2: 'Maret', 3: 'April', 4: 'Mei', 5: 'Juni',
    6: 'Juli', 7: 'Agustus', 8: 'September', 9: 'Oktober', 10: 'November', 11: 'Desember'
  };

  const sortedTransaksi = [...filteredData].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  const groupedTransaksi: { monthName: string; monthIndex: number; transactions: Transaksi[] }[] = [];
  let currentMonth = -1;
  let currentGroup: { monthName: string; monthIndex: number; transactions: Transaksi[] } | null = null;

  sortedTransaksi.forEach(t => {
    const m = new Date(t.tanggal).getMonth();
    if (m !== currentMonth || !currentGroup) {
      currentMonth = m;
      currentGroup = { monthName: BULAN_MAP[m], monthIndex: m, transactions: [] };
      groupedTransaksi.push(currentGroup);
    }
    currentGroup.transactions.push(t);
  });

  // Ekspor CSV
  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push('ID Transaksi,Tanggal,Jenis,Kategori,Keterangan,Jumlah,Input Oleh');
    filteredData.forEach(t => {
      rows.push([
        t.id, t.tanggal, t.jenis, `"${t.kategori}"`, `"${t.keterangan.replace(/"/g, '""')}"`, t.jumlah, `"${t.inputOleh}"`
      ].join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Rekap_Transaksi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="space-y-6 print-area font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800">
            Riwayat Transaksi
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Lihat, cari, saring, dan laporkan seluruh catatan pemasukan dan pengeluaran kas.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-xl transition shadow-xs">
            <Download size={14} className="text-emerald-600" /> CSV / Excel
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-xl transition shadow-xs">
            <Printer size={14} className="text-slate-500" /> Print
          </button>
          {role === 'Bendahara' && (
            <button
              onClick={() => {
                setShowForm(!showForm);
                if(showForm) setEditId(null);
                setFormError('');
              }}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-xl transition shadow-md shadow-violet-500/20"
            >
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Batal Form' : 'Tambah Transaksi'}
            </button>
          )}
        </div>
      </div>

      {/* Form Tambah Transaksi (Hanya Bendahara) */}
      {showForm && role === 'Bendahara' && (
        <div className={`glass-panel border-l-4 ${editId ? 'border-l-amber-500' : 'border-l-violet-500'} p-6 relative rounded-3xl shadow-xs geo-corner-decor`}>
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={16} className={editId ? "text-amber-500" : "text-violet-600"} /> {editId ? 'Edit Transaksi' : 'Entri Transaksi Baru'}
          </h2>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4 rounded-xl">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tanggal */}
            <div className="space-y-1">
              <label htmlFor="tx-date" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Tanggal Transaksi *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Calendar size={14} />
                </span>
                <input
                  id="tx-date"
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                />
              </div>
            </div>

            {/* Jenis Transaksi */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Jenis Aliran Dana *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setJenis('Pemasukan'); setKategori(''); }}
                  className={`py-2 text-xs font-semibold uppercase tracking-wider border rounded-xl transition ${
                    jenis === 'Pemasukan' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Pemasukan (+)
                </button>
                <button
                  type="button"
                  onClick={() => { setJenis('Pengeluaran'); setKategori(''); }}
                  className={`py-2 text-xs font-semibold uppercase tracking-wider border rounded-xl transition ${
                    jenis === 'Pengeluaran' 
                      ? 'bg-rose-50 border-rose-200 text-rose-800 font-bold' 
                      : 'bg-slate-50 border-slate-200 text-slate-500'
                  }`}
                >
                  Pengeluaran (-)
                </button>
              </div>
            </div>

            {/* Kategori */}
            <div className="space-y-1">
              <label htmlFor="tx-category" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Kategori *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Tag size={14} />
                </span>
                <select
                  id="tx-category"
                  required
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {(jenis === 'Pemasukan' ? kategoriPemasukan : kategoriPengeluaran).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Jumlah */}
            <div className="space-y-1">
              <label htmlFor="tx-amount" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Jumlah Nominal (IDR) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs font-bold font-display">
                  Rp
                </span>
                <input
                  id="tx-amount"
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 150000"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="tx-desc" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Keterangan / Rincian Transaksi *
              </label>
              <textarea
                id="tx-desc"
                required
                rows={2}
                placeholder="Rincian peruntukan pengeluaran atau sumber pemasukan..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white font-sans rounded-xl"
              />
            </div>

            {/* Bukti Transaksi */}
            <div className="space-y-1 md:col-span-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Bukti Transaksi (Kuitansi / Nota)
              </span>
              
              <div className="flex items-center gap-4">
                <label className="flex-1 flex flex-col items-center justify-center py-4 bg-slate-50 hover:bg-slate-100/80 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl cursor-pointer transition">
                  <div className="flex flex-col items-center justify-center space-y-1.5 text-center">
                    <Upload size={18} className="text-violet-500" />
                    <p className="text-[10px] text-slate-600 font-medium">Klik untuk upload foto bukti</p>
                    <p className="text-[8px] text-slate-400">JPEG, PNG maks. 20MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {buktiBase64 && (
                  <div className="relative w-20 h-20 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src={buktiBase64} alt="Bukti" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBuktiBase64('')}
                      className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-rose-600 hover:text-rose-700 shadow-xs"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <button
                type="submit"
                id="submit-tx"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50 flex items-center gap-2 rounded-xl shadow-md shadow-violet-500/20"
              >
                {loading ? 'Menyimpan...' : 'Simpan Entri'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Print Layout */}
      <div className="hidden print-show mb-6 text-slate-900">
        <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5 mb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">Buku Besar / Riwayat Transaksi</h2>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Dewan Kerja Cabang Cilacap</h3>
          <p className="text-xs">Periode: Semua transaksi yang difilter</p>
        </div>

        <table className="w-full text-left border-collapse text-xs mt-4 print-ledger-table" style={{ pageBreakInside: 'auto' }}>
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase">
              <th className="py-2 pr-2">No</th>
              <th className="py-2 px-2">Tanggal</th>
              <th className="py-2 px-2">Kategori</th>
              <th className="py-2 px-2">Keterangan</th>
              <th className="py-2 px-2 text-right">Pemasukan</th>
              <th className="py-2 px-2 text-right">Pengeluaran</th>
              <th className="py-2 pl-2 text-right">Saldo</th>
            </tr>
          </thead>
          {filteredData.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7} className="py-4 text-center italic">Tidak ada transaksi</td>
              </tr>
            </tbody>
          ) : (() => {
            let saldo = 0;
            let globalIdx = 0;
            return groupedTransaksi.map((group) => (
              <tbody key={group.monthIndex} style={{ pageBreakInside: 'avoid' }}>
                <tr className="bg-slate-200 border-y-2 border-slate-400">
                  <td colSpan={7} className="py-2 px-2 font-bold uppercase tracking-widest text-slate-800 text-center">
                    -- Bulan: {group.monthName} --
                  </td>
                </tr>
                {group.transactions.map((t) => {
                  globalIdx++;
                  if (t.jenis === 'Pemasukan') saldo += t.jumlah;
                  else saldo -= t.jumlah;
                  return (
                    <tr key={t.id || globalIdx} className="border-b border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                      <td className="py-2 pr-2">{globalIdx}</td>
                      <td className="py-2 px-2 whitespace-nowrap">{t.tanggal}</td>
                      <td className="py-2 px-2 uppercase">{t.kategori}</td>
                      <td className="py-2 px-2">{t.keterangan}</td>
                      <td className="py-2 px-2 text-right">{t.jenis === 'Pemasukan' ? formatIDR(t.jumlah) : '-'}</td>
                      <td className="py-2 px-2 text-right">{t.jenis === 'Pengeluaran' ? formatIDR(t.jumlah) : '-'}</td>
                      <td className="py-2 pl-2 text-right font-semibold">{formatIDR(saldo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            ));
          })()}
        </table>
        <p className="text-[10px] text-slate-500 italic mt-4 text-right">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-4 flex flex-col md:flex-row gap-4 no-print rounded-2xl shadow-xs">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan keterangan, kategori, admin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl font-sans"
          />
        </div>

        {/* Jenis Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aliran:</span>
          <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl">
            {(['Semua', 'Pemasukan', 'Pengeluaran'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterJenis(mode)}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition rounded-lg ${
                  filterJenis === mode 
                    ? 'bg-white text-violet-700 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Kategori Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kategori:</span>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="bg-white border border-slate-200 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 focus:outline-none rounded-xl shadow-xs"
          >
            <option value="Semua">Semua Kategori</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel p-5 no-print rounded-3xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-3">ID</th>
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Keterangan</th>
                <th className="pb-3">Input Oleh</th>
                <th className="pb-3 text-right">Jumlah</th>
                <th className="pb-3 text-center pr-3 no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((t, idx) => (
                <tr key={t.id || idx} className="border-b border-slate-100 hover:bg-violet-50/40 transition">
                  <td className="py-3 pl-3 text-slate-400 font-mono">{t.id}</td>
                  <td className="py-3 text-slate-500 font-medium">{t.tanggal}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full ${
                      t.jenis === 'Pemasukan' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60' 
                        : 'bg-rose-100 text-rose-800 border border-rose-200/60'
                    }`}>
                      {t.kategori}
                    </span>
                  </td>
                  <td className="py-3 text-slate-800 font-medium max-w-sm truncate" title={t.keterangan}>
                    {t.keterangan}
                  </td>
                  <td className="py-3 text-slate-500">{t.inputOleh}</td>
                  <td className={`py-3 text-right font-semibold ${
                    t.jenis === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {t.jenis === 'Pemasukan' ? '+' : '-'} {formatIDR(t.jumlah)}
                  </td>
                  <td className="py-3 text-center pr-3 no-print">
                    <button
                      onClick={() => setSelectedTx(t)}
                      className="p-1.5 bg-white hover:bg-slate-100 text-violet-600 border border-slate-200 rounded-lg shadow-xs transition"
                      title="Lihat Detail & Bukti"
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                    Tidak ditemukan catatan transaksi yang sesuai filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200/80 p-6 relative rounded-3xl shadow-xl shadow-purple-900/10 geo-corner-decor">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X size={16} />
            </button>
            
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 mb-5 pb-2 border-b border-slate-100">
              Rincian Transaksi
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Transaksi</span>
                <span className="font-mono text-slate-700">{selectedTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal</span>
                <span className="text-slate-800 font-medium">{selectedTx.tanggal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jenis Aliran</span>
                <span className={`font-bold ${selectedTx.jenis === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {selectedTx.jenis}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori</span>
                <span className="text-slate-800 font-semibold uppercase">{selectedTx.kategori}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah Nominal</span>
                <span className="text-slate-900 font-bold font-display">{formatIDR(selectedTx.jumlah)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Admin Penginput</span>
                <span className="text-slate-700">{selectedTx.inputOleh}</span>
              </div>
              <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
                <span className="text-slate-500">Keterangan:</span>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 border border-slate-200 rounded-xl">
                  {selectedTx.keterangan}
                </p>
              </div>
              
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">Bukti Transaksi:</span>
                  {role === 'Bendahara' && (
                    <div className="flex gap-2">
                      <button onClick={() => openEditForm(selectedTx!)} className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[9px] uppercase tracking-wider font-bold rounded-lg transition">Edit</button>
                      <button onClick={() => handleDelete(selectedTx!.id)} className="px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[9px] uppercase tracking-wider font-bold rounded-lg transition">Hapus</button>
                    </div>
                  )}
                </div>
                
                {selectedTx.buktiTransaksi && selectedTx.buktiTransaksi !== "" ? (
                  <div className="w-full h-48 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden">
                    {selectedTx.buktiTransaksi.startsWith('http') ? (
                      <a href={selectedTx.buktiTransaksi} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-violet-600 hover:underline font-semibold">
                        <FileText size={14} /> Lihat Berkas di Google Drive
                      </a>
                    ) : (
                      <img
                        src={selectedTx.buktiTransaksi}
                        alt="Bukti Transaksi"
                        className="w-full h-full object-contain cursor-zoom-in"
                        onClick={() => window.open(selectedTx.buktiTransaksi, '_blank')}
                      />
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1">
                    <AlertCircle size={16} />
                    <span>Tidak ada bukti transaksi terunggah</span>
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={() => setSelectedTx(null)}
              className="mt-6 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-display text-[10px] font-bold uppercase tracking-wider transition rounded-xl"
            >
              Tutup Rincian
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media print { 
          @page { size: auto; margin: 0mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; text-shadow: none !important; color: black !important; }
          html, body, #root { width: auto !important; height: auto !important; overflow: visible !important; display: block !important; background: white !important; }
          body { padding: 15mm !important; box-sizing: border-box !important; }
          div, main, section { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; display: block !important; position: static !important; border: none !important; background: transparent !important; }
          
          .no-print, .hidden, aside, header, nav, button { display: none !important; }
          .print-show { display: block !important; }
          
          /* Tabel Normal & Rapi */
          table { width: 100% !important; border-collapse: collapse !important; page-break-inside: auto !important; font-size: 10pt !important; margin-bottom: 20px !important; border: 1px solid #000 !important; background: transparent !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; background: transparent !important; }
          thead { display: table-header-group !important; }
          th, td { padding: 6px !important; border: 1px solid #000 !important; text-align: left !important; background: transparent !important; }
          th { background-color: #e5e7eb !important; font-weight: bold !important; text-align: center !important; }
          
          .glass-panel { border: none !important; margin: 0 !important; padding: 0 !important; background: transparent !important; }
          .geo-border, .geo-corner-decor { border: none !important; }
          .geo-corner-decor::before, .geo-corner-decor::after { display: none !important; }
        }
      `}</style>
    </div>
  );
}
