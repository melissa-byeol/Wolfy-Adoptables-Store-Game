// js/main.js - VERSIÓN V3.1

document.addEventListener('DOMContentLoaded', () => {
    
    // --- REFERENCIAS DOM ---
    
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    
    const btnNewGame = document.getElementById('btn-new-game');
    const btnLoadGame = document.getElementById('btn-load-game');
    
    const btnToggleShop = document.getElementById('btn-toggle-shop');
    
    // Modal Pago Rápido
    const quickPayModal = document.getElementById('quick-pay-modal');
    const btnQuickConfirm = document.getElementById('btn-quick-confirm');
    const btnQuickCancel = document.getElementById('btn-quick-cancel');
    
    // Modal Pago Manual
    const paymentModal = document.getElementById('payment-modal');
    const btnConfirmPayment = document.getElementById('btn-confirm-payment');
    const btnCancelPayment = document.getElementById('btn-cancel-payment');
    const payInputAmount = document.getElementById('pay-input-amount');
    
    // Modal Fin Día
    const dayEndModal = document.getElementById('day-end-modal');
    const btnNextDay = document.getElementById('btn-next-day');
    
    // Modal Genérico
    const genericModal = document.getElementById('message-modal');
    const btnCloseGenericModal = document.getElementById('btn-close-modal');

    // Reposición
    const btnBuyLote = document.getElementById('btn-buy-lote');
    const btnBuyMax = document.getElementById('btn-buy-max');


    // --- INICIALIZACIÓN ---

    const savedData = loadGame();
    if (savedData) {
        btnLoadGame.disabled = false;
        btnLoadGame.textContent = `Continuar (Día ${savedData.day})`;
    }


    // --- EVENT LISTENERS: MENÚ PRINCIPAL ---

    btnNewGame.addEventListener('click', () => {
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initNewGame();
        updateUI(); 
    });

    btnLoadGame.addEventListener('click', () => {
        const data = loadGame();
        if (data) {
            gameState = data;
            
            if (gameState.shopStatus === 'open') {
                gameState.shopStatus = 'closed';
                gameState.customers = [];
            }

            startScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            
            updateUI();
            
            if (gameState.shopStatus === 'closed') {
                btnToggleShop.textContent = "ABRIR TIENDA";
                btnToggleShop.className = "btn success large"; 
            } else {
                btnToggleShop.textContent = "CERRAR TIENDA";
                btnToggleShop.className = "btn danger large"; 
            }
        }
    });


    // --- EVENT LISTENERS: CONTROLES DE JUEGO ---

    if (btnToggleShop) {
        btnToggleShop.addEventListener('click', () => {
            toggleShopState(); 
            
            if (gameState.shopStatus === 'open') {
                btnToggleShop.textContent = "CERRAR TIENDA";
                btnToggleShop.className = "btn danger large";
            } else {
                btnToggleShop.textContent = "ABRIR TIENDA";
                btnToggleShop.className = "btn success large";
            }
        });
    }


    // --- EVENT LISTENERS: REPOSICIÓN ---
    
    if (btnBuyLote) {
        btnBuyLote.addEventListener('click', buySingleLote);
    }

    if (btnBuyMax) {
        btnBuyMax.addEventListener('click', fillMaxStock);
    }


    // --- EVENT LISTENERS: MODAL PAGO RÁPIDO ---
    
    if (btnQuickCancel) {
        btnQuickCancel.addEventListener('click', hideQuickPayModal);
    }
    // El botón confirmar se configura dinámicamente en showQuickPayModal


    // --- EVENT LISTENERS: MODAL PAGO MANUAL ---

    if (btnConfirmPayment) {
        btnConfirmPayment.addEventListener('click', () => {
            const customerId = parseFloat(paymentModal.dataset.currentCustomerId);
            const amountStr = payInputAmount.value;
            confirmPayment(amountStr, customerId);
        });
    }

    if (btnCancelPayment) {
        btnCancelPayment.addEventListener('click', hidePaymentModal);
    }

    if (payInputAmount) {
        payInputAmount.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') btnConfirmPayment.click();
        });
    }


    // --- EVENT LISTENERS: FIN DE DÍA ---

    if (btnNextDay) {
        btnNextDay.addEventListener('click', () => {
            nextDay(); 
            dayEndModal.classList.add('hidden');
            
            btnToggleShop.textContent = "ABRIR TIENDA";
            btnToggleShop.className = "btn success large";
            gameState.shopStatus = 'closed'; 
        });
    }


    // --- EVENT LISTENERS: MODAL GENÉRICO ---

    if (btnCloseGenericModal) {
        btnCloseGenericModal.addEventListener('click', () => {
            hideModal(); 
        });
    }

});
