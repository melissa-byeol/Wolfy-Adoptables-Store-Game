// js/main.js - VERSIÓN V3 (SIMULACIÓN ACTIVA)

document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS DOM ---
    
    // Pantallas
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    
    // Menú Principal
    const btnNewGame = document.getElementById('btn-new-game');
    const btnLoadGame = document.getElementById('btn-load-game');
    
    // Controles de Tienda Principales
    const btnToggleShop = document.getElementById('btn-toggle-shop'); // Botón Abrir/Cerrar
    
    // Modal de Pago
    const paymentModal = document.getElementById('payment-modal');
    const btnConfirmPayment = document.getElementById('btn-confirm-payment');
    const btnCancelPayment = document.getElementById('btn-cancel-payment');
    const payInputAmount = document.getElementById('pay-input-amount');
    
    // Modal Fin de Día
    const dayEndModal = document.getElementById('day-end-modal');
    const btnNextDay = document.getElementById('btn-next-day');
    
    // Modal Genérico (Bienvenida/Errores)
    const genericModal = document.getElementById('message-modal');
    const btnCloseGenericModal = document.getElementById('btn-close-modal');


    // --- INICIALIZACIÓN ---

    // Chequear si hay partida guardada
    const savedData = loadGame();
    if (savedData) {
        btnLoadGame.disabled = false;
        btnLoadGame.textContent = `Continuar (Día ${savedData.day})`;
    }


    // --- EVENT LISTENERS: MENÚ PRINCIPAL ---

    btnNewGame.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        
        // Iniciar nueva partida lógica
        initNewGame();
        
        // Renderizar estado inicial visualmente
        updateUI(); 
    });

    btnLoadGame.addEventListener('click', () => {
        const data = loadGame();
        if (data) {
            gameState = data;
            
            // SEGURIDAD: Si la tienda estaba 'open' al guardar, forzamos 'closed'
            // Esto evita que haya dos loops de setInterval corriendo o clientes fantasma.
            if (gameState.shopStatus === 'open') {
                gameState.shopStatus = 'closed';
                gameState.customers = []; // Limpiar clientes residuales
            }

            startScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            
            // Actualizar UI inmediatamente
            updateUI();
            
            // Resetear texto del botón según estado cargado
            if (gameState.shopStatus === 'closed') {
                btnToggleShop.textContent = "ABRIR TIENDA";
                btnToggleShop.className = "btn success large"; // Clase verde
            } else {
                btnToggleShop.textContent = "CERRAR TIENDA";
                btnToggleShop.className = "btn danger large"; // Clase roja
            }
        }
    });


    // --- EVENT LISTENERS: CONTROLES DE JUEGO ---

    // Abrir / Cerrar Tienda
    btnToggleShop.addEventListener('click', () => {
        toggleShopState(); // Llama a la función en logic.js
        
        // Actualizar apariencia del botón manualmente por seguridad
        if (gameState.shopStatus === 'open') {
            btnToggleShop.textContent = "CERRAR TIENDA";
            btnToggleShop.className = "btn danger large";
        } else {
            btnToggleShop.textContent = "ABRIR TIENDA";
            btnToggleShop.className = "btn success large";
        }
    });


    // --- EVENT LISTENERS: MODAL DE PAGO ---

    btnConfirmPayment.addEventListener('click', () => {
        const customerId = parseFloat(paymentModal.dataset.currentCustomerId);
        const amountStr = payInputAmount.value;
        
        confirmPayment(amountStr, customerId);
    });

    btnCancelPayment.addEventListener('click', () => {
        hidePaymentModal();
    });

    // Permitir Enter para confirmar pago
    payInputAmount.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            btnConfirmPayment.click();
        }
    });


    // --- EVENT LISTENERS: FIN DE DÍA ---

    btnNextDay.addEventListener('click', () => {
        nextDay(); // Llama a la función en logic.js
        
        // El modal se cierra dentro de nextDay(), pero aseguramos limpieza visual
        dayEndModal.classList.add('hidden');
        
        // Resetear botón de tienda a "Abrir" ya que iniciamos día nuevo
        btnToggleShop.textContent = "ABRIR TIENDA";
        btnToggleShop.className = "btn success large";
        gameState.shopStatus = 'closed'; // Forzar estado cerrado lógico
    });


    // --- EVENT LISTENERS: MODAL GENÉRICO ---

    btnCloseGenericModal.addEventListener('click', () => {
        hideModal(); // Función en ui.js
    });

});
