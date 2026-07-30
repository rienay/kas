import React, { useState } from 'react';
import { Search, Plus, Calendar, User, Download, Printer, Upload, X, Eye, FileText, AlertCircle } from 'lucide-react';
import { PenerimaanDana, UserRole } from '../types';

interface PenerimaanDanaProps {
  role: UserRole;
  penerimaanDana: PenerimaanDana[];
  onAdd: (data: Omit<PenerimaanDana, 'id' | 'inputOleh'>) => Promise<void>;
  onEdit: (data: PenerimaanDana) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function PenerimaanDanaComponent({ role, penerimaanDana, onAdd, onEdit, onDelete }: PenerimaanDanaProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [pemberi, setPemberi] = useState('');
  const [penerima, setPenerima] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [buktiBase64, setBuktiBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const [selectedItem, setSelectedItem] = useState<PenerimaanDana | null>(null);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setBuktiBase64(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          const MAX = 1200;
          if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } } 
          else { if (height > MAX) { width *= MAX / height; height = MAX; } }
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
          setBuktiBase64(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseFloat(jumlah);
    if (isNaN(nominal) || nominal <= 0) return alert('Nominal tidak valid');

    setLoading(true);
    try {
      if (editId) {
        await onEdit({ id: editId, tanggal, pemberi, penerima, jumlah: nominal, keterangan, buktiDokumentasi: buktiBase64 || undefined, inputOleh: '' });
      } else {
        await onAdd({ tanggal, pemberi, penerima, jumlah: nominal, keterangan, buktiDokumentasi: buktiBase64 || undefined });
      }
      setShowForm(false);
      setEditId(null);
      setPemberi(''); setPenerima(''); setJumlah(''); setKeterangan(''); setBuktiBase64('');
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal memproses data'); } 
    finally { setLoading(false); }
  };

  const openEditForm = (item: PenerimaanDana) => {
    setEditId(item.id || null);
    setTanggal(item.tanggal); setPemberi(item.pemberi); setPenerima(item.penerima);
    setJumlah(item.jumlah.toString()); setKeterangan(item.keterangan);
    setBuktiBase64(item.buktiDokumentasi || '');
    setShowForm(true); setSelectedItem(null);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Yakin menghapus catatan ini?')) {
      await onDelete(id);
      setSelectedItem(null);
    }
  };

  const filteredData = penerimaanDana.filter(d => 
    d.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.pemberi.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.penerima.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pengelompokan berdasarkan bulan
  const BULAN_MAP: Record<number, string> = {
    0: 'Januari', 1: 'Februari', 2: 'Maret', 3: 'April', 4: 'Mei', 5: 'Juni',
    6: 'Juli', 7: 'Agustus', 8: 'September', 9: 'Oktober', 10: 'November', 11: 'Desember'
  };

  const sortedData = [...filteredData].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  
  const groupedData: { monthName: string; monthIndex: number; items: PenerimaanDana[] }[] = [];
  let currentMonth = -1;
  let currentGroup: { monthName: string; monthIndex: number; items: PenerimaanDana[] } | null = null;

  sortedData.forEach(d => {
    const m = new Date(d.tanggal).getMonth();
    if (m !== currentMonth || !currentGroup) {
      currentMonth = m;
      currentGroup = { monthName: BULAN_MAP[m], monthIndex: m, items: [] };
      groupedData.push(currentGroup);
    }
    currentGroup.items.push(d);
  });

  const handleExportCSV = () => {
    const rows: string[] = [];
    
    groupedData.forEach(group => {
      rows.push(`"--- BULAN: ${group.monthName.toUpperCase()} ---",,,,,`);
      rows.push('No,Tanggal,Diserahkan Oleh,Diterima Oleh,Jumlah,Keterangan');
      group.items.forEach((d, i) => {
        rows.push([
          i + 1, d.tanggal, `"${d.pemberi}"`, `"${d.penerima}"`, d.jumlah, `"${d.keterangan}"`
        ].join(','));
      });
      rows.push(',,,,,'); // Spacing antar bulan
    });

    if (groupedData.length === 0) {
      rows.push('Tidak ada data,,,,,');
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Penerimaan_Dana_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print-area">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-100">Penerimaan Dana</h1>
          <p className="text-slate-400 text-xs mt-1">Pencatatan dana yang diserahkan oleh Kwarcab atau Instansi lainnya.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><Download size={14} /> CSV</button>
          <button onClick={() => window.print()} className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><Printer size={14} /> Print</button>
          {role === 'Bendahara' && (
            <button onClick={() => { setShowForm(!showForm); if(showForm) setEditId(null); }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
              {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Batal' : 'Tambah'}
            </button>
          )}
        </div>
      </div>

      {/* Form Tambah/Edit */}
      {showForm && role === 'Bendahara' && (
        <div className={`glass-panel border-l-4 ${editId ? 'border-amber-500' : 'border-emerald-500'} p-6 relative no-print`}>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4">{editId ? 'Edit Catatan Dana' : 'Catat Penerimaan Dana Baru'}</h2>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Tanggal</label>
              <input type="date" required value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Jumlah Nominal</label>
              <input type="number" required value={jumlah} onChange={e => setJumlah(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: 1500000" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Diserahkan Oleh (Staff/Kwarcab)</label>
              <input type="text" required value={pemberi} onChange={e => setPemberi(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Nama Staff Kwarcab" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Diterima Oleh (Anggota DKC)</label>
              <input type="text" required value={penerima} onChange={e => setPenerima(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Nama Pengurus DKC" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Keterangan / Peruntukan</label>
              <textarea required rows={2} value={keterangan} onChange={e => setKeterangan(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Rincian dana..." />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Bukti Dokumentasi (Foto/Berita Acara)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-xs text-slate-400" />
              {buktiBase64 && <img src={buktiBase64} alt="Preview" className="h-20 mt-2 object-cover border border-slate-800" />}
            </div>
            <div className="md:col-span-2 flex justify-end mt-2"><button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 font-bold text-[10px] uppercase tracking-wider">{loading ? '...' : 'Simpan'}</button></div>
          </form>
        </div>
      )}

      {/* Print Layout */}
      <div className="hidden print-show mb-6 text-slate-900">
        <div className="text-center space-y-2 border-b-2 border-slate-800 pb-5 mb-4">
          <h2 className="text-xl font-bold uppercase tracking-wider">Laporan Penerimaan Dana Operasional</h2>
          <h3 className="text-sm font-semibold uppercase tracking-wide">Dari Kwarcab ke Dewan Kerja Cabang Cilacap</h3>
          <p className="text-xs">Periode: Semua data yang difilter</p>
        </div>

        <table className="w-full text-left border-collapse text-xs print-ledger-table" style={{ pageBreakInside: 'auto' }}>
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-900 font-bold uppercase">
              <th className="py-2 pr-2">No</th>
              <th className="py-2 px-2">Tanggal</th>
              <th className="py-2 px-2">Diserahkan Oleh</th>
              <th className="py-2 px-2">Diterima Oleh</th>
              <th className="py-2 px-2 text-right">Jumlah</th>
              <th className="py-2 px-2">Keterangan</th>
            </tr>
          </thead>
          {groupedData.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={6} className="py-4 text-center italic">Tidak ada catatan dana ditemukan.</td>
              </tr>
            </tbody>
          ) : (
            groupedData.map((group) => (
              <tbody key={group.monthIndex} style={{ pageBreakInside: 'avoid' }}>
                <tr className="bg-slate-200 border-y-2 border-slate-400">
                  <td colSpan={6} className="py-2 px-3 font-bold uppercase tracking-widest text-slate-800 text-center">
                    -- Bulan: {group.monthName} --
                  </td>
                </tr>
                {group.items.map((d, idx) => (
                  <tr key={d.id || idx} className="border-b border-slate-200" style={{ pageBreakInside: 'avoid' }}>
                    <td className="py-2 pr-2">{idx + 1}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{d.tanggal}</td>
                    <td className="py-2 px-2">{d.pemberi}</td>
                    <td className="py-2 px-2">{d.penerima}</td>
                    <td className="py-2 px-2 text-right">{formatIDR(d.jumlah)}</td>
                    <td className="py-2 px-2">{d.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            ))
          )}
        </table>
        <p className="text-[10px] text-slate-500 italic mt-4 text-right">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Table Data */}
      <div className="glass-panel geo-border p-5 no-print">
        <div className="mb-4 relative no-print">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input type="text" placeholder="Cari data..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-900 text-xs" />
        </div>
        
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800 text-slate-400 uppercase">
              <th className="py-2 pr-2">No</th>
              <th className="py-2 px-2">Tanggal</th>
              <th className="py-2 px-2">Diserahkan Oleh</th>
              <th className="py-2 px-2">Diterima Oleh</th>
              <th className="py-2 px-2 text-right">Jumlah</th>
              <th className="py-2 px-2">Keterangan</th>
              <th className="py-2 pl-2 text-center no-print">Aksi</th>
            </tr>
          </thead>
          {groupedData.length === 0 ? (
            <tbody><tr><td colSpan={7} className="py-8 text-center text-slate-500 italic">Tidak ada catatan dana ditemukan.</td></tr></tbody>
          ) : (
            groupedData.map((group) => (
              <tbody key={group.monthIndex}>
                <tr className="bg-slate-900 border-y border-slate-800">
                  <td colSpan={7} className="py-2 px-3 font-bold uppercase tracking-widest text-sky-400 text-[10px] text-center">
                    -- {group.monthName} --
                  </td>
                </tr>
                {group.items.map((d, idx) => (
                  <tr key={d.id || idx} className="border-b border-slate-800 hover:bg-slate-900/30">
                    <td className="py-2 pr-2">{idx + 1}</td>
                    <td className="py-2 px-2 whitespace-nowrap">{d.tanggal}</td>
                    <td className="py-2 px-2 font-semibold text-sky-400">{d.pemberi}</td>
                    <td className="py-2 px-2 text-slate-300">{d.penerima}</td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-400">{formatIDR(d.jumlah)}</td>
                    <td className="py-2 px-2">{d.keterangan}</td>
                    <td className="py-2 pl-2 text-center no-print">
                      <button onClick={() => setSelectedItem(d)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400"><Eye size={12} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))
          )}
        </table>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 no-print">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X size={16} /></button>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Rincian Penerimaan Dana</h3>
            <div className="space-y-3 text-xs mb-4">
              <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span className="font-bold">{selectedItem.tanggal}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Diserahkan Oleh (Kwarcab)</span><span>{selectedItem.pemberi}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Diterima Oleh (DKC)</span><span>{selectedItem.penerima}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Jumlah Dana</span><span className="font-bold text-emerald-400">{formatIDR(selectedItem.jumlah)}</span></div>
              <div className="flex flex-col gap-1 border-t border-slate-800 pt-2"><span className="text-slate-500">Keterangan:</span><p className="bg-slate-950 p-2 border border-slate-850">{selectedItem.keterangan}</p></div>
              <div className="border-t border-slate-800 pt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500">Bukti Dokumentasi:</span>
                  {role === 'Bendahara' && (
                    <div className="flex gap-2">
                      <button onClick={() => openEditForm(selectedItem)} className="px-2 py-1 bg-amber-600 text-[9px] uppercase font-bold text-white">Edit</button>
                      <button onClick={() => handleDelete(selectedItem.id)} className="px-2 py-1 bg-rose-600 text-[9px] uppercase font-bold text-white">Hapus</button>
                    </div>
                  )}
                </div>
                {selectedItem.buktiDokumentasi ? (
                  <div className="h-40 bg-slate-950 flex items-center justify-center border border-slate-800 overflow-hidden">
                    <img src={selectedItem.buktiDokumentasi} className="w-full h-full object-contain cursor-pointer" onClick={() => window.open(selectedItem.buktiDokumentasi)} alt="Bukti" />
                  </div>
                ) : (
                  <div className="h-16 bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 gap-2"><AlertCircle size={14} /> Kosong</div>
                )}
              </div>
            </div>
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
