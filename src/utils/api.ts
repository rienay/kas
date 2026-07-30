import { Transaksi, UtangPiutang, KasAnggota, User, PenerimaanDana, PerjalananDinas } from '../types';

// Ambil URL Google Apps Script dengan fallback ke override LocalStorage agar user bisa setup langsung
const getScriptUrl = (): string => {
  const override = localStorage.getItem('kas_dkc_gas_url_override');
  if (override) return override.trim();
  return (import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbx6hipxrU7VFxEpdoNaoMoVVqcEJyb4P1ZWVqZ9N11ePn4WmXaUQm_ZtvbaVPbQrQxHOA/exec').trim();
};

// Cek apakah aplikasi berjalan dalam mode Demo
export const isDemoMode = () => !getScriptUrl();

// Initial Mock Data untuk Demo Mode
const INITIAL_TRANSAKSI: Transaksi[] = [
  { id: 'TX-001', tanggal: '2026-05-10', jenis: 'Pemasukan', kategori: 'Iuran Kas', jumlah: 500000, keterangan: 'Iuran wajib pengurus DKC Triwulan II', inputOleh: 'Kak Rian' },
  { id: 'TX-002', tanggal: '2026-05-12', jenis: 'Pengeluaran', kategori: 'Konsumsi', jumlah: 150000, keterangan: 'Konsumsi Rapat Pleno DKC', inputOleh: 'Kak Rian' },
  { id: 'TX-003', tanggal: '2026-05-15', jenis: 'Pemasukan', kategori: 'Sponsorship', jumlah: 1200000, keterangan: 'Dana sponsor dari Kwarda untuk Pelatihan', inputOleh: 'Kak Rian' },
  { id: 'TX-004', tanggal: '2026-05-18', jenis: 'Pengeluaran', kategori: 'Atribut', jumlah: 350000, keterangan: 'Cetak ID Card & Emblem DKC Baru', inputOleh: 'Kak Rian' },
  { id: 'TX-005', tanggal: '2026-05-20', jenis: 'Pemasukan', kategori: 'Iuran Kas', jumlah: 250000, keterangan: 'Pembayaran Kas Anggota a.n Kak Sarah', inputOleh: 'Kak Rian' }
];

const INITIAL_UTANG_PIUTANG: UtangPiutang[] = [
  { id: 'UP-001', tanggal: '2026-05-05', tipe: 'Utang', nama: 'Percetakan Jaya', jumlah: 450000, jumlahTerbayar: 150000, keterangan: 'Utang cetak baliho kegiatan Raimuna', status: 'Dicicil' },
  { id: 'UP-002', tanggal: '2026-05-08', tipe: 'Piutang', nama: 'Ambalan Sukarno', jumlah: 300000, jumlahTerbayar: 0, keterangan: 'Pinjam tenda & perlengkapan DKC oleh Ambalan', status: 'Belum Lunas' },
  { id: 'UP-003', tanggal: '2026-05-11', tipe: 'Utang', nama: 'Toko Pramuka', jumlah: 200000, jumlahTerbayar: 200000, keterangan: 'Beli tali & tongkat kepanduan', status: 'Lunas', tanggalLunas: '2026-05-16' }
];

const INITIAL_PENERIMAAN_DANA: PenerimaanDana[] = [
  { id: 'PD-001', tanggal: '2026-05-15', pemberi: 'Kak Budi (Staff Kwarcab)', penerima: 'Kak Rian', jumlah: 1200000, keterangan: 'Dana bantuan pelatihan dewan kerja', inputOleh: 'Kak Rian' },
  { id: 'PD-002', tanggal: '2026-06-10', pemberi: 'Kak Andika (Waka Binamuda)', penerima: 'Kak Sarah', jumlah: 2500000, keterangan: 'Subsidi kegiatan Raimuna', inputOleh: 'Kak Sarah' }
];

const INITIAL_SPPD: PerjalananDinas[] = [
  {
    id: 'SPPD-001',
    nomorSurat: '05',
    tahun: '2025',
    dasarSurat: 'Surat dari Yayasan Raden Fatah SMA Raden Fatah Cimanggu Nomor: 800/251/2025 tanggal 26 Desember 2025 perihal Permohonan Pemateri dari Dewan Kerja Cabang dan Unit Bantu Pertolongan Pramuka (UBALOKA).',
    petugas: [
      { nama: 'Tri Soma Ananta Rahman', jabatan: 'Anggota Dewan Kerja Cabang Cilacap' },
      { nama: 'Rico Setiawan', jabatan: 'Anggota Unit Bantu Pertolongan Pramuka (UBALOKA)' }
    ],
    maksudPerjalanan: 'Mengikuti Kegiatan Pendidikan dan Pelatihan (DIKLAT) Pengurus Osis dan Dewan Ambalan SMA Raden Fatah Cimanggu Tahun 2025.',
    hariTanggal: 'Selasa, 31 Desember 2025',
    waktu: 'Pukul 09.00 WIB s.d 12.00 WIB',
    tempat: 'SMA Raden Fatah Cimanggu',
    tempatTujuan: 'Cimanggu',
    lamaPerjalanan: '1 (satu) Hari',
    tanggalBerangkat: '31 Agustus 2025',
    tanggalKembali: '31 Agustus 2025',
    kendaraan: 'Kendaraan Pribadi',
    keterangan: 'Setelah selesai melaksanakan tugas agar melaporkan hasilnya',
    tanggalDitetapkan: 'Desember 2025',
    inputOleh: 'Sistem',
    suratUndanganUrl: ''
  }
];

const ANGGOTA_LIST = ['Kak Ahmad', 'Kak Sarah', 'Kak Budi', 'Kak Indah', 'Kak Rian', 'Kak Dian', 'Kak Yusuf', 'Kak Megawati'];
const BULAN_LIST = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const getInitialKasAnggota = (): KasAnggota[] => {
  return ANGGOTA_LIST.map(nama => {
    const currentYear = new Date().getFullYear();
    const pembayaran: KasAnggota['pembayaran'] = {
      [currentYear]: {}
    };
    
    // Acak pembayaran untuk demo
    BULAN_LIST.forEach((bulan, idx) => {
      if (idx < 4) { // Jan-Apr lunas
        pembayaran[currentYear][bulan] = {
          jumlah: 10000,
          tanggalBayar: `${currentYear}-0${idx + 1}-05`,
          status: 'Lunas',
          metode: 'Transfer'
        };
      } else if (idx === 4 && Math.random() > 0.4) { // Mei sebagian lunas
        pembayaran[currentYear][bulan] = {
          jumlah: 10000,
          tanggalBayar: `${currentYear}-05-10`,
          status: 'Lunas',
          metode: 'Offline'
        };
      } else {
        pembayaran[currentYear][bulan] = {
          jumlah: 0,
          tanggalBayar: '',
          status: 'Belum Bayar',
          metode: undefined
        };
      }
    });

    return {
      nama,
      jabatan: 'Anggota DKC',
      tahunMasuk: 2024,
      statusAktif: 'Aktif',
      janjiBayarPerBulan: 10000,
      pembayaran
    };
  });
};

// Helper untuk LocalStorage
const getStorage = <T>(key: string, initial: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : initial;
};

const setStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// State penampung local (Demo Mode)
let localTransaksi = getStorage<Transaksi[]>('kas_dkc_transaksi', INITIAL_TRANSAKSI);
let localUtangPiutang = getStorage<UtangPiutang[]>('kas_dkc_utang_piutang', INITIAL_UTANG_PIUTANG);
let localKasAnggota = getStorage<KasAnggota[]>('kas_dkc_kas_anggota', getInitialKasAnggota());
let localPenerimaanDana = getStorage<PenerimaanDana[]>('kas_dkc_penerimaan_dana', INITIAL_PENERIMAAN_DANA);
let localPerjalananDinas = getStorage<PerjalananDinas[]>('kas_dkc_perjalanan_dinas', INITIAL_SPPD);

// Fungsi POST Helper ke Google Apps Script
async function postToGAS(action: string, payload: object = {}) {
  if (isDemoMode()) {
    throw new Error('Aplikasi berjalan dalam Mode Demo (Tidak ada URL GAS)');
  }
  
  try {
    const response = await fetch(getScriptUrl(), {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain', // Menggunakan text/plain mencegah preflight CORS issues di GAS
      },
      body: JSON.stringify({ action, ...payload })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Terjadi kesalahan pada backend Apps Script');
    }
    return data;
  } catch (error: unknown) {
    console.error('GAS Request Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Failed to fetch')) {
      throw new Error(`Koneksi Gagal (Failed to fetch). Pastikan akses Google Script di-set ke "Anyone" (Siapa saja), atau coba "Reset URL" di menu Setup.`);
    }
    throw new Error(`Koneksi Backend Gagal: ${message}`);
  }
}

// SERVICE EXPORTS
export const api = {
  // 1. Authentikasi Login
  login: async (email: string, password: string): Promise<User> => {
    if (isDemoMode()) {
      // Demo authentication
      if ((email === 'bendahara@dkc.org' && password === 'admin123') || (email === 'bendarahadkckabcilacap@gmail.com' && password === 'bendaharadkc1101cilacap')) {
        const user: User = { email, nama: 'Bendahara Utama', role: 'Bendahara' };
        localStorage.setItem('kas_dkc_user', JSON.stringify(user));
        return user;
      } else if (email === 'anggota@dkc.org' && password === 'anggota123') {
        const user: User = { email, nama: 'Anggota DKC', role: 'Anggota' };
        localStorage.setItem('kas_dkc_user', JSON.stringify(user));
        return user;
      } else if (email === 'viewer@dkc.org' && password === 'viewer123') {
        const user: User = { email, nama: 'Pimpinan / Kwarcab', role: 'Viewer' };
        localStorage.setItem('kas_dkc_user', JSON.stringify(user));
        return user;
      } else {
        throw new Error('Email atau password salah! Silakan coba lagi.');
      }
    }

    const res = await postToGAS('login', { email, password });
    localStorage.setItem('kas_dkc_user', JSON.stringify(res.user));
    return res.user;
  },

  // 2. Mengambil Semua Data
  getAllData: async (): Promise<{
    transaksi: Transaksi[];
    utangPiutang: UtangPiutang[];
    kasAnggota: KasAnggota[];
    penerimaanDana: PenerimaanDana[];
    perjalananDinas: PerjalananDinas[];
  }> => {
    if (isDemoMode()) {
      return {
        transaksi: [...localTransaksi].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
        utangPiutang: [...localUtangPiutang].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
        kasAnggota: localKasAnggota,
        penerimaanDana: [...localPenerimaanDana].sort((a, b) => b.tanggal.localeCompare(a.tanggal)),
        perjalananDinas: localPerjalananDinas
      };
    }

    const res = await postToGAS('getAllData');
    
    // Normalisasi data transaksi dari Google Sheets untuk mencegah tipe data korup
    const normalizedTransaksi: Transaksi[] = (res.transaksi || []).map((t: any) => {
      // Normalisasi Jenis
      const jenisRaw = String(t.jenis || t.Jenis || '').trim().toUpperCase();
      const jenis: 'Pemasukan' | 'Pengeluaran' = (jenisRaw === 'IN' || jenisRaw === 'PEMASUKAN') ? 'Pemasukan' : 'Pengeluaran';

      // Normalisasi Jumlah & Keterangan jika terbalik di Sheets
      let rawJumlah = t.jumlah !== undefined ? t.jumlah : t.Jumlah;
      let rawKeterangan = t.keterangan !== undefined ? t.keterangan : t.Keterangan;
      
      let jumlah = 0;
      let keterangan = '';

      if (typeof rawJumlah === 'number') {
        jumlah = rawJumlah;
        keterangan = String(rawKeterangan || '');
      } else if (typeof rawKeterangan === 'number') {
        // Terbalik di Sheet
        jumlah = rawKeterangan;
        keterangan = String(rawJumlah || '');
      } else {
        const parsed = parseFloat(String(rawJumlah || '').replace(/[^0-9.-]+/g, ''));
        jumlah = isNaN(parsed) ? 0 : parsed;
        keterangan = String(rawKeterangan || '');
      }

      return {
        id: String(t.id || t.ID || ''),
        tanggal: String(t.tanggal || t.Tanggal || ''),
        jenis,
        kategori: String(t.kategori || t.Kategori || 'Lain-lain'),
        jumlah,
        keterangan,
        buktiTransaksi: String(t.buktiTransaksi || t['Bukti Transaksi'] || ''),
        inputOleh: String(t.inputOleh || t['Input Oleh'] || 'Sistem')
      };
    });

    return {
      transaksi: normalizedTransaksi,
      utangPiutang: res.utangPiutang || [],
      kasAnggota: res.kasAnggota || [],
      penerimaanDana: res.penerimaanDana || [],
      perjalananDinas: res.perjalananDinas || []
    };
  },

  // 3. Menambah Transaksi Baru
  addTransaksi: async (transaksi: Omit<Transaksi, 'id'>): Promise<Transaksi> => {
    if (isDemoMode()) {
      const newTx: Transaksi = {
        ...transaksi,
        id: `TX-${String(localTransaksi.length + 1).padStart(3, '0')}`
      };
      localTransaksi.unshift(newTx);
      setStorage('kas_dkc_transaksi', localTransaksi);
      return newTx;
    }

    const res = await postToGAS('addTransaksi', { transaksi });
    return res.transaksi;
  },

  editTransaksi: async (transaksi: Transaksi): Promise<Transaksi> => {
    if (isDemoMode()) {
      const idx = localTransaksi.findIndex(t => t.id === transaksi.id);
      if (idx === -1) throw new Error("Transaksi tidak ditemukan");
      localTransaksi[idx] = { ...localTransaksi[idx], ...transaksi };
      setStorage('kas_dkc_transaksi', localTransaksi);
      return localTransaksi[idx];
    }
    const res = await postToGAS('editTransaksi', { transaksi });
    return res.transaksi;
  },

  deleteTransaksi: async (id: string): Promise<string> => {
    if (isDemoMode()) {
      localTransaksi = localTransaksi.filter(t => t.id !== id);
      setStorage('kas_dkc_transaksi', localTransaksi);
      return id;
    }
    const res = await postToGAS('deleteTransaksi', { id });
    return res.id || id;
  },

  addAnggota: async (nama: string, tahunMasuk: number | string, jabatan: string): Promise<KasAnggota[]> => {
    if (isDemoMode()) {
      localKasAnggota.push({ nama, tahunMasuk, jabatan, statusAktif: 'Aktif', janjiBayarPerBulan: 10000, pembayaran: {} });
      setStorage('kas_dkc_kas_anggota', localKasAnggota);
      return localKasAnggota;
    }
    const res = await postToGAS('addAnggota', { nama, tahunMasuk, jabatan });
    return res.kasAnggota;
  },

  updateStatusAnggota: async (nama: string, tahunMasuk: number, statusAktif: 'Aktif' | 'Tidak Aktif'): Promise<KasAnggota[]> => {
    if (isDemoMode()) {
      localKasAnggota = localKasAnggota.map(a => (a.nama === nama && Number(a.tahunMasuk) === tahunMasuk) ? { ...a, statusAktif } : a);
      setStorage('kas_dkc_kas_anggota', localKasAnggota);
      return localKasAnggota;
    }
    const res = await postToGAS('updateStatusAnggota', { nama, tahunMasuk, statusAktif });
    return res.kasAnggota;
  },

  addPenerimaanDana: async (pd: Omit<PenerimaanDana, 'id'>): Promise<PenerimaanDana> => {
    if (isDemoMode()) {
      const newPd: PenerimaanDana = { ...pd, id: `PD-${String(localPenerimaanDana.length + 1).padStart(3, '0')}` };
      localPenerimaanDana.unshift(newPd);
      setStorage('kas_dkc_penerimaan_dana', localPenerimaanDana);
      return newPd;
    }
    const res = await postToGAS('addPenerimaanDana', { penerimaanDana: pd });
    return res.penerimaanDana;
  },

  editPenerimaanDana: async (pd: PenerimaanDana): Promise<PenerimaanDana> => {
    if (isDemoMode()) {
      const idx = localPenerimaanDana.findIndex(p => p.id === pd.id);
      if (idx === -1) throw new Error("Data tidak ditemukan");
      localPenerimaanDana[idx] = { ...localPenerimaanDana[idx], ...pd };
      setStorage('kas_dkc_penerimaan_dana', localPenerimaanDana);
      return localPenerimaanDana[idx];
    }
    const res = await postToGAS('editPenerimaanDana', { penerimaanDana: pd });
    return res.penerimaanDana;
  },

  deletePenerimaanDana: async (id: string): Promise<string> => {
    if (isDemoMode()) {
      localPenerimaanDana = localPenerimaanDana.filter(p => p.id !== id);
      setStorage('kas_dkc_penerimaan_dana', localPenerimaanDana);
      return id;
    }
    const res = await postToGAS('deletePenerimaanDana', { id });
    return res.id || id;
  },

  addPerjalananDinas: async (pd: Omit<PerjalananDinas, 'id'>): Promise<PerjalananDinas> => {
    if (isDemoMode()) {
      const newPd: PerjalananDinas = { ...pd, id: `SPPD-${String(localPerjalananDinas.length + 1).padStart(3, '0')}` };
      localPerjalananDinas.unshift(newPd);
      setStorage('kas_dkc_perjalanan_dinas', localPerjalananDinas);
      return newPd;
    }
    const res = await postToGAS('addPerjalananDinas', { perjalananDinas: pd });
    return res.perjalananDinas;
  },

  editPerjalananDinas: async (pd: PerjalananDinas): Promise<PerjalananDinas> => {
    if (isDemoMode()) {
      const idx = localPerjalananDinas.findIndex(p => p.id === pd.id);
      if (idx === -1) throw new Error("Data tidak ditemukan");
      localPerjalananDinas[idx] = { ...localPerjalananDinas[idx], ...pd };
      setStorage('kas_dkc_perjalanan_dinas', localPerjalananDinas);
      return localPerjalananDinas[idx];
    }
    const res = await postToGAS('editPerjalananDinas', { perjalananDinas: pd });
    return res.perjalananDinas;
  },

  deletePerjalananDinas: async (id: string): Promise<string> => {
    if (isDemoMode()) {
      localPerjalananDinas = localPerjalananDinas.filter(p => p.id !== id);
      setStorage('kas_dkc_perjalanan_dinas', localPerjalananDinas);
      return id;
    }
    const res = await postToGAS('deletePerjalananDinas', { id });
    return res.id || id;
  },

  // 4. Menambah Utang/Piutang Baru
  addUtangPiutang: async (data: Omit<UtangPiutang, 'id' | 'status'>): Promise<UtangPiutang> => {
    if (isDemoMode()) {
      const newUp: UtangPiutang = {
        ...data,
        id: `UP-${String(localUtangPiutang.length + 1).padStart(3, '0')}`,
        status: 'Belum Lunas',
        jumlahTerbayar: 0
      };
      localUtangPiutang.unshift(newUp);
      setStorage('kas_dkc_utang_piutang', localUtangPiutang);
      return newUp;
    }

    const res = await postToGAS('addUtangPiutang', { utangPiutang: data });
    return res.utangPiutang;
  },

  // 5. Melunasi Utang/Piutang
  bayarUtangPiutang: async (id: string, tanggalLunas: string, nominalBayar: number, mode: 'Lunas' | 'Cicil', buktiTransaksi?: string): Promise<UtangPiutang> => {
    if (isDemoMode()) {
      const idx = localUtangPiutang.findIndex(item => item.id === id);
      if (idx === -1) throw new Error('Data utang/piutang tidak ditemukan');
      
      const target = localUtangPiutang[idx];
      const terbayar = target.jumlahTerbayar || 0;
      const sisa = target.jumlah - terbayar;
      const bayar = mode === 'Lunas' ? sisa : nominalBayar;
      
      if (bayar <= 0) throw new Error("Nominal pembayaran tidak valid");

      const newTerbayar = terbayar + bayar;
      const newStatus = newTerbayar >= target.jumlah ? 'Lunas' : 'Dicicil';

      const updated = {
        ...target,
        status: newStatus as "Belum Lunas" | "Dicicil" | "Lunas",
        jumlahTerbayar: newTerbayar,
        tanggalLunas: newStatus === 'Lunas' ? (tanggalLunas || new Date().toISOString().split('T')[0]) : target.tanggalLunas,
        buktiTransaksi: buktiTransaksi || target.buktiTransaksi
      };
      
      const txKategori = target.tipe === 'Utang' ? (mode === 'Cicil' ? 'Cicilan Utang' : 'Pelunasan Utang') : (mode === 'Cicil' ? 'Cicilan Piutang' : 'Pelunasan Piutang');
      const txJenis = updated.tipe === 'Utang' ? 'Pengeluaran' : 'Pemasukan';
      const user = JSON.parse(localStorage.getItem('kas_dkc_user') || '{"nama":"Sistem"}');
      
      const newTx: Transaksi = {
        id: `TX-${String(localTransaksi.length + 1).padStart(3, '0')}`,
        tanggal: updated.tanggalLunas || new Date().toISOString().split('T')[0],
        jenis: txJenis,
        kategori: txKategori,
        jumlah: bayar,
        keterangan: `${mode === 'Cicil' ? 'Cicilan' : 'Pelunasan'} ${updated.tipe} a.n ${updated.nama} (${updated.keterangan})`,
        buktiTransaksi: updated.buktiTransaksi,
        inputOleh: user.nama
      };
      
      localTransaksi.unshift(newTx);
      setStorage('kas_dkc_transaksi', localTransaksi);

      localUtangPiutang[idx] = updated;
      setStorage('kas_dkc_utang_piutang', localUtangPiutang);
      return updated;
    }

    const res = await postToGAS('bayarUtangPiutang', { id, tanggalLunas, nominalBayar, mode, buktiTransaksi });
    return res.utangPiutang;
  },

  // 6. Mengupdate Kas Anggota
  updateKasAnggota: async (nama: string, tahun: number, bulan: string, jumlah: number, tanggalBayar: string, metodeBayar: 'Transfer' | 'Offline'): Promise<KasAnggota[]> => {
    if (isDemoMode()) {
      localKasAnggota = localKasAnggota.map(item => {
        if (item.nama === nama && Number(item.tahunMasuk) === tahun) {
          const pembayaranBulan = item.pembayaran[tahun]?.[bulan] || { jumlah: 0, status: 'Belum Bayar', tanggalBayar: '' };
          const newJumlah = pembayaranBulan.jumlah + jumlah;
          const status = newJumlah >= item.janjiBayarPerBulan ? 'Lunas' : newJumlah > 0 ? 'Dicicil' : 'Belum Bayar';
          
          const updatedPembayaran = {
            ...item.pembayaran,
            [tahun]: {
              ...(item.pembayaran[tahun] || {}),
              [bulan]: {
                jumlah: newJumlah,
              tanggalBayar: tanggalBayar || new Date().toISOString().split('T')[0],
                status: status as "Lunas" | "Belum Bayar" | "Dicicil",
                metode: metodeBayar
              }
            }
          };

          // Catat transaksi kas ke histori jika bayar > 0
          if (jumlah > 0) {
            const user = JSON.parse(localStorage.getItem('kas_dkc_user') || '{"nama":"Sistem"}');
            const newTx: Transaksi = {
              id: `TX-${String(localTransaksi.length + 1).padStart(3, '0')}`,
            tanggal: tanggalBayar || new Date().toISOString().split('T')[0],
              jenis: 'Pemasukan',
              kategori: 'Iuran Kas',
              jumlah: jumlah,
              keterangan: `Iuran Kas Anggota ${nama} - Bulan ${bulan} ${tahun}`,
              inputOleh: user.nama
            };
            localTransaksi.unshift(newTx);
            setStorage('kas_dkc_transaksi', localTransaksi);
          }

          return { ...item, pembayaran: updatedPembayaran };
        }
        return item;
      });
      
      setStorage('kas_dkc_kas_anggota', localKasAnggota);
      return localKasAnggota;
    }

    const res = await postToGAS('updateKasAnggota', { nama, tahun, bulan, jumlah, tanggalBayar, metodeBayar });
    return res.kasAnggota;
  },

  // Reset demo data jika diperlukan
  resetDemoData: () => {
    localStorage.removeItem('kas_dkc_transaksi');
    localStorage.removeItem('kas_dkc_utang_piutang');
    localStorage.removeItem('kas_dkc_kas_anggota');
    localStorage.removeItem('kas_dkc_penerimaan_dana');
    localStorage.removeItem('kas_dkc_perjalanan_dinas');
    localTransaksi = INITIAL_TRANSAKSI;
    localUtangPiutang = INITIAL_UTANG_PIUTANG;
    localKasAnggota = getInitialKasAnggota();
    localPenerimaanDana = INITIAL_PENERIMAAN_DANA;
    localPerjalananDinas = INITIAL_SPPD;
  }
};
