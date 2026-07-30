import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, FileText, Users, Activity, Clock, BarChart2, PieChart as PieChartIcon, ArrowDownToLine, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaksi, KasAnggota, PerjalananDinas, UtangPiutang, PenerimaanDana, UserRole } from '../types';

interface DashboardProps {
  role: UserRole;
  transaksi: Transaksi[];
  kasAnggota: KasAnggota[];
  perjalananDinas: PerjalananDinas[];
  penerimaanDana: PenerimaanDana[];
  utangPiutang: UtangPiutang[];
  onNavigate: (tab: string) => void;
  onOpenQuickTx: (jenis: 'Pemasukan' | 'Pengeluaran') => void;
}

export default function DashboardComponent({ role, transaksi, kasAnggota, perjalananDinas, penerimaanDana, utangPiutang, onNavigate, onOpenQuickTx }: DashboardProps) {
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  // 1. Kalkulasi Saldo Total Keseluruhan
  const totalPemasukan = transaksi.filter(t => t.jenis === 'Pemasukan').reduce((acc, t) => acc + t.jumlah, 0);
  const totalPengeluaran = transaksi.filter(t => t.jenis === 'Pengeluaran').reduce((acc, t) => acc + t.jumlah, 0);
  const saldoSaatIni = totalPemasukan - totalPengeluaran;

  // 2. Kalkulasi Bulan Ini
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // State untuk tahun grafik yang sedang dipilih
  const [chartYear, setChartYear] = useState<number>(currentYear);

  // Kumpulkan semua tahun yang tersedia dari histori transaksi
  const availableYears = Array.from(
    new Set([currentYear, ...transaksi.map(t => new Date(t.tanggal).getFullYear())])
  ).sort((a, b) => b - a);
  
  // Kalkulasi Berdasarkan Tahun Terpilih (Dashboard Year)
  const transaksiTahunIni = transaksi.filter(t => new Date(t.tanggal).getFullYear() === chartYear);
  const pemasukanTahunIni = transaksiTahunIni.filter(t => t.jenis === 'Pemasukan').reduce((acc, t) => acc + t.jumlah, 0);
  const pengeluaranTahunIni = transaksiTahunIni.filter(t => t.jenis === 'Pengeluaran').reduce((acc, t) => acc + t.jumlah, 0);
  const saldoTahunIni = pemasukanTahunIni - pengeluaranTahunIni;
  
  const penerimaanDanaTahunIni = penerimaanDana
    .filter(pd => new Date(pd.tanggal).getFullYear() === chartYear)
    .reduce((acc, pd) => acc + pd.jumlah, 0);
    
  const sppdTahunIni = perjalananDinas.filter(pd => Number(pd.tahun) === chartYear).length;

  const transaksiBulanIni = transaksi.filter(t => {
    const d = new Date(t.tanggal);
    return d.getMonth() === currentMonth && d.getFullYear() === chartYear; // Mengikuti tahun yang dipilih
  });
  
  const pemasukanBulanIni = transaksiBulanIni.filter(t => t.jenis === 'Pemasukan').reduce((acc, t) => acc + t.jumlah, 0);
  const pengeluaranBulanIni = transaksiBulanIni.filter(t => t.jenis === 'Pengeluaran').reduce((acc, t) => acc + t.jumlah, 0);

  // 3. Kalkulasi Utang & Piutang Aktif
  const utangAktif = utangPiutang.filter(up => up.tipe === 'Utang' && up.status !== 'Lunas')
    .reduce((acc, up) => acc + (up.jumlah - (up.jumlahTerbayar || 0)), 0);
  
  const piutangAktif = utangPiutang.filter(up => up.tipe === 'Piutang' && up.status !== 'Lunas')
    .reduce((acc, up) => acc + (up.jumlah - (up.jumlahTerbayar || 0)), 0);

  // 4. Ambil 5 Transaksi Terakhir (Asumsi data sudah terurut dari backend, atau kita urutkan ulang)
  const transaksiTerbaru = [...transaksi]
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime() || b.id!.localeCompare(a.id!))
    .slice(0, 5);

  // 5. Data Grafik (Chart) - Rekapitulasi per Bulan untuk Tahun Ini
  const chartData = Array.from({ length: 12 }, (_, i) => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'][i],
    Pemasukan: 0,
    Pengeluaran: 0,
  }));

  transaksi.forEach(t => {
    const d = new Date(t.tanggal);
    if (d.getFullYear() === chartYear) {
      const month = d.getMonth();
      if (t.jenis === 'Pemasukan') chartData[month].Pemasukan += t.jumlah;
      if (t.jenis === 'Pengeluaran') chartData[month].Pengeluaran += t.jumlah;
    }
  });

  // 6. Data Grafik Pie Chart (Analisis Kategori Pengeluaran Tahun Terpilih)
  const expenseCategoryMap: Record<string, number> = {};
  transaksiTahunIni.filter(t => t.jenis === 'Pengeluaran').forEach(t => {
    expenseCategoryMap[t.kategori] = (expenseCategoryMap[t.kategori] || 0) + t.jumlah;
  });
  const expenseCategoryData = Object.keys(expenseCategoryMap).map(key => ({
    name: key,
    value: expenseCategoryMap[key]
  })).sort((a, b) => b.value - a.value);
  
  const PIE_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b'];

  // Custom Tooltip untuk format Rupiah di Grafik (Pastel Style)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-md border border-purple-100 p-3 shadow-xl rounded-2xl text-xs">
          <p className="font-bold text-slate-800 mb-2">{label} {chartYear}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="font-semibold mt-1" style={{ color: entry.color }}>
              {entry.name}: {formatIDR(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][currentMonth];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Activity className="text-violet-600" /> Dashboard Statistik
          </h1>
          <p className="text-slate-500 text-xs mt-1">Ringkasan kondisi kas dan administrasi Dewan Kerja Cabang secara real-time.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-xs">
          <Calendar size={14} className="text-violet-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tahun Data:</span>
          <select
            value={chartYear}
            onChange={(e) => setChartYear(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {availableYears.map(year => (
              <option key={year} value={year} className="bg-white text-slate-800">{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Highlight Cards - ROW 1 (Keseluruhan & Tahunan) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-l-4 border-l-violet-500 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet size={100} className="text-violet-900" /></div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Total Saldo (Keseluruhan)</h3>
          <p className="text-2xl font-display font-bold text-slate-800 tracking-tight">{formatIDR(saldoSaatIni)}</p>
        </div>
        
        <div className="glass-panel p-5 border-l-4 border-l-indigo-400 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={100} className="text-indigo-900" /></div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Arus Kas Bersih ({chartYear})</h3>
          <p className="text-xl font-display font-bold text-indigo-600 tracking-tight">{saldoTahunIni > 0 ? '+' : ''}{formatIDR(saldoTahunIni)}</p>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-emerald-500 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingUp size={100} className="text-emerald-900" /></div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Pemasukan Tahun {chartYear}</h3>
          <p className="text-xl font-display font-bold text-emerald-600 tracking-tight">+{formatIDR(pemasukanTahunIni)}</p>
        </div>

        <div className="glass-panel p-5 border-l-4 border-l-rose-400 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity"><TrendingDown size={100} className="text-rose-900" /></div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Pengeluaran Tahun {chartYear}</h3>
          <p className="text-xl font-display font-bold text-rose-600 tracking-tight">-{formatIDR(pengeluaranTahunIni)}</p>
        </div>
      </div>

      {/* Highlight Cards - ROW 2 (Bulanan & Lainnya) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl bg-white/70 flex items-center justify-between shadow-xs">
          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pemasukan {namaBulan}</h3>
            <p className="text-sm font-bold text-emerald-600">+{formatIDR(pemasukanBulanIni)}</p>
          </div>
          <TrendingUp size={24} className="text-emerald-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-2xl bg-white/70 flex items-center justify-between shadow-xs">
          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Pengeluaran {namaBulan}</h3>
            <p className="text-sm font-bold text-rose-600">-{formatIDR(pengeluaranBulanIni)}</p>
          </div>
          <TrendingDown size={24} className="text-rose-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-2xl bg-white/70 flex items-center justify-between shadow-xs">
          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Penerimaan Dana ({chartYear})</h3>
            <p className="text-sm font-bold text-violet-600">+{formatIDR(penerimaanDanaTahunIni)}</p>
          </div>
          <ArrowDownToLine size={24} className="text-violet-500/30" />
        </div>

        <div className="glass-panel p-4 rounded-2xl bg-white/70 flex items-center justify-between shadow-xs">
          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">SPPD Diterbitkan ({chartYear})</h3>
            <p className="text-sm font-bold text-slate-700">{sppdTahunIni} <span className="text-[10px] font-normal text-slate-500">Surat</span></p>
          </div>
          <FileText size={24} className="text-slate-400/40" />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Bar Chart Arus Kas */}
        <div className="xl:col-span-2 glass-panel p-5 rounded-3xl shadow-xs">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-6 flex items-center gap-2">
            <BarChart2 size={14} className="text-violet-600" /> Analisis Arus Kas Bulanan
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp${value / 1000}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.6 }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart Kategori Pengeluaran */}
        <div className="glass-panel p-5 flex flex-col rounded-3xl shadow-xs">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <PieChartIcon size={14} className="text-rose-500" /> Kategori Pengeluaran
          </h3>
          {expenseCategoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">Belum ada data pengeluaran</div>
          ) : (
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatIDR(Number(value ?? 0))} 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', borderColor: '#f1f5f9', color: '#1e293b', fontSize: '12px' }} 
                    itemStyle={{ color: '#1e293b', fontWeight: 'bold' }} 
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} 
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Riwayat Transaksi Terakhir */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-3xl shadow-xs">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
            <Clock size={14} className="text-violet-600" /> 5 Transaksi Terakhir
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Tanggal</th>
                  <th className="pb-2 font-medium">Keterangan</th>
                  <th className="pb-2 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {transaksiTerbaru.length === 0 ? (
                  <tr><td colSpan={3} className="py-4 text-center text-slate-400 italic">Belum ada transaksi</td></tr>
                ) : (
                  transaksiTerbaru.map((t, i) => (
                    <tr key={t.id || i} className="border-b border-slate-100 hover:bg-violet-50/40 transition">
                      <td className="py-2.5 text-slate-500 whitespace-nowrap font-medium">{t.tanggal}</td>
                      <td className="py-2.5 text-slate-800 font-medium truncate max-w-[200px]" title={t.keterangan}>{t.keterangan}</td>
                      <td className={`py-2.5 text-right font-semibold whitespace-nowrap ${t.jenis === 'Pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.jenis === 'Pemasukan' ? '+' : '-'}{formatIDR(t.jumlah)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Utang Piutang */}
        <div className="glass-panel p-5 flex flex-col justify-center space-y-6 rounded-3xl shadow-xs">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Users size={14} className="text-amber-500" /> Status Utang & Piutang Aktif
          </h3>
          
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Tanggungan Utang (Harus Dibayar)</p>
            <p className="text-lg font-bold text-rose-600 font-display">{formatIDR(utangAktif)}</p>
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Total Piutang (Tagihan Keluar)</p>
            <p className="text-lg font-bold text-emerald-600 font-display">{formatIDR(piutangAktif)}</p>
          </div>
        </div>

      </div>

    </div>
  );
}
