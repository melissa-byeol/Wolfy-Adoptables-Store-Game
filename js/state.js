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

// --- SKINS (Wolfies Go Studio Certification) ---
// Cada skin certifica un producto. Costeadas con monedas-evento:
//   • "wolfichas" : moneda general (temporada actual y futuras).
//   • "candies"   : moneda de Halloween atrasado — solo ganjable/comprable
//                    entre el 29/10/2026 y el 30/11/2026 inclusive.
//
// V2 — Skins REALES: cada skin define `visual` con:
//   palette : [color base, color secundario] -> rellena el cuerpo del wolfie
//             con un degradado (ya no es un emoji suelto encima).
//   art     : nombre del diseño grabado en el cuerpo ("spots", "mountain"...).
//   fx      : partícula que suelta la skin ("sparkle", "snowflake", ...).
// Los CSS correspondientes viven en style.css como .skin-<id>, .skin-art-<art>
// y .fx-particle.fx-<tipo>.
const SKINS = [
    { id: "classic", name: "Clásico", emoji: "⬜", product: "white_wolfie", cost: { wolfichas: 5 }, currency: "wolfichas", desc: "El pelaje original del lobito blanco.", visual: { palette: ["#f5f5f5", "#d7dbe0"], art: "plain", fx: null } },
    { id: "golden", name: "Dorado", emoji: "✨", product: "white_wolfie", cost: { wolfichas: 20 }, currency: "wolfichas", desc: "Manchas amarillas que sueltan destellos ✨.", visual: { palette: ["#ffe45c", "#e6a817"], art: "spots", fx: "sparkle" } },
    { id: "choco", name: "Chocolate", emoji: "🍫", product: "brown_wolfie", cost: { candies: 10 }, currency: "candies", desc: "Body de chocolate con gotas y brillos 🍫.", visual: { palette: ["#8a5a2b", "#4e2c14"], art: "drops", fx: "crumb" } },
    { id: "pumpkin", name: "Calabaza", emoji: "🎃", product: "brown_wolfie", cost: { candies: 15 }, currency: "candies", desc: "Body tipo calabaza con vetas y calidez 🔥.", visual: { palette: ["#ff9d2e", "#c85a10"], art: "ribs", fx: "ember" } },
    { id: "snowy", name: "Ventisca", emoji: "🌨️", product: "winteruff", cost: { wolfichas: 25 }, currency: "wolfichas", desc: "Body de montaña nevada que suelta copo ❄️.", visual: { palette: ["#cfeeff", "#5aa7d8"], art: "mountain", fx: "snowflake" } },
    { id: "spooky", name: "Espeluznante", emoji: "👻", product: "winteruff", cost: { candies: 20 }, currency: "candies", desc: "Fantasma pálido con ojos huecos y neblina 👻.", visual: { palette: ["#eef2ff", "#9fb0d8"], art: "ghostface", fx: "wisp" } },
    { id: "rainbow", name: "Arcoíris", emoji: "🌈", product: "curious_pups", cost: { wolfichas: 30 }, currency: "wolfichas", desc: "Franjas de todos los colores con estrellitas ⭐.", visual: { palette: ["#ff5b5b", "#4d7cff"], art: "stripes", fx: "star" } },
    { id: "candy_corn", name: "Caramelo Maíz", emoji: "🍬", product: "curious_pups", cost: { candies: 25 }, currency: "candies", desc: "Bandas amarillo-naranja-blanco de caramelo 🍬.", visual: { palette: ["#ffd23f", "#ffffff"], art: "candycorn", fx: "candybit" } }
];

// --- HELPERS DE SKINS VISUALES ---
// Devuelve la skin equipada para un producto (o null si usa el look por defecto).
function getEquippedSkin(productKey) {
    if (!gameState) return null;
    ensureCurrencyState();
    const id = gameState.equippedSkins[productKey];
    if (!id) return null;
    return SKINS.find(s => s.id === id) || null;
}

// Clase CSS de la skin (null = sin skin equipada -> look clásico del juego).
function getSkinClass(productKey) {
    const skin = getEquippedSkin(productKey);
    return skin ? `skin-${skin.id}` : null;
}

// Partículas que suelta una skin (["sparkle"], []...), según su config `visual.fx`.
function getSkinFx(skinId) {
    const skin = SKINS.find(s => s.id === skinId);
    return (skin && skin.visual && skin.visual.fx) ? [skin.visual.fx] : [];
}

// Construye el elemento visual de una skin: mini-wolfie con body propio
// (orejas, hocico, mejillas), arte grabado por CSS y partículas animadas.
// `opts.tagText`: etiqueta opcional (p.ej. el pedido del cliente) bajo el cuerpo.
function buildSkinElement(productKey, opts = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'skin-body';
    if (opts.extraClass) wrap.classList.add(opts.extraClass);

    const skin = getEquippedSkin(productKey);
    const v = skin ? skin.visual : null;

    const critter = document.createElement('div');
    critter.className = 'skin-critter' + (skin ? ` skin-${skin.id}` : '');
    if (v && Array.isArray(v.palette) && v.palette.length >= 2) {
        // Degradado del pelaje -> el COLOR vive en el cuerpo, no en un emoji suelto.
        critter.style.background = `linear-gradient(150deg, ${v.palette[0]} 0%, ${v.palette[1]} 100%)`;
    } else {
        // Sin skin equipada: fallback al estilo clásico del slot.
        critter.style.background = opts.baseFallback || 'transparent';
    }

    ['ear-l', 'ear-r', 'snout', 'cheek-l', 'cheek-r'].forEach(part => {
        const el = document.createElement('i');
        el.className = 'skin-part ' + part;
        critter.appendChild(el);
    });

    if (v && v.art) {
        const art = document.createElement('span');
        art.className = 'skin-art skin-art-' + v.art;
        critter.appendChild(art);
    }

    wrap.appendChild(critter);

    if (v && v.fx) {
        for (let i = 0; i < 3; i++) {
            const p = document.createElement('span');
            p.className = `fx-particle fx-${v.fx} fx-i${i}`;
            wrap.appendChild(p);
        }
    }

    if (opts.tagText) {
        const tag = document.createElement('span');
        tag.className = 'skin-tag';
        tag.textContent = opts.tagText;
        wrap.appendChild(tag);
    }
    return wrap;
}

// Ventana del evento de caramelos (Halloween atrasado): hoy -> 30 nov 2026
const CANDY_EVENT_START = new Date("2026-10-29T00:00:00");
const CANDY_EVENT_END = new Date("2026-11-30T23:59:59");

function isCandyEventActive(now = new Date()) {
    return now >= CANDY_EVENT_START && now <= CANDY_EVENT_END;
}

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
            // FIX: el flag hidePrices nunca se usaba en la UI. Se marca para
            // que updateUI() oculte los precios de los estantes/recibos simples.
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
        chaos_log: [],
        chaos_processed: false
    },
    achievements: { unlocked: [] },
    // NUEVO: Monedas-evento y skins (Wolfies Go Studio Certification)
    currencies: { wolfichas: 0, candies: 0 },
    ownedSkins: [],          // ids de skins compradas
    equippedSkins: {},       // { producto: skinId } — una skin equipada por producto
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
