function updateUI() {
    if (!gameState) return;

    // Actualizar textos
    document.getElementById('display-day').textContent = gameState.day;
    document.getElementById('display-budget').textContent = `$${gameState.budget.toFixed(2)}`;
    document.getElementById('display-stock-white').textContent = gameState.inventory.white_wolfie;
    
    checkQuotaStatus();
}

function showModal(title, body) {
    const modal = document.getElementById('message-modal');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerText = body; // innerText preserva saltos de línea
    modal.classList.remove('hidden');
}

function hideModal() {
    document.getElementById('message-modal').classList.add('hidden');
}

function showToast(message) {
    // Implementación simple usando alert o consola para MVP
    // En un juego real usarías una div flotante
    console.log(message);
    // alert(message); // Descomentar si quieres interrupción fuerte
}
