document.addEventListener('DOMContentLoaded', () => {
    // 1. Selecciona els elements clau
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');

    // 2. Defineix el temps d'espera en mil·lisegons (5 segons = 5000 ms)
    const tempsEspera = 5000;

    // 3. Utilitza setTimeout per esperar el temps definit
    setTimeout(() => {
        // Afegeix la classe 'fade-out' per iniciar l'animació de desaparició
        splashScreen.classList.add('fade-out');

        // Espera una mica més (0.5s, la duració de la transició CSS) abans d'amagar completament
        // Això assegura que l'animació de 'fade' es vegi.
        setTimeout(() => {
            // Amaga la pantalla de càrrega completament
            splashScreen.classList.add('hidden');
            
            // Mostra el contingut principal
            mainContent.classList.remove('hidden');
        }, 500); // 500ms = 0.5 segons
        
    }, tempsEspera); // Espera 5000 mil·lisegons abans de començar la transició
});
