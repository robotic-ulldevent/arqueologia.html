document.addEventListener('DOMContentLoaded', () => {
    // 1. Configuració de l'API de ThingSpeak (Duplicat per independència, però utilitza la mateixa configuració)
    const CHANNEL_ID = '3197190';
    const READ_API_KEY = 'EQNNKHBZGLZVUZ34';
    
    // URL per obtenir les últimes 24 lectures
    const NUM_ENTRIES = 24;
    const API_URL_HISTORIC = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=${NUM_ENTRIES}`;
    
    // Mapeig dels camps (Amb informació extra per a gràfics)
    const fieldMapHistoric = [
        { key: 'temperatura', label: 'Temperatura', field: 'field1', unit: '°C', color: 'rgba(255, 99, 132, 1)' },
        { key: 'lluminositat', label: 'Lluminositat', field: 'field2', unit: 'lux', color: 'rgba(255, 206, 86, 1)' },
        { key: 'so', label: 'So', field: 'field3', unit: 'dB', color: 'rgba(75, 192, 192, 1)' },
        { key: 'inclinacio-x', label: 'Inclinació X', field: 'field4', unit: '°', color: 'rgba(153, 102, 255, 1)' },
        { key: 'inclinacio-y', label: 'Inclinació Y', field: 'field5', unit: '°', color: 'rgba(255, 159, 64, 1)' },
    ];
    
    const averageContainer = document.getElementById('average-data-container');
    const chartLoadingMessage = document.getElementById('chart-loading-message');


    async function fetchHistoricData() {
        averageContainer.innerHTML = '<p class="initial-message">Calculant mitjanes...</p>';
        if (chartLoadingMessage) chartLoadingMessage.textContent = 'Carregant gràfics...';
        
        // Assegurem que l'estat de connexió del header s'actualitzi
        if (window.fetchSensorData) {
            window.fetchSensorData(false, true); 
        }

        try {
            const response = await fetch(API_URL_HISTORIC);
            if (!response.ok) throw new Error(`Error de xarxa: ${response.status}`);
            
            const data = await response.json();
            const feeds = data.feeds;
            
            if (!feeds || feeds.length === 0) {
                averageContainer.innerHTML = '<p class="error-message">No s\'han trobat dades històriques.</p>';
                if (chartLoadingMessage) chartLoadingMessage.textContent = 'No hi ha dades suficients per generar gràfics.';
                return;
            }

            // 2. Càlcul de Mitjanes i Preparació de Dades per a Gràfics
            const sums = {};
            const counts = {};
            const chartData = {}; // Objecte per emmagatzemar dades per a Chart.js

            fieldMapHistoric.forEach(item => {
                sums[item.field] = 0;
                counts[item.field] = 0;
                chartData[item.field] = { labels: [], values: [] };
            });

            feeds.forEach(feed => {
                const date = new Date(feed.created_at).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
                
                fieldMapHistoric.forEach(item => {
                    const value = parseFloat(feed[item.field]);
                    
                    if (!isNaN(value)) {
                        sums[item.field] += value;
                        counts[item.field]++;
                        chartData[item.field].labels.push(date);
                        chartData[item.field].values.push(value);
                    }
                });
            });

            // 3. Renderització de Mitjanes
            let averageHtml = '';
            fieldMapHistoric.forEach(item => {
                const average = counts[item.field] > 0 ? (sums[item.field] / counts[item.field]).toFixed(2) : 'N/A';
                
                averageHtml += `
                    <div class="data-card">
                        <h4>Mitjana ${NUM_ENTRIES} Lectures: ${item.label}</h4>
                        <span class="data-value">${average}</span>
                        <span class="data-unit">${item.unit}</span>
                    </div>
                `;
            });
            averageContainer.innerHTML = averageHtml;
            
            // 4. Generació de Gràfics (Chart.js)
            if (chartLoadingMessage) chartLoadingMessage.textContent = '';
            
            fieldMapHistoric.forEach(item => {
                const ctx = document.getElementById(`chart-${item.key}`).getContext('2d');
                
                // Si hi ha dades per a aquest sensor, dibuixem
                if (chartData[item.field].values.length > 0) {
                     new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: chartData[item.field].labels.reverse(), // Mostra les hores més recents al final
                            datasets: [{
                                label: item.label,
                                data: chartData[item.field].values.reverse(),
                                borderColor: item.color,
                                backgroundColor: item.color.replace('1)', '0.2)'), // Més clar
                                borderWidth: 2,
                                fill: true,
                                tension: 0.1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: false,
                                    title: {
                                        display: true,
                                        text: item.unit
                                    }
                                }
                            }
                        }
                    });
                } else {
                     ctx.font = "20px Arial";
                     ctx.textAlign = "center";
                     ctx.fillText("No hi ha dades recents.", ctx.canvas.width / 2, ctx.canvas.height / 2);
                }
            });

        } catch (error) {
            console.error('Error al historial de dades:', error);
            averageContainer.innerHTML = '<p class="error-message">❌ Error de connexió o processament de dades històriques.</p>';
            if (chartLoadingMessage) chartLoadingMessage.textContent = 'Error en la generació de gràfics.';
        }
    }

    fetchHistoricData();
});
