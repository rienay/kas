export type UserRole = 'Bendahara' | 'Anggota' | 'Viewer';

export interface User {
  email: string;
  nama: string;
  role: UserRole;
}

export interface Transaksi {
  id: string;
  tanggal: string;
  jenis: 'Pemasukan' | 'Pengeluaran';
  kategori: string;
  jumlah: number;
  keterangan: string;
  buktiTransaksi?: string; // Base64 image data or drive link
  inputOleh: string;
}

export interface UtangPiutang {
  id: string;
  tanggal: string;
  tipe: 'Utang' | 'Piutang';
  nama: string;
  jumlah: number;
  keterangan: string;
  status: 'Lunas' | 'Belum Lunas';
  tanggalLunas?: string;
  buktiTransaksi?: string;
}

export interface KasAnggota {
  nama: string;
  janjiBayarPerBulan: number;
  pembayaran: {
    [tahun: number]: {
      [bulan: string]: {
        jumlah: number;
        tanggalBayar: string;
        status: 'Lunas' | 'Belum Bayar' | 'Dicicil';
      };
    };
  };
}

export interface DashboardData {
  saldoOnline: number;
  saldoOffline: number;
  totalUtang: number;
  totalPiutang: number;
  transaksiTerbaru: Transaksi[];
  statBulanan: {
    bulan: string;
    pemasukan: number;
    pengeluaran: number;
  }[];
}
