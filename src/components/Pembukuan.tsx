import { useState } from 'react';
import { Download, Printer, Filter, BookText } from 'lucide-react';
import { Transaksi, UtangPiutang, PenerimaanDana } from '../types';

interface PembukuanProps {
  transaksi: Transaksi[];
  utangPiutang: UtangPiutang[];
  penerimaanDana: PenerimaanDana[];
}

interface UnifiedItem {
  id: string;
  tanggal: string;
  modul: string;
  kategori: string;
  rincian: string;
  masuk: number;
  keluar: number;
  isKas: boolean;
  isKwarcab: boolean;
}

export default function PembukuanComponent({ transaksi, utangPiutang, penerimaanDana }: PembukuanProps) {
  const [filterTahun, setFilterTahun] = useState<string>(new Date().getFullYear().toString());

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  // 1. Gabungkan semua data menjadi satu format seragam (Unified)
  const allItems: UnifiedItem[] = [];

  transaksi.forEach(t => {
    if (t.tanggal.startsWith(filterTahun)) {
      allItems.push({
        id: t.id || Math.random().toString(),
        tanggal: t.tanggal,
        modul: 'Kas DKC',
        kategori: t.kategori,
        rincian: t.keterangan,
        masuk: t.jenis === 'Pemasukan' ? t.jumlah : 0,
        keluar: t.jenis === 'Pengeluaran' ? t.jumlah : 0,
        isKas: true,
        isKwarcab: false
      });
    }
  });

  penerimaanDana.forEach(pd => {
    if (pd.tanggal.startsWith(filterTahun)) {
      allItems.push({
        id: pd.id || Math.random().toString(),
        tanggal: pd.tanggal,
        modul: 'Dana Kwarcab',
        kategori: 'Penerimaan',
        rincian: `Dari: ${pd.pemberi} | Kepada: ${pd.penerima} | ${pd.keterangan}`,
        masuk: pd.jumlah,
        keluar: 0,
        isKas: false,
        isKwarcab: true
      });
    }
  });

  utangPiutang.forEach(up => {
    if (up.tanggal.startsWith(filterTahun)) {
      allItems.push({
        id: up.id || Math.random().toString(),
        tanggal: up.tanggal,
        modul: 'Utang/Piutang',
        kategori: `Pencatatan ${up.tipe}`,
        rincian: `${up.nama} - ${up.keterangan} (${up.status})`,
        masuk: up.tipe === 'Utang' ? up.jumlah : 0,
        keluar: up.tipe === 'Piutang' ? up.jumlah : 0,
        isKas: false,
        isKwarcab: false
      });
    }
  });

  // 2. Urutkan berdasarkan tanggal
  allItems.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  // 3. Kelompokkan berdasarkan bulan
  const BULAN_MAP: Record<number, string> = {
    0: 'Januari', 1: 'Februari', 2: 'Maret', 3: 'April', 4: 'Mei', 5: 'Juni',
    6: 'Juli', 7: 'Agustus', 8: 'September', 9: 'Oktober', 10: 'November', 11: 'Desember'
  };

  const groupedItems: { monthName: string; monthIndex: number; items: UnifiedItem[] }[] = [];
  let currentMonth = -1;
  let currentGroup: { monthName: string; monthIndex: number; items: UnifiedItem[] } | null = null;

  allItems.forEach(item => {
    const m = new Date(item.tanggal).getMonth();
    if (m !== currentMonth || !currentGroup) {
      currentMonth = m;
      currentGroup = { monthName: BULAN_MAP[m], monthIndex: m, items: [] };
      groupedItems.push(currentGroup);
    }
    currentGroup.items.push(item);
  });

  // Ekspor Data ke CSV
  const handleExportCSV = () => {
    const rows: string[] = [];
    
    groupedItems.forEach(group => {
      rows.push(`"--- BULAN: ${group.monthName.toUpperCase()} ---",,,,,,,,`);
      rows.push('No,Tanggal,Modul,Kategori,Rincian Keterangan,Masuk (Debit),Keluar (Kredit),Saldo Kas,Saldo Kwarcab');
      
      let saldoKas = 0;
      let saldoKwarcab = 0;
      
      group.items.forEach((item, idx) => {
        if (item.isKas) saldoKas += (item.masuk - item.keluar);
        if (item.isKwarcab) saldoKwarcab += (item.masuk - item.keluar);
        
        rows.push([
          idx + 1, item.tanggal, item.modul, item.kategori, `"${item.rincian.replace(/"/g, '""')}"`,
          item.masuk, item.keluar, saldoKas, saldoKwarcab
        ].join(','));
      });
      rows.push(',,,,,,,,'); // Spacing
    });

    if (groupedItems.length === 0) rows.push('Tidak ada catatan keuangan,,,,,,,,');

    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Buku_Besar_Keuangan_Tahun_${filterTahun}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-100">Buku Besar (Ledger)</h1>
          <p className="text-slate-400 text-xs mt-1">Pembukuan terpadu mencakup Kas, Utang, Piutang, dan Dana Kwarcab.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition">
            <Download size={14} /> CSV
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition">
            <Printer size={14} /> Print Landscape
          </button>
        </div>
      </div>

      {/* Filter Tahun */}
      <div className="glass-panel geo-border p-4 flex gap-4 items-center no-print">
        <Filter size={14} className="text-slate-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tahun Buku:</span>
        <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="bg-slate-900 border border-slate-800 px-3 py-1 text-xs text-slate-300 focus:outline-none">
          <option value="2026">2026</option><option value="2025">2025</option><option value="2024">2024</option>
        </select>
      </div>

      {/* Area Cetak Print */}
      <div className="hidden print-show mb-4 text-slate-900 text-center border-b-2 border-slate-800 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-wider">Buku Besar Pembukuan Terpadu</h2>
        <h3 className="text-sm font-semibold uppercase tracking-wide">Dewan Kerja Cabang Cilacap</h3>
        <p className="text-xs">Periode: Tahun {filterTahun}</p>
      </div>

      {/* Tabel Landscape Utama */}
      <div className="glass-panel geo-border p-5 print:bg-white print:border-none print:p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[10px] sm:text-xs whitespace-nowrap print:text-black print:text-[9px]" style={{pageBreakInside:'auto'}}>
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-400 print:text-slate-900 font-bold uppercase tracking-wider bg-slate-900/50 print:bg-slate-200">
                <th className="p-2">Tanggal</th>
                <th className="p-2">Modul</th>
                <th className="p-2">Kategori</th>
                <th className="p-2 max-w-xs truncate print:max-w-none print:whitespace-normal">Rincian</th>
                <th className="p-2 text-right text-emerald-500 print:text-emerald-700">Masuk (Debit)</th>
                <th className="p-2 text-right text-rose-500 print:text-rose-700">Keluar (Kredit)</th>
                <th className="p-2 text-right text-sky-400 print:text-slate-900">Saldo Kas</th>
                <th className="p-2 text-right text-purple-400 print:text-slate-900">Saldo Kwarcab</th>
              </tr>
            </thead>
            {groupedItems.length === 0 ? (
              <tbody><tr><td colSpan={8} className="p-6 text-center italic text-slate-500">Buku besar kosong pada tahun ini.</td></tr></tbody>
            ) : (() => {
              let saldoKas = 0; let saldoKwarcab = 0;
              return groupedItems.map((group) => (
                <tbody key={group.monthIndex}>
                  <tr className="bg-slate-900 print:bg-slate-100 border-y border-slate-800 print:border-slate-300">
                    <td colSpan={8} className="p-2 font-bold uppercase tracking-widest text-sky-400 print:text-slate-800 text-center">
                      -- Bulan {group.monthName} --
                    </td>
                  </tr>
                  {group.items.map((item, idx) => {
                    if (item.isKas) saldoKas += (item.masuk - item.keluar);
                    if (item.isKwarcab) saldoKwarcab += (item.masuk - item.keluar);
                    return (
                      <tr key={idx} className="border-b border-slate-900/40 print:border-slate-300 hover:bg-slate-900/30" style={{pageBreakInside:'avoid'}}>
                        <td className="p-2">{item.tanggal}</td>
                        <td className="p-2 font-semibold text-slate-300 print:text-slate-800">{item.modul}</td>
                        <td className="p-2 text-slate-400 print:text-slate-700">{item.kategori}</td>
                        <td className="p-2 max-w-xs truncate print:max-w-none print:whitespace-normal" title={item.rincian}>{item.rincian}</td>
                        <td className="p-2 text-right text-emerald-400 print:text-emerald-700 font-medium">{item.masuk > 0 ? formatIDR(item.masuk) : '-'}</td>
                        <td className="p-2 text-right text-rose-400 print:text-rose-700 font-medium">{item.keluar > 0 ? formatIDR(item.keluar) : '-'}</td>
                        <td className="p-2 text-right font-bold text-slate-200 print:text-black bg-slate-900/30 print:bg-transparent">{formatIDR(saldoKas)}</td>
                        <td className="p-2 text-right font-bold text-purple-300 print:text-black bg-slate-900/30 print:bg-transparent">{formatIDR(saldoKwarcab)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              ));
            })()}
          </table>
        </div>
      </div>

      {/* Print Signatures Area (Only visible on print) */}
      <div className="hidden print-show mt-12 text-xs text-slate-900 w-full clear-both">
        <div style={{ float: 'right', width: '250px', textAlign: 'center' }}>
          <p>Pelaksana,</p>
          <p className="font-bold uppercase mt-1">Bendahara DKC Cilacap</p>
          <p className="font-bold underline" style={{ marginTop: '60px' }}>( ___________________________ )</p>
        </div>
        <div style={{ clear: 'both' }}></div>
      </div>

      {/* Setup CSS Print Landscape */}
      <style>{`
        @media print { 
          @page { size: landscape; margin: 15mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-shadow: none !important; text-shadow: none !important; color: black !important; }
          html, body, #root { width: 100% !important; height: auto !important; overflow: visible !important; display: block !important; background: white !important; }
          body { padding: 0 !important; margin: 0 !important; box-sizing: border-box !important; }
          div, main, section { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; display: block !important; position: static !important; border: none !important; background: transparent !important; }
          
          .no-print, .hidden, aside, header, nav, button { display: none !important; }
          .print-show { display: block !important; }
          
          /* Tabel Normal & Rapi */
          table { width: 100% !important; border-collapse: collapse !important; page-break-inside: auto !important; font-size: 8pt !important; margin-bottom: 20px !important; border: 1px solid #ddd !important; background: transparent !important; }
          tr { page-break-inside: avoid !important; page-break-after: auto !important; background: transparent !important; }
          thead { display: table-header-group !important; }
          th, td { padding: 6px 4px !important; border: 1px solid #ccc !important; text-align: left !important; background: transparent !important; }
          th { background-color: #f3f4f6 !important; color: #111827 !important; font-weight: bold !important; text-align: center !important; border: 1px solid #aaa !important; }
          
          .glass-panel { border: none !important; margin: 0 !important; padding: 0 !important; background: transparent !important; }
        }
      `}</style>
    </div>
  );
}