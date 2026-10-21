// Pendaftaran anggota - data disimpan di localStorage
const STORAGE_KEY = "libraryreg_anggota";

function ambilAnggota() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function simpanAnggota(daftar) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(daftar));
    return true;
  } catch (e) {
    return false;
  }
}

const form = document.getElementById("formDaftar");
const notif = document.getElementById("notif");
const fields = ["nama", "nim", "prodi", "jenis", "telepon", "email", "alamat"];

function setError(id, pesan) {
  const el = document.getElementById(id);
  el.classList.add("is-invalid");
  el.classList.remove("is-valid");
  el.nextElementSibling.textContent = pesan;
}

function setValid(id) {
  const el = document.getElementById(id);
  el.classList.remove("is-invalid");
  el.classList.add("is-valid");
}

function validasi() {
  const v = {};
  fields.forEach(id => { v[id] = document.getElementById(id).value.trim(); });
  let ok = true;

  const cek = (id, kondisi, pesan) => {
    if (kondisi) { setError(id, pesan); ok = false; } else { setValid(id); }
  };

  cek("nama", v.nama.length < 3, "Nama lengkap wajib diisi (minimal 3 huruf).");

  if (!v.nim) {
    cek("nim", true, "NIM/NIP wajib diisi.");
  } else if (!/^\d{5,20}$/.test(v.nim)) {
    cek("nim", true, "NIM/NIP hanya boleh angka, 5 sampai 20 digit.");
  } else {
    const sudahAda = ambilAnggota().some(a => a.nim === v.nim);
    cek("nim", sudahAda, "NIM/NIP ini sudah terdaftar.");
  }

  cek("prodi", !v.prodi, "Pilih program studi.");
  cek("jenis", !v.jenis, "Pilih jenis keanggotaan.");

  if (!v.telepon) {
    cek("telepon", true, "Nomor telepon wajib diisi.");
  } else {
    cek("telepon", !/^(\+62|62|0)8\d{8,12}$/.test(v.telepon.replace(/[\s-]/g, "")),
        "Format nomor tidak valid. Contoh: 081234567890.");
  }

  if (!v.email) {
    cek("email", true, "Email wajib diisi.");
  } else {
    cek("email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email), "Format email tidak valid. Contoh: nama@email.com.");
  }

  cek("alamat", v.alamat.length < 5, "Alamat wajib diisi.");

  return ok ? v : null;
}

function tampilNotif(jenis, html) {
  notif.innerHTML = '<div class="alert alert-' + jenis + ' d-flex align-items-start gap-2" role="alert">' + html + "</div>";
  notif.scrollIntoView({ behavior: "smooth", block: "center" });
}

function bersihkanTampilan() {
  fields.forEach(id => document.getElementById(id).classList.remove("is-valid", "is-invalid"));
}

form.addEventListener("submit", function (e) {
  e.preventDefault();
  notif.innerHTML = "";
  const data = validasi();
  if (!data) {
    const pertama = form.querySelector(".is-invalid");
    if (pertama) pertama.focus();
    return;
  }

  const daftar = ambilAnggota();
  daftar.push({
    id: Date.now(),
    nama: data.nama,
    nim: data.nim,
    prodi: data.prodi,
    jenis: data.jenis,
    telepon: data.telepon,
    email: data.email,
    alamat: data.alamat,
    tanggal: new Date().toISOString()
  });

  if (!simpanAnggota(daftar)) {
    tampilNotif("danger", "<div>Data gagal disimpan. Pastikan browser mengizinkan penyimpanan lokal, lalu coba lagi.</div>");
    return;
  }

  form.reset();
  bersihkanTampilan();
  tampilNotif("success",
    "<div><strong>Pendaftaran berhasil.</strong> Selamat bergabung, " + data.nama.replace(/</g, "&lt;") +
    '! Lihat datamu di <a href="anggota.html" class="alert-link">Data Anggota</a>.</div>');
});

form.addEventListener("reset", function () {
  bersihkanTampilan();
  notif.innerHTML = "";
});

// Hapus pesan error saat pengguna mulai memperbaiki isian
fields.forEach(id => {
  document.getElementById(id).addEventListener("input", function () {
    this.classList.remove("is-invalid");
  });
});
