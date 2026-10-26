const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: {
        white_wolfie: 24,
        brown_wolfie: 0 // Stock inicial de Gordinflones
    },
    shopStatus: 'closed',
    customers: [],
    stats: { total_sales_lifetime: 0, days_survived: 0 },
    daily_tracker: { start_budget: 0, earned_today: 0 },
    
    // Estado de interacción
    interactionMode: null, // null, 'grabbing', 'petting'
    petTimer: 0,           
    pendingCustomerForPayment: null // Referencia al cliente peligroso
};

let gameState = null;
