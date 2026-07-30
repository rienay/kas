import React, { useState } from 'react';
import { Search, Plus, Printer, X, Eye, Users, FileText, Trash2, Download } from 'lucide-react';
import { PerjalananDinas, UserRole } from '../types';

interface PerjalananDinasProps {
  role: UserRole;
  perjalananDinas: PerjalananDinas[];
  onAdd: (data: Omit<PerjalananDinas, 'id' | 'inputOleh'>) => Promise<void>;
  onEdit: (data: PerjalananDinas) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function PerjalananDinasComponent({ role, perjalananDinas, onAdd, onEdit, onDelete }: PerjalananDinasProps) {
  
  // Ekspor Excel (CSV) untuk Semua Data
  const handleExportExcel = () => {
    const rows: string[] = [];
    rows.push('No,Nomor Surat,Tahun,Maksud Perjalanan,Petugas Ditugaskan,Tempat,Tempat Tujuan,Tanggal Berangkat,Tanggal Kembali,Lama,Kendaraan');
    perjalananDinas.forEach((d, i) => {
      const petugasStr = d.petugas.map(p => p.nama).join('; ');
      rows.push([
        i + 1,
        `"${d.nomorSurat}"`,
        `"${d.tahun}"`,
        `"${d.maksudPerjalanan.replace(/"/g, '""')}"`,
        `"${petugasStr}"`,
        `"${d.tempat}"`,
        `"${d.tempatTujuan}"`,
        `"${d.tanggalBerangkat}"`,
        `"${d.tanggalKembali}"`,
        `"${d.lamaPerjalanan}"`,
        `"${d.kendaraan}"`
      ].join(','));
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Rekap_SPPD_DKC_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  // Cetak PDF seluruh data Perjalanan Dinas
  const handlePrintAll = () => {
    setTimeout(() => {
      window.print();
    }, 200);
  };
  const [searchTerm, setSearchTerm] = useState('');
  
  // State Form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [nomorSurat, setNomorSurat] = useState('');
  const [tahun, setTahun] = useState(new Date().getFullYear().toString());
  const [dasarSurat, setDasarSurat] = useState('');
  const [petugas, setPetugas] = useState([{ nama: '', jabatan: '' }]);
  const [maksudPerjalanan, setMaksudPerjalanan] = useState('');
  const [hariTanggal, setHariTanggal] = useState('');
  const [waktu, setWaktu] = useState('');
  const [tempat, setTempat] = useState('');
  const [tempatTujuan, setTempatTujuan] = useState('');
  const [lamaPerjalanan, setLamaPerjalanan] = useState('');
  const [tanggalBerangkat, setTanggalBerangkat] = useState('');
  const [tanggalKembali, setTanggalKembali] = useState('');
  const [kendaraan, setKendaraan] = useState('Kendaraan Pribadi');
  const [keterangan, setKeterangan] = useState('Setelah selesai melaksanakan tugas untuk dapat melaporkan hasil kegiatan');
  const [tanggalDitetapkan, setTanggalDitetapkan] = useState('');
  
  const [suratUndanganBase64, setSuratUndanganBase64] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PerjalananDinas | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setSuratUndanganBase64(reader.result as string);
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
          setSuratUndanganBase64(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPetugas = () => setPetugas([...petugas, { nama: '', jabatan: '' }]);
  const handleRemovePetugas = (index: number) => setPetugas(petugas.filter((_, i) => i !== index));
  const handlePetugasChange = (index: number, field: 'nama' | 'jabatan', value: string) => {
    const newPetugas = [...petugas];
    newPetugas[index][field] = value;
    setPetugas(newPetugas);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const pdData = {
      nomorSurat, tahun, dasarSurat, petugas, maksudPerjalanan, hariTanggal, waktu, tempat,
      tempatTujuan, lamaPerjalanan, tanggalBerangkat, tanggalKembali, kendaraan, keterangan, tanggalDitetapkan, suratUndanganUrl: suratUndanganBase64
    };

    try {
      if (editId) {
        await onEdit({ id: editId, ...pdData, inputOleh: '' });
      } else {
        await onAdd(pdData);
      }
      setShowForm(false);
      resetForm();
    } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Gagal menyimpan SPPD'); } 
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setEditId(null);
    setNomorSurat(''); setDasarSurat(''); setPetugas([{ nama: '', jabatan: '' }]);
    setMaksudPerjalanan(''); setHariTanggal(''); setWaktu(''); setTempat(''); setTempatTujuan('');
    setLamaPerjalanan(''); setTanggalBerangkat(''); setTanggalKembali('');
    setKendaraan('Kendaraan Pribadi'); setTanggalDitetapkan('');
    setKeterangan('Setelah selesai melaksanakan tugas untuk dapat melaporkan hasil kegiatan');
    setSuratUndanganBase64('');
  };

  const openEditForm = (item: PerjalananDinas) => {
    setEditId(item.id || null);
    setNomorSurat(item.nomorSurat); setTahun(item.tahun); setDasarSurat(item.dasarSurat);
    setPetugas(item.petugas && item.petugas.length > 0 ? item.petugas : [{ nama: '', jabatan: '' }]);
    setMaksudPerjalanan(item.maksudPerjalanan); setHariTanggal(item.hariTanggal);
    setWaktu(item.waktu); setTempat(item.tempat); setTempatTujuan(item.tempatTujuan);
    setLamaPerjalanan(item.lamaPerjalanan); setTanggalBerangkat(item.tanggalBerangkat);
    setTanggalKembali(item.tanggalKembali); setKendaraan(item.kendaraan);
    setKeterangan(item.keterangan); setTanggalDitetapkan(item.tanggalDitetapkan);
    setSuratUndanganBase64(item.suratUndanganUrl || '');
    setShowForm(true); setSelectedItem(null);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (window.confirm('Yakin menghapus arsip SPPD ini?')) {
      await onDelete(id);
      setSelectedItem(null);
    }
  };

  const filteredData = perjalananDinas.filter(d => 
    d.maksudPerjalanan.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.tempat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.petugas.some(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // EKSPOR KE WORD (.doc)
  const exportToWord = (item: PerjalananDinas) => {
    const content = document.getElementById(`print-template-${item.id}`)?.innerHTML;
    if (!content) return;
    
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export Doc</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; color: black; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .underline { text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; }
      td { vertical-align: top; padding: 2px 5px; }
      .border-table td, .border-table th { border: 1px solid black; }
      .kop-surat { border-bottom: 3px solid black; margin-bottom: 20px; padding-bottom: 10px; text-align: center; }
      .page-break { page-break-before: always; }
    </style></head><body>`;
    
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SPPD_${item.nomorSurat}_${item.tahun}.doc`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 print-area">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-slate-100">Perjalanan Dinas (SPPD)</h1>
          <p className="text-slate-400 text-xs mt-1">Arsip dan cetak Surat Tugas serta Surat Perintah Perjalanan Dinas (SPPD).</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportExcel} className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
            <Download size={14} /> CSV / Excel
          </button>
          {(role === 'Bendahara' || role === 'Anggota') && (
            <>
              <button onClick={() => { setShowForm(!showForm); if(showForm) resetForm(); }} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? 'Batal' : 'Buat SPPD Baru'}
              </button>
              <button onClick={handlePrintAll} className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                <Printer size={14} /> Cetak PDF Semua Data
              </button>
            </>
          )}
        </div>
      </div>

      {/* Form Tambah/Edit */}
      {showForm && (role === 'Bendahara' || role === 'Anggota') && (
        <div className="glass-panel border-l-4 border-l-sky-500 p-6 relative no-print mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">{editId ? 'Edit SPPD' : 'Buat Surat Tugas & SPPD Baru'}</h2>
          <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            
            {/* Nomor & Tahun */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Nomor & Tahun Surat</label>
              <div className="flex gap-2">
                <input type="text" required value={nomorSurat} onChange={e => setNomorSurat(e.target.value)} className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: 05" />
                <input type="text" required value={tahun} onChange={e => setTahun(e.target.value)} className="w-1/2 px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: 2025" />
              </div>
            </div>
            
            {/* Dasar Surat */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Dasar Surat / Undangan</label>
              <textarea required rows={2} value={dasarSurat} onChange={e => setDasarSurat(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs leading-relaxed" placeholder="Contoh: Surat dari Yayasan Raden Fatah Nomor: 800/251/2025 tanggal 26 Desember 2025 perihal..." />
            </div>

            {/* Petugas Ditugaskan (Dynamic) */}
            <div className="space-y-2 md:col-span-2 border border-slate-800 p-4 bg-slate-900/30">
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Daftar Petugas Ditugaskan</label>
                <button type="button" onClick={handleAddPetugas} className="px-2 py-1 bg-slate-800 text-xs text-sky-400 font-bold">+ Tambah Petugas</button>
              </div>
              {petugas.map((p, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <input type="text" required value={p.nama} onChange={e => handlePetugasChange(index, 'nama', e.target.value)} className="w-[45%] px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Nama Lengkap" />
                  <input type="text" required value={p.jabatan} onChange={e => handlePetugasChange(index, 'jabatan', e.target.value)} className="w-[45%] px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Jabatan Pramuka" />
                  {petugas.length > 1 && (
                    <button type="button" onClick={() => handleRemovePetugas(index)} className="p-2 text-rose-500 hover:bg-slate-800 border border-transparent hover:border-slate-700 mt-0.5"><Trash2 size={14}/></button>
                  )}
                </div>
              ))}
            </div>

            {/* Pelaksanaan Kegiatan */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Untuk / Maksud Perjalanan</label>
              <textarea required rows={2} value={maksudPerjalanan} onChange={e => setMaksudPerjalanan(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: Mengikuti Kegiatan Pendidikan dan Pelatihan (DIKLAT)..." />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Hari, Tanggal Kegiatan</label>
              <input type="text" required value={hariTanggal} onChange={e => setHariTanggal(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: Selasa, 31 Desember 2025" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Waktu Kegiatan</label>
              <input type="text" required value={waktu} onChange={e => setWaktu(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: Pukul 09.00 WIB s.d Selesai" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Tempat Kegiatan</label>
              <input type="text" required value={tempat} onChange={e => setTempat(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: SMA Raden Fatah Cimanggu" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Tempat Tujuan (Kota/Kec)</label>
              <input type="text" required value={tempatTujuan} onChange={e => setTempatTujuan(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: Cimanggu" />
            </div>

            {/* Detail SPPD */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Tanggal Berangkat</label>
              <input type="text" required value={tanggalBerangkat} onChange={e => setTanggalBerangkat(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: 31 Agustus 2025" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Tanggal Kembali</label>
              <input type="text" required value={tanggalKembali} onChange={e => setTanggalKembali(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: 31 Agustus 2025" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Lama Perjalanan</label>
              <input type="text" required value={lamaPerjalanan} onChange={e => setLamaPerjalanan(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: 1 (satu) Hari" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Kendaraan</label>
              <input type="text" required value={kendaraan} onChange={e => setKendaraan(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: Kendaraan Pribadi" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Keterangan Lain</label>
              <input type="text" required value={keterangan} onChange={e => setKeterangan(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-slate-400">Tanggal Ditetapkan TTD</label>
              <input type="text" required value={tanggalDitetapkan} onChange={e => setTanggalDitetapkan(e.target.value)} className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs" placeholder="Contoh: Desember 2025" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-400">Upload Surat Undangan (Opsional)</label>
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                onChange={handleFileChange}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-1 file:px-2 file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-300 hover:file:bg-slate-700"
              />
            </div>

            <div className="md:col-span-2 flex justify-end mt-4 pt-4 border-t border-slate-800">
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider">{loading ? 'Menyimpan...' : 'Simpan SPPD'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Table Data */}
      <div className="glass-panel geo-border p-5 no-print">
        <div className="mb-4 relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input type="text" placeholder="Cari SPPD berdasarkan kegiatan, tempat, nama petugas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-900 text-xs" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-400 uppercase">
                <th className="py-2 pr-2">Nomor</th>
                <th className="py-2 px-2">Kegiatan / Maksud</th>
                <th className="py-2 px-2">Petugas Ditugaskan</th>
                <th className="py-2 px-2">Waktu & Tempat</th>
                <th className="py-2 pl-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500 italic">Belum ada arsip SPPD.</td></tr>
              ) : (
                filteredData.map((d, idx) => (
                  <tr key={d.id || idx} className="border-b border-slate-800 hover:bg-slate-900/30">
                    <td className="py-3 pr-2 font-mono text-sky-400 whitespace-nowrap">{d.nomorSurat} / {d.tahun}</td>
                    <td className="py-3 px-2 text-slate-300 font-medium max-w-xs truncate" title={d.maksudPerjalanan}>{d.maksudPerjalanan}</td>
                    <td className="py-3 px-2 text-emerald-400">
                      {d.petugas[0]?.nama} {d.petugas.length > 1 && <span className="text-slate-500 text-[10px] border border-slate-700 px-1 ml-1 rounded">+{d.petugas.length - 1} org</span>}
                    </td>
                    <td className="py-3 px-2 text-slate-400">{d.hariTanggal}<br/><span className="text-[10px] text-slate-500">{d.tempat}</span></td>
                    <td className="py-3 pl-2 text-center">
                      <button onClick={() => setSelectedItem(d)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400" title="Buka Detail & Cetak"><Eye size={14} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal & Print Preview Trigger */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"><X size={18} /></button>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-2"><FileText size={16} className="text-sky-500"/> Arsip Perjalanan Dinas</h3>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs mb-6 bg-slate-950 p-4 border border-slate-800">
              <div><span className="text-slate-500 block mb-0.5">Nomor Surat:</span> <span className="font-mono text-sky-400 text-sm">{selectedItem.nomorSurat} / Tahun {selectedItem.tahun}</span></div>
              <div><span className="text-slate-500 block mb-0.5">Tanggal Berangkat:</span> <span className="text-slate-200">{selectedItem.tanggalBerangkat}</span></div>
              <div className="col-span-2"><span className="text-slate-500 block mb-0.5">Maksud Perjalanan:</span> <span className="text-slate-200">{selectedItem.maksudPerjalanan}</span></div>
              <div className="col-span-2"><span className="text-slate-500 block mb-0.5">Tempat:</span> <span className="text-slate-200">{selectedItem.tempat}</span></div>
            </div>

            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 block">Daftar Petugas ({selectedItem.petugas.length} Orang)</span>
              <div className="space-y-1">
                {selectedItem.petugas.map((p, i) => (
                  <div key={i} className="flex gap-2 text-xs bg-slate-900 border border-slate-800 p-2"><Users size={14} className="text-emerald-500 mt-0.5"/><div className="flex-1"><div className="font-bold text-slate-200">{p.nama}</div><div className="text-[10px] text-slate-500 uppercase">{p.jabatan}</div></div></div>
                ))}
              </div>
            </div>

            {selectedItem.suratUndanganUrl && (
              <div className="mb-6">
                <a href={selectedItem.suratUndanganUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-sky-400 hover:underline flex items-center gap-2"><FileText size={14}/> Lihat Surat Undangan Terlampir</a>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800 no-print">
              <button onClick={() => exportToWord(selectedItem)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 font-bold text-xs uppercase flex items-center gap-2 text-white"><Download size={14} /> Unduh (.doc)</button>
              {(role === 'Bendahara' || role === 'Anggota') && (
                <button onClick={() => openEditForm(selectedItem)} className="px-4 py-2 bg-amber-600 hover:bg-amber-500 font-bold text-xs uppercase flex items-center gap-2 text-white ml-auto">Edit</button>
              )}
              {role === 'Bendahara' && (
                <button onClick={() => handleDelete(selectedItem.id)} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 font-bold text-xs uppercase flex items-center gap-2 text-white">Hapus</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY TABLE: Semua Data Perjalanan Dinas */}
      <div className="hidden print-show bg-white text-black text-[11pt] font-sans leading-snug w-full max-w-[215mm] mx-auto print-ledger-table" style={{ fontFamily: 'Arial, Helvetica, sans-serif', color: 'black', pageBreakInside: 'auto' }}>
        <h2 className="text-xl font-bold mb-4 text-center uppercase tracking-wider">Rekapitulasi Perjalanan Dinas (SPPD)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <thead>
            <tr style={{ background: '#eee' }}>
              <th style={{ border: '1px solid #222', padding: '4px' }}>No</th>
              <th style={{ border: '1px solid #222', padding: '4px' }}>Nomor</th>
              <th style={{ border: '1px solid #222', padding: '4px' }}>Kegiatan / Maksud</th>
              <th style={{ border: '1px solid #222', padding: '4px' }}>Petugas</th>
              <th style={{ border: '1px solid #222', padding: '4px' }}>Tanggal</th>
              <th style={{ border: '1px solid #222', padding: '4px' }}>Tempat</th>
            </tr>
          </thead>
          <tbody>
            {perjalananDinas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ border: '1px solid #222', padding: '4px', textAlign: 'center', fontStyle: 'italic' }}>Tidak ada data perjalanan dinas</td>
              </tr>
            ) : (
              perjalananDinas.map((d, idx) => (
                <tr key={d.id || idx} style={{ pageBreakInside: 'avoid' }}>
                  <td style={{ border: '1px solid #222', padding: '4px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #222', padding: '4px' }}>{d.nomorSurat} / {d.tahun}</td>
                  <td style={{ border: '1px solid #222', padding: '4px' }}>{d.maksudPerjalanan}</td>
                  <td style={{ border: '1px solid #222', padding: '4px' }}>{d.petugas.map(p => p.nama).join(', ')}</td>
                  <td style={{ border: '1px solid #222', padding: '4px' }}>{d.hariTanggal}</td>
                  <td style={{ border: '1px solid #222', padding: '4px' }}>{d.tempat}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="text-xs text-right mt-4">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      {/* Template HTML Tersembunyi untuk Export ke Word (.doc) yang sebelumnya hilang */}
      <div className="hidden">
        {perjalananDinas.map(item => (
          <div key={item.id} id={`print-template-${item.id}`}>
            <div style={{ textAlign: 'center', borderBottom: '3px solid black', marginBottom: '20px', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>GERAKAN PRAMUKA</h3>
              <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 'bold' }}>KWARTIR CABANG CILACAP</h2>
              <h3 style={{ margin: 0, fontSize: '14pt', fontWeight: 'bold' }}>DEWAN KERJA CABANG</h3>
            </div>
            <h3 style={{ textAlign: 'center', textDecoration: 'underline', marginBottom: '5px' }}>SURAT TUGAS</h3>
            <p style={{ textAlign: 'center', marginTop: 0 }}>Nomor: {item.nomorSurat} / Tahun {item.tahun}</p>
            <br />
            <table style={{ width: '100%', marginBottom: '20px' }}>
              <tbody>
                <tr><td style={{ width: '120px', verticalAlign: 'top' }}>Dasar</td><td style={{ width: '10px', verticalAlign: 'top' }}>:</td><td>{item.dasarSurat}</td></tr>
              </tbody>
            </table>
            <p style={{ textAlign: 'center', fontWeight: 'bold' }}>MENGUTUS / MENUGASKAN :</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid black', padding: '5px' }}>No</th>
                  <th style={{ border: '1px solid black', padding: '5px' }}>Nama</th>
                  <th style={{ border: '1px solid black', padding: '5px' }}>Jabatan</th>
                </tr>
              </thead>
              <tbody>
                {item.petugas.map((p, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid black', padding: '5px' }}>{p.nama}</td>
                    <td style={{ border: '1px solid black', padding: '5px' }}>{p.jabatan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr><td style={{ width: '120px', verticalAlign: 'top' }}>Untuk</td><td style={{ width: '10px', verticalAlign: 'top' }}>:</td><td>{item.maksudPerjalanan}</td></tr>
                <tr><td style={{ verticalAlign: 'top' }}>Hari, Tanggal</td><td style={{ verticalAlign: 'top' }}>:</td><td>{item.hariTanggal}</td></tr>
                <tr><td style={{ verticalAlign: 'top' }}>Waktu</td><td style={{ verticalAlign: 'top' }}>:</td><td>{item.waktu}</td></tr>
                <tr><td style={{ verticalAlign: 'top' }}>Tempat</td><td style={{ verticalAlign: 'top' }}>:</td><td>{item.tempat}</td></tr>
                <tr><td style={{ verticalAlign: 'top' }}>Keterangan</td><td style={{ verticalAlign: 'top' }}>:</td><td>{item.keterangan}</td></tr>
              </tbody>
            </table>
            <br/><br/>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
              <div style={{ width: '250px', float: 'right' }}>
                <p style={{ margin: 0 }}>Ditetapkan di: Cilacap<br/>Pada tanggal: {item.tanggalDitetapkan}</p>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Dewan Kerja Cabang Cilacap<br/>Ketua,</p>
                <br/><br/><br/><br/>
                <p style={{ margin: 0, fontWeight: 'bold', textDecoration: 'underline' }}>_________________________</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @media print { 
          @page { size: 215mm 330mm; margin: 0mm; }
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
