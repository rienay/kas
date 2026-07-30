import React, { useState } from 'react';
import { Plus, Check, Clock, User, Calendar, X, AlertTriangle, Upload } from 'lucide-react';
import { UtangPiutang, UserRole } from '../types';

interface UtangPiutangProps {
  role: UserRole;
  utangPiutang: UtangPiutang[];
  onAddUtangPiutang: (data: Omit<UtangPiutang, 'id' | 'status'>) => Promise<void>;
  onBayarUtangPiutang: (id: string, tanggalLunas: string, nominalBayar: number, mode: 'Lunas' | 'Cicil', buktiTransaksi?: string) => Promise<void>;
}

export default function UtangPiutangComponent({ role, utangPiutang, onAddUtangPiutang, onBayarUtangPiutang }: UtangPiutangProps) {
  const [activeSubTab, setActiveSubTab] = useState<'Utang' | 'Piutang'>('Utang');
  const [statusFilter, setStatusFilter] = useState<'Belum Lunas' | 'Dicicil' | 'Lunas' | 'Semua'>('Belum Lunas');
  
  // State Form
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [nama, setNama] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // State Pelunasan Modal
  const [selectedPayItem, setSelectedPayItem] = useState<UtangPiutang | null>(null);
  const [payTanggal, setPayTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [payMode, setPayMode] = useState<'Lunas' | 'Cicil'>('Lunas');
  const [payNominal, setPayNominal] = useState('');
  const [buktiBase64, setBuktiBase64] = useState<string>('');
  const [payLoading, setPayLoading] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !jumlah || !keterangan) {
      setFormError('Mohon isi seluruh kolom wajib');
      return;
    }

    const nominal = parseFloat(jumlah);
    if (isNaN(nominal) || nominal <= 0) {
      setFormError('Nominal jumlah tidak valid');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      await onAddUtangPiutang({
        tanggal,
        tipe: activeSubTab,
        nama,
        jumlah: nominal,
        keterangan
      });

      // Reset
      setNama('');
      setJumlah('');
      setKeterangan('');
      setShowForm(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Gagal menambahkan catatan');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuktiBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLunasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayItem || !selectedPayItem.id) return;

    const nominalBayar = parseFloat(payNominal) || 0;
    if (payMode === 'Cicil' && (isNaN(nominalBayar) || nominalBayar <= 0)) {
      alert('Nominal cicilan tidak valid');
      return;
    }

    const itemId = selectedPayItem.id;
    setPayLoading(true);
    try {
      await onBayarUtangPiutang(itemId, payTanggal, nominalBayar, payMode, buktiBase64 || undefined);
      setSelectedPayItem(null);
      setBuktiBase64('');
      setPayNominal('');
      setPayMode('Lunas');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal memproses pelunasan');
    } finally {
      setPayLoading(false);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Filter Data
  const filteredData = utangPiutang.filter(item => {
    const matchTipe = item.tipe === activeSubTab;
    const matchStatus = statusFilter === 'Semua' || item.status === statusFilter;
    return matchTipe && matchStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800">
            Kewajiban & Tagihan
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Kelola utang organisasi kepada pihak eksternal, dan piutang/pinjaman yang harus ditagih.
          </p>
        </div>

        {role === 'Bendahara' && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              setFormError('');
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-xl transition shadow-md shadow-violet-500/20"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Batal Tambah' : `Tambah ${activeSubTab}`}
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex justify-between items-center border-b border-slate-200/80">
        <div className="flex space-x-1">
          {(['Utang', 'Piutang'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveSubTab(tab);
                setShowForm(false);
              }}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider relative transition-all ${
                activeSubTab === tab 
                  ? 'text-violet-700 border-b-2 border-b-violet-600 font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'Utang' ? 'Utang Kami (Kewajiban)' : 'Piutang Kami (Tagihan)'}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl text-xs">
          {(['Belum Lunas', 'Dicicil', 'Lunas', 'Semua'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition rounded-lg ${
                statusFilter === status 
                  ? 'bg-white text-violet-700 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Form Add (Only Bendahara) */}
      {showForm && role === 'Bendahara' && (
        <div className="glass-panel border-l-4 border-l-amber-500 p-6 relative rounded-3xl shadow-xs geo-corner-decor">
          <h2 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-amber-500" /> Catat {activeSubTab} Baru
          </h2>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium mb-4 rounded-xl">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tanggal */}
            <div className="space-y-1">
              <label htmlFor="up-date" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Tanggal Pencatatan *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Calendar size={14} />
                </span>
                <input
                  id="up-date"
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                />
              </div>
            </div>

            {/* Nama Pihak */}
            <div className="space-y-1">
              <label htmlFor="up-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                {activeSubTab === 'Utang' ? 'Nama Pemberi Utang *' : 'Nama Penerima Piutang *'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User size={14} />
                </span>
                <input
                  id="up-name"
                  type="text"
                  required
                  placeholder="Contoh: Toko Buku, Kak Anto"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                />
              </div>
            </div>

            {/* Jumlah Nominal */}
            <div className="space-y-1">
              <label htmlFor="up-amount" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Jumlah Nominal (IDR) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs font-bold font-display">
                  Rp
                </span>
                <input
                  id="up-amount"
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 350000"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                />
              </div>
            </div>

            {/* Keterangan */}
            <div className="space-y-1 md:col-span-2">
              <label htmlFor="up-desc" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Keterangan Keperluan *
              </label>
              <textarea
                id="up-desc"
                required
                rows={2}
                placeholder="Rincian peruntukan utang atau status piutang..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white font-sans rounded-xl"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <button
                type="submit"
                id="submit-up"
                disabled={loading}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display text-[10px] font-bold uppercase tracking-widest transition disabled:opacity-50 flex items-center gap-2 rounded-xl shadow-md shadow-violet-500/20"
              >
                {loading ? 'Menyimpan...' : 'Simpan Catatan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List Table */}
      <div className="glass-panel p-5 rounded-3xl shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-3">Tanggal</th>
                <th className="pb-3">{activeSubTab === 'Utang' ? 'Pemberi Utang' : 'Penerima Piutang'}</th>
                <th className="pb-3">Keterangan</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Jumlah</th>
                {role === 'Bendahara' && <th className="pb-3 text-center pr-3">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={item.id || idx} className="border-b border-slate-100 hover:bg-violet-50/40 transition">
                  <td className="py-3 pl-3 text-slate-500 font-medium">{item.tanggal}</td>
                  <td className="py-3 text-slate-800 font-semibold">{item.nama}</td>
                  <td className="py-3 text-slate-600 font-sans max-w-sm truncate" title={item.keterangan}>
                    {item.keterangan}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${
                      item.status === 'Lunas'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                        : 'bg-amber-100 text-amber-800 border border-amber-200/60 animate-pulse'
                    }`}>
                      {item.status === 'Lunas' ? <Check size={10} /> : <Clock size={10} />}
                      {item.status}
                    </span>
                  </td>
                  <td className={`py-3 text-right font-semibold font-display ${
                    activeSubTab === 'Utang' ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    <div className="font-semibold text-slate-800">{formatIDR(item.jumlah)}</div>
                    <div className={`text-[10px] mt-0.5 ${activeSubTab === 'Utang' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      Sisa: {formatIDR(item.jumlah - (item.jumlahTerbayar || 0))}
                    </div>
                  </td>
                  
                  {role === 'Bendahara' && (
                    <td className="py-2 text-center pr-3">
                      {item.status !== 'Lunas' ? (
                        <button
                          onClick={() => { setSelectedPayItem(item); setPayMode('Lunas'); setPayNominal(''); setPayTanggal(new Date().toISOString().split('T')[0]); setBuktiBase64(''); }}
                          className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[9px] font-bold uppercase tracking-wider rounded-xl transition shadow-xs"
                        >
                          Bayar / Cicil
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          Selesai ({item.tanggalLunas})
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={role === 'Bendahara' ? 6 : 5} className="py-8 text-center text-slate-400 italic">
                    Tidak ada catatan {activeSubTab.toLowerCase()} yang sesuai filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repayment Modal with Receipt Upload */}
      {selectedPayItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200/80 p-6 relative rounded-3xl shadow-xl shadow-purple-900/10 geo-corner-decor">
            <button
              onClick={() => { setSelectedPayItem(null); setBuktiBase64(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <X size={16} />
            </button>
            
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} /> Konfirmasi Pelunasan
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Anda akan menandai {selectedPayItem.tipe.toLowerCase()} a.n <strong>{selectedPayItem.nama}</strong> sejumlah <strong>{formatIDR(selectedPayItem.jumlah)}</strong> sebagai <strong>LUNAS</strong>. Tindakan ini akan secara otomatis menambahkan entri baru di modul Transaksi Utama.
            </p>

            <form onSubmit={handleLunasSubmit} className="space-y-4">
              {/* Tanggal Pelunasan */}
              <div className="space-y-1">
                <label htmlFor="pay-date" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Tanggal Pelunasan *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Calendar size={14} />
                  </span>
                  <input
                    id="pay-date"
                    type="date"
                    required
                    value={payTanggal}
                    onChange={(e) => setPayTanggal(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                  />
                </div>
              </div>

              {/* Upload Receipt */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Unggah Bukti Pelunasan (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => { setSelectedPayItem(null); setBuktiBase64(''); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-display text-[10px] font-bold uppercase tracking-wider rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-display text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md shadow-emerald-500/20 transition"
                >
                  {payLoading ? 'Memproses...' : 'Proses Pelunasan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
