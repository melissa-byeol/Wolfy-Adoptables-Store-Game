// Estructura predeterminada del juego
const DEFAULT_STATE = {
    day: 1,
    budget: 0, // Se llenará al iniciar partida
    inventory: {
        white_wolfie: 24 // 2 lotes gratis iniciales
    },
    stats: {
        total_sales_lifetime: 0,
        days_survived: 0
    },
    daily_tracker: {
        start_budget: 0, // Presupuesto al inicio del día actual
        earned_today: 0  // Cuánto has ganado neto hoy
    }
};

// Variable global mutable
let gameState = null;
