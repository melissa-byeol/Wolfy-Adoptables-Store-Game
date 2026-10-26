// js/main.js - V4.2 FINALES BUENOS

document.addEventListener('DOMContentLoaded', () => {
    
    const btnNew = document.getElementById('btn-new-game');
    const btnLoad = document.getElementById('btn-load-game');
    const btnToggle = document.getElementById('btn-toggle-shop');
    const btnNext = document.getElementById('btn-next-day');
    const btnCloseGen = document.getElementById('btn-close-modal');
    
    const btnBuyW = document.getElementById('btn-buy-lote-white');
    const btnMaxW = document.getElementById('btn-buy-max-white');
    const btnBuyB = document.getElementById('btn-buy-lote-brown');
    const btnMaxB = document.getElementById('btn-buy-max-brown');
    const btnBuyWi = document.getElementById('btn-buy-lote-winter');
    const btnMaxWi = document.getElementById('btn-buy-max-winter');
    
    const btnUpg1 = document.getElementById('btn-upg-exp1');
    const btnUpgAc = document.getElementById('btn-upg-ac');
    const btnUpg2 = document.getElementById('btn-upg-exp2');

    const btnConfPay = document.getElementById('btn-confirm-payment');
    const btnCancelPay = document.getElementById('btn-cancel-payment');
    const inpPay = document.getElementById('pay-input-amount');
    const payModal = document.getElementById('payment-modal');

    const saved = loadGame();
    if(saved) {
        btnLoad.disabled = false;
        btnLoad.textContent = `Continuar (Día ${saved.day})`;
    }

    btnNew.addEventListener('click', () => {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        initNewGame(); updateUI();
    });

    btnLoad.addEventListener('click', () => {
        const d = loadGame();
        if(d) {
            gameState = d;
            if(gameState.shopStatus==='open') { gameState.shopStatus='closed'; gameState.customers=[]; }
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            updateUI();
            if(gameState.shopStatus==='closed') {
                btnToggle.textContent = "ABRIR TIENDA"; btnToggle.className = "btn success large";
            }
        }
    });

    btnToggle.addEventListener('click', () => {
        toggleShopState();
        if(gameState.shopStatus==='open') { btnToggle.textContent="CERRAR TIENDA"; btnToggle.className="btn danger large"; }
        else { btnToggle.textContent="ABRIR TIENDA"; btnToggle.className="btn success large"; }
    });

    btnNext.addEventListener('click', () => {
        nextDay();
        btnToggle.textContent = "ABRIR TIENDA"; btnToggle.className = "btn success large";
        gameState.shopStatus = 'closed';
    });

    btnCloseGen.addEventListener('click', () => document.getElementById('message-modal').classList.add('hidden'));

    btnBuyW.addEventListener('click', () => buyLote('white'));
    btnMaxW.addEventListener('click', () => fillStock('white'));
    btnBuyB.addEventListener('click', () => buyLote('brown'));
    btnMaxB.addEventListener('click', () => fillStock('brown'));
    btnBuyWi.addEventListener('click', () => buyLote('winter'));
    btnMaxWi.addEventListener('click', () => fillStock('winter'));

    btnUpg1.addEventListener('click', () => buyUpgrade('exp1'));
    btnUpgAc.addEventListener('click', () => buyUpgrade('ac'));
    btnUpg2.addEventListener('click', () => buyUpgrade('exp2'));

    btnConfPay.addEventListener('click', () => {
        const cid = parseFloat(payModal.dataset.cid);
        confirmPayment(inpPay.value, cid);
    });
    btnCancelPay.addEventListener('click', () => payModal.classList.add('hidden'));
    inpPay.addEventListener('keypress', e => { if(e.key==='Enter') btnConfPay.click(); });

    window.addEventListener('keydown', e => {
        if(gameState && gameState.interactionMode) handleDangerKey(e.key);
    });
    window.addEventListener('keyup', e => {
        if(gameState && gameState.interactionMode) handleDangerKeyUp(e.key);
    });
    
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(eventType => {
        window.addEventListener(eventType, () => {
            resetInactivityTimer();
        }, { passive: true });
    });
    
    function confirmPayment(val, cid) {
        const cust = gameState.customers.find(c=>c.id==cid);
        if(!cust) return;
        const expected = cust.cart.reduce((s,i)=>s+i.price,0);
        const paid = parseFloat(val);
        if(isNaN(paid)) { document.getElementById('pay-error-msg').textContent="Número inválido."; document.getElementById('pay-error-msg').classList.remove('hidden'); return; }
        if(paid === expected) {
            processPayment(cid, paid);
        } else {
            document.getElementById('pay-error-msg').textContent=`Incorrecto. Esperado: $${expected.toFixed(2)}`;
            document.getElementById('pay-error-msg').classList.remove('hidden');
        }
    }
});
