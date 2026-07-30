import React, { useState, useEffect } from 'react';
import { Search, Calendar, CreditCard, Printer, Download } from 'lucide-react';
import { KasAnggota, UserRole } from '../types';

interface KasAnggotaProps {
  role: UserRole;
  kasAnggota: KasAnggota[];
  onAddAnggota: (nama: string, tahunMasuk: string | number, jabatan: string) => Promise<void>;
  onUpdateKasAnggota: (nama: string, tahun: number, bulan: string, jumlah: number, tanggalBayar: string, metodeBayar: 'Transfer' | 'Offline') => Promise<void>;
  onUpdateStatusAnggota: (nama: string, tahunMasuk: number, status: 'Aktif' | 'Tidak Aktif') => Promise<void>;
  onAddTransaksi?: (txData: { tanggal: string; jenis: 'Pemasukan' | 'Pengeluaran'; kategori: string; jumlah: number; keterangan: string }) => Promise<void>;
}

export default function KasAnggotaComponent({ role, kasAnggota, onAddAnggota, onUpdateKasAnggota, onUpdateStatusAnggota, onAddTransaksi }: KasAnggotaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  const [manualYears, setManualYears] = useState<number[]>([]);
  
  // State Input Bayar Kas
  const [selectedPayUser, setSelectedPayUser] = useState<{ nama: string; bulan: string } | null>(null);
  const [bayarJumlah, setBayarJumlah] = useState('10000'); // Default nominal iuran bulanan
  const [bayarTanggal, setBayarTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [bayarMetode, setBayarMetode] = useState<'Transfer' | 'Offline'>('Offline');

  // State Add Anggota
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newJabatan, setNewJabatan] = useState('');
  const [newTahun, setNewTahun] = useState(selectedTahun.toString());
  const [loading, setLoading] = useState(false);

  // State & Interface Iuran Kebutuhan (Non-Rutin)
  interface DetailPembayaranIuran {
    nominalBayar: number;
    tanggalBayar: string;
    keterangan: string;
    statusBayar: 'Lunas' | 'Dicicil' | 'Belum Bayar';
  }

  interface IuranKebutuhan {
    id: string;
    nama: string;
    tanggal: string;
    nominalDefault: number;
    pembayaran: Record<string, DetailPembayaranIuran>;
    status: 'Proses' | 'Selesai';
    uangDipakai?: number;
    opsiKas?: 'Masuk Kas' | 'Nambah Dari Kas' | 'Tanggung Sendiri';
    selisih?: number;
  }

  const [iuranKebutuhanList, setIuranKebutuhanList] = useState<IuranKebutuhan[]>(() => {
    const saved = localStorage.getItem('kas_dkc_iuran_kebutuhan');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((iuran: any) => {
        const migratedPembayaran: Record<string, DetailPembayaranIuran> = {};
        Object.keys(iuran.pembayaran || {}).forEach(name => {
          const val = iuran.pembayaran[name];
          if (typeof val === 'number') {
            migratedPembayaran[name] = {
              nominalBayar: val,
              tanggalBayar: '',
              keterangan: '',
              statusBayar: val >= iuran.nominalDefault ? 'Lunas' : val > 0 ? 'Dicicil' : 'Belum Bayar'
            };
          } else {
            migratedPembayaran[name] = val;
          }
        });
        return {
          ...iuran,
          pembayaran: migratedPembayaran
        };
      });
    } catch {
      return [];
    }
  });

  const [showNewIuranForm, setShowNewIuranForm] = useState(false);
  const [newIuranNama, setNewIuranNama] = useState('');
  const [newIuranNominalDefault, setNewIuranNominalDefault] = useState('50000');

  // State untuk menyelesaikan iuran
  const [finishingIuranId, setFinishingIuranId] = useState<string | null>(null);
  const [uangDipakaiInput, setUangDipakaiInput] = useState('');
  const [opsiKekurangan, setOpsiKekurangan] = useState<'Nambah Dari Kas' | 'Tanggung Sendiri'>('Nambah Dari Kas');

  // State untuk mengedit pembayaran anggota di iuran tertentu
  const [editingMemberPay, setEditingMemberPay] = useState<{
    iuranId: string;
    memberNama: string;
  } | null>(null);

  const [editNominalInput, setEditNominalInput] = useState('');
  const [editTanggalInput, setEditTanggalInput] = useState('');
  const [editKeteranganInput, setEditKeteranganInput] = useState('');
  const [editStatusInput, setEditStatusInput] = useState<'Lunas' | 'Dicicil' | 'Belum Bayar'>('Belum Bayar');

  // Menyimpan data iuran ke localStorage ketika berubah
  useEffect(() => {
    localStorage.setItem('kas_dkc_iuran_kebutuhan', JSON.stringify(iuranKebutuhanList));
  }, [iuranKebutuhanList]);

  // Pre-populate input di modal edit
  useEffect(() => {
    if (editingMemberPay) {
      const iuran = iuranKebutuhanList.find(i => i.id === editingMemberPay.iuranId);
      if (iuran) {
        const detail = iuran.pembayaran[editingMemberPay.memberNama] || {
          nominalBayar: 0,
          tanggalBayar: new Date().toISOString().split('T')[0],
          keterangan: '',
          statusBayar: 'Belum Bayar'
        };
        setEditNominalInput(detail.nominalBayar.toString());
        setEditTanggalInput(detail.tanggalBayar || new Date().toISOString().split('T')[0]);
        setEditKeteranganInput(detail.keterangan || '');
        setEditStatusInput(detail.statusBayar || 'Belum Bayar');
      }
    }
  }, [editingMemberPay]);

  const handleNominalChangeInEdit = (val: string, targetNominal: number) => {
    setEditNominalInput(val);
    const nominal = parseFloat(val) || 0;
    if (nominal === 0) {
      setEditStatusInput('Belum Bayar');
    } else if (nominal < targetNominal) {
      setEditStatusInput('Dicicil');
    } else {
      setEditStatusInput('Lunas');
    }
  };

  const handleCreateIuran = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIuranNama) return;

    const nominalDefaultVal = parseFloat(newIuranNominalDefault) || 0;
    const activeAnggotas = kasAnggota.filter(a => a.statusAktif !== 'Tidak Aktif');
    
    const pembayaranAwal: Record<string, DetailPembayaranIuran> = {};
    activeAnggotas.forEach(a => {
      pembayaranAwal[a.nama] = {
        nominalBayar: 0,
        tanggalBayar: '',
        keterangan: '',
        statusBayar: 'Belum Bayar'
      };
    });

    const newIuran: IuranKebutuhan = {
      id: 'iuran_' + Date.now(),
      nama: newIuranNama,
      tanggal: new Date().toISOString().split('T')[0],
      nominalDefault: nominalDefaultVal,
      pembayaran: pembayaranAwal,
      status: 'Proses'
    };

    setIuranKebutuhanList(prev => [newIuran, ...prev]);
    setNewIuranNama('');
    setNewIuranNominalDefault('50000');
    setShowNewIuranForm(false);
  };

  const handleSaveMemberPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberPay) return;

    const nominal = parseFloat(editNominalInput) || 0;
    
    setIuranKebutuhanList(prev => prev.map(iuran => {
      if (iuran.id === editingMemberPay.iuranId) {
        return {
          ...iuran,
          pembayaran: {
            ...iuran.pembayaran,
            [editingMemberPay.memberNama]: {
              nominalBayar: nominal,
              tanggalBayar: editTanggalInput,
              keterangan: editKeteranganInput,
              statusBayar: editStatusInput
            }
          }
        };
      }
      return iuran;
    }));

    setEditingMemberPay(null);
  };

  const handleCompleteIuranSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishingIuranId) return;

    const iuran = iuranKebutuhanList.find(i => i.id === finishingIuranId);
    if (!iuran) return;

    const totalTerkumpul = Object.values(iuran.pembayaran).reduce((sum, v) => sum + (v.nominalBayar || 0), 0);
    const uangTerpakai = parseFloat(uangDipakaiInput) || 0;
    const selisih = totalTerkumpul - uangTerpakai;

    let opsiKas: 'Masuk Kas' | 'Nambah Dari Kas' | 'Tanggung Sendiri' = 'Tanggung Sendiri';
    
    if (selisih > 0) {
      opsiKas = 'Masuk Kas';
      if (onAddTransaksi) {
        try {
          await onAddTransaksi({
            tanggal: new Date().toISOString().split('T')[0],
            jenis: 'Pemasukan',
            kategori: 'Lain-lain',
            jumlah: selisih,
            keterangan: `Sisa dana iuran: ${iuran.nama}`
          });
        } catch (err) {
          alert('Gagal mencatat transaksi sisa kas: ' + (err instanceof Error ? err.message : String(err)));
        }
      }
    } else if (selisih < 0) {
      opsiKas = opsiKekurangan;
      if (opsiKekurangan === 'Nambah Dari Kas' && onAddTransaksi) {
        try {
          await onAddTransaksi({
            tanggal: new Date().toISOString().split('T')[0],
            jenis: 'Pengeluaran',
            kategori: 'Lain-lain',
            jumlah: Math.abs(selisih),
            keterangan: `Kekurangan dana iuran: ${iuran.nama}`
          });
        } catch (err) {
          alert('Gagal mencatat transaksi kekurangan kas: ' + (err instanceof Error ? err.message : String(err)));
        }
      }
    }

    setIuranKebutuhanList(prev => prev.map(i => {
      if (i.id === finishingIuranId) {
        return {
          ...i,
          status: 'Selesai',
          uangDipakai: uangTerpakai,
          opsiKas,
          selisih
        };
      }
      return i;
    }));

    setFinishingIuranId(null);
    setUangDipakaiInput('');
  };

  const handleDeleteIuran = (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan iuran kebutuhan ini?')) {
      setIuranKebutuhanList(prev => prev.filter(i => i.id !== id));
    }
  };

  // Sinkronisasi form tambah anggota dengan tahun yang sedang dibuka
  useEffect(() => {
    setNewTahun(selectedTahun.toString());
  }, [selectedTahun]);

  const BULAN_LIST = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`; // DD/MM/YY
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayUser) return;

    const nominal = parseFloat(bayarJumlah);
    if (isNaN(nominal) || nominal <= 0) {
      alert('Jumlah pembayaran tidak valid');
      return;
    }

    setLoading(true);
    try {
      await onUpdateKasAnggota(
        selectedPayUser.nama,
        selectedTahun,
        selectedPayUser.bulan,
        nominal,
        bayarTanggal,
        bayarMetode
      );
      setSelectedPayUser(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal mencatat kas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnggotaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama || !newJabatan || !newTahun) return;
    setLoading(true);
    try {
      await onAddAnggota(newNama, newTahun, newJabatan);
      setShowAddForm(false);
      setNewNama('');
      setNewJabatan('');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menambahkan anggota');
    } finally { setLoading(false); }
  };

  const JABATAN_ORDER = [
    'Ketua',
    'Wakil Ketua',
    'Sekretaris 1',
    'Sekretaris', // fallback
    'Sekretaris 2',
    'Bendahara',
    'Kabid Kajian Kepramukaan',
    'Anggota Kajian Kepramukaan 1',
    'Anggota Kajian Kepramukaan 2',
    'Anggota Kajian Kepramukaan', // fallback
    'Kabid Giat',
    'Anggota Giat',
    'Kabid Penelitian dan Evaluasi',
    'Anggota Penelitian dan Evaluasi',
    'Kabid Pembinaan dan Pengembangan',
    'Anggota Pembinaan dan Pengembangan'
  ];

  // Filter data berdasarkan pencarian nama dan urutkan berdasarkan jabatan
  const filteredAnggota = kasAnggota
    .filter(anggota =>
      anggota.nama.toLowerCase().includes(searchTerm.toLowerCase()) &&
      String(anggota.tahunMasuk || new Date().getFullYear()) === String(selectedTahun)
    )
    .sort((a, b) => {
      // 1. Urutkan berdasarkan status keaktifan (aktif di atas, tidak aktif di paling bawah)
      const isAktifA = a.statusAktif !== 'Tidak Aktif';
      const isAktifB = b.statusAktif !== 'Tidak Aktif';
      
      if (isAktifA !== isAktifB) {
        return isAktifA ? -1 : 1;
      }
      
      // 2. Jika status keaktifan sama, urutkan berdasarkan prioritas jabatan
      const jabA = (a.jabatan || '').toLowerCase().trim();
      const jabB = (b.jabatan || '').toLowerCase().trim();
      
      const idxA = JABATAN_ORDER.findIndex(j => j.toLowerCase() === jabA);
      const idxB = JABATAN_ORDER.findIndex(j => j.toLowerCase() === jabB);
      
      const valA = idxA === -1 ? 999 : idxA;
      const valB = idxB === -1 ? 999 : idxB;
      
      if (valA !== valB) return valA - valB;
      
      // 3. Jika jabatan juga sama, urutkan berdasarkan abjad nama
      return a.nama.localeCompare(b.nama);
    });

  // Ekstrak daftar tahun tersedia dari database (ditambah tahun saat ini dan tahun terpilih)
  const currentYear = new Date().getFullYear();
  const yearsSet = new Set<number>([currentYear, selectedTahun, ...manualYears]);
  kasAnggota.forEach(anggota => {
    Object.keys(anggota.pembayaran).forEach(y => yearsSet.add(Number(y)));
    if (anggota.tahunMasuk) yearsSet.add(Number(anggota.tahunMasuk));
  });
  const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

  // Fungsi Tambah Tahun Buku Manual
  const handleAddTahun = () => {
    const input = window.prompt('Masukkan Tahun Buku baru (Contoh: 2024):', '');
    if (input) {
      const year = parseInt(input);
      if (!isNaN(year) && year > 2000 && year < 2100) {
        setSelectedTahun(year);
        setManualYears(prev => Array.from(new Set([...prev, year])));
      }
      else alert('Format tahun tidak valid!');
    }
  };

  // Ekspor CSV
  const handleExportCSV = () => {
    const rows: string[] = [];
    rows.push(`Nama Anggota,Jabatan,${BULAN_LIST.join(',')},Total Terbayar,Tunggakan`);
    filteredAnggota.forEach(anggota => {
      const rowData = [ `"${anggota.nama}"`, `"${anggota.jabatan}"` ];
      let totalPaid = 0;
      BULAN_LIST.forEach(bulan => {
         const pay = anggota.pembayaran[selectedTahun]?.[bulan];
         rowData.push(pay ? pay.jumlah.toString() : '0');
         if (pay) totalPaid += pay.jumlah;
      });
      const totalUnpaid = (12 * anggota.janjiBayarPerBulan) - totalPaid;
      rowData.push(totalPaid.toString(), totalUnpaid > 0 ? totalUnpaid.toString() : '0');
      rows.push(rowData.join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = `Matriks_Kas_Anggota_${selectedTahun}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print-area font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800">
            Kas Rutin Anggota
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Matriks pemantauan iuran wajib bulanan seluruh pengurus Dewan Kerja Cabang Cilacap.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-xl transition shadow-xs">
            <Download size={14} className="text-emerald-600" /> CSV / Excel
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 rounded-xl transition shadow-xs">
            <Printer size={14} className="text-slate-500" /> Print
          </button>
        </div>
      </div>

      {/* Print Layout */}
      <div className="hidden print-show mb-6 text-slate-900">
        <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5 mb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">Matriks Kas Rutin Anggota</h2>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Tahun Buku {selectedTahun} - Dewan Kerja Cabang Cilacap</h3>
          <p className="text-xs">Periode: Tahun {selectedTahun}</p>
        </div>

        <table className="w-full text-left border-collapse text-xs mt-4 print-ledger-table" style={{ pageBreakInside: 'auto' }}>
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase">
              <th className="py-2 pr-2">No</th>
              <th className="py-2 px-2">Nama Anggota</th>
              <th className="py-2 px-2">Jabatan</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2 text-right">Total Terbayar</th>
              <th className="py-2 px-2 text-right">Tunggakan</th>
            </tr>
          </thead>
          {filteredAnggota.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="py-4 text-center italic">Anggota tidak ditemukan</td>
              </tr>
            </tbody>
          ) : (
            <tbody>
              {filteredAnggota.map((anggota, idx) => {
                const totalPaid = Object.values(anggota.pembayaran[selectedTahun] || {}).reduce((sum, month) => sum + month.jumlah, 0);
                const totalUnpaid = (12 * anggota.janjiBayarPerBulan) - totalPaid;
                const isAktif = anggota.statusAktif !== 'Tidak Aktif';
                return (
                  <tr key={anggota.nama || idx} className="border-b border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                    <td className="py-2 pr-2">{idx + 1}</td>
                    <td className="py-2 px-2">{anggota.nama}</td>
                    <td className="py-2 px-2">{anggota.jabatan}</td>
                    <td className="py-2 px-2">{isAktif ? 'Aktif' : 'Tidak Aktif'}</td>
                    <td className="py-2 px-2 text-right">{formatIDR(totalPaid)}</td>
                    <td className="py-2 px-2 text-right">{formatIDR(totalUnpaid > 0 ? totalUnpaid : 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          )}
        </table>
        <p className="text-[10px] text-slate-500 italic mt-4 text-right">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Control Panel */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-4 flex flex-col md:flex-row gap-4 no-print rounded-2xl shadow-xs">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Cari nama anggota pengurus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl font-sans"
          />
        </div>

        {/* Tahun Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tahun Buku:</span>
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
            className="bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none rounded-xl shadow-xs"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {role === 'Bendahara' && (
            <button onClick={handleAddTahun} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider transition rounded-xl">
              + Tahun Baru
            </button>
          )}
        </div>
      </div>

      {/* Dues Matrix Table (Desktop & Scrollable) */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-5 no-print rounded-3xl shadow-xs">
        <div className="flex justify-between items-center mb-4 no-print">
          <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Calendar size={14} className="text-violet-600" /> Matriks Pembayaran Tahun {selectedTahun}
          </h2>
          {role === 'Bendahara' && (
            <button onClick={() => setShowAddForm(!showAddForm)} className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-bold uppercase tracking-wider transition rounded-xl shadow-xs">
              {showAddForm ? 'Batal Tambah' : '+ Tambah Anggota'}
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-3 font-display text-xs">Nama Anggota</th>
                {BULAN_LIST.map(b => (
                  <th key={b} className="pb-3 text-center min-w-[70px]">{b.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAnggota.map((anggota, idx) => {
                const isAktif = anggota.statusAktif !== 'Tidak Aktif';
                const totalPaid = Object.values(anggota.pembayaran[selectedTahun] || {}).reduce((sum, month) => sum + month.jumlah, 0);
                const totalUnpaid = (12 * anggota.janjiBayarPerBulan) - totalPaid;

                return (
                  <tr key={anggota.nama || idx} className={`border-b border-slate-100 hover:bg-violet-50/40 transition-colors ${!isAktif ? 'opacity-50 grayscale' : ''}`}>
                  <td className="py-3 pl-3 pr-2">
                    <div className="font-semibold text-slate-800">{anggota.nama}</div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5 mb-1.5">{anggota.jabatan}</div>
                    {role === 'Bendahara' ? (
                      <select
                        value={anggota.statusAktif || 'Aktif'}
                        onChange={(e) => {
                          if(window.confirm(`Yakin mengubah status ${anggota.nama} menjadi ${e.target.value}?`)) {
                            onUpdateStatusAnggota(anggota.nama, Number(anggota.tahunMasuk || selectedTahun), e.target.value as 'Aktif' | 'Tidak Aktif').catch(err => alert(err instanceof Error ? err.message : 'Error'));
                          }
                        }}
                        className={`text-[9px] font-bold uppercase tracking-wider bg-white border ${isAktif ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700'} px-1.5 py-0.5 rounded-lg outline-none focus:border-violet-500 cursor-pointer w-auto shadow-xs`}
                      >
                        <option value="Aktif">Aktif</option>
                        <option value="Tidak Aktif">Tidak Aktif</option>
                      </select>
                    ) : (
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-lg ${isAktif ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                        {anggota.statusAktif || 'Aktif'}
                      </span>
                    )}
                  </td>
                    
                    {BULAN_LIST.map(bulan => {
                      const dataBulan = anggota.pembayaran[selectedTahun]?.[bulan] || {
                        jumlah: 0,
                        status: 'Belum Bayar',
                        tanggalBayar: ''
                      };

                      let bgClass = 'bg-slate-100/80 text-slate-500 border-slate-200/80';
                      if (!isAktif && dataBulan.status === 'Belum Bayar') {
                        bgClass = 'bg-slate-100/40 text-slate-300 border-slate-200/40 opacity-40';
                      } else if (dataBulan.status === 'Lunas') {
                        bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                      } else if (dataBulan.status === 'Dicicil') {
                        bgClass = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                      }

                      return (
                        <td key={bulan} className="py-2.5 px-1 text-center align-middle">
                          {role === 'Bendahara' ? (
                            <button
                              onClick={() => isAktif && setSelectedPayUser({ nama: anggota.nama, bulan })}
                              disabled={!isAktif}
                              className={`w-full py-1.5 border text-[9px] font-bold uppercase tracking-wider rounded-xl transition flex flex-col items-center justify-center gap-0.5 ${bgClass} ${isAktif ? 'hover:scale-105 hover:shadow-xs cursor-pointer' : 'cursor-not-allowed'}`}
                              title={!isAktif ? 'Anggota sudah tidak aktif' : `Klik untuk catat iuran - Status: ${dataBulan.status} (${formatIDR(dataBulan.jumlah)})`}
                            >
                              <span className="text-[10px] font-mono">{formatIDR(dataBulan.jumlah)}</span>
                              <span className="text-[8px]">{!isAktif && dataBulan.status === 'Belum Bayar' ? '-' : dataBulan.status}</span>
                              {dataBulan.tanggalBayar && dataBulan.status !== 'Belum Bayar' && (
                                <span className="text-[7px] font-normal tracking-normal opacity-90">{formatDateShort(dataBulan.tanggalBayar)}</span>
                              )}
                            </button>
                          ) : (
                            <div className={`py-1.5 px-0.5 border text-[9px] font-bold uppercase tracking-wider rounded-xl flex flex-col items-center justify-center gap-0.5 ${bgClass}`}>
                              <span>{!isAktif && dataBulan.status === 'Belum Bayar' ? '-' : dataBulan.status === 'Lunas' ? 'Lunas' : dataBulan.status === 'Dicicil' ? 'Cicil' : '-'}</span>
                              {dataBulan.tanggalBayar && dataBulan.status !== 'Belum Bayar' && (
                                <span className="text-[7px] font-normal tracking-normal opacity-90">{formatDateShort(dataBulan.tanggalBayar)}</span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2.5 px-2 text-right">
                      <div className="text-emerald-700 font-bold">{formatIDR(totalPaid)}</div>
                      <div className="text-rose-600 font-semibold">{formatIDR(totalUnpaid > 0 ? totalUnpaid : 0)}</div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredAnggota.length === 0 && (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 italic">
                    Anggota tidak ditemukan
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td className="pt-3 pl-3 font-bold text-slate-700 uppercase tracking-wider">Total Kas Terkumpul</td>
                <td colSpan={12}></td>
                <td className="pt-3 pr-2 text-right font-bold text-lg text-violet-700">
                  {formatIDR(filteredAnggota.reduce((total, anggota) => total + Object.values(anggota.pembayaran[selectedTahun] || {}).reduce((sum, month) => sum + month.jumlah, 0), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-slate-500 border-t border-slate-100 pt-4 no-print">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded-sm inline-block"></span>
            <span>Lunas (Minimal Rp 10.000)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-amber-50 border border-amber-200 rounded-sm inline-block"></span>
            <span>Dicicil (Kurang dari Rp 10.000)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-100 border border-slate-200 rounded-sm inline-block"></span>
            <span>Belum Bayar (Belum ada dana masuk)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-slate-100 border border-slate-200 rounded-sm inline-block opacity-40"></span>
            <span>Tidak Aktif</span>
          </div>
          {role === 'Bendahara' && (
            <div className="text-violet-600 font-semibold ml-auto">
              *Klik sel bulan untuk menginput pembayaran anggota.
            </div>
          )}
        </div>
      </div>

      {/* Mobile view Helper (Jika dibuka di HP) */}
      <div className="block lg:hidden glass-panel geo-border p-5 no-print">
        <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Ringkasan Status Tunggakan Pengurus
        </h2>
        <div className="space-y-3">
          {filteredAnggota.slice(0, 3).map((anggota, idx) => {
            // Hitung berapa bulan yang belum lunas di tahun terpilih
            const monthsUnpaid = BULAN_LIST.filter(b => {
              const pay = anggota.pembayaran[selectedTahun]?.[b];
              return !pay || pay.status !== 'Lunas';
            }).length;

            return (
              <div key={idx} className={`flex justify-between items-center py-2 border-b border-slate-900 text-xs ${anggota.statusAktif === 'Tidak Aktif' ? 'opacity-50' : ''}`}>
                <span className="font-semibold text-slate-300">{anggota.nama}</span>
                <span className={monthsUnpaid > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                  {monthsUnpaid > 0 ? `${monthsUnpaid} bulan belum lunas` : 'Lunas semua bulan'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Add Anggota */}
      {showAddForm && role === 'Bendahara' && (
        <div className="bg-white border-l-4 border-l-emerald-500 border border-slate-200 p-5 mb-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">Daftarkan Anggota Baru</h3>
          <form onSubmit={handleAddAnggotaSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" required placeholder="Nama Anggota" value={newNama} onChange={e => setNewNama(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-800 px-3 py-2 text-xs rounded-xl focus:bg-white focus:outline-none focus:border-violet-400" />
            <select required value={newJabatan} onChange={e => setNewJabatan(e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-violet-400 rounded-xl">
              <option value="" disabled>-- Pilih Jabatan --</option>
              <option value="Ketua">Ketua</option>
              <option value="Wakil Ketua">Wakil Ketua</option>
              <option value="Sekretaris 1">Sekretaris 1</option>
              <option value="Sekretaris 2">Sekretaris 2</option>
              <option value="Bendahara">Bendahara</option>
              <option value="Kabid Kajian Kepramukaan">Kabid Kajian Kepramukaan</option>
              <option value="Anggota Kajian Kepramukaan 1">Anggota Kajian Kepramukaan 1</option>
              <option value="Anggota Kajian Kepramukaan 2">Anggota Kajian Kepramukaan 2</option>
              <option value="Kabid Giat">Kabid Giat</option>
              <option value="Anggota Giat">Anggota Giat</option>
              <option value="Kabid Penelitian dan Evaluasi">Kabid Penelitian dan Evaluasi</option>
              <option value="Anggota Penelitian dan Evaluasi">Anggota Penelitian dan Evaluasi</option>
              <option value="Kabid Pembinaan dan Pengembangan">Kabid Pembinaan dan Pengembangan</option>
              <option value="Anggota Pembinaan dan Pengembangan">Anggota Pembinaan dan Pengembangan</option>
            </select>
            <input type="number" required placeholder="Tahun Kepengurusan" value={newTahun} disabled title="Sesuai dengan tahun buku yang sedang dibuka" className="bg-slate-100 border border-slate-200 text-slate-500 px-3 py-2 text-xs opacity-60 cursor-not-allowed rounded-xl" />
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider py-2 rounded-xl shadow-xs transition">{loading ? '...' : 'Simpan'}</button>
          </form>
        </div>
      )}

      {/* Input Dues Payment Modal (Bendahara Only) */}
      {selectedPayUser && role === 'Bendahara' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm bg-white border border-slate-200 p-6 relative rounded-3xl shadow-xl shadow-purple-900/10">
            <button
              onClick={() => setSelectedPayUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              <span className="text-sm">✕</span>
            </button>
            
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-1.5">
              <CreditCard className="text-violet-600" size={16} /> Entri Pembayaran Iuran
            </h3>

            <div className="mb-4 text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Nama Pengurus</span>
                <span className="font-semibold text-slate-800">{selectedPayUser.nama}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Bulan & Tahun</span>
                <span className="font-semibold text-slate-800">{selectedPayUser.bulan} {selectedTahun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Saat Ini</span>
                <span className="text-amber-600 font-bold">
                  {formatIDR(kasAnggota.find(a => a.nama === selectedPayUser.nama)?.pembayaran[selectedTahun]?.[selectedPayUser.bulan]?.jumlah || 0)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="pay-amount" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Jumlah Pembayaran Baru (IDR) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold font-display text-xs">
                    Rp
                  </span>
                  <input
                    id="pay-amount"
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 10000"
                    value={bayarJumlah}
                    onChange={(e) => setBayarJumlah(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                  />
                </div>
                <p className="text-[9px] text-slate-500">
                  *Nominal iuran standar pengurus: <strong>Rp 10.000 / bulan</strong>.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="pay-method" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Metode Pembayaran *
                </label>
                <select
                  id="pay-method"
                  required
                  value={bayarMetode}
                  onChange={(e) => setBayarMetode(e.target.value as 'Transfer' | 'Offline')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-violet-400 focus:bg-white rounded-xl"
                >
                  <option value="Offline">Offline (Uang Tunai)</option>
                  <option value="Transfer">Transfer</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-display text-[10px] font-bold uppercase tracking-wider rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-display text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 rounded-xl shadow-xs"
                >
                  {loading ? 'Menyimpan...' : 'Catat Kas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* SECTION: IURAN KEBUTUHAN */}
      {/* ========================================================================= */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 p-5 mt-6 no-print rounded-3xl shadow-xs">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-slate-700">
              Iuran Kebutuhan Organisasi (Non-Rutin)
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Pencatatan iuran di luar uang kas wajib bulanan, seperti kaos, makan-makan, ATK kegiatan, dll.
            </p>
          </div>
          {role === 'Bendahara' && (
            <button
              onClick={() => setShowNewIuranForm(!showNewIuranForm)}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider transition"
            >
              {showNewIuranForm ? 'Batal' : '+ Buat Iuran Baru'}
            </button>
          )}
        </div>

        {/* Form Pembuatan Iuran Baru */}
        {showNewIuranForm && role === 'Bendahara' && (
          <div className="bg-slate-900/60 border border-slate-800 p-4 mb-5 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Inisialisasi Iuran Baru</h4>
            <form onSubmit={handleCreateIuran} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-bold text-slate-400">Nama Keperluan / Kegiatan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli Kaos Organisasi"
                  value={newIuranNama}
                  onChange={e => setNewIuranNama(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[9px] uppercase font-bold text-slate-400">Nominal Default (IDR)</label>
                <input
                  type="number"
                  placeholder="Contoh: 50000"
                  value={newIuranNominalDefault}
                  onChange={e => setNewIuranNominalDefault(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider py-2"
                >
                  Buat Daftar Iuran
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Daftar Iuran Kebutuhan */}
        <div className="space-y-5">
          {iuranKebutuhanList.map((iuran) => {
            const totalTerkumpul = Object.values(iuran.pembayaran).reduce((sum, v) => sum + (v.nominalBayar || 0), 0);
            const isCompleted = iuran.status === 'Selesai';

            return (
              <div key={iuran.id} className="border border-slate-900 p-4 bg-slate-950/40">
                {/* Header Iuran */}
                <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-900 pb-3 mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      {iuran.nama}
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                        isCompleted ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' : 'bg-amber-950/40 text-amber-400 border border-amber-500/20'
                      }`}>
                        {iuran.status === 'Selesai' ? 'Selesai' : 'Sedang Berjalan'}
                      </span>
                    </h3>
                    <span className="text-[9px] text-slate-500">Tanggal Mulai: {iuran.tanggal} | Target per Orang: {formatIDR(iuran.nominalDefault)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="block text-[8px] font-bold uppercase tracking-widest text-slate-500">Uang Terkumpul</span>
                      <span className="text-xs font-mono font-bold text-sky-400">{formatIDR(totalTerkumpul)}</span>
                    </div>
                    {role === 'Bendahara' && (
                      <button
                        onClick={() => handleDeleteIuran(iuran.id)}
                        className="p-1 hover:bg-rose-950/30 text-rose-500 text-[10px] font-semibold border border-rose-950/50 uppercase transition"
                        title="Hapus Catatan"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabel Nama, Status, Nominal, Tanggal, Keterangan & Aksi */}
                <div className="max-h-80 overflow-y-auto border border-slate-900/60 mb-4">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-2 pl-3">Nama Anggota</th>
                        <th className="p-2">Status</th>
                        <th className="p-2 text-right">Nominal Bayar</th>
                        <th className="p-2">Tanggal Bayar</th>
                        <th className="p-2">Keterangan</th>
                        {role === 'Bendahara' && <th className="p-2 text-center w-[80px]">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAnggota
                        .filter(a => a.statusAktif !== 'Tidak Aktif')
                        .map((anggota) => {
                          const paymentDetail = iuran.pembayaran[anggota.nama] || {
                            nominalBayar: 0,
                            tanggalBayar: '',
                            keterangan: '',
                            statusBayar: 'Belum Bayar'
                          };
                          const status = paymentDetail.statusBayar || 'Belum Bayar';
                          const statusClass = status === 'Lunas' 
                            ? 'text-emerald-400 border border-emerald-500/20 bg-emerald-950/20' 
                            : status === 'Dicicil' 
                              ? 'text-amber-400 border border-amber-500/20 bg-amber-950/20' 
                              : 'text-slate-500 border border-slate-900 bg-slate-950';

                          return (
                            <tr key={anggota.nama} className="border-b border-slate-900 hover:bg-slate-900/10">
                              <td className="p-2 pl-3">
                                <div className="font-semibold text-slate-200">{anggota.nama}</div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">{anggota.jabatan}</div>
                              </td>
                              <td className="p-2 align-middle">
                                <span className={`inline-block px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${statusClass}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="p-2 text-right font-mono font-semibold text-slate-300">
                                {formatIDR(paymentDetail.nominalBayar || 0)}
                              </td>
                              <td className="p-2 text-slate-400 font-mono">
                                {paymentDetail.tanggalBayar ? formatDateShort(paymentDetail.tanggalBayar) : '-'}
                              </td>
                              <td className="p-2 text-slate-400 max-w-[150px] truncate" title={paymentDetail.keterangan || ''}>
                                {paymentDetail.keterangan || '-'}
                              </td>
                              {role === 'Bendahara' && (
                                <td className="p-2 text-center align-middle">
                                  <button
                                    onClick={() => setEditingMemberPay({ iuranId: iuran.id, memberNama: anggota.nama })}
                                    disabled={isCompleted}
                                    className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider transition ${
                                      isCompleted 
                                        ? 'text-slate-600 border border-slate-900 bg-slate-950 cursor-not-allowed' 
                                        : 'text-sky-400 hover:bg-sky-950/40 border border-sky-900/30'
                                    }`}
                                  >
                                    Edit
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Summary / Control Action */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-900/60">
                  <div className="text-[10px]">
                    {isCompleted ? (
                      <div className="space-y-1">
                        <div>
                          <span className="text-slate-500">Uang Terpakai: </span>
                          <span className="font-mono font-bold text-slate-300">{formatIDR(iuran.uangDipakai || 0)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Hasil Akhir: </span>
                          <span className={`font-bold uppercase tracking-wider ${
                            (iuran.selisih || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(iuran.selisih || 0) > 0 
                              ? `Lebihan ${formatIDR(iuran.selisih || 0)} (Masuk Kas)` 
                              : (iuran.selisih || 0) < 0 
                                ? `Kekurangan ${formatIDR(Math.abs(iuran.selisih || 0))} (${iuran.opsiKas === 'Nambah Dari Kas' ? 'Ditutup Kas' : 'Tanggung Sendiri'})`
                                : 'Sesuai Anggaran (Pas)'
                            }
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Iuran sedang berjalan. Klik tombol "Edit" pada nama anggota untuk mencatat pembayaran mereka.</span>
                    )}
                  </div>

                  {!isCompleted && role === 'Bendahara' && (
                    <button
                      onClick={() => {
                        setFinishingIuranId(iuran.id);
                        setUangDipakaiInput(totalTerkumpul.toString());
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider transition"
                    >
                      Selesaikan Iuran
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {iuranKebutuhanList.length === 0 && (
            <div className="py-8 text-center text-slate-600 italic text-[11px] border border-dashed border-slate-900">
              Belum ada iuran kebutuhan yang dibuat. Klik "+ Buat Iuran Baru" untuk memulai.
            </div>
          )}
        </div>
      </div>

      {/* Modal Selesaikan Iuran (Bendahara Only) */}
      {finishingIuranId && role === 'Bendahara' && (() => {
        const iuran = iuranKebutuhanList.find(i => i.id === finishingIuranId);
        if (!iuran) return null;
        const totalTerkumpul = Object.values(iuran.pembayaran).reduce((sum, v) => sum + (v.nominalBayar || 0), 0);
        const uangDipakai = parseFloat(uangDipakaiInput) || 0;
        const selisih = totalTerkumpul - uangDipakai;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 relative geo-corner-decor">
              <button
                onClick={() => setFinishingIuranId(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                ✕
              </button>
              
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-1.5">
                Selesaikan Iuran: {iuran.nama}
              </h3>

              <form onSubmit={handleCompleteIuranSubmit} className="space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-500">Uang Terkumpul:</span>
                    <span className="font-semibold text-slate-300">{formatIDR(totalTerkumpul)}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Berapa Uang yang Dipakai (IDR) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold font-display text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={uangDipakaiInput}
                      onChange={(e) => setUangDipakaiInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Info Hasil Akhir */}
                <div className="text-[10px] bg-slate-950 p-3 border border-slate-855 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-400">Selisih Anggaran:</span>
                    <span className={selisih >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {selisih >= 0 ? '+' : ''}{formatIDR(selisih)}
                    </span>
                  </div>

                  {selisih > 0 && (
                    <p className="text-emerald-500 leading-normal">
                      * Ada kelebihan dana sebesar {formatIDR(selisih)}. Uang ini akan <strong>otomatis dimasukkan ke Kas Utama</strong> sebagai Pemasukan.
                    </p>
                  )}

                  {selisih < 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-rose-400 leading-normal">
                        * Ada kekurangan dana sebesar {formatIDR(Math.abs(selisih))}. Pilih opsi penutupan dana:
                      </p>
                      <div className="space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deficit-option"
                            checked={opsiKekurangan === 'Nambah Dari Kas'}
                            onChange={() => setOpsiKekurangan('Nambah Dari Kas')}
                            className="accent-sky-500"
                          />
                          <span className="text-slate-300">Ambil kekurangan dari Kas Utama (catat Pengeluaran)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="deficit-option"
                            checked={opsiKekurangan === 'Tanggung Sendiri'}
                            onChange={() => setOpsiKekurangan('Tanggung Sendiri')}
                            className="accent-sky-500"
                          />
                          <span className="text-slate-300">Tanggung sendiri (tidak mengurangi Kas Utama)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-950 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setFinishingIuranId(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 font-display text-[10px] font-bold uppercase tracking-wider"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-display text-[10px] font-bold uppercase tracking-wider transition"
                  >
                    Konfirmasi Selesai
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Modal Edit Pembayaran Anggota (Bendahara Only) */}
      {editingMemberPay && role === 'Bendahara' && (() => {
        const iuran = iuranKebutuhanList.find(i => i.id === editingMemberPay.iuranId);
        if (!iuran) return null;
        const targetNominal = iuran.nominalDefault;

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 relative geo-corner-decor">
              <button
                onClick={() => setEditingMemberPay(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 focus:outline-none"
              >
                ✕
              </button>
              
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-slate-200 mb-4">
                Edit Pembayaran Iuran
              </h3>

              <div className="mb-4 text-xs space-y-2">
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Nama Pengurus</span>
                  <span className="font-semibold text-slate-300">{editingMemberPay.memberNama}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-500">Nama Iuran</span>
                  <span className="font-semibold text-slate-300">{iuran.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Tagihan</span>
                  <span className="text-sky-400 font-mono font-bold">{formatIDR(targetNominal)}</span>
                </div>
              </div>

              <form onSubmit={handleSaveMemberPayment} className="space-y-4">
                {/* Nominal Bayar */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Jumlah Pembayaran (IDR)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-bold font-display text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      required
                      placeholder="0"
                      value={editNominalInput}
                      onChange={(e) => handleNominalChangeInEdit(e.target.value, targetNominal)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                {/* Status Bayar */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Status Pembayaran
                  </label>
                  <select
                    value={editStatusInput}
                    onChange={(e) => setEditStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="Belum Bayar">Belum Bayar</option>
                    <option value="Dicicil">Dicicil</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>

                {/* Tanggal Bayar */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Tanggal Pembayaran
                  </label>
                  <input
                    type="date"
                    value={editTanggalInput}
                    onChange={(e) => setEditTanggalInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Keterangan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Cicil 1, Lunas, Transfer bank..."
                    value={editKeteranganInput}
                    onChange={(e) => setEditKeteranganInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex gap-2 justify-end border-t border-slate-950 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMemberPay(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-300 font-display text-[10px] font-bold uppercase tracking-wider"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-display text-[10px] font-bold uppercase tracking-wider transition"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

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
