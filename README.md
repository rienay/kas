# Panduan Deployment & Setup Aplikasi Kas DKC

Aplikasi **Kas DKC** ini menggunakan React (Vite + TypeScript + Tailwind CSS v4) untuk frontend, dan Google Sheets (via Google Apps Script) sebagai backend database online gratis.

Ikuti petunjuk di bawah ini untuk menghubungkan aplikasi dan melakukan deployment agar dapat diakses oleh seluruh pengurus organisasi.

---

## BAGIAN 1: Setup Database Google Sheets & Apps Script

Langkah ini dilakukan untuk mengaktifkan database online sehingga transaksi tersimpan secara real-time.

1. **Buat Google Sheet Baru**:
   - Buka [Google Sheets](https://sheets.google.com) dan buat dokumen kosong baru.
   - Beri nama dokumen tersebut, misalnya `Database Kas DKC`.
   - *Catatan*: Anda tidak perlu membuat lembar kerja (sheets) secara manual. Script akan membuat sheet `users`, `transaksi`, `utang_piutang`, dan `kas_anggota` secara otomatis pada saat pertama kali dijalankan.

2. **Buka Apps Script**:
   - Di dalam Google Sheet Anda, klik menu **Extensions** (Ekstensi) > **Apps Script**.

3. **Tempelkan Kode Backend**:
   - Hapus semua kode default di dalam editor Apps Script.
   - Buka file [google-apps-script.js](file:///C:/Users/HP/.gemini/antigravity/scratch/kas-dkc/google-apps-script.js) dari proyek ini, salin seluruh kodenya, dan paste ke editor Apps Script.
   - Klik ikon **Save** (Simpan) atau tekan `Ctrl + S`.

4. **Lakukan Deployment Web App**:
   - Klik tombol **Deploy** di kanan atas, lalu pilih **New Deployment** (Penerapan Baru).
   - Klik ikon gerigi (Select Type) di sebelah tulisan "Configuration", pilih **Web App**.
   - Isi konfigurasi sebagai berikut:
     - **Description**: `Kas DKC API v1`
     - **Execute as**: `Me (email-anda@gmail.com)` (Ini penting agar script dapat mengedit sheet atas nama Anda).
     - **Who has access**: `Anyone` (Penting: pilih Anyone/Siapa saja agar aplikasi frontend dapat mengakses API secara publik).
   - Klik tombol **Deploy**.

5. **Salin URL Web App**:
   - Google akan meminta persetujuan akses berkas (Drive & Sheets). Klik **Authorize Access** dan setujui perizinan akun Google Anda (klik Advanced > Go to Untitled Project jika muncul peringatan tidak diverifikasi).
   - Setelah deployment selesai, Anda akan diberikan sebuah **Web App URL** yang formatnya seperti ini:
     `https://script.google.com/macros/s/AKfycbzffJiiU-VmD9cz6rMTkXWawayAksAhNyj6eZZ9obUQ74URi31qLJORp7laqnxARx41Pw/exec`
   - **Salin URL ini**, Anda akan membutuhkannya untuk konfigurasi frontend.

---

## BAGIAN 2: Menghubungkan Frontend ke Google Sheets

Anda dapat menghubungkan frontend dengan URL Web App tersebut dalam dua cara:

### Cara A: Melalui Menu Setup di Aplikasi (Rekomendasi untuk Uji Coba)
1. Buka website Kas DKC Anda.
2. Di pojok kiri bawah (desktop) atau bagian bawah menu (mobile), klik tombol **Setup**.
3. Tempelkan URL Web App yang telah Anda salin tadi ke input **Google Apps Script Web App URL**.
4. Klik **Simpan URL**. Halaman akan dimuat ulang, dan aplikasi sekarang terhubung langsung ke Google Sheets Anda!
5. Kredensial login default yang tersimpan di Google Sheets Anda adalah:
   - **Email Bendahara**: `bendahara@dkc.org` / Password: `admin123`
   - **Email Anggota**: `anggota@dkc.org` / Password: `anggota123`
   - **Email Pimpinan**: `viewer@dkc.org` / Password: `viewer123`
   *(Anda dapat langsung mengedit password atau menambahkan anggota baru di sheet `users` Google Sheets Anda).*

### Cara B: Melalui File Environment Variable (Sebelum Build)
Jika ingin menyematkan URL secara permanen sehingga pengguna tidak perlu melakukan Setup manual:
1. Buat file baru bernama `.env.local` (atau edit `.env`) di root folder proyek ini.
2. Tambahkan baris berikut dan masukkan URL Web App Anda:
   ```env
   VITE_GAS_URL="https://script.google.com/macros/s/AKfycbzffJiiU-VmD9cz6rMTkXWawayAksAhNyj6eZZ9obUQ74URi31qLJORp7laqnxARx41Pw/exec"
   ```
3. Jalankan build ulang aplikasi.

---

## BAGIAN 3: Menjalankan Aplikasi Secara Lokal

Pastikan Anda telah menginstal **Node.js** di komputer Anda, lalu buka terminal di folder proyek ini (`C:\Users\HP\.gemini\antigravity\scratch\kas-dkc`) dan jalankan perintah:

1. **Instal Dependensi**:
   ```bash
   npm install
   ```
2. **Jalankan Dev Server**:
   ```bash
   npm run dev
   ```
3. Buka browser di alamat `http://localhost:5173`.

---

## BAGIAN 4: Men-deploy Aplikasi ke Internet (Gratis)

Anda dapat mengunggah (deploy) aplikasi frontend ini secara gratis agar bisa diakses oleh bendahara dan anggota DKC di mana saja.

### Pilihan 1: Deploy ke Vercel (Sangat Mudah)
1. Buat akun gratis di [Vercel](https://vercel.com).
2. Instal Vercel CLI secara global di terminal Anda:
   ```bash
   npm install -g vercel
   ```
3. Jalankan perintah deploy di folder proyek ini:
   ```bash
   vercel
   ```
4. Ikuti instruksi di layar (pilih link project baru, gunakan setelan default).
5. Setelah selesai, Vercel akan memberikan link website aktif Anda (misalnya: `kas-dkc.vercel.app`).
6. Buka menu **Project Settings** di dashboard Vercel Anda, cari bagian **Environment Variables**, dan tambahkan:
   - Key: `VITE_GAS_URL`
   - Value: `(Salin URL Web App Google Apps Script Anda)`
7. Lakukan redeploy agar environment variable terbaca.

### Pilihan 2: Deploy ke Netlify
1. Buka [Netlify](https://www.netlify.com) dan masuk dengan akun Anda.
2. Jalankan perintah build lokal terlebih dahulu untuk menghasilkan folder `dist`:
   ```bash
   npm run build
   ```
3. Tarik dan lepas (drag-and-drop) folder `dist` yang dihasilkan ke area unggahan di dashboard Netlify.
4. Website Anda siap diakses secara online!
5. Konfigurasikan URL Apps Script menggunakan menu **Setup** langsung di website tersebut.
