// dashboard.js — parser robusto + detección automática de columnas
console.log("dashboard.js cargado (versión robusta)");

let barChart = null;
let pieChart = null;
let BASE_DATA = [];

/* ------------------ parseCSV robusto (maneja comillas y comas internas) ------------------ */
function parseCSV(text) {
  const rows = [];
  let cur = "", row = [], inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i+1] === '"') { // comilla escapada
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      // manejar CRLF \r\n
      if (cur !== "" || row.length > 0) row.push(cur);
      if (row.length > 0) rows.push(row);
      cur = ""; row = [];
      if (ch === '\r' && text[i+1] === '\n') i++;
      continue;
    }

    cur += ch;
  }

  if (cur !== "" || row.length > 0) row.push(cur);
  if (row.length > 0) rows.push(row);

  return rows;
}

/* ------------------ detectar índices de columnas automáticamente ------------------ */
function detectIndices(header, sampleRows) {
  const head = header.map(h => (h || "").toString().trim().toLowerCase());
  // Entity
  let idxEntity = head.findIndex(h => /entity|country|pais|name/i.test(h));
  if (idxEntity === -1) idxEntity = 0;

  // Year
  let idxYear = head.findIndex(h => /year|anio|año/i.test(h));
  if (idxYear === -1) {
    // buscar columna cuyo primer valor parezca un año (4 dígitos)
    for (let c = 0; c < header.length; c++) {
      const sample = (sampleRows[0][c] || "").trim();
      if (/^\d{4}$/.test(sample)) { idxYear = c; break; }
    }
  }

  // Value/Solar
  let idxSolar = head.findIndex(h => /solar|pv|photovoltaic|consumption|value|twh|gwh|kw/i.test(h));
  if (idxSolar === -1) {
    // buscar la última columna numérica en la primera fila de muestra
    for (let c = header.length - 1; c >= 0; c--) {
      const sample = (sampleRows[0][c] || "").trim().replace(/\s/g,"").replace(',', '.');
      if (sample.match(/^-?\d+(\.\d+)?$/)) { idxSolar = c; break; }
    }
  }

  // Fallbacks si no encontró
  if (idxYear === -1) idxYear = Math.max(1, header.length - 2);
  if (idxSolar === -1) idxSolar = header.length - 1;

  return { idxEntity, idxYear, idxSolar };
}

/* ------------------ cargar CSV ------------------ */
async function cargarCSV() {
  try {
    const resp = await fetch("solar-energy-consumption.csv");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    const filas = parseCSV(text).filter(r => r.length > 0);
    if (filas.length < 2) throw new Error("CSV vacío o sin filas de datos");

    const header = filas[0].map(h => h ? h.toString().trim() : "");
    const dataRows = filas.slice(1);

    const { idxEntity, idxYear, idxSolar } = detectIndices(header, dataRows);

    console.log("Indices detectados:", { idxEntity, idxYear, idxSolar, header });

    const data = dataRows.map(cols => {
      const entity = (cols[idxEntity] || "").trim();
      const yearRaw = (cols[idxYear] || "").trim();
      const valRaw = (cols[idxSolar] || "").trim();

      // normalizar año y valor
      const Year = /^\d{4}$/.test(yearRaw) ? parseInt(yearRaw, 10) : (parseInt(yearRaw.replace(/\D/g,''),10) || null);
      const Solar = valRaw === "" ? null : parseFloat(valRaw.replace(/\s/g,'').replace(',', '.'));

      return { Entity: entity, Year: isNaN(Year) ? null : Year, Solar: isNaN(Solar) ? null : Solar };
    }).filter(d => d.Entity && d.Year !== null && d.Solar !== null);

    console.log("Primeros 10 registros parseados:", data.slice(0,10));
    return data;

  } catch (err) {
    console.error("Error cargando CSV:", err);
    // mostrar mensaje al usuario (si existe un contenedor debug)
    const dbg = document.getElementById("debug");
    if (dbg) dbg.innerText = "Error cargando CSV: " + err.message;
    return [];
  }
}

/* ------------------ UI: llenar selector ------------------ */
function llenarSelector(data) {
  const selector = document.getElementById("selector");
  selector.innerHTML = "";
  const paises = [...new Set(data.map(d => d.Entity))].sort();
  paises.forEach(p => {
    const op = document.createElement("option");
    op.value = p;
    op.textContent = p;
    selector.appendChild(op);
  });
  selector.addEventListener("change", () => actualizarDashboard(selector.value));
  // seleccionar el primero por defecto
  if (paises.length > 0) selector.value = paises[0];
}

/* ------------------ Tabla: actualizar ------------------ */
function actualizarTabla(pais, data) {
  const tbody = document.querySelector("#tabla tbody");
  tbody.innerHTML = "";

  const serie = data.filter(d => d.Entity === pais).sort((a,b) => a.Year - b.Year);
  if (serie.length === 0) {
    tbody.innerHTML = "<tr><td colspan='2'>No hay datos para este país</td></tr>";
    return;
  }

  serie.forEach(r => {
    const tr = document.createElement("tr");
    const tdYear = document.createElement("td");
    tdYear.textContent = r.Year;
    const tdSolar = document.createElement("td");
    tdSolar.textContent = r.Solar;
    tr.appendChild(tdYear);
    tr.appendChild(tdSolar);
    tbody.appendChild(tr);
  });
}

/* ------------------ Graficas: actualizar ------------------ */
function actualizarGraficas(pais, data) {
  const serie = data.filter(d => d.Entity === pais).sort((a,b) => a.Year - b.Year);
  const labels = serie.map(s => s.Year);
  const values = serie.map(s => s.Solar);

  if (barChart) barChart.destroy();
  if (pieChart) pieChart.destroy();

  const ctxBar = document.getElementById("barChart").getContext("2d");
  barChart = new Chart(ctxBar, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: `Consumo Solar ${pais}`, data: values }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });

  const ctxPie = document.getElementById("pieChart").getContext("2d");
  pieChart = new Chart(ctxPie, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data: values }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

/* ------------------ actualizar todo ------------------ */
function actualizarDashboard(pais) {
  if (!BASE_DATA || BASE_DATA.length === 0) return;
  actualizarTabla(pais, BASE_DATA);
  actualizarGraficas(pais, BASE_DATA);
}

/* ------------------ init ------------------ */
(async function init() {
  BASE_DATA = await cargarCSV();
  if (!BASE_DATA || BASE_DATA.length === 0) {
    console.warn("No hay datos cargados");
    return;
  }
  llenarSelector(BASE_DATA);
  const sel = document.getElementById("selector");
  const first = sel && sel.value ? sel.value : BASE_DATA[0].Entity;
  actualizarDashboard(first);
})();