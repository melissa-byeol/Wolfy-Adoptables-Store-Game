document.addEventListener('DOMContentLoaded', () => {
    
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const btnNewGame = document.getElementById('btn-new-game');
    const btnLoadGame = document.getElementById('btn-load-game');
    
    const btnRestock = document.getElementById('btn-restock-all');
    const btnSellFast = document.getElementById('btn-sell-fast'); // Nuevo botón rápido
    const btnEndDay = document.getElementById('btn-end-day');
    const btnSaveManual = document.getElementById('btn-save-manual');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Chequear partida guardada
    const savedData = loadGame();
    if (savedData) {
        btnLoadGame.disabled = false;
        btnLoadGame.textContent = `Continuar (Día ${savedData.day})`;
    }

    // Menú Principal
    btnNewGame.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initNewGame();
    });

    btnLoadGame.addEventListener('click', () => {
        const data = loadGame();
        if (data) {
            gameState = data;
            startScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            initStoreGrid(); // Reconstruir visual
            updateUI();       // Rellenar visual
        }
    });

    // Controles de Juego
    btnRestock.addEventListener('click', restockAllShelves);
    
    if(btnSellFast) {
        btnSellFast.addEventListener('click', () => {
            sellUnitWhite();
            updateStoreMapView();
        });
    }

    btnEndDay.addEventListener('click', endDay);
    
    btnSaveManual.addEventListener('click', () => {
        if(saveGame()) showToast("Guardado manual exitoso.");
    });

    btnCloseModal.addEventListener('click', hideModal);
});
