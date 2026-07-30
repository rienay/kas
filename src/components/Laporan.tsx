import { useState } from 'react';
import { Download, Printer, Filter, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Transaksi, UtangPiutang } from '../types';

interface LaporanProps {
  transaksi: Transaksi[];
  utangPiutang: UtangPiutang[];
}

export default function LaporanComponent({ transaksi, utangPiutang }: LaporanProps) {
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // Saring Transaksi berdasarkan Tahun terpilih
  const filteredTransaksi = transaksi.filter(t => {
    const tDate = new Date(t.tanggal);
    const tYear = String(tDate.getFullYear());
    return tYear === filterTahun;
  });

  // Pengelompokan berdasarkan bulan
  const BULAN_MAP: Record<number, string> = {
    0: 'Januari', 1: 'Februari', 2: 'Maret', 3: 'April', 4: 'Mei', 5: 'Juni',
    6: 'Juli', 7: 'Agustus', 8: 'September', 9: 'Oktober', 10: 'November', 11: 'Desember'
  };

  const sortedTransaksi = [...filteredTransaksi].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  
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

  // Kalkulasi Keuangan Tahunan Terpilih
  const totalPemasukan = filteredTransaksi
    .filter(t => t.jenis === 'Pemasukan')
    .reduce((acc, t) => acc + t.jumlah, 0);

  const totalPengeluaran = filteredTransaksi
    .filter(t => t.jenis === 'Pengeluaran')
    .reduce((acc, t) => acc + t.jumlah, 0);

  const surplusDefisit = totalPemasukan - totalPengeluaran;

  // Laporan Utang Piutang Aktif
  const utangAktif = utangPiutang.filter(up => up.tipe === 'Utang' && up.status !== 'Lunas');
  const piutangAktif = utangPiutang.filter(up => up.tipe === 'Piutang' && up.status !== 'Lunas');

  const totalUtangAktif = utangAktif.reduce((acc, up) => acc + (up.jumlah - (up.jumlahTerbayar || 0)), 0);
  const totalPiutangAktif = piutangAktif.reduce((acc, up) => acc + (up.jumlah - (up.jumlahTerbayar || 0)), 0);

  // Ekspor Data ke CSV
  const handleExportCSV = () => {
    const rows: string[] = [];
    
    groupedTransaksi.forEach(group => {
      rows.push(`"--- BULAN: ${group.monthName.toUpperCase()} ---",,,,,,`);
      rows.push('ID Transaksi,Tanggal,Jenis,Kategori,Jumlah,Keterangan,Input Oleh');
      group.transactions.forEach(t => {
        rows.push([
          t.id, t.tanggal, t.jenis, t.kategori, t.jumlah, `"${t.keterangan.replace(/"/g, '""')}"`, t.inputOleh
        ].join(','));
      });
      rows.push(',,,,,,'); // Spacing antar bulan
    });

    if (groupedTransaksi.length === 0) {
      rows.push('Tidak ada transaksi,,,,,,');
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Kas_DKC_Tahun_${filterTahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fungsi Cetak Print Layout
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print-area">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-100">
            Rekap & Laporan
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Ekspor rekapitulasi bulanan, cetak laporan resmi, atau pantau status performa anggaran kas.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition"
          >
            <Download size={14} />
            Ekspor CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition"
          >
            <Printer size={14} />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Filter Laporan (Sembunyikan saat dicetak) */}
      <div className="glass-panel geo-border p-4 flex flex-wrap gap-4 items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Periode Rekapitulasi:</span>
        </div>

        <div className="flex gap-2">
          {/* Filter Tahun */}
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            className="bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* PRINT-ONLY HEADER AREA */}
      <div className="hidden print-show mb-6 text-slate-900">
        <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5 mb-6">
          <h2 className="text-xl font-bold uppercase tracking-wider">Laporan Rekapitulasi Kas Keuangan</h2>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Dewan Kerja Cabang (DKC) Cilacap</h3>
          <p className="text-xs">Periode: Tahun {filterTahun}</p>
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
          {groupedTransaksi.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={7} className="py-4 text-center italic">Tidak ada transaksi</td>
              </tr>
            </tbody>
          ) : (() => {
            let saldo = 0;
            let globalIdx = 0;
            return groupedTransaksi.map((group) => (
              <tbody key={group.monthIndex}>
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

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 no-print">
        
        {/* Pemasukan Tahunan */}
        <div className="glass-panel geo-border p-5 print:bg-slate-50 print:text-slate-950">
          <div className="flex justify-between text-slate-400 print:text-slate-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pemasukan Tahunan</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="mt-3 text-xl font-display font-bold text-emerald-400 print:text-emerald-700 tracking-tight">
            {formatIDR(totalPemasukan)}
          </p>
          <span className="text-[9px] text-slate-500 mt-2 block">Akumulasi dana masuk tahun ini</span>
        </div>

        {/* Pengeluaran Tahunan */}
        <div className="glass-panel geo-border p-5 print:bg-slate-50 print:text-slate-950">
          <div className="flex justify-between text-slate-400 print:text-slate-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Pengeluaran Tahunan</span>
            <TrendingDown size={16} className="text-rose-500" />
          </div>
          <p className="mt-3 text-xl font-display font-bold text-rose-400 print:text-rose-700 tracking-tight">
            {formatIDR(totalPengeluaran)}
          </p>
          <span className="text-[9px] text-slate-500 mt-2 block">Akumulasi dana keluar tahun ini</span>
        </div>

        {/* Surplus / Defisit */}
        <div className="glass-panel geo-border p-5 print:bg-slate-50 print:text-slate-950">
          <div className="flex justify-between text-slate-400 print:text-slate-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Surplus / Defisit Kas</span>
            <DollarSign size={16} className="text-sky-500" />
          </div>
          <p className={`mt-3 text-xl font-display font-bold tracking-tight ${
            surplusDefisit >= 0 ? 'text-sky-400 print:text-sky-700' : 'text-rose-500 print:text-rose-700'
          }`}>
            {surplusDefisit >= 0 ? '+' : ''}{formatIDR(surplusDefisit)}
          </p>
          <span className="text-[9px] text-slate-500 mt-2 block">Arus bersih (net cash flow)</span>
        </div>

      </div>

      {/* Balance Statement for Print - Debt & Receivables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 no-print">
        
        {/* Utang Aktif */}
        <div className="glass-panel geo-border p-4 print:bg-slate-50 print:text-slate-950">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 border-b border-slate-900 pb-2 mb-3">
            Rincian Tanggungan Utang Aktif
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {utangAktif.map((up, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-900/40">
                <span className="text-slate-400 print:text-slate-600 font-medium">{up.nama}</span>
                <span className="font-semibold text-rose-400 print:text-rose-700">{formatIDR(up.jumlah - (up.jumlahTerbayar || 0))}</span>
              </div>
            ))}
            {utangAktif.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">Tidak ada utang aktif</p>
            )}
          </div>
          <div className="flex justify-between items-center border-t border-slate-900 pt-2.5 mt-3 text-xs font-bold">
            <span className="text-slate-400 print:text-slate-700">Total Utang Aktif:</span>
            <span className="text-rose-400 print:text-rose-700">{formatIDR(totalUtangAktif)}</span>
          </div>
        </div>

        {/* Piutang Aktif */}
        <div className="glass-panel geo-border p-4 print:bg-slate-50 print:text-slate-950">
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-slate-300 print:text-slate-800 border-b border-slate-900 pb-2 mb-3">
            Rincian Piutang Aktif (Tagihan)
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {piutangAktif.map((up, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-900/40">
                <span className="text-slate-400 print:text-slate-600 font-medium">{up.nama}</span>
                <span className="font-semibold text-emerald-400 print:text-emerald-700">{formatIDR(up.jumlah - (up.jumlahTerbayar || 0))}</span>
              </div>
            ))}
            {piutangAktif.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">Tidak ada piutang aktif</p>
            )}
          </div>
          <div className="flex justify-between items-center border-t border-slate-900 pt-2.5 mt-3 text-xs font-bold">
            <span className="text-slate-400 print:text-slate-700">Total Piutang Aktif:</span>
            <span className="text-emerald-400 print:text-emerald-700">{formatIDR(totalPiutangAktif)}</span>
          </div>
        </div>

      </div>

      {/* Main Ledger Table */}
      <div className="glass-panel geo-border p-5 no-print">
        <h2 className="text-xs font-display font-semibold uppercase tracking-wider text-slate-300 print:text-slate-800 mb-4 pb-2 border-b border-slate-900">
          Jurnal Ledger Rincian Transaksi - Tahun {filterTahun}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-900 print:border-slate-800 text-slate-400 print:text-slate-600 font-semibold uppercase tracking-wider">
                <th className="pb-3 pl-3">ID</th>
                <th className="pb-3">Tanggal</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Keterangan</th>
                <th className="pb-3">Admin</th>
                <th className="pb-3 text-right pr-3">Jumlah</th>
              </tr>
            </thead>
            {groupedTransaksi.length === 0 ? (
              <tbody><tr><td colSpan={6} className="py-8 text-center text-slate-500 italic">Tidak ada transaksi tercatat pada periode ini.</td></tr></tbody>
            ) : (
              groupedTransaksi.map((group) => (
                <tbody key={group.monthIndex}>
                  <tr className="bg-slate-900 print:bg-slate-200 border-y border-slate-800 print:border-slate-400">
                    <td colSpan={6} className="py-2 px-3 font-bold uppercase tracking-widest text-sky-400 print:text-slate-800 text-[10px] text-center">
                      -- {group.monthName} --
                    </td>
                  </tr>
                  {group.transactions.map((t, idx) => (
                    <tr key={t.id || idx} className="border-b border-slate-900/60 print:border-slate-200 hover:bg-slate-900/20 transition-colors">
                      <td className="py-3 pl-3 text-slate-500 font-mono">{t.id}</td>
                      <td className="py-3 text-slate-400 print:text-slate-700">{t.tanggal}</td>
                      <td className="py-3"><span className="font-semibold uppercase text-slate-300 print:text-slate-800">{t.kategori}</span></td>
                      <td className="py-3 text-slate-300 print:text-slate-900 font-medium">{t.keterangan}</td>
                      <td className="py-3 text-slate-400 print:text-slate-700">{t.inputOleh}</td>
                      <td className={`py-3 text-right pr-3 font-semibold ${t.jenis === 'Pemasukan' ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                        {t.jenis === 'Pemasukan' ? '+' : '-'} {formatIDR(t.jumlah)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))
            )}
          </table>
        </div>
      </div>

      {/* Print Signatures Area (Only visible on print) */}
      <div className="hidden print-show mt-16 text-xs text-slate-900 w-full clear-both">
        <div style={{ float: 'right', width: '250px', textAlign: 'center' }}>
          <p>Pelaksana,</p>
          <p className="font-bold uppercase mt-1">Bendahara DKC Cilacap</p>
          <p className="font-bold underline" style={{ marginTop: '60px' }}>( ___________________________ )</p>
        </div>
        <div style={{ clear: 'both' }}></div>
      </div>

      {/* Print CSS Rules */}
      <style>{`
        @media print {
          @page { size: portrait; margin: 15mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; text-shadow: none !important; color: black !important; }
          html, body, #root { width: 100% !important; height: auto !important; overflow: visible !important; display: block !important; background: white !important; }
          body { padding: 0 !important; margin: 0 !important; box-sizing: border-box !important; }
          div, main, section { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; display: block !important; position: static !important; border: none !important; background: transparent !important; }
          
          .no-print, .hidden, aside, header, nav, button { display: none !important; }
          .print-show { display: block !important; }
          
          /* Tabel Normal & Rapi */
          table { width: 100% !important; border-collapse: collapse !important; page-break-inside: auto !important; font-size: 9pt !important; margin-bottom: 20px !important; border: 1px solid #ddd !important; background: transparent !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; background: transparent !important; }
          thead { display: table-header-group !important; }
          th, td { padding: 8px 6px !important; border: 1px solid #ccc !important; text-align: left !important; background: transparent !important; }
          th { background-color: #f3f4f6 !important; color: #111827 !important; font-weight: bold !important; text-align: center !important; border: 1px solid #aaa !important; }
          
          .glass-panel { border: none !important; margin: 0 !important; padding: 0 !important; background: transparent !important; }
          .geo-border, .geo-corner-decor { border: none !important; }
          .geo-corner-decor::before, .geo-corner-decor::after { display: none !important; }
        }
      `}</style>

    </div>
  );
}
