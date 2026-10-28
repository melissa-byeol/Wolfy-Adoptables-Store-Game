// --- CONFIGURACIÓN DE LA COMUNIDAD ---
const COMMUNITY_STYLES = {
    "FanmadeG": { border: "#ff69b4", glow: "#ff69b4" }, 
    "FanmadeB": { border: "#69b4ff", glow: "#69b4ff" },
    "Default":  { border: "#ffffff", glow: "#ffffff" } 
};

const COMMUNITY_NAMES = [
    { name: "Pekita", color: "#FFFFFF", specialTagBorder: "FanmadeG" },
    { name: "Yocch", color: "#B9CFEB", specialTagBorder: "FanmadeG" },
];

// --- LOGROS ---
const ACHIEVEMENTS = {
    "demo_2027": {
        id: "demo_2027",
        title: "¡Has Jugado La Demo!!",
        desc: "Has sido de las personas especiales que jugaron durante los primeros meses.",
        isExclusive: true,
        deadline: "2027-01-01"
    }
};

// --- DEFINICIÓN DE MODIFIERS (MULTI-SELECT READY) ---
const AVAILABLE_MODIFIERS = [
    // --- BUENOS ---
    {
        id: "good_offers",
        name: "Good Offers",
        tier: "GOOD",
        description: "-20% Wolfichas. Pop-ups de descuento y Chance VIP (x2 dinero).",
        effect: (state) => {
            state.modifierFlags.hasDiscounts = true;
            state.modifierFlags.vipChance = Math.max(state.modifierFlags.vipChance || 0, 0.05);
            state.priceMultiplier = Math.min(state.priceMultiplier || 1.0, 0.8);
        }
    },
    {
        id: "black_friday",
        name: "Black Friday",
        tier: "GOOD",
        description: "-10% Wolfichas. Spawn rate x2. Cola máxima ampliada a 30.",
        effect: (state) => {
            state.spawnRateMultiplier = (state.spawnRateMultiplier || 1.0) * 2.0;
            state.maxQueueLength = Math.max(state.maxQueueLength || 8, 30);
            state.priceMultiplier = Math.min(state.priceMultiplier || 1.0, 0.9);
        }
    },
    // --- NEUTRALES ---
    {
        id: "tech_failures",
        name: "Fallas Técnicas Estúpidas",
        tier: "NEUTRAL",
        description: "+5% Wolfichas. El stock tarda 1-5 segundos extra en llegar tras comprar.",
        effect: (state) => {
            state.modifierFlags.deliveryDelay = true;
        }
    },
    {
        id: "complex_decisions",
        name: "Decisiones Complicadas",
        tier: "NEUTRAL",
        description: "+15% Wolfichas. Los clientes suelen pedir mezclas de mascotas.",
        effect: (state) => {
            state.modifierFlags.mixedOrders = true;
        }
    },
    // --- MALOS ---
    {
        id: "database_hack",
        name: "Hackeo A La Base De Datos",
        tier: "BAD",
        description: "+30% Wolfichas. Precios ocultos (calcular manual) y 5% fallo delivery.",
        effect: (state) => {
            state.modifierFlags.hidePrices = true;
            state.modifierFlags.deliveryFailChance = Math.max(state.modifierFlags.deliveryFailChance || 0, 0.05);
        }
    },
    {
        id: "greedy_tax",
        name: "Impuesto Al Ahorro",
        tier: "BAD",
        description: "+25% Wolfichas. Si terminas el día con >$1000, pierdes el 10%.",
        effect: (state) => {
            state.modifierFlags.luxuryTax = true;
        }
    },
    {
        id: "chaotic_walkers",
        name: "Caminantes Caóticos",
        tier: "BAD",
        description: "+20% Wolfichas. Los clientes se mueven más lento y a veces retroceden.",
        effect: (state) => {
            state.modifierFlags.slowWalkers = true;
        }
    }
];

const DEFAULT_STATE = {
    day: 1,
    budget: 10.00,
    inventory: {
        white_wolfie: 24,
        brown_wolfie: 0,
        winteruff: 0,
        curious_pups: 0
    },
    shopStatus: 'closed',
    customers: [],
    stats: {
        total_sales_lifetime: 0,
        days_survived: 0,
        winter_sold_fresh: 0,
        has_sold_other_types: false,
        chaos_warnings: 0,
        microwave_incident: false,
        active_chaos_timers: []
    },
    daily_tracker: {
        start_budget: 0,
        earned_today: 0,
        chaos_log: []
    },
    achievements: { unlocked: [] },
    interactionMode: null, 
    petTimer: 0,
    minigame: { active: false, progress: 50, needlePos: 0, direction: 1, intervalId: null },
    upgrades: { expansion1: false, ac: false, expansion2: false },
    currentMaxSlots: 48,
    biteCounter: 0,
    winterAbandonTimer: 0,
    lastBiteTime: 0,
    
    // NUEVO: Estado de Múltiples Modificadores
    activeModifiers: [], // Array de IDs string
    spawnRateMultiplier: 1.0,
    maxQueueLength: 8,
    priceMultiplier: 1.0, // Para descuentos globales
    modifierFlags: {
        hasDiscounts: false,
        vipChance: 0,
        deliveryDelay: false,
        mixedOrders: false,
        hidePrices: false,
        deliveryFailChance: 0,
        luxuryTax: false,
        slowWalkers: false
    }
};

let gameState = null;
let inactivityTimer = null;
const INACTIVITY_LIMIT = 20 * 60 * 1000;
