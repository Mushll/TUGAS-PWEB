// Data contoh. Dalam aplikasi sungguhan data ini datang dari database/API.
const students = [
  { name: "Andi Pratama", nim: "5025241001" },
  { name: "Anisa Putri", nim: "5025241002" },
  { name: "Ananda Rizky", nim: "5025241003" },
  { name: "Aulia Rahma", nim: "5025241004" },
  { name: "Budi Santoso", nim: "5025241005" },
  { name: "Bagas Wicaksono", nim: "5025241006" },
  { name: "Citra Maharani", nim: "5025241007" },
  { name: "Dewi Lestari", nim: "5025241008" },
  { name: "Dimas Aditya", nim: "5025241009" },
  { name: "Eka Saputra", nim: "5025241010" },
  { name: "Fajar Nugroho", nim: "5025241011" },
  { name: "Fitri Handayani", nim: "5025241012" },
  { name: "Gilang Ramadhan", nim: "5025241013" },
  { name: "Hana Salsabila", nim: "5025241014" },
  { name: "Indra Kurniawan", nim: "5025241015" },
  { name: "Mushallina Dzikri Rozana", nim: "5025241016" },
  { name: "Nadia Azzahra", nim: "5025241017" },
  { name: "Rizky Firmansyah", nim: "5025241018" },
  { name: "Salsa Maharani", nim: "5025241019" },
  { name: "Yoga Prasetyo", nim: "5025241020" }
];

const courses = [
  { name: "Pemrograman Web", lecturer: "Dr. Fajar Baskoro" },
  { name: "Jaringan Komputer", lecturer: "Ir. Rahmat Hidayat, M.T." },
  { name: "Basis Data", lecturer: "Dr. Siti Aminah" },
  { name: "Struktur Data", lecturer: "Prof. Agus Wijaya" },
  { name: "Rekayasa Perangkat Lunak", lecturer: "Dr. Lina Marlina" },
  { name: "Pemrograman Berorientasi Objek", lecturer: "Budi Hartono, M.Kom." },
  { name: "Sistem Operasi", lecturer: "Ir. Dedi Kurniawan, M.T." },
  { name: "Kecerdasan Buatan", lecturer: "Dr. Maya Anggraini" }
];

const form = document.getElementById("registrationForm");
const fields = {
  name: document.getElementById("name"),
  nim: document.getElementById("nim"),
  course: document.getElementById("course"),
  lecturer: document.getElementById("lecturer")
};
const result = document.getElementById("result");

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Tandai huruf yang diketik pengguna di dalam teks rekomendasi.
function highlight(text, keyword) {
  const index = text.toLowerCase().indexOf(keyword);
  if (index === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, index)) +
    "<mark>" + escapeHtml(text.slice(index, index + keyword.length)) + "</mark>" +
    escapeHtml(text.slice(index + keyword.length))
  );
}

// Rekomendasi: nama yang diawali keyword tampil lebih dulu,
// lalu nama yang mengandung keyword di bagian lain (mis. nama belakang).
function search(list, keyword) {
  const startsWith = [];
  const contains = [];
  list.forEach((item) => {
    const lower = item.name.toLowerCase();
    if (lower.startsWith(keyword)) startsWith.push(item);
    else if (lower.includes(keyword)) contains.push(item);
  });
  return startsWith.concat(contains).slice(0, 6);
}

// Satu fungsi autocomplete dipakai untuk kolom nama dan mata kuliah.
function setupAutocomplete({ input, listEl, source, detail, onSelect }) {
  let items = [];
  let active = -1;

  function close() {
    listEl.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }

  function setActive(index) {
    active = index;
    listEl.querySelectorAll(".ac-item").forEach((el, i) => {
      el.setAttribute("aria-selected", String(i === active));
      if (i === active) {
        input.setAttribute("aria-activedescendant", el.id);
        el.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function choose(item) {
    input.value = item.name;
    onSelect(item);
    close();
  }

  function render() {
    const keyword = input.value.trim().toLowerCase();
    listEl.innerHTML = "";
    if (!keyword) { close(); return; }

    items = search(source, keyword);

    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = "ac-empty";
      empty.textContent = "Tidak ada rekomendasi. Kamu tetap bisa mengetik manual.";
      listEl.appendChild(empty);
    }

    items.forEach((item, i) => {
      const li = document.createElement("li");
      li.className = "ac-item";
      li.id = listEl.id + "-" + i;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      li.innerHTML = "<span>" + highlight(item.name, keyword) + "</span><small>" + escapeHtml(detail(item)) + "</small>";
      // mousedown dipakai supaya terjadi sebelum input kehilangan fokus (blur)
      li.addEventListener("mousedown", (e) => { e.preventDefault(); choose(item); });
      listEl.appendChild(li);
    });

    listEl.hidden = false;
    input.setAttribute("aria-expanded", "true");
    active = -1;
  }

  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  input.addEventListener("blur", close);
  input.addEventListener("keydown", (e) => {
    if (listEl.hidden || items.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((active + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((active - 1 + items.length) % items.length); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(items[active]); }
    else if (e.key === "Escape") { close(); }
  });
}

setupAutocomplete({
  input: fields.name,
  listEl: document.getElementById("nameList"),
  source: students,
  detail: (s) => s.nim,
  onSelect: (s) => { fields.nim.value = s.nim; clearError("nim"); clearError("name"); }
});

setupAutocomplete({
  input: fields.course,
  listEl: document.getElementById("courseList"),
  source: courses,
  detail: (c) => c.lecturer,
  onSelect: (c) => { fields.lecturer.value = c.lecturer; clearError("lecturer"); clearError("course"); }
});

function showError(key, message) {
  document.getElementById(key + "Error").textContent = message;
  fields[key].classList.add("invalid");
  fields[key].setAttribute("aria-invalid", "true");
}

function clearError(key) {
  document.getElementById(key + "Error").textContent = "";
  fields[key].classList.remove("invalid");
  fields[key].removeAttribute("aria-invalid");
}

Object.keys(fields).forEach((key) => fields[key].addEventListener("input", () => clearError(key)));

function validate() {
  const values = {};
  Object.keys(fields).forEach((key) => { values[key] = fields[key].value.trim(); clearError(key); });

  let firstInvalid = null;
  function fail(key, message) {
    showError(key, message);
    if (!firstInvalid) firstInvalid = fields[key];
  }

  if (!values.name) fail("name", "Nama mahasiswa wajib diisi.");
  else if (!/^[A-Za-z .'-]{3,}$/.test(values.name)) fail("name", "Nama hanya boleh berisi huruf dan minimal 3 karakter.");

  if (!values.nim) fail("nim", "NIM wajib diisi.");
  else if (!/^\d{5,12}$/.test(values.nim)) fail("nim", "NIM harus berupa angka, 5 sampai 12 digit.");

  if (!values.course) fail("course", "Mata kuliah wajib diisi.");
  if (!values.lecturer) fail("lecturer", "Dosen wajib diisi.");

  if (firstInvalid) { firstInvalid.focus(); return null; }
  return values;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = validate();
  if (!values) { result.hidden = true; return; }

  result.innerHTML =
    "<h2>Pendaftaran berhasil dicatat</h2>" +
    "<dl>" +
    "<dt>Nama</dt><dd>" + escapeHtml(values.name) + "</dd>" +
    "<dt>NIM</dt><dd>" + escapeHtml(values.nim) + "</dd>" +
    "<dt>Mata kuliah</dt><dd>" + escapeHtml(values.course) + "</dd>" +
    "<dt>Dosen</dt><dd>" + escapeHtml(values.lecturer) + "</dd>" +
    "</dl>";
  result.hidden = false;
  result.scrollIntoView({ behavior: "smooth", block: "nearest" });
});
