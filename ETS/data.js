// Data Anggota - membaca dan mengubah data di localStorage (kunci sama dengan daftar.js)
(function () {
  const KEY = "libraryreg_anggota";
  const PER_PAGE = 5;
  const PRODI = ["Informatika", "Sistem Informasi", "Teknik Elektro", "Manajemen", "Akuntansi", "Hukum", "Lainnya"];
  const JENIS = ["Mahasiswa", "Dosen", "Tenaga Kependidikan"];
  const $ = id => document.getElementById(id);

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = n => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); return true; } catch (e) { return false; } }

  let members = load();
  const st = { q: "", jenis: "", prodi: "", page: 1 };

  const mDetail = new bootstrap.Modal($("mDetail"));
  const mEdit = new bootstrap.Modal($("mEdit"));
  const mHapus = new bootstrap.Modal($("mHapus"));
  let editId = null, hapusId = null;

  // isi pilihan dropdown
  const opsi = (arr, awal) => (awal ? '<option value="">' + awal + "</option>" : "") + arr.map(v => "<option>" + v + "</option>").join("");
  $("fJenis").innerHTML = opsi(JENIS, "Semua Jenis");
  $("fProdi").innerHTML = opsi(PRODI, "Semua Program Studi");
  $("e-jenis").innerHTML = opsi(JENIS, "Pilih jenis keanggotaan");
  $("e-prodi").innerHTML = opsi(PRODI, "Pilih program studi");

  function toast(msg, type) {
    const el = document.createElement("div");
    el.className = "toast align-items-center text-bg-" + (type || "success") + " border-0";
    el.setAttribute("role", "status");
    el.innerHTML = '<div class="d-flex"><div class="toast-body">' + esc(msg) + '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Tutup"></button></div>';
    $("toasts").appendChild(el);
    el.addEventListener("hidden.bs.toast", () => el.remove());
    new bootstrap.Toast(el, { delay: 3500 }).show();
  }

  function filtered() {
    const q = st.q.toLowerCase();
    return members.filter(m =>
      (!st.jenis || m.jenis === st.jenis) &&
      (!st.prodi || m.prodi === st.prodi) &&
      (!q || [m.nama, m.nim, m.prodi].some(v => String(v).toLowerCase().includes(q)))
    );
  }

  function renderRingkasan() {
    const baris = [["", "Semua anggota", members.length]].concat(
      JENIS.map(j => [j, j, members.filter(m => m.jenis === j).length])
    );
    $("ringkasan").innerHTML = baris.map(b =>
      '<button type="button" class="sum-btn' + (st.jenis === b[0] ? " on" : "") + '" data-jenis="' + b[0] + '"><span>' + b[1] + "</span><b>" + b[2] + "</b></button>"
    ).join("");
  }

  function render() {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    if (st.page > pages) st.page = pages;
    const start = (st.page - 1) * PER_PAGE;
    const slice = list.slice(start, start + PER_PAGE);

    if (!slice.length) {
      $("tbody").innerHTML = members.length
        ? '<tr><td colspan="8" class="kosong">Tidak ada data yang cocok dengan pencarian atau filter.</td></tr>'
        : '<tr><td colspan="8" class="kosong">Belum ada anggota terdaftar.<br><a href="daftar.html" class="btn btn-brass btn-sm">Daftarkan anggota</a> <button type="button" class="btn btn-reset btn-sm" data-act="contoh">Muat data contoh</button></td></tr>';
    } else {
      $("tbody").innerHTML = slice.map((m, i) =>
        "<tr><td>" + (start + i + 1) + '</td><td><div class="nama-cell"><span class="avatar" aria-hidden="true">' + esc(initials(m.nama)) + "</span>" + esc(m.nama) + "</div></td>" +
        "<td>" + esc(m.nim) + "</td><td>" + esc(m.prodi) + "</td><td>" + esc(m.jenis) + "</td><td>" + esc(m.telepon) + "</td><td>" + esc(m.email) + "</td>" +
        '<td><div class="aksi">' +
        '<button type="button" class="ab ab-detail" data-act="detail" data-id="' + m.id + '" aria-label="Detail ' + esc(m.nama) + '"><i class="bi bi-eye-fill"></i></button>' +
        '<button type="button" class="ab ab-edit" data-act="edit" data-id="' + m.id + '" aria-label="Edit ' + esc(m.nama) + '"><i class="bi bi-pencil-fill"></i></button>' +
        '<button type="button" class="ab ab-hapus" data-act="hapus" data-id="' + m.id + '" aria-label="Hapus ' + esc(m.nama) + '"><i class="bi bi-trash-fill"></i></button>' +
        "</div></td></tr>"
      ).join("");
    }

    $("info").textContent = list.length ? "Menampilkan " + (start + 1) + " - " + (start + slice.length) + " dari " + list.length + " data" : "Tidak ada data";

    let p = '<button type="button" class="pg" data-page="' + (st.page - 1) + '" aria-label="Sebelumnya"' + (st.page === 1 ? " disabled" : "") + '><i class="bi bi-chevron-left"></i></button>';
    for (let n = 1; n <= pages; n++) p += '<button type="button" class="pg' + (n === st.page ? " on" : "") + '" data-page="' + n + '"' + (n === st.page ? ' aria-current="page"' : "") + ">" + n + "</button>";
    p += '<button type="button" class="pg" data-page="' + (st.page + 1) + '" aria-label="Berikutnya"' + (st.page === pages ? " disabled" : "") + '><i class="bi bi-chevron-right"></i></button>';
    $("pager").innerHTML = p;

    renderRingkasan();
  }

  // ----- Filter dan pencarian -----
  $("cari").addEventListener("input", e => { st.q = e.target.value.trim(); st.page = 1; render(); });
  $("fJenis").addEventListener("change", e => { st.jenis = e.target.value; st.page = 1; render(); });
  $("fProdi").addEventListener("change", e => { st.prodi = e.target.value; st.page = 1; render(); });
  $("ringkasan").addEventListener("click", e => {
    const b = e.target.closest("button[data-jenis]");
    if (!b) return;
    st.jenis = b.dataset.jenis; $("fJenis").value = st.jenis; st.page = 1; render();
  });
  $("pager").addEventListener("click", e => {
    const b = e.target.closest("button[data-page]");
    if (!b || b.disabled) return;
    st.page = Number(b.dataset.page); render();
  });

  // ----- Aksi pada baris -----
  $("tbody").addEventListener("click", e => {
    const b = e.target.closest("button[data-act]");
    if (!b) return;
    if (b.dataset.act === "contoh") return muatContoh();
    const m = members.find(x => x.id === Number(b.dataset.id));
    if (!m) return;

    if (b.dataset.act === "detail") {
      const tgl = m.tanggal ? new Date(m.tanggal).toLocaleDateString("id-ID", { dateStyle: "long" }) : "-";
      const baris = [["Nama lengkap", m.nama], ["NIM/NIP", m.nim], ["Program studi", m.prodi], ["Jenis keanggotaan", m.jenis], ["Nomor telepon", m.telepon], ["Email", m.email], ["Alamat", m.alamat], ["Terdaftar", tgl]];
      $("detailIsi").innerHTML = baris.map(r => "<dt>" + r[0] + "</dt><dd>" + esc(r[1]) + "</dd>").join("");
      mDetail.show();
    } else if (b.dataset.act === "edit") {
      editId = m.id;
      ["nama", "nim", "prodi", "jenis", "telepon", "email", "alamat"].forEach(f => { $("e-" + f).value = m[f]; $("e-" + f).classList.remove("is-invalid"); });
      mEdit.show();
    } else if (b.dataset.act === "hapus") {
      hapusId = m.id; $("hapusNama").textContent = m.nama; mHapus.show();
    }
  });

  $("btnHapus").addEventListener("click", () => {
    const m = members.find(x => x.id === hapusId);
    members = members.filter(x => x.id !== hapusId);
    if (!save(members)) { toast("Data gagal dihapus. Coba lagi.", "danger"); return; }
    mHapus.hide(); render(); toast("Data " + (m ? m.nama : "anggota") + " berhasil dihapus.");
  });

  // ----- Edit dengan validasi -----
  const F = ["nama", "nim", "prodi", "jenis", "telepon", "email", "alamat"];
  function setErr(id, msg) { const el = $("e-" + id); el.classList.add("is-invalid"); el.nextElementSibling.textContent = msg; }

  $("formEdit").addEventListener("submit", e => {
    e.preventDefault();
    const v = {}; F.forEach(f => { v[f] = $("e-" + f).value.trim(); $("e-" + f).classList.remove("is-invalid"); });
    let ok = true;
    const bad = (id, msg) => { setErr(id, msg); ok = false; };

    if (v.nama.length < 3) bad("nama", "Nama lengkap wajib diisi (minimal 3 huruf).");
    if (!v.nim) bad("nim", "NIM/NIP wajib diisi.");
    else if (!/^\d{5,20}$/.test(v.nim)) bad("nim", "NIM/NIP hanya boleh angka, 5 sampai 20 digit.");
    else if (members.some(m => m.nim === v.nim && m.id !== editId)) bad("nim", "NIM/NIP ini sudah dipakai anggota lain.");
    if (!v.prodi) bad("prodi", "Pilih program studi.");
    if (!v.jenis) bad("jenis", "Pilih jenis keanggotaan.");
    if (!v.telepon) bad("telepon", "Nomor telepon wajib diisi.");
    else if (!/^(\+62|62|0)8\d{8,12}$/.test(v.telepon.replace(/[\s-]/g, ""))) bad("telepon", "Format nomor tidak valid. Contoh: 081234567890.");
    if (!v.email) bad("email", "Email wajib diisi.");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) bad("email", "Format email tidak valid.");
    if (v.alamat.length < 5) bad("alamat", "Alamat wajib diisi.");

    if (!ok) { const p = $("formEdit").querySelector(".is-invalid"); if (p) p.focus(); return; }

    members = members.map(m => m.id === editId ? Object.assign({}, m, v) : m);
    if (!save(members)) { toast("Perubahan gagal disimpan. Coba lagi.", "danger"); return; }
    mEdit.hide(); render(); toast("Data " + v.nama + " berhasil diperbarui.");
  });

  F.forEach(f => $("e-" + f).addEventListener("input", function () { this.classList.remove("is-invalid"); }));

  // ----- Data contoh (untuk mencoba tampilan) -----
  function muatContoh() {
    const t = Date.now();
    const contoh = [
      ["Andi Pratama", "230101001", "Informatika", "Mahasiswa", "081234567890", "andi@email.com", "Jl. Mawar No. 1, Surabaya"],
      ["Siti Rahma", "230101002", "Sistem Informasi", "Mahasiswa", "081234567891", "siti@email.com", "Jl. Melati No. 2, Surabaya"],
      ["Budi Santoso", "19881234", "Informatika", "Dosen", "081234567892", "budi@email.com", "Jl. Kenanga No. 3, Sidoarjo"],
      ["Maya Lestari", "230101003", "Manajemen", "Mahasiswa", "081234567893", "maya@email.com", "Jl. Anggrek No. 4, Surabaya"],
      ["Rizky Kurniawan", "230101004", "Akuntansi", "Tenaga Kependidikan", "081234567894", "rizky@email.com", "Jl. Dahlia No. 5, Gresik"]
    ].map((c, i) => ({ id: t + i, nama: c[0], nim: c[1], prodi: c[2], jenis: c[3], telepon: c[4], email: c[5], alamat: c[6], tanggal: new Date().toISOString() }));
    members = members.concat(contoh.filter(c => !members.some(m => m.nim === c.nim)));
    if (save(members)) { render(); toast("Data contoh dimuat."); } else toast("Data gagal disimpan.", "danger");
  }

  render();
})();
