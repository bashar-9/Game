// Map definitions for scrollable world

export interface Decoration {
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'floor_decal' | 'cable' | 'crack' | 'symbol';
    color: string;
    rotation?: number;
    opacity?: number;
}

export type WallType = 'wall' | 'crate' | 'fence' | 'server' | 'glass' | 'glitch';

export interface Wall {
    x: number;
    y: number;
    w: number;
    h: number;
    type?: WallType;        // Visual type for rendering
    color?: string;          // Override color
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
    // Visual Style Flags
    isIndustrial?: boolean;   // Sandbox / Warehouse
    isDatacenter?: boolean;   // Production / Server Farm
    isGlitch?: boolean;       // Kernel Panic / Corruption
}

export interface MapConfig {
    id: string;
    name: string;
    width: number;
    height: number;
    walls: Wall[];
    hazards: HazardZone[];
    decorations: Decoration[];
    theme: MapTheme;
}

// --- SANDBOX (Easy) -> "Neon Warehouse" Style ---
// Open courtyard with scattered shipping containers (crates)
const SANDBOX_WALLS: Wall[] = [
    // Central "Arena" bounds defined by heavy crates
    // Top Left Cluster
    { x: 300, y: 300, w: 100, h: 200, type: 'crate' },
    { x: 400, y: 350, w: 100, h: 100, type: 'crate' },

    // Top Right Cluster
    { x: 2100, y: 300, w: 100, h: 200, type: 'crate' },
    { x: 2000, y: 350, w: 100, h: 100, type: 'crate' },

    // Bottom Left Cluster
    { x: 300, y: 2000, w: 100, h: 200, type: 'crate' },
    { x: 400, y: 2050, w: 100, h: 100, type: 'crate' },

    // Bottom Right Cluster
    { x: 2100, y: 2000, w: 100, h: 200, type: 'crate' },
    { x: 2000, y: 2050, w: 100, h: 100, type: 'crate' },

    // Center Structures - Indestructible "Core" pillars
    { x: 1000, y: 1000, w: 80, h: 500, type: 'wall' },
    { x: 1420, y: 1000, w: 80, h: 500, type: 'wall' },

    // Scattered cover
    { x: 800, y: 600, w: 80, h: 80, type: 'crate' },
    { x: 1700, y: 600, w: 80, h: 80, type: 'crate' },
    { x: 800, y: 1800, w: 80, h: 80, type: 'crate' },
    { x: 1700, y: 1800, w: 80, h: 80, type: 'crate' },
];

const SANDBOX_DECORATIONS: Decoration[] = [
    // Floor markings
    { x: 1250, y: 1250, w: 400, h: 400, type: 'symbol', color: 'rgba(255, 200, 0, 0.1)', rotation: 0 },
    { x: 1250, y: 400, w: 200, h: 20, type: 'floor_decal', color: 'rgba(255, 255, 0, 0.2)' },
    { x: 1250, y: 2100, w: 200, h: 20, type: 'floor_decal', color: 'rgba(255, 255, 0, 0.2)' },
];

export const MAP_SANDBOX: MapConfig = {
    id: 'sandbox',
    name: 'SANDBOX',
    width: 2500,
    height: 2500,
    walls: SANDBOX_WALLS,
    hazards: [],
    decorations: SANDBOX_DECORATIONS,
    theme: {
        backgroundColor: '#1a1a24', // Dark industrial grey
        gridColor: 'rgba(255, 220, 100, 0.05)', // Faint yellow industrial grid
        wallColor: '#2d2d3d',
        wallBorderColor: '#ffaa00', // Industrial safety orange
        ambientParticles: 'dust',
        isIndustrial: true,
    },
};

// --- PRODUCTION (Medium) -> "Datacenter Core" Style ---
// Structured server farm, tight corridors, destructible racks
// Retains the Blue/Cyan palette user liked
const PRODUCTION_WALLS: Wall[] = [
    // Main Server Aisles - Vertical
    { x: 600, y: 400, w: 60, h: 800, type: 'server' },
    { x: 600, y: 1400, w: 60, h: 800, type: 'server' },

    { x: 3340, y: 400, w: 60, h: 800, type: 'server' },
    { x: 3340, y: 1400, w: 60, h: 800, type: 'server' },

    // Central Hub - Hardened Glass Walls
    { x: 1500, y: 1500, w: 1000, h: 40, type: 'glass' }, // Horizontal bar
    { x: 1500, y: 2460, w: 1000, h: 40, type: 'glass' },

    // Scattered Data Banks
    { x: 1200, y: 800, w: 100, h: 100, type: 'server' },
    { x: 2700, y: 800, w: 100, h: 100, type: 'server' },
    { x: 1200, y: 3200, w: 100, h: 100, type: 'server' },
    { x: 2700, y: 3200, w: 100, h: 100, type: 'server' },

    // Large Perimeter Blocks (Out of bounds feel)
    { x: 0, y: 0, w: 400, h: 400, type: 'wall' },
    { x: 3600, y: 0, w: 400, h: 400, type: 'wall' },
];

const PRODUCTION_HAZARDS: HazardZone[] = [
    // Cooling Vents (Slow)
    { x: 800, y: 800, w: 200, h: 200, type: 'slow', slowMultiplier: 0.5, color: 'rgba(0, 255, 255, 0.2)' },
    { x: 3000, y: 800, w: 200, h: 200, type: 'slow', slowMultiplier: 0.5, color: 'rgba(0, 255, 255, 0.2)' },
    { x: 1900, y: 1900, w: 200, h: 200, type: 'slow', slowMultiplier: 0.5, color: 'rgba(0, 255, 255, 0.2)' },

    // Energy Leaks (Damage)
    { x: 1950, y: 400, w: 100, h: 100, type: 'damage', damagePerSecond: 10, color: 'rgba(255, 50, 50, 0.3)', pulseSpeed: 5 },
];

const PRODUCTION_DECORATIONS: Decoration[] = [
    // Cables running on floor
    { x: 630, y: 0, w: 10, h: 4000, type: 'cable', color: 'rgba(0, 200, 255, 0.3)' },
    { x: 3370, y: 0, w: 10, h: 4000, type: 'cable', color: 'rgba(0, 200, 255, 0.3)' },
    { x: 0, y: 2000, w: 4000, h: 10, type: 'cable', color: 'rgba(0, 200, 255, 0.3)' },
];

export const MAP_PRODUCTION: MapConfig = {
    id: 'production',
    name: 'PRODUCTION',
    width: 4000,
    height: 4000,
    walls: PRODUCTION_WALLS,
    hazards: PRODUCTION_HAZARDS,
    decorations: PRODUCTION_DECORATIONS,
    theme: {
        backgroundColor: '#050a14', // Deep Server Blue
        gridColor: 'rgba(0, 240, 255, 0.08)',
        wallColor: '#101825',
        wallBorderColor: '#00ccff', // Cyan Neon
        ambientParticles: 'digital',
        isDatacenter: true,
    },
};

// --- KERNEL PANIC (Hard) -> "The Void" Style ---
// Deep space, abstract geometry, stable but ominous
const KERNEL_PANIC_WALLS: Wall[] = [
    // Void Blocks - stable, heavy geometry
    { x: 500, y: 500, w: 150, h: 150, type: 'wall' },
    { x: 2500, y: 500, w: 150, h: 150, type: 'wall' },
    { x: 500, y: 2500, w: 150, h: 150, type: 'wall' },
    { x: 2500, y: 2500, w: 150, h: 150, type: 'wall' },

    // Central Monoliths
    { x: 1300, y: 1300, w: 400, h: 50, type: 'wall' },
    { x: 1300, y: 1650, w: 400, h: 50, type: 'wall' },

    // Outer Barriers
    { x: 200, y: 1000, w: 50, h: 1000, type: 'wall' },
    { x: 2750, y: 1000, w: 50, h: 1000, type: 'wall' },
];

const KERNEL_PANIC_HAZARDS: HazardZone[] = [
    // Void Zones (Damage)
    { x: 800, y: 800, w: 300, h: 300, type: 'damage', damagePerSecond: 15, color: 'rgba(140, 0, 255, 0.25)', pulseSpeed: 2 },
    { x: 1900, y: 1900, w: 300, h: 300, type: 'damage', damagePerSecond: 15, color: 'rgba(140, 0, 255, 0.25)', pulseSpeed: 2 },

    // Random Teleporters
    { x: 300, y: 300, w: 100, h: 100, type: 'teleport', color: 'rgba(0, 255, 200, 0.3)' },
    { x: 2600, y: 2600, w: 100, h: 100, type: 'teleport', color: 'rgba(0, 255, 200, 0.3)' },
];

const KERNEL_PANIC_DECORATIONS: Decoration[] = [
    // Abstract geometry instead of cracks
    { x: 1500, y: 1500, w: 800, h: 800, type: 'symbol', color: 'rgba(100, 0, 255, 0.05)', rotation: 0 },
    { x: 500, y: 2000, w: 300, h: 300, type: 'symbol', color: 'rgba(100, 0, 255, 0.05)', rotation: 0.78 },
];

export const MAP_KERNEL_PANIC: MapConfig = {
    id: 'kernel_panic',
    name: 'THE_VOID',
    width: 3000,
    height: 3000,
    walls: KERNEL_PANIC_WALLS,
    hazards: KERNEL_PANIC_HAZARDS,
    decorations: KERNEL_PANIC_DECORATIONS,
    theme: {
        backgroundColor: '#050010', // Deep Violet/Black
        gridColor: 'rgba(140, 0, 255, 0.1)',
        wallColor: '#1a0525', // Dark Purple
        wallBorderColor: '#9d00ff', // Neon Purple
        ambientParticles: 'ember', // Floating embers (maybe purple?)
        // remove isGlitch
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
 * Returns the wall hit or null.
 */
export function getWallAtPoint(px: number, py: number, walls: Wall[]): Wall | null {
    for (const wall of walls) {
        if (px >= wall.x && px <= wall.x + wall.w && py >= wall.y && py <= wall.y + wall.h) {
            return wall;
        }
    }
    return null;
}

/**
 * Legacy support for simple boolean check
 */
export function pointInWalls(px: number, py: number, walls: Wall[]): boolean {
    return getWallAtPoint(px, py, walls) !== null;
}
