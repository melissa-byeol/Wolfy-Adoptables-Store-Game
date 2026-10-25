const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: {
        white_wolfie: 24 // Stock inicial
    },
    shopStatus: 'closed', // 'open' o 'closed'
    customers: [], // Array de objetos cliente activos
    stats: {
        total_sales_lifetime: 0,
        days_survived: 0
    },
    daily_tracker: {
        start_budget: 0,
        earned_today: 0
    }
};

let gameState = null;
