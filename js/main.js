// js/main.js - V5.2 MODIFIERS FLOW

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
    
    let selectedModifierTemp = 'none';

    // Generar Tarjetas de Modifiers
    function renderModifierCards() {
        modifierListContainer.innerHTML = '';
        AVAILABLE_MODIFIERS.forEach(mod => {
            const card = document.createElement('div');
            card.classList.add('modifier-card', `tier-${mod.tier}`);
            card.dataset.id = mod.id;
            card.innerHTML = `<h4>${mod.name}</h4><p>${mod.description}</p>`;
            
            card.onclick = () => {
                document.querySelectorAll('.modifier-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedModifierTemp = mod.id;
                btnStartWithMod.disabled = false;
            };
            
            modifierListContainer.appendChild(card);
        });
    }

    renderModifierCards();

    // Eventos Menú Principal
    btnNew.addEventListener('click', () => {
        screenStart.classList.add('hidden');
        screenMods.classList.remove('hidden');
        document.querySelectorAll('.modifier-card').forEach(c => c.classList.remove('selected'));
        btnStartWithMod.disabled = true;
        selectedModifierTemp = 'none';
    });

    btnBackMenu.addEventListener('click', () => {
        screenMods.classList.add('hidden');
        screenStart.classList.remove('hidden');
    });

    btnStartWithMod.addEventListener('click', () => {
        screenMods.classList.add('hidden');
        screenGame.classList.remove('hidden');
        initNewGame(selectedModifierTemp);
        updateUI();
    });

    // Cargar Partida (Salta modifiers)
    btnLoad.addEventListener('click', () => {
        const d = loadGame();
        if(d) {
            gameState = d;
            if(gameState.shopStatus==='open') { gameState.shopStatus='closed'; gameState.customers=[]; }
            screenStart.classList.add('hidden');
            screenGame.classList.remove('hidden');
            updateUI();
            if(gameState.shopStatus==='closed') { btnToggle.textContent = "ABRIR TIENDA"; btnToggle.className = "btn success large"; }
        }
    });

    // ... (Resto de event listeners: toggleShop, nextDay, buyLote, etc. iguales a la versión anterior) ...
    
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
        if(paid === expected) processPayment(cid, paid);
        else { document.getElementById('pay-error-msg').textContent=`Incorrecto. Esperado: $${expected.toFixed(2)}`; document.getElementById('pay-error-msg').classList.remove('hidden'); }
    }
});
