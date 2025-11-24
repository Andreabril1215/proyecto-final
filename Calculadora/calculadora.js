function resultado(){

    const valor = document.getElementById("kwh").value;

    const cov= parseFloat(valor)

    const twh= convierte_twh(cov)

    const porcent=58.19

    const porcentaje= ((twh*100)/porcent).toFixed(4)

    const res="Su consumo promedio mensual fue de "+valor+"kwh, lo cual es quivalente al "+ porcentaje+"% a la totalidad connsumida de la fuente hidrica producida en el pais Colombiano con respecto al año 2021";


    if(valor != ""){

        Swal.fire({
            title: 'excelente',
            text: res,
            icon: 'success',
            confirmButtonText: '¡Interesante!'
        })

        limpia()

    }else{

        Swal.fire({
            title: '¡Error!',
            text: 'no hay datos ingresados',
            icon: 'error',
            confirmButtonText: 'Close'
        })

    }
    
}

function convierte_twh(dato){

    return (dato/1000)*12

}

function limpia(){

    document.getElementById("kwh").value=""

}