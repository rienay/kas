export type UserRole = 'Bendahara' | 'Anggota' | 'Viewer';

export interface User {
  email: string;
  nama: string;
  role: UserRole;
}

export interface Transaksi {
  id?: string;
  tanggal: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  kategori: string;
  jumlah: number;
  keterangan: string;
  buktiTransaksi?: string;
  inputOleh: string;
}

export interface UtangPiutang {
  id?: string;
  tanggal: string;
  tipe: 'Utang' | 'Piutang';
  nama: string;
  jumlah: number;
  keterangan: string;
  status: 'Belum Lunas' | 'Dicicil' | 'Lunas';
  jumlahTerbayar?: number;
  tanggalLunas?: string;
  buktiTransaksi?: string;
}

export interface KasAnggota {
  nama: string;
  jabatan?: string;
  tahunMasuk?: number | string;
  statusAktif?: 'Aktif' | 'Tidak Aktif';
  janjiBayarPerBulan: number;
  pembayaran: {
    [tahun: number]: {
      [bulan: string]: {
        jumlah: number;
        tanggalBayar: string;
        status: 'Belum Bayar' | 'Dicicil' | 'Lunas';
        metode?: 'Transfer' | 'Offline';
      };
    };
  };
}

export interface PenerimaanDana {
  id?: string;
  tanggal: string;
  pemberi: string;
  penerima: string;
  jumlah: number;
  keterangan: string;
  buktiDokumentasi?: string;
  inputOleh: string;
}

export interface PetugasDinas {
  nama: string;
  jabatan: string;
}

export interface PerjalananDinas {
  id?: string;
  nomorSurat: string;
  tahun: string;
  dasarSurat: string;
  petugas: PetugasDinas[];
  maksudPerjalanan: string;
  hariTanggal: string;
  waktu: string;
  tempat: string;
  tempatTujuan: string;
  lamaPerjalanan: string;
  tanggalBerangkat: string;
  tanggalKembali: string;
  kendaraan: string;
  keterangan: string;
  tanggalDitetapkan: string;
  inputOleh: string;
  suratUndanganUrl?: string;
}