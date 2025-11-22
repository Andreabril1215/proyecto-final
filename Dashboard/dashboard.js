let data = [];
let lineChart, topChart;

// Cargar CSV
async function cargarDatos() {
    const response = await fetch("solar-energy-consumption.csv");
    const text = await response.text();

    const rows = text.trim().split("\n").map(r => r.split(","));
    rows.shift(); // quitar encabezado

    data = rows.map(r => ({
        country: r[0],
        code: r[1],
        year: parseInt(r[2]),
        value: parseFloat(r[3])
    })).filter(d => !isNaN(d.year) && !isNaN(d.value));

    cargarPaises();
    crearTopPaises();
}

// Llenar selector
function cargarPaises() {
    const selector = document.getElementById("selector");
    const paises = [...new Set(data.map(d => d.country))].sort();

    paises.forEach(pais => {
        const op = document.createElement("option");
        op.value = pais;
        op.textContent = pais;
        selector.appendChild(op);
    });

    selector.addEventListener("change", () => actualizarDashboard(selector.value));
    actualizarDashboard(paises[0]);
}

// Actualizar tarjetas + gráficas
function actualizarDashboard(pais) {
    const filtrado = data.filter(d => d.country === pais).sort((a, b) => a.year - b.year);

    const total = filtrado.reduce((s, d) => s + d.value, 0).toFixed(2);

    const max = filtrado.reduce((a, b) => (a.value > b.value ? a : b));

    

    document.getElementById("total").textContent = total + " TWh";
    document.getElementById("maxYear").textContent = `${max.year} (${max.value} TWh)`;
    

    actualizarLinea(filtrado);
}

// Gráfica de evolución
function actualizarLinea(datos) {
    const ctx = document.getElementById("lineChart");

    if (lineChart) lineChart.destroy();

    lineChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: datos.map(d => d.year),
            datasets: [
                {
                    label: "Consumo solar (TWh)",
                    data: datos.map(d => d.value),
                    borderColor: "#095c29ff",
                    backgroundColor: "#0ca53fff",
                    tension: 0.3,
                    fill: true
                }
            ]
        }
    });
}

// Top países último año
function crearTopPaises() {
    const ctx = document.getElementById("topChart");

    const ultimos = {};

    data.forEach(d => {
        if (!ultimos[d.country] || d.year > ultimos[d.country].year) {
            ultimos[d.country] = d;
        }
    });

    const lista = Object.values(ultimos)
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    topChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: lista.map(d => d.country),
            datasets: [
                {
                    label: "TWh último año",
                    data: lista.map(d => d.value),
                    backgroundColor: "#066826ff"
                }
            ]
        }
    });
}

cargarDatos();