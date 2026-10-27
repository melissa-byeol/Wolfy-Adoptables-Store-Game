document.addEventListener('DOMContentLoaded', () => {
    const saved = loadGame();
    if(saved) { gameState = saved; updateUI(); document.getElementById('btn-load-game').disabled = false; }

    document.getElementById('btn-new-game').addEventListener('click', () => { initNewGame(); document.getElementById('start-screen').classList.remove('active'); document.getElementById('start-screen').classList.add('hidden'); document.getElementById('game-screen').classList.remove('hidden'); });
    document.getElementById('btn-load-game').addEventListener('click', () => { if(gameState) { document.getElementById('start-screen').classList.remove('active'); document.getElementById('start-screen').classList.add('hidden'); document.getElementById('game-screen').classList.remove('hidden'); updateUI(); } });
    document.getElementById('btn-toggle-shop').addEventListener('click', toggleShopState);
    
    document.getElementById('btn-buy-lote-white').addEventListener('click', () => buyLote('white'));
    document.getElementById('btn-buy-max-white').addEventListener('click', () => fillStock('white'));
    document.getElementById('btn-buy-lote-brown').addEventListener('click', () => buyLote('brown'));
    document.getElementById('btn-buy-max-brown').addEventListener('click', () => fillStock('brown'));
    document.getElementById('btn-buy-lote-winter').addEventListener('click', () => buyLote('winter'));
    document.getElementById('btn-buy-max-winter').addEventListener('click', () => fillStock('winter'));

    document.getElementById('btn-upg-exp1').addEventListener('click', () => buyUpgrade('exp1'));
    document.getElementById('btn-upg-ac').addEventListener('click', () => buyUpgrade('ac'));
    document.getElementById('btn-upg-exp2').addEventListener('click', () => buyUpgrade('exp2'));

    document.getElementById('btn-next-day').addEventListener('click', nextDay);
    document.getElementById('btn-close-modal').addEventListener('click', () => document.getElementById('message-modal').classList.add('hidden'));
    
    document.getElementById('btn-confirm-payment').addEventListener('click', () => {
        const cid = document.getElementById('payment-modal').dataset.cid;
        const input = parseFloat(document.getElementById('pay-input-amount').value);
        const cust = gameState.customers.find(c=>c.id==cid);
        if(!cust) return;
        const total = cust.cart.reduce((s,i)=>s+i.price,0);
        if(input >= total) { processPayment(cid, total); } else { document.getElementById('pay-error-msg').textContent = "Monto insuficiente."; document.getElementById('pay-error-msg').classList.remove('hidden'); }
    });
    document.getElementById('btn-cancel-payment').addEventListener('click', hideAllModals);
    document.getElementById('btn-quick-cancel').addEventListener('click', hideAllModals);

    // EVENTOS MINIJUEGO
    document.getElementById('btn-start-minigame').addEventListener('click', () => {
        startGordinflonMinigame('MOVIL');
        document.getElementById('btn-start-minigame').classList.add('hidden');
        document.getElementById('btn-pet-action').classList.remove('hidden');
    });
    document.getElementById('btn-pet-action').addEventListener('click', performPetAction);

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'g' && !gameState.minigame.active && currentDangerCust) startGordinflonMinigame('PC');
        if (e.key.toLowerCase() === 'p' && gameState.minigame.active) performPetAction();
    });
});
