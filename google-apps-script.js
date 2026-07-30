/**
 * KAS DKC BACKEND ENGINE - GOOGLE APPS SCRIPT
 */

var GOOGLE_DRIVE_FOLDER_ID = ""; 

function renderJSON(responseObj) {
  return ContentService.createTextOutput(JSON.stringify(responseObj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return renderJSON({ 
    success: true, 
    message: "Koneksi API Kas DKC ke Google Sheets Berhasil Aktif!",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  // Mencegah tabrakan (Race Condition) jika 2 user input bersamaan
  var lock = LockService.getScriptLock();
  
  try {
    // Tunggu maksimal 10 detik jika ada proses lain yang sedang berjalan
    if (!lock.tryLock(10000)) {
      return renderJSON({ success: false, message: "Server sibuk memproses data lain. Silakan coba beberapa detik lagi." });
    }

    if (!e || !e.postData) {
      return renderJSON({ success: false, message: "TIDAK PERLU DIJALANKAN MANUAL: Fungsi ini dipanggil secara otomatis oleh aplikasi Frontend Anda." });
    }

    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initializeSheets(ss);

    switch (action) {
      case 'login': return handleLogin(ss, requestData.email, requestData.password);
      case 'getAllData': return handleGetAllData(ss);
      case 'addTransaksi': return handleAddTransaksi(ss, requestData.transaksi);
      case 'addUtangPiutang': return handleAddUtangPiutang(ss, requestData.utangPiutang);
      case 'bayarUtangPiutang': return handleBayarUtangPiutang(ss, requestData.id, requestData.tanggalLunas, requestData.buktiTransaksi, requestData.nominalBayar, requestData.mode);
      case 'updateKasAnggota': return handleUpdateKasAnggota(ss, requestData.nama, requestData.tahun, requestData.bulan, requestData.jumlah, requestData.tanggalBayar, requestData.metodeBayar);
      case 'editTransaksi': return handleEditTransaksi(ss, requestData.transaksi);
      case 'deleteTransaksi': return handleDeleteTransaksi(ss, requestData.id);
      case 'addAnggota': return handleAddAnggota(ss, requestData.nama, requestData.tahunMasuk, requestData.jabatan);
      case 'updateStatusAnggota': return handleUpdateStatusAnggota(ss, requestData.nama, requestData.tahunMasuk, requestData.statusAktif);
      case 'addPenerimaanDana': return handleAddPenerimaanDana(ss, requestData.penerimaanDana);
      case 'editPenerimaanDana': return handleEditPenerimaanDana(ss, requestData.penerimaanDana);
      case 'deletePenerimaanDana': return handleDeletePenerimaanDana(ss, requestData.id);
      case 'addPerjalananDinas': return handleAddPerjalananDinas(ss, requestData.perjalananDinas);
      case 'editPerjalananDinas': return handleEditPerjalananDinas(ss, requestData.perjalananDinas);
      case 'deletePerjalananDinas': return handleDeletePerjalananDinas(ss, requestData.id);
      default: return renderJSON({ success: false, message: "Aksi '" + action + "' tidak dikenali" });
    }
  } catch (err) {
    return renderJSON({ success: false, message: "Server Error: " + err.toString() });
  } finally {
    // Selalu lepaskan kunci setelah proses selesai atau error
    lock.releaseLock();
  }
}

function initializeSheets(ss) {
  var sheets = {
    'users': ['Email', 'Nama', 'Password', 'Role'],
    'transaksi': ['ID', 'Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Keterangan', 'Bukti Transaksi', 'Input Oleh'],
    'utang_piutang': ['ID', 'Tanggal', 'Tipe', 'Nama Pihak', 'Jumlah', 'Keterangan', 'Status', 'Tanggal Lunas', 'Bukti Transaksi', 'Jumlah Terbayar'],
    'kas_anggota': ['Nama Anggota', 'Bulan', 'Tahun', 'Jumlah Bayar', 'Tanggal Bayar', 'Status', 'Metode Bayar'],
    'master_anggota': ['Nama', 'Tahun Masuk', 'Jabatan', 'Status Aktif'],
    'penerimaan_dana': ['ID', 'Tanggal', 'Pemberi', 'Penerima', 'Jumlah', 'Keterangan', 'Bukti Dokumentasi', 'Input Oleh'],
    'perjalanan_dinas': ['ID', 'Nomor Surat', 'Tahun', 'Dasar Surat', 'Petugas (JSON)', 'Maksud', 'Hari Tanggal', 'Waktu', 'Tempat', 'Tempat Tujuan', 'Lama', 'Tgl Berangkat', 'Tgl Kembali', 'Kendaraan', 'Keterangan', 'Tgl Ditetapkan', 'Input Oleh', 'Surat Undangan URL']
  };

  for (var name in sheets) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      
      if (name === 'users') {
        sheet.appendRow(['bendaharadkckabcilacap@gmail.com', 'Bendahara Utama', 'bendaharadkc1101cilacap', 'Bendahara']);
        sheet.appendRow(['bendahara@dkc.org', 'Bendahara Utama (Demo)', 'admin123', 'Bendahara']);
        sheet.appendRow(['anggota@dkc.org', 'Anggota DKC', 'anggota123', 'Anggota']);
        sheet.appendRow(['viewer@dkc.org', 'Pimpinan / Kwarcab', 'viewer123', 'Viewer']);
      }
    }
  }
}

function handleLogin(ss, email, password) {
  var sheet = ss.getSheetByName('users');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    var dbEmail = data[i][0];
    var dbNama = data[i][1];
    var dbPassword = data[i][2];
    var dbRole = data[i][3];
    
    if (dbEmail.toLowerCase() === email.toLowerCase() && String(dbPassword) === password) {
      return renderJSON({
        success: true,
        user: { email: dbEmail, nama: dbNama, role: dbRole }
      });
    }
  }
  return renderJSON({ success: false, message: "Kredensial login salah!" });
}

function handleGetAllData(ss) {
  var tSheet = ss.getSheetByName('transaksi');
  var tData = tSheet.getDataRange().getValues();
  var transaksi = [];
  for (var i = 1; i < tData.length; i++) {
    transaksi.push({
      id: tData[i][0], tanggal: formatDate(tData[i][1]), jenis: tData[i][2], kategori: tData[i][3],
      jumlah: Number(tData[i][4]), keterangan: tData[i][5], buktiTransaksi: tData[i][6] || "", inputOleh: tData[i][7]
    });
  }
  transaksi.sort(function(a,b) { return b.tanggal.localeCompare(a.tanggal); });

  var upSheet = ss.getSheetByName('utang_piutang');
  var upData = upSheet.getDataRange().getValues();
  var utangPiutang = [];
  for (var i = 1; i < upData.length; i++) {
    utangPiutang.push({
      id: upData[i][0], tanggal: formatDate(upData[i][1]), tipe: upData[i][2], nama: upData[i][3],
      jumlah: Number(upData[i][4]), keterangan: upData[i][5], status: upData[i][6],
      tanggalLunas: upData[i][7] ? formatDate(upData[i][7]) : "", buktiTransaksi: upData[i][8] || "", jumlahTerbayar: Number(upData[i][9]) || 0
    });
  }

  var maSheet = ss.getSheetByName('master_anggota');
  var maData = maSheet ? maSheet.getDataRange().getValues() : [];
  var anggotaMeta = {};
  for (var i = 1; i < maData.length; i++) {
    var key = maData[i][0] + "_" + maData[i][1];
    anggotaMeta[key] = { nama: maData[i][0], tahunMasuk: maData[i][1], jabatan: maData[i][2], statusAktif: maData[i][3] || 'Aktif' };
  }

  var kasSheet = ss.getSheetByName('kas_anggota');
  var kasData = kasSheet.getDataRange().getValues();
  var kasMap = {};
  
  for (var i = 1; i < kasData.length; i++) {
    var nama = kasData[i][0], bulan = kasData[i][1], tahun = Number(kasData[i][2]);
    var jumlah = Number(kasData[i][3]), tanggal = kasData[i][4] ? formatDate(kasData[i][4]) : "", status = kasData[i][5];
    
    var keyK = nama + "_" + tahun;
    var meta = anggotaMeta[keyK];
    if (!kasMap[keyK]) kasMap[keyK] = { nama: nama, jabatan: meta ? meta.jabatan : "Anggota", tahunMasuk: tahun, statusAktif: meta ? meta.statusAktif : 'Aktif', janjiBayarPerBulan: 10000, pembayaran: {} }; // Default janjiBayar
    if (!kasMap[keyK].pembayaran[tahun]) kasMap[keyK].pembayaran[tahun] = {};
    kasMap[keyK].pembayaran[tahun][bulan] = { jumlah: jumlah, tanggalBayar: tanggal, status: status, metode: kasData[i][6] };
  }

  // Masukkan semua anggota ke list, walau belum ada record pembayaran
  for (var i = 1; i < maData.length; i++) {
    var namaM = maData[i][0], tahunM = Number(maData[i][1]);
    var keyM = namaM + "_" + tahunM;
    if (!kasMap[keyM]) {
      kasMap[keyM] = { nama: namaM, jabatan: maData[i][2], tahunMasuk: tahunM, statusAktif: maData[i][3] || 'Aktif', janjiBayarPerBulan: 10000, pembayaran: {} };
    }
  }

  var kasAnggota = Object.keys(kasMap).map(function(k) { return kasMap[k]; });

  if (kasAnggota.length === 0) {
    var uSheet = ss.getSheetByName('users');
    var uData = uSheet.getDataRange().getValues();
    for (var i = 1; i < uData.length; i++) {
      if (uData[i][3] === 'Anggota') {
        var initialPay = {};
        initialPay[new Date().getFullYear()] = {};
        kasAnggota.push({ nama: uData[i][1], jabatan: 'Anggota', tahunMasuk: new Date().getFullYear(), statusAktif: 'Aktif', janjiBayarPerBulan: 10000, pembayaran: initialPay });
      }
    }
  }

  var pdSheet = ss.getSheetByName('penerimaan_dana');
  var pdData = pdSheet ? pdSheet.getDataRange().getValues() : [];
  var penerimaanDana = [];
  for (var i = 1; i < pdData.length; i++) {
    penerimaanDana.push({
      id: pdData[i][0], tanggal: formatDate(pdData[i][1]), pemberi: pdData[i][2],
      penerima: pdData[i][3], jumlah: Number(pdData[i][4]), keterangan: pdData[i][5],
      buktiDokumentasi: pdData[i][6] || "", inputOleh: pdData[i][7]
    });
  }
  penerimaanDana.sort(function(a,b) { return b.tanggal.localeCompare(a.tanggal); });

  var sppdSheet = ss.getSheetByName('perjalanan_dinas');
  var sppdData = sppdSheet ? sppdSheet.getDataRange().getValues() : [];
  var perjalananDinas = [];
  for (var i = 1; i < sppdData.length; i++) {
    var petugasArr = [];
    try { petugasArr = JSON.parse(sppdData[i][4]); } catch(e) {}
    perjalananDinas.push({
      id: sppdData[i][0], nomorSurat: sppdData[i][1], tahun: String(sppdData[i][2]),
      dasarSurat: sppdData[i][3], petugas: petugasArr, maksudPerjalanan: sppdData[i][5],
      hariTanggal: sppdData[i][6], waktu: sppdData[i][7], tempat: sppdData[i][8],
      tempatTujuan: sppdData[i][9], lamaPerjalanan: sppdData[i][10], tanggalBerangkat: formatDate(sppdData[i][11]),
      tanggalKembali: formatDate(sppdData[i][12]), kendaraan: sppdData[i][13], keterangan: sppdData[i][14],
      tanggalDitetapkan: formatDate(sppdData[i][15]), inputOleh: sppdData[i][16], suratUndanganUrl: sppdData[i][17] || ""
    });
  }
  perjalananDinas.reverse(); // Terbaru di atas

  return renderJSON({ success: true, transaksi: transaksi, utangPiutang: utangPiutang, kasAnggota: kasAnggota, penerimaanDana: penerimaanDana, perjalananDinas: perjalananDinas });
}

function handleAddTransaksi(ss, tx) {
  var sheet = ss.getSheetByName('transaksi');
  var id = "TX-" + Utilities.getUuid().split('-')[0].toUpperCase();
  var buktiUrl = "";
  if (tx.buktiTransaksi && tx.buktiTransaksi.indexOf('base64,') > -1) {
    buktiUrl = saveFileToDrive(tx.buktiTransaksi, id + "_bukti_transaksi");
  }

  sheet.appendRow([id, tx.tanggal, tx.jenis, tx.kategori, tx.jumlah, tx.keterangan, buktiUrl, tx.inputOleh]);
  
  return renderJSON({
    success: true,
    transaksi: { id: id, tanggal: tx.tanggal, jenis: tx.jenis, kategori: tx.kategori, jumlah: tx.jumlah, keterangan: tx.keterangan, buktiTransaksi: buktiUrl, inputOleh: tx.inputOleh }
  });
}

function handleEditTransaksi(ss, tx) {
  var sheet = ss.getSheetByName('transaksi');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === tx.id) {
      var row = i + 1;
      var buktiUrl = data[i][6] || "";
      if (tx.buktiTransaksi && tx.buktiTransaksi.indexOf('base64,') > -1) {
        buktiUrl = saveFileToDrive(tx.buktiTransaksi, tx.id + "_bukti_edit");
      }
      // Perbarui cell tanpa menghapus ID & Input Oleh
      sheet.getRange(row, 2, 1, 6).setValues([[tx.tanggal, tx.jenis, tx.kategori, tx.jumlah, tx.keterangan, buktiUrl]]);
      return renderJSON({ success: true, transaksi: { id: tx.id, tanggal: tx.tanggal, jenis: tx.jenis, kategori: tx.kategori, jumlah: tx.jumlah, keterangan: tx.keterangan, buktiTransaksi: buktiUrl, inputOleh: data[i][7] } });
    }
  }
  return renderJSON({ success: false, message: "Transaksi tak ditemukan" });
}

function handleDeleteTransaksi(ss, id) {
  var sheet = ss.getSheetByName('transaksi');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return renderJSON({ success: true, id: id });
    }
  }
  return renderJSON({ success: false, message: "Transaksi tak ditemukan" });
}

function handleAddUtangPiutang(ss, up) {
  var sheet = ss.getSheetByName('utang_piutang');
  var id = "UP-" + Utilities.getUuid().split('-')[0].toUpperCase();
  sheet.appendRow([id, up.tanggal, up.tipe, up.nama, up.jumlah, up.keterangan, 'Belum Lunas', '', '', 0]);
  
  return renderJSON({
    success: true,
    utangPiutang: { id: id, tanggal: up.tanggal, tipe: up.tipe, nama: up.nama, jumlah: up.jumlah, keterangan: up.keterangan, status: 'Belum Lunas', jumlahTerbayar: 0 }
  });
}

function handleBayarUtangPiutang(ss, id, tanggalLunasInput, buktiBase64, nominalBayar, mode) {
  var sheet = ss.getSheetByName('utang_piutang');
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1, targetItem = null;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIndex = i + 1;
      targetItem = { id: data[i][0], tanggal: formatDate(data[i][1]), tipe: data[i][2], nama: data[i][3], jumlah: Number(data[i][4]), keterangan: data[i][5], status: data[i][6], tanggalLunas: data[i][7] ? formatDate(data[i][7]) : "", jumlahTerbayar: Number(data[i][9]) || 0 };
      break;
    }
  }

  if (rowIndex === -1 || !targetItem) return renderJSON({ success: false, message: "Data tidak ditemukan!" });

  var terbayar = targetItem.jumlahTerbayar || 0;
  var sisa = targetItem.jumlah - terbayar;
  var bayar = (mode === 'Lunas') ? sisa : Number(nominalBayar);
  if (bayar <= 0) return renderJSON({ success: false, message: "Nominal pembayaran tidak valid!" });

  var newTerbayar = terbayar + bayar;
  var newStatus = newTerbayar >= targetItem.jumlah ? 'Lunas' : 'Dicicil';

  var tanggalLunas = tanggalLunasInput || new Date().toISOString().split('T')[0];
  var buktiUrl = "";
  if (buktiBase64 && buktiBase64.indexOf('base64,') > -1) buktiUrl = saveFileToDrive(buktiBase64, id + "_pelunasan_" + tanggalLunas);

  sheet.getRange(rowIndex, 7).setValue(newStatus);
  if (newStatus === 'Lunas') {
    sheet.getRange(rowIndex, 8).setValue(tanggalLunas);
  }
  if (buktiUrl) sheet.getRange(rowIndex, 9).setValue(buktiUrl);
  sheet.getRange(rowIndex, 10).setValue(newTerbayar);

  var txKategori = targetItem.tipe === 'Utang' ? (mode === 'Cicil' ? 'Cicilan Utang' : 'Pelunasan Utang') : (mode === 'Cicil' ? 'Cicilan Piutang' : 'Pelunasan Piutang');
  var txJenis = targetItem.tipe === 'Utang' ? 'Pengeluaran' : 'Pemasukan';
  var tSheet = ss.getSheetByName('transaksi');
  var txId = "TX-" + Utilities.getUuid().split('-')[0].toUpperCase();
  
  tSheet.appendRow([txId, tanggalLunas, txJenis, txKategori, bayar, (mode === 'Cicil' ? "Cicilan " : "Pelunasan ") + targetItem.tipe + " a.n " + targetItem.nama + " (" + targetItem.keterangan + ")", buktiUrl, "Sistem"]);

  return renderJSON({
    success: true,
    utangPiutang: { id: id, tanggal: targetItem.tanggal, tipe: targetItem.tipe, nama: targetItem.nama, jumlah: targetItem.jumlah, keterangan: targetItem.keterangan, status: newStatus, tanggalLunas: newStatus === 'Lunas' ? tanggalLunas : targetItem.tanggalLunas, buktiTransaksi: buktiUrl || data[rowIndex-1][8], jumlahTerbayar: newTerbayar }
  });
}

function handleUpdateKasAnggota(ss, nama, tahun, bulan, jumlah, tanggalBayarInput, metodeBayar) {
  var sheet = ss.getSheetByName('kas_anggota');
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1, currentJumlah = 0;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === nama && data[i][1] === bulan && Number(data[i][2]) === Number(tahun)) {
      rowIndex = i + 1; currentJumlah = Number(data[i][3]); break;
    }
  }

  var tanggalBayar = tanggalBayarInput || new Date().toISOString().split('T')[0];
  var newJumlah = currentJumlah + jumlah;
  var status = newJumlah >= 10000 ? 'Lunas' : 'Dicicil';

  if (rowIndex > -1) {
    sheet.getRange(rowIndex, 4).setValue(newJumlah);
    sheet.getRange(rowIndex, 5).setValue(tanggalBayar);
    sheet.getRange(rowIndex, 6).setValue(status);
    sheet.getRange(rowIndex, 7).setValue(metodeBayar);
  } else {
    sheet.appendRow([nama, bulan, tahun, newJumlah, tanggalBayar, status, metodeBayar]);
  }

  if (jumlah > 0) {
    var tSheet = ss.getSheetByName('transaksi');
    var txId = "TX-" + Utilities.getUuid().split('-')[0].toUpperCase();
    tSheet.appendRow([txId, tanggalBayar, 'Pemasukan', 'Iuran Kas', jumlah, "Iuran Kas Anggota " + nama + " - Bulan " + bulan + " " + tahun, "", "Bendahara"]);
  }

  return handleGetAllData(ss);
}

function handleAddAnggota(ss, nama, tahunMasuk, jabatan) {
  var sheet = ss.getSheetByName('master_anggota');
  if (!sheet) { 
    sheet = ss.insertSheet('master_anggota');
    sheet.appendRow(['Nama', 'Tahun Masuk', 'Jabatan', 'Status Aktif']);
  }
  sheet.appendRow([nama, tahunMasuk, jabatan, 'Aktif']);
  return handleGetAllData(ss);
}

function handleUpdateStatusAnggota(ss, nama, tahun, statusAktif) {
  var sheet = ss.getSheetByName('master_anggota');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === nama && Number(data[i][1]) === Number(tahun)) {
        sheet.getRange(i + 1, 4).setValue(statusAktif);
        found = true;
        break;
      }
    }
    if (!found) sheet.appendRow([nama, tahun, 'Anggota', statusAktif]);
  } else {
    sheet = ss.insertSheet('master_anggota'); 
    sheet.appendRow(['Nama', 'Tahun Masuk', 'Jabatan', 'Status Aktif']); 
    sheet.appendRow([nama, tahun, 'Anggota', statusAktif]);
  }
  return handleGetAllData(ss);
}

function handleAddPenerimaanDana(ss, pd) {
  var sheet = ss.getSheetByName('penerimaan_dana');
  if(!sheet) { sheet = ss.insertSheet('penerimaan_dana'); sheet.appendRow(['ID', 'Tanggal', 'Pemberi', 'Penerima', 'Jumlah', 'Keterangan', 'Bukti Dokumentasi', 'Input Oleh']); }
  var id = "PD-" + Utilities.getUuid().split('-')[0].toUpperCase();
  var buktiUrl = "";
  if (pd.buktiDokumentasi && pd.buktiDokumentasi.indexOf('base64,') > -1) {
    buktiUrl = saveFileToDrive(pd.buktiDokumentasi, id + "_bukti");
  }
  sheet.appendRow([id, pd.tanggal, pd.pemberi, pd.penerima, pd.jumlah, pd.keterangan, buktiUrl, pd.inputOleh]);
  return renderJSON({ success: true, penerimaanDana: { id: id, tanggal: pd.tanggal, pemberi: pd.pemberi, penerima: pd.penerima, jumlah: pd.jumlah, keterangan: pd.keterangan, buktiDokumentasi: buktiUrl, inputOleh: pd.inputOleh } });
}

function handleEditPenerimaanDana(ss, pd) {
  var sheet = ss.getSheetByName('penerimaan_dana');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === pd.id) {
      var row = i + 1;
      var buktiUrl = data[i][6] || "";
      if (pd.buktiDokumentasi && pd.buktiDokumentasi.indexOf('base64,') > -1) {
        buktiUrl = saveFileToDrive(pd.buktiDokumentasi, pd.id + "_bukti_edit");
      }
      sheet.getRange(row, 2, 1, 6).setValues([[pd.tanggal, pd.pemberi, pd.penerima, pd.jumlah, pd.keterangan, buktiUrl]]);
      return renderJSON({ success: true, penerimaanDana: { id: pd.id, tanggal: pd.tanggal, pemberi: pd.pemberi, penerima: pd.penerima, jumlah: pd.jumlah, keterangan: pd.keterangan, buktiDokumentasi: buktiUrl, inputOleh: data[i][7] } });
    }
  }
  return renderJSON({ success: false, message: "Data tak ditemukan" });
}

function handleDeletePenerimaanDana(ss, id) {
  var sheet = ss.getSheetByName('penerimaan_dana');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return renderJSON({ success: true, id: id });
    }
  }
  return renderJSON({ success: false, message: "Data tak ditemukan" });
}

function handleAddPerjalananDinas(ss, pd) {
  var sheet = ss.getSheetByName('perjalanan_dinas');
  if(!sheet) { sheet = ss.insertSheet('perjalanan_dinas'); sheet.appendRow(['ID', 'Nomor Surat', 'Tahun', 'Dasar Surat', 'Petugas (JSON)', 'Maksud', 'Hari Tanggal', 'Waktu', 'Tempat', 'Tempat Tujuan', 'Lama', 'Tgl Berangkat', 'Tgl Kembali', 'Kendaraan', 'Keterangan', 'Tgl Ditetapkan', 'Input Oleh', 'Surat Undangan URL']); }
  var id = "SPPD-" + Utilities.getUuid().split('-')[0].toUpperCase();
  
  var suratUndanganUrl = "";
  if (pd.suratUndanganUrl && pd.suratUndanganUrl.indexOf('base64,') > -1) {
    suratUndanganUrl = saveFileToDrive(pd.suratUndanganUrl, id + "_surat_undangan");
  }

  sheet.appendRow([
    id, pd.nomorSurat, pd.tahun, pd.dasarSurat, JSON.stringify(pd.petugas), pd.maksudPerjalanan,
    pd.hariTanggal, pd.waktu, pd.tempat, pd.tempatTujuan, pd.lamaPerjalanan, pd.tanggalBerangkat,
    pd.tanggalKembali, pd.kendaraan, pd.keterangan, pd.tanggalDitetapkan, pd.inputOleh, suratUndanganUrl
  ]);
  pd.id = id;
  return renderJSON({ success: true, perjalananDinas: pd });
}

function handleEditPerjalananDinas(ss, pd) {
  var sheet = ss.getSheetByName('perjalanan_dinas');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === pd.id) {
      var row = i + 1;
      
      var suratUndanganUrl = data[i][17] || "";
      if (pd.suratUndanganUrl && pd.suratUndanganUrl.indexOf('base64,') > -1) {
        suratUndanganUrl = saveFileToDrive(pd.suratUndanganUrl, pd.id + "_surat_undangan_edit");
      }

      sheet.getRange(row, 2, 1, 17).setValues([[
        pd.nomorSurat, pd.tahun, pd.dasarSurat, JSON.stringify(pd.petugas), pd.maksudPerjalanan,
        pd.hariTanggal, pd.waktu, pd.tempat, pd.tempatTujuan, pd.lamaPerjalanan, pd.tanggalBerangkat,
        pd.tanggalKembali, pd.kendaraan, pd.keterangan, pd.tanggalDitetapkan, pd.inputOleh, suratUndanganUrl
      ]]);
      return renderJSON({ success: true, perjalananDinas: pd });
    }
  }
  return renderJSON({ success: false, message: "Data tak ditemukan" });
}

function handleDeletePerjalananDinas(ss, id) {
  var sheet = ss.getSheetByName('perjalanan_dinas');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return renderJSON({ success: true, id: id });
    }
  }
  return renderJSON({ success: false, message: "Data tak ditemukan" });
}

function saveFileToDrive(base64Data, filename) {
  try {
    if (!base64Data || base64Data.indexOf(';base64,') === -1) return "";
    
    var folder;
    if (GOOGLE_DRIVE_FOLDER_ID && GOOGLE_DRIVE_FOLDER_ID !== "") folder = DriveApp.getFolderById(GOOGLE_DRIVE_FOLDER_ID);
    else {
      var folders = DriveApp.getFoldersByName("Bukti Transaksi Kas DKC");
      if (folders.hasNext()) folder = folders.next();
      else folder = DriveApp.createFolder("Bukti Transaksi Kas DKC");
    }
    
    var parts = base64Data.split(';base64,');
    var blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), parts[0].split(':')[1], filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) { return ""; }
}

function formatDate(dateVal) {
  if (!dateVal) return "";
  try {
    var d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    var month = '' + (d.getMonth() + 1), day = '' + d.getDate(), year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  } catch (e) { return String(dateVal); }
}
