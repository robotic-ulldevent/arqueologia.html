document.addEventListener('DOMContentLoaded', () => {
    // 1. Lògica de la Pantalla de Portada
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    
    // NOU TEMPS D'ESPERA: 10 segons (10000 ms)
    const tempsEspera = 10000; 

    if (splashScreen) { // Assegurem que només s'executa a index.html
        setTimeout(() => {
            splashScreen.classList.add('fade-out');
            setTimeout(() => {
                splashScreen.classList.add('hidden');
                mainContent.classList.remove('hidden');
                
                // Carreguem les dades inicials
                fetchSensorData(true);
            }, 500); 
            
        }, tempsEspera); 
    } else {
        // Si no hi ha splash screen (estem a historic.html), carreguem l'estat inicial
        // (La càrrega principal de dades es fa a historic.js)
        fetchSensorData(false, true); 
    }


    // 2. Configuració de l'API de ThingSpeak
    const CHANNEL_ID = '3197190';
    const READ_API_KEY = 'EQNNKHBZGLZVUZ34';
    
    // URL per obtenir l'última lectura
    const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_API_KEY}`;
    
    // Mapeig dels camps de ThingSpeak (Afegim unitats per millorar el disseny)
    const fieldMap = [
        { key: 'data-temperatura', label: 'Temperatura', field: 'field1', unit: '°C' },
        { key: 'data-lluminositat', label: 'Lluminositat', field: 'field2', unit: 'lux' },
        { key: 'data-so', label: 'So', field: 'field3', unit: 'dB' },
        { key: 'data-inclinacio-x', label: 'Inclinació X', field: 'field4', unit: '°' },
        { key: 'data-inclinacio-y', label: 'Inclinació Y', field: 'field5', unit: '°' },
    ];
    
    const dataArea = document.getElementById('data-display-area');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');


    /**
     * Carrega les últimes dades de ThingSpeak.
     * @param {boolean} updateDisplay - Si s'ha d'actualitzar el display de targetes.
     * @param {boolean} onlyStatus - Si només s'ha d'actualitzar l'estat (per a altres pàgines).
     */
    async function fetchSensorData(updateDisplay = true, onlyStatus = false) {
        if (dataArea && updateDisplay) {
             dataArea.innerHTML = '<p class="initial-message">Carregant dades...</p>';
        }
       
        // Estat inicial de càrrega
        if (statusIndicator) statusIndicator.classList.add('status-red');
        if (statusText) statusText.textContent = 'Carregant...';
        
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error(`Error de xarxa: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (onlyStatus) {
                // Si només cal l'estat, no fem la feina pesada de renderitzar les targetes
                if (statusIndicator) statusIndicator.classList.remove('status-red');
                if (statusIndicator) statusIndicator.classList.add('status-green');
                if (statusText) statusText.textContent = 'Dades en línia';
                return data; 
            }

            let htmlContent = '';
            let dataReceived = true;
            
            // Creació de les targetes de dades
            fieldMap.forEach(item => {
                const value = data[item.field]; 
                
                let displayValue;
                let displayClass = '';

                if (value === null || value === undefined || (typeof value === 'string' && value.trim() === "")) {
                    displayValue = 'Sense dades ara mateix';
                    displayClass = 'error-message';
                    dataReceived = false;
                } else {
                    displayValue = parseFloat(value).toFixed(2); // Format a 2 decimals
                    displayClass = 'data-value';
                }
                
                htmlContent += `
                    <div class="data-card" id="${item.key}">
                        <h4>${item.label}</h4>
                        <span class="${displayClass}">${displayValue}</span>
                        <span class="data-unit">${item.unit}</span>
                    </div>
                `;
            });
            
            // Actualització del Display
            if (dataArea) {
                dataArea.innerHTML = htmlContent;
            }
            
            // Actualització del Timestamp
            const rawTimestamp = data.created_at;
            const date = new Date(rawTimestamp);
            const formattedDate = date.toLocaleString('ca-ES', { 
                dateStyle: 'short', 
                timeStyle: 'medium' 
            });
            
            const timestampElement = document.getElementById('data-timestamp');
            if (timestampElement) {
                timestampElement.textContent = `Darrera actualització: ${formattedDate}`;
            }

            // Actualització de l'Indicador d'Estat
            if (statusIndicator) statusIndicator.classList.remove('status-red');
            if (statusIndicator) statusIndicator.classList.add(dataReceived ? 'status-green' : 'status-red');
            if (statusText) statusText.textContent = dataReceived ? 'Dades rebudes' : 'Alerta: Dades incompletes';
            
            return data; // Retornem les dades per si les necessita historic.js

        } catch (error) {
            console.error('Error carregant dades de ThingSpeak:', error);
            if (dataArea) {
                dataArea.innerHTML = '<p class="error-message">❌ Error de connexió amb ThingSpeak. Comprova l\'ID del Canal.</p>';
            }
            // Estat d'error
            if (statusIndicator) statusIndicator.classList.remove('status-green');
            if (statusIndicator) statusIndicator.classList.add('status-red');
            if (statusText) statusText.textContent = 'ERROR de connexió';
            return null;
        }
    }
    
    // 3. Enllaça la funció d'actualització al botó (només a index.html)
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', () => fetchSensorData(true));
    }

    // 4. Per a ús extern (historic.js)
    window.fetchSensorData = fetchSensorData;
});
