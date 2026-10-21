const API_URL = "https://kodepos-2d475.firebaseio.com";
const TIMEOUT_MS = 15000;

const provinceSelect = document.getElementById("province");
const regencySelect = document.getElementById("regency");
const districtSelect = document.getElementById("district");
const searchForm = document.getElementById("searchForm");
const searchButton = document.getElementById("searchButton");
const statusText = document.getElementById("status");
const retryButton = document.getElementById("retryButton");
const results = document.getElementById("results");
const resultBody = document.getElementById("resultBody");
const areaInfo = document.getElementById("areaInfo");
const postalValue = document.getElementById("postalValue");
const postalLabel = document.getElementById("postalLabel");

// Cache supaya data kabupaten/kota yang sama tidak diunduh dua kali.
const cache = new Map();
let lastAction = null;
let requestId = 0; // mencegah respons lama menimpa pilihan yang sudah berganti

async function getData(path) {
  if (cache.has(path)) return cache.get(path);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(API_URL + path, { signal: controller.signal });
    if (!response.ok) throw new Error("Server mengembalikan status " + response.status + ".");
    const data = await response.json();
    if (data === null) throw new Error("Data tidak ditemukan.");
    cache.set(path, data);
    return data;
  } catch (error) {
    if (error.name === "AbortError") throw new Error("Permintaan terlalu lama. Periksa koneksi internet.");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function setStatus(message, isError = false, retry = null) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
  lastAction = retry;
  retryButton.hidden = !retry;
}

function fillSelect(select, entries, placeholder) {
  select.innerHTML = "";
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);
  entries.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });
  select.disabled = false;
}

function resetSelect(select, placeholder) {
  select.innerHTML = "";
  const option = document.createElement("option");
  option.value = "";
  option.textContent = placeholder;
  select.appendChild(option);
  select.disabled = true;
}

function clearResults() {
  results.hidden = true;
  resultBody.innerHTML = "";
  areaInfo.innerHTML = "";
  postalValue.textContent = "";
}

function selectedText(select) {
  return select.selectedOptions[0] ? select.selectedOptions[0].textContent : "";
}

function byName(a, b) {
  return a[1].localeCompare(b[1], "id");
}

// Data per kabupaten/kota berupa array {kecamatan, kelurahan, kodepos}.
// Daftar kecamatan diturunkan dari array itu.
function rowsOf(data) {
  return (Array.isArray(data) ? data : Object.values(data)).filter(Boolean);
}

async function loadProvinces() {
  setStatus("Memuat data provinsi...");
  try {
    const data = await getData("/list_propinsi.json");
    fillSelect(provinceSelect, Object.entries(data).sort(byName), "Pilih provinsi");
    setStatus("Silakan pilih provinsi.");
  } catch (error) {
    resetSelect(provinceSelect, "Data gagal dimuat");
    setStatus("Data provinsi gagal dimuat: " + error.message, true, loadProvinces);
  }
}

provinceSelect.addEventListener("change", async () => {
  const id = ++requestId;
  resetSelect(regencySelect, "Pilih kabupaten/kota");
  resetSelect(districtSelect, "Pilih kecamatan");
  searchButton.disabled = true;
  clearResults();

  if (!provinceSelect.value) { setStatus("Silakan pilih provinsi."); return; }

  const load = async () => {
    setStatus("Memuat kabupaten/kota...");
    try {
      const data = await getData("/list_kotakab/" + provinceSelect.value + ".json");
      if (id !== requestId) return;
      fillSelect(regencySelect, Object.entries(data).sort(byName), "Pilih kabupaten/kota");
      setStatus("Silakan pilih kabupaten/kota.");
    } catch (error) {
      if (id !== requestId) return;
      setStatus("Kabupaten/kota gagal dimuat: " + error.message, true, load);
    }
  };
  load();
});

regencySelect.addEventListener("change", async () => {
  const id = ++requestId;
  resetSelect(districtSelect, "Pilih kecamatan");
  searchButton.disabled = true;
  clearResults();

  if (!regencySelect.value) { setStatus("Silakan pilih kabupaten/kota."); return; }

  const load = async () => {
    setStatus("Memuat kecamatan...");
    try {
      const rows = rowsOf(await getData("/kota_kab/" + regencySelect.value + ".json"));
      if (id !== requestId) return;
      const districts = [...new Set(rows.map((r) => r.kecamatan))]
        .filter(Boolean)
        .map((name) => [name, name])
        .sort(byName);
      fillSelect(districtSelect, districts, "Pilih kecamatan");
      setStatus("Silakan pilih kecamatan.");
    } catch (error) {
      if (id !== requestId) return;
      setStatus("Kecamatan gagal dimuat: " + error.message, true, load);
    }
  };
  load();
});

districtSelect.addEventListener("change", () => {
  clearResults();
  searchButton.disabled = !districtSelect.value;
  setStatus(districtSelect.value ? "Klik Cari kode pos untuk melihat hasil." : "Silakan pilih kecamatan.");
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!provinceSelect.value || !regencySelect.value || !districtSelect.value) {
    setStatus("Pilih provinsi, kabupaten/kota, dan kecamatan terlebih dahulu.", true);
    return;
  }

  clearResults();
  searchButton.disabled = true;
  setStatus("Mencari kode pos...");

  try {
    const rows = rowsOf(await getData("/kota_kab/" + regencySelect.value + ".json"));
    const villages = rows
      .filter((r) => r.kecamatan === districtSelect.value)
      .sort((a, b) => a.kelurahan.localeCompare(b.kelurahan, "id"));

    if (villages.length === 0) {
      setStatus("Tidak ada data kelurahan/desa untuk kecamatan ini.", true);
      return;
    }

    const codes = [...new Set(villages.map((v) => v.kodepos))].sort();
    postalLabel.textContent = codes.length === 1 ? "Kode pos" : "Kode pos (" + codes.length + " kode)";
    postalValue.textContent = codes.join(", ");

    [
      ["Provinsi", selectedText(provinceSelect)],
      ["Kabupaten/Kota", selectedText(regencySelect)],
      ["Kecamatan", districtSelect.value],
      ["Jumlah kelurahan/desa", String(villages.length)]
    ].forEach(([label, value]) => {
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      areaInfo.append(dt, dd);
    });

    villages.forEach((village, i) => {
      const row = document.createElement("tr");
      [String(i + 1), village.kelurahan, village.kodepos || "-"].forEach((text) => {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.appendChild(cell);
      });
      resultBody.appendChild(row);
    });

    results.hidden = false;
    setStatus("Ditemukan " + villages.length + " kelurahan/desa.");
  } catch (error) {
    setStatus("Pencarian gagal: " + error.message, true);
  } finally {
    searchButton.disabled = !districtSelect.value;
  }
});

retryButton.addEventListener("click", () => { if (lastAction) lastAction(); });

loadProvinces();
