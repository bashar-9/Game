// Map definitions for scrollable world

export interface Wall {
    x: number;
    y: number;
    w: number;
    h: number;
    destructible?: boolean;  // Can be destroyed by player
    hp?: number;             // Health if destructible
}

export interface HazardZone {
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'damage' | 'slow' | 'teleport';
    // Damage: deals damage over time
    damagePerSecond?: number;
    // Slow: reduces speed multiplier
    slowMultiplier?: number;
    // Visual effect
    color: string;
    pulseSpeed?: number;
}

export interface MapTheme {
    backgroundColor: string;
    gridColor: string;
    wallColor: string;
    wallBorderColor: string;
    ambientParticles?: 'dust' | 'digital' | 'ember';
    // Unique visual effects
    hasGlitchEffect?: boolean;
    hasBlinkingLights?: boolean;
    hasBlueprintStyle?: boolean;
}

export interface MapConfig {
    id: string;
    name: string;
    width: number;
    height: number;
    walls: Wall[];
    hazards: HazardZone[];
    theme: MapTheme;
}

// --- SANDBOX (Easy) ---
// Open training ground with 4 corner pillars
const SANDBOX_WALLS: Wall[] = [
    // Top-left pillar
    { x: 400, y: 400, w: 120, h: 120 },
    // Top-right pillar
    { x: 1980, y: 400, w: 120, h: 120 },
    // Bottom-left pillar
    { x: 400, y: 1980, w: 120, h: 120 },
    // Bottom-right pillar
    { x: 1980, y: 1980, w: 120, h: 120 },
    // Center obstacle
    { x: 1190, y: 1190, w: 120, h: 120 },
];

export const MAP_SANDBOX: MapConfig = {
    id: 'sandbox',
    name: 'SANDBOX',
    width: 2500,
    height: 2500,
    walls: SANDBOX_WALLS,
    hazards: [], // No hazards in training mode - safe environment
    theme: {
        backgroundColor: '#0d1b2a', // Deeper blueprint blue
        gridColor: 'rgba(0, 180, 255, 0.12)',
        wallColor: '#1b3a5c',
        wallBorderColor: '#00ccff',
        ambientParticles: 'dust',
        hasBlueprintStyle: true,
    },
};

// --- PRODUCTION (Medium) ---
// Server farm with vertical rack aisles
const PRODUCTION_WALLS: Wall[] = [
    // Aisle 1
    { x: 600, y: 200, w: 80, h: 1200 },
    { x: 600, y: 1600, w: 80, h: 1200 },
    // Aisle 2
    { x: 1200, y: 400, w: 80, h: 1400 },
    { x: 1200, y: 2000, w: 80, h: 1000 },
    // Aisle 3
    { x: 1800, y: 200, w: 80, h: 1000 },
    { x: 1800, y: 1400, w: 80, h: 1600 },
    // Aisle 4
    { x: 2400, y: 600, w: 80, h: 1200 },
    { x: 2400, y: 2000, w: 80, h: 800 },
    // Aisle 5
    { x: 3000, y: 200, w: 80, h: 1400 },
    { x: 3000, y: 1800, w: 80, h: 1200 },
    // Horizontal connectors
    { x: 200, y: 1500, w: 400, h: 60 },
    { x: 3400, y: 1500, w: 400, h: 60 },
];

// Slow zones (cooling vents) for Production
const PRODUCTION_HAZARDS: HazardZone[] = [
    // Cooling vent zones - slow player and enemies
    { x: 800, y: 800, w: 300, h: 300, type: 'slow', slowMultiplier: 0.5, color: 'rgba(0, 200, 255, 0.3)', pulseSpeed: 2 },
    { x: 2200, y: 1200, w: 300, h: 300, type: 'slow', slowMultiplier: 0.5, color: 'rgba(0, 200, 255, 0.3)', pulseSpeed: 2 },
    { x: 1400, y: 2800, w: 400, h: 200, type: 'slow', slowMultiplier: 0.4, color: 'rgba(0, 200, 255, 0.3)', pulseSpeed: 2.5 },
    { x: 3200, y: 600, w: 250, h: 350, type: 'slow', slowMultiplier: 0.5, color: 'rgba(0, 200, 255, 0.3)', pulseSpeed: 2 },
];

export const MAP_PRODUCTION: MapConfig = {
    id: 'production',
    name: 'PRODUCTION',
    width: 4000,
    height: 4000,
    walls: PRODUCTION_WALLS,
    hazards: PRODUCTION_HAZARDS,
    theme: {
        backgroundColor: '#050510',
        gridColor: 'rgba(0, 255, 200, 0.05)',
        wallColor: '#1a1a2e',
        wallBorderColor: '#00ffcc',
        ambientParticles: 'digital',
        hasBlinkingLights: true,
    },
};

// --- KERNEL PANIC (Hard) ---
// Chaotic debris layout
const KERNEL_PANIC_WALLS: Wall[] = [
    // Scattered debris blocks
    { x: 300, y: 500, w: 150, h: 80 },
    { x: 800, y: 200, w: 100, h: 200 },
    { x: 1200, y: 700, w: 200, h: 100 },
    { x: 500, y: 1100, w: 80, h: 250 },
    { x: 1500, y: 400, w: 120, h: 120 },
    { x: 2000, y: 800, w: 180, h: 80 },
    { x: 1800, y: 1200, w: 100, h: 180 },
    { x: 400, y: 1800, w: 200, h: 100 },
    { x: 1000, y: 1500, w: 150, h: 150 },
    { x: 2200, y: 1700, w: 120, h: 200 },
    { x: 700, y: 2200, w: 180, h: 80 },
    { x: 1600, y: 2000, w: 100, h: 160 },
    { x: 2500, y: 500, w: 80, h: 300 },
    { x: 2400, y: 2400, w: 200, h: 100 },
    { x: 1200, y: 2500, w: 150, h: 80 },
];

// Hazard zones for Kernel Panic - damage zones and teleporters
const KERNEL_PANIC_HAZARDS: HazardZone[] = [
    // Glitch damage zones (corrupted memory)
    { x: 600, y: 600, w: 200, h: 200, type: 'damage', damagePerSecond: 8, color: 'rgba(255, 0, 100, 0.4)', pulseSpeed: 4 },
    { x: 1400, y: 900, w: 250, h: 150, type: 'damage', damagePerSecond: 10, color: 'rgba(255, 0, 100, 0.4)', pulseSpeed: 5 },
    { x: 2100, y: 1400, w: 200, h: 200, type: 'damage', damagePerSecond: 8, color: 'rgba(255, 0, 100, 0.4)', pulseSpeed: 4 },
    { x: 800, y: 1900, w: 300, h: 150, type: 'damage', damagePerSecond: 12, color: 'rgba(255, 0, 100, 0.5)', pulseSpeed: 6 },
    // Teleporter zones (corrupted sectors)
    { x: 200, y: 200, w: 150, h: 150, type: 'teleport', color: 'rgba(150, 0, 255, 0.5)', pulseSpeed: 3 },
    { x: 2650, y: 200, w: 150, h: 150, type: 'teleport', color: 'rgba(150, 0, 255, 0.5)', pulseSpeed: 3 },
    { x: 200, y: 2650, w: 150, h: 150, type: 'teleport', color: 'rgba(150, 0, 255, 0.5)', pulseSpeed: 3 },
    { x: 2650, y: 2650, w: 150, h: 150, type: 'teleport', color: 'rgba(150, 0, 255, 0.5)', pulseSpeed: 3 },
];

export const MAP_KERNEL_PANIC: MapConfig = {
    id: 'kernel_panic',
    name: 'KERNEL_PANIC',
    width: 3000,
    height: 3000,
    walls: KERNEL_PANIC_WALLS,
    hazards: KERNEL_PANIC_HAZARDS,
    theme: {
        backgroundColor: '#100505',
        gridColor: 'rgba(255, 0, 100, 0.06)',
        wallColor: '#2a0a0a',
        wallBorderColor: '#ff0055',
        ambientParticles: 'ember',
        hasGlitchEffect: true,
    },
};

// Map lookup by difficulty
export const MAPS_BY_DIFFICULTY: Record<'easy' | 'medium' | 'hard', MapConfig> = {
    easy: MAP_SANDBOX,
    medium: MAP_PRODUCTION,
    hard: MAP_KERNEL_PANIC,
};

// --- Collision Helper ---
/**
 * Check if a circle collides with a rectangle (wall).
 * Returns penetration vector if colliding, null otherwise.
 */
export function circleRectCollision(
    cx: number,
    cy: number,
    radius: number,
    rect: Wall
): { nx: number; ny: number; depth: number } | null {
    // Find closest point on rectangle to circle center
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));

    const dx = cx - closestX;
    const dy = cy - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist === 0) {
            // Circle center is inside rectangle - push out horizontally
            return { nx: 1, ny: 0, depth: radius };
        }
        return {
            nx: dx / dist,
            ny: dy / dist,
            depth: radius - dist,
        };
    }

    return null;
}

/**
 * Resolve circle collision with all walls in a map.
 * Returns adjusted position.
 */
export function resolveWallCollisions(
    cx: number,
    cy: number,
    radius: number,
    walls: Wall[]
): { x: number; y: number } {
    let x = cx;
    let y = cy;

    for (const wall of walls) {
        const collision = circleRectCollision(x, y, radius, wall);
        if (collision) {
            x += collision.nx * collision.depth;
            y += collision.ny * collision.depth;
        }
    }

    return { x, y };
}

/**
 * Check if a point is inside any wall (for bullet collision).
 */
export function pointInWalls(px: number, py: number, walls: Wall[]): boolean {
    for (const wall of walls) {
        if (px >= wall.x && px <= wall.x + wall.w && py >= wall.y && py <= wall.y + wall.h) {
            return true;
        }
    }
    return false;
}
