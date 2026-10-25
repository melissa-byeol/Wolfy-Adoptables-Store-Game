document.addEventListener('DOMContentLoaded', () => {
    
    // Referencias a elementos DOM
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const btnNewGame = document.getElementById('btn-new-game');
    const btnLoadGame = document.getElementById('btn-load-game');
    
    const btnBuy = document.getElementById('btn-buy-lote');
    const btnSell = document.getElementById('btn-sell-unit');
    const btnEndDay = document.getElementById('btn-end-day');
    const btnSaveManual = document.getElementById('btn-save-manual');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // --- INICIALIZACIÓN ---
    
    // Chequear si hay partida guardada
    const savedData = loadGame();
    if (savedData) {
        btnLoadGame.disabled = false;
        btnLoadGame.textContent = `Continuar (Día ${savedData.day})`;
    }

    // --- EVENT LISTENERS MENÚ PRINCIPAL ---
    
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
            updateUI();
        }
    });

    // --- EVENT LISTENERS JUEGO ---
    
    btnBuy.addEventListener('click', buyLoteWhite);
    btnSell.addEventListener('click', sellUnitWhite);
    btnEndDay.addEventListener('click', endDay);
    
    btnSaveManual.addEventListener('click', () => {
        if(saveGame()) {
            showToast("Guardado manual exitoso.");
        }
    });

    btnCloseModal.addEventListener('click', hideModal);
});
