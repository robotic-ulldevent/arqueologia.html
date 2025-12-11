document.addEventListener('DOMContentLoaded', () => {
    // 1. Lògica de la Pantalla de Càrrega (Splash Screen) (Sense canvis)
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const tempsEspera = 5000;

    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            splashScreen.classList.add('hidden');
            mainContent.classList.remove('hidden');
            
            // Un cop l'aplicació és visible, carreguem les dades inicials
            fetchSensorData();
        }, 500); 
        
    }, tempsEspera); 

    // 2. Lògica de l'API de ThingSpeak
    
    // ⚠️ ATENCIÓ: HAS DE SUBSTITUIR [EL TEU CHANNEL ID] PEL NÚMERO DEL TEU CANAL.
    const CHANNEL_ID = '3197190'; // Exemple: 123456
    const READ_API_KEY = 'EQNNKHBZGLZVUZ34';
    
    // URL per obtenir l'última lectura en format JSON
    const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds/last.json?api_key=${READ_API_KEY}`;
    
    // Mapeig dels camps de ThingSpeak als elements HTML (segons l'ordre demanat)
    const fieldMap = [
        { id: 'data-temperatura', label: 'Temperatura', field: 'field1' },
        { id: 'data-lluminositat', label: 'Lluminositat', field: 'field2' },
        { id: 'data-so', label: 'So', field: 'field3' },
        { id: 'data-inclinacio-x', label: 'Inclinació X', field: 'field4' },
        { id: 'data-inclinacio-y', label: 'Inclinació Y', field: 'field5' },
    ];
    
    const timestampElement = document.getElementById('data-timestamp');
    const dataArea = document.getElementById('data-display-area');
    
    // NOU: Elements per l'indicador d'estat
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');


    async function fetchSensorData() {
        dataArea.innerHTML = '<p class="data-loading-message">Carregant dades...</p>';
        
        // Asumeix error mentre carrega
        statusIndicator.classList.remove('status-green');
        statusIndicator.classList.add('status-red');
        statusText.textContent = 'Carregant...';
        
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                throw new Error(`Error de xarxa: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Restaura l'estructura de la llista (per si l'havia substituït un error)
            dataArea.innerHTML = `
                <ul id="sensor-data-list">
                    <li id="data-temperatura"></li>
                    <li id="data-lluminositat"></li>
                    <li id="data-so"></li>
                    <li id="data-inclinacio-x"></li>
                    <li id="data-inclinacio-y"></li>
                </ul>
                <p id="data-timestamp" class="timestamp-text"></p>
            `;
            
            let dataReceived = true; // Flag per a l'indicador d'estat
            
            // Actualitzem cada element de la llista
            fieldMap.forEach(item => {
                const element = document.getElementById(item.id);
                
                // NOVEtat: Comprovació de dades faltants
                const value = data[item.field]; 
                
                let displayValue;
                if (value === null || value === undefined || value.trim() === "") {
                    displayValue = 'Sense dades ara mateix';
                    dataReceived = false; // Si falta alguna dada, canviem l'estat a vermell
                } else {
                    displayValue = value;
                }
                
                // Formatem la visualització
                element.innerHTML = `**${item.label}:** ${displayValue}`;
            });
            
            // Afegim l'hora d'actualització
            const rawTimestamp = data.created_at;
            const date = new Date(rawTimestamp);
            const formattedDate = date.toLocaleString('ca-ES', { 
                dateStyle: 'short', 
                timeStyle: 'medium' 
            });
            
            document.getElementById('data-timestamp').textContent = `Darrera actualització: ${formattedDate}`;

            // NOVEtat: Actualització de l'indicador d'estat
            if (dataReceived) {
                statusIndicator.classList.remove('status-red');
                statusIndicator.classList.add('status-green');
                statusText.textContent = 'Dades rebudes';
            } else {
                statusIndicator.classList.remove('status-green');
                statusIndicator.classList.add('status-red');
                statusText.textContent = 'Alerta: Dades incompletes';
            }


        } catch (error) {
            console.error('Error carregant dades de ThingSpeak:', error);
            dataArea.innerHTML = '<p class="data-error-message">❌ No s\'han pogut carregar les dades. Comprova el Channel ID, la clau API o la connexió.</p>';
            
            // NOVEtat: Estat vermell si hi ha error
            statusIndicator.classList.remove('status-green');
            statusIndicator.classList.add('status-red');
            statusText.textContent = 'ERROR de connexió';
        }
    }
    
    // 3. Enllaça la funció d'actualització al botó
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
        refreshButton.addEventListener('click', fetchSensorData);
    }
});
