const SAVE_KEY = 'wolfies_sim_save_v1';

function saveGame() {
    try {
        const dataString = JSON.stringify(gameState);
        window.localStorage.setItem(SAVE_KEY, dataString);
        console.log("Partida guardada.");
        return true;
    } catch (error) {
        console.error("Error al guardar:", error);
        return false;
    }
}

function loadGame() {
    try {
        const dataString = window.localStorage.getItem(SAVE_KEY);
        if (!dataString) return null;

        const parsedData = JSON.parse(dataString);
        
        // Validación simple de integridad
        if (parsedData.day && typeof parsedData.budget === 'number') {
            return parsedData;
        } else {
            console.warn("Datos corruptos detectados.");
            return null;
        }
    } catch (error) {
        console.error("Error al cargar:", error);
        return null;
    }
}

function clearSave() {
    window.localStorage.removeItem(SAVE_KEY);
}
