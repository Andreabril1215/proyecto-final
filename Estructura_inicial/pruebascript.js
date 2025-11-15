// Cargar CSV directamente desde la carpeta
fetch('solar-energy-consumption.csv')
  .then(response => response.text())
  .then(data => {
      const rows = data.split('\n').slice(1);
      const jsonData = [];

      rows.forEach(row => {
          if(!row.trim()) return;
          const cols = row.split(',');
          if(cols.length<4) return;
          jsonData.push({
              Entity: cols[0].trim(),
              Year: parseInt(cols[2]),
              Solar: parseFloat(cols[3])
          });
      });

      generarDashboard(jsonData);
  })
  .catch(err => console.error('Error cargando CSV:', err));

function generarDashboard(data){
    if(data.length===0) return;

    const years = [...new Set(data.map(d=>d.Year))].sort((a,b)=>a-b);
    const lastYear = Math.max(...years);

    // Top 5 países último año
    const topData = data.filter(d=>d.Year===lastYear).sort((a,b)=>b.Solar-b.Solar).slice(0,5);
    const barLabels = topData.map(d=>d.Entity);
    const barValues = topData.map(d=>d.Solar);

    // Gráfico de barras
    new Chart(document.getElementById('barChart'), {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: `Consumo ${lastYear} (TWh)`,
                data: barValues,
                backgroundColor:'rgba(54,162,235,0.6)',
                borderColor:'rgba(54,162,235,1)',
                borderWidth:1
            }]
        },
        options: { responsive:true }
    });

    // Línea evolución país líder
    const leader = barLabels[0];
    const leaderData = data.filter(d=>d.Entity===leader).sort((a,b)=>a.Year-b.Year);
    new Chart(document.getElementById('lineChart'), {
        type:'line',
        data:{
            labels: leaderData.map(d=>d.Year),
            datasets:[{
                label:`Evolución ${leader} (TWh)`,
                data: leaderData.map(d=>d.Solar),
                borderColor:'rgba(255,99,132,1)',
                backgroundColor:'rgba(255,99,132,0.2)',
                fill:true,
                tension:0.1
            }]
        },
        options:{ responsive:true }
    });

    // Pie: participación top 5 último año
    new Chart(document.getElementById('pieChart'),{
        type:'pie',
        data:{
            labels: barLabels,
            datasets:[{
                label:`Participación ${lastYear}`,
                data: barValues,
                backgroundColor:[
                    'rgba(255,99,132,0.6)',
                    'rgba(54,162,235,0.6)',
                    'rgba(255,206,86,0.6)',
                    'rgba(75,192,192,0.6)',
                    'rgba(153,102,255,0.6)'
                ]
            }]
        },
        options:{ responsive:true }
    });
}