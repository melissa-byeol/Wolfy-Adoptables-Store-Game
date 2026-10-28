// js/main.js - V5.2 MULTI-MODIFIERS FLOW

document.addEventListener('DOMContentLoaded', () => {
    
    // Referencias existentes...
    const btnNew = document.getElementById('btn-new-game');
    const btnLoad = document.getElementById('btn-load-game');
    const btnToggle = document.getElementById('btn-toggle-shop');
    const btnNext = document.getElementById('btn-next-day');
    const btnCloseGen = document.getElementById('btn-close-modal');
    
    // Nuevas Referencias para Modifiers
    const screenStart = document.getElementById('start-screen');
    const screenMods = document.getElementById('modifier-screen');
    const screenGame = document.getElementById('game-screen');
    const modifierListContainer = document.getElementById('modifier-list');
    const btnBackMenu = document.getElementById('btn-back-menu');
    const btnStartWithMod = document.getElementById('btn-start-with-modifier');
    
    let selectedModifiersTemp = new Set();

    // Generar Tarjetas de Modifiers
    function renderModifierCards() {
        if(!modifierListContainer) return;
        modifierListContainer.innerHTML = '';
        AVAILABLE_MODIFIERS.forEach(mod => {
            const card = document.createElement('div');
            card.classList.add('modifier-card', `tier-${mod.tier}`);
            card.dataset.id = mod.id;
            card.innerHTML = `<h4>${mod.name}</h4><p>${mod.description}</p>`;
            
            card.onclick = () => {
                if (selectedModifiersTemp.has(mod.id)) {
                    selectedModifiersTemp.delete(mod.id);
                    card.classList.remove('selected');
                } else {
                    selectedModifiersTemp.add(mod.id);
                    card.classList.add('selected');
                }
                
                if (selectedModifiersTemp.size > 0) {
                    btnStartWithMod.disabled = false;
                    btnStartWithMod.textContent = `INICIAR (${selectedModifiersTemp.size} Mods)`;
                } else {
                    btnStartWithMod.disabled = true;
                    btnStartWithMod.textContent = "INICIAR PARTIDA";
                }
            };
            
            modifierListContainer.appendChild(card);
        });
    }

    renderModifierCards();

// FIX: "Cargar Partida" estaba disabled en el HTML y nunca se habilitaba,
// por lo que la partida guardada era inalcanzable. Ahora se habilita si hay save.
(function enableLoadButtonIfSaveExists() {
    const btn = document.getElementById('btn-load-game');
    if (btn && window.localStorage.getItem(SAVE_KEY)) btn.disabled = false;
})();

// Eventos Menú Principal
    btnNew.addEventListener('click', () => {
        screenStart.classList.add('hidden');
        screenMods.classList.remove('hidden');
        selectedModifiersTemp.clear();
        document.querySelectorAll('.modifier-card').forEach(c => c.classList.remove('selected'));
        btnStartWithMod.disabled = true;
        btnStartWithMod.textContent = "INICIAR PARTIDA";
    });

    btnBackMenu.addEventListener('click', () => {
        screenMods.classList.add('hidden');
        screenStart.classList.remove('hidden');
    });

    btnStartWithMod.addEventListener('click', () => {
        screenMods.classList.add('hidden');
        screenGame.classList.remove('hidden');
        // Convertir Set a Array para passing
        initNewGame(Array.from(selectedModifiersTemp));
        updateUI();
    });

    // Cargar Partida (Salta modifiers)
    btnLoad.addEventListener('click', () => {
        const d = loadGame();
        if(d) {
            gameState = d;
            normalizeLoadedState();
            if(gameState.shopStatus==='open') { gameState.shopStatus='closed'; gameState.customers=[]; }
            screenStart.classList.add('hidden');
            screenGame.classList.remove('hidden');
            updateUI();
            if(gameState.shopStatus==='closed') { btnToggle.textContent = "ABRIR TIENDA"; btnToggle.className = "btn success large"; }
        }
    });

    // ... Resto de event listeners (toggleShop, nextDay, buyLote, etc.) ...
    
    btnToggle.addEventListener('click', () => {
        toggleShopState();
        if(gameState.shopStatus==='open') { btnToggle.textContent="CERRAR TIENDA"; btnToggle.className="btn danger large"; }
        else { btnToggle.textContent="ABRIR TIENDA"; btnToggle.className="btn success large"; }
    });

    btnNext.addEventListener('click', () => {
        nextDay();
        // FIX: no pisar gameState.shopStatus a mano ni forzar className:
        // openShop()/closeShop()/updateUI() ya sincronizan texto y clases del botón.
        btnToggle.textContent = "ABRIR TIENDA";
        btnToggle.classList.remove('danger'); btnToggle.classList.add('success');
    });

    btnCloseGen.addEventListener('click', () => document.getElementById('message-modal').classList.add('hidden'));

    const btnBuyW = document.getElementById('btn-buy-lote-white');
    const btnMaxW = document.getElementById('btn-buy-max-white');
    const btnBuyB = document.getElementById('btn-buy-lote-brown');
    const btnMaxB = document.getElementById('btn-buy-max-brown');
    const btnBuyWi = document.getElementById('btn-buy-lote-winter');
    const btnMaxWi = document.getElementById('btn-buy-max-winter');
    const btnBuyPups = document.getElementById('btn-buy-lote-pups');
    const btnMaxPups = document.getElementById('btn-buy-max-pups');
    
    const btnUpg1 = document.getElementById('btn-upg-exp1');
    const btnUpgAc = document.getElementById('btn-upg-ac');
    const btnUpg2 = document.getElementById('btn-upg-exp2');

    const btnConfPay = document.getElementById('btn-confirm-payment');
    const btnCancelPay = document.getElementById('btn-cancel-payment');
    const inpPay = document.getElementById('pay-input-amount');
    const payModal = document.getElementById('payment-modal');

    if(btnBuyW) btnBuyW.addEventListener('click', () => buyLote('white'));
    if(btnMaxW) btnMaxW.addEventListener('click', () => fillStock('white'));
    if(btnBuyB) btnBuyB.addEventListener('click', () => buyLote('brown'));
    if(btnMaxB) btnMaxB.addEventListener('click', () => fillStock('brown'));
    if(btnBuyWi) btnBuyWi.addEventListener('click', () => buyLote('winter'));
    if(btnMaxWi) btnMaxWi.addEventListener('click', () => fillStock('winter'));
    if(btnBuyPups) btnBuyPups.addEventListener('click', () => buyLote('pups'));
    if(btnMaxPups) btnMaxPups.addEventListener('click', () => fillStock('pups'));

    if(btnUpg1) btnUpg1.addEventListener('click', () => buyUpgrade('exp1'));
    if(btnUpgAc) btnUpgAc.addEventListener('click', () => buyUpgrade('ac'));
    if(btnUpg2) btnUpg2.addEventListener('click', () => buyUpgrade('exp2'));

    if(btnConfPay) btnConfPay.addEventListener('click', () => {
        const cid = parseFloat(payModal.dataset.cid);
        confirmPayment(inpPay.value, cid);
    });
    if(btnCancelPay) btnCancelPay.addEventListener('click', () => payModal.classList.add('hidden'));
    if(inpPay) inpPay.addEventListener('keypress', e => { if(e.key==='Enter') btnConfPay.click(); });

    window.addEventListener('keydown', e => { if(gameState && gameState.interactionMode) handleDangerKey(e.key); });
    window.addEventListener('keyup', e => { if(gameState && gameState.interactionMode) handleDangerKeyUp(e.key); });
    
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(eventType => {
        window.addEventListener(eventType, () => resetInactivityTimer(), { passive: true });
    });
    
    function confirmPayment(val, cid) {
        const cust = gameState.customers.find(c=>c.id==cid);
        if(!cust) return;
        const expected = cust.cart.reduce((s,i)=>s+i.price,0);
        const paid = parseFloat(val);
        if(isNaN(paid)) { document.getElementById('pay-error-msg').textContent="Número inválido."; document.getElementById('pay-error-msg').classList.remove('hidden'); return; }
        if(Math.abs(paid - expected) < 0.01) processPayment(cid, paid);
        else { document.getElementById('pay-error-msg').textContent=`Incorrecto. Esperado: $${expected.toFixed(2)}`; document.getElementById('pay-error-msg').classList.remove('hidden'); }
    }
});
