function resultado() {

    const valor = document.getElementById("kwh").value;

    if (valor === "" || parseFloat(valor) <= 0) {
        Swal.fire({
            title: '¡Error!',
            text: 'Debe ingresar un valor válido.',
            icon: 'error',
            confirmButtonText: 'Cerrar'
        });
        return;
    }

    const consumoMensual = parseFloat(valor);

    // --- 1. Consumo anual ---
    const consumoAnual_kWh = consumoMensual * 12;

    // --- 2. Convertir a TWh ---
    const consumoAnual_TWh = consumoAnual_kWh / 1_000_000_000;

    // --- 3. Valor del listado (archivo CSV): energía solar Colombia 2021 ---
    const solarColombia2021_TWh = 0.32;

    // --- 4. Porcentaje respecto al listado ---
    const porcentaje = ((consumoAnual_TWh / solarColombia2021_TWh) * 100).toFixed(6);

    // --- 5. Mensaje final (incluye consumo anual) ---
    const res =
        "Su consumo promedio mensual es de " + consumoMensual + " kWh, " +
        "equivalente a un consumo anual de " + consumoAnual_kWh + " kWh. " +
        "Este valor representa el " + porcentaje +
        "% de la energía solar generada en Colombia durante el año 2021.";

    Swal.fire({
        title: 'Resultado',
        text: res,
        icon: 'success',
        confirmButtonText: 'Aceptar'
    });

    limpia();
}

function limpia() {
    document.getElementById("kwh").value = "";
}