// --- Game Constants & Configuration ---

export const CONFIG = {
    CANVAS_ID: 'gameCanvas',
    COLORS: {
        primary: '#00ffcc',
        danger: '#ff0055',
        xp: '#ffee00',
        bg: '#0a0a12',
        glass: 'rgba(16, 20, 30, 0.95)',
        gold: '#ffd700',
        swarmForEnemy: '#ff9900',
        tankEnemy: '#aa00ff',
        standardEnemy: '#ff0055',
        bullet: '#ccffff',
        bulletShadow: '#00ffff'
    },
    IS_MOBILE: false, // Will be set on mount
};

export const POWERUP_DURATIONS = {
    double_stats: 900, // 15 seconds
    invulnerability: 900, // 15 seconds
    magnet: 900, // 15 seconds
    drop_rate: 0 // No duration - passive upgrade
};

export const BASE_POWERUP_DURATIONS = { ...POWERUP_DURATIONS };

export const MAX_POWERUP_LEVEL = 10;
export const KILLS_PER_POINT = 125;
export const POWERUP_DURATION_PER_LEVEL = 180; // +3 seconds per level

// Upgrade costs (scaled for 125 kills = 1 point)
export const POWERUP_UPGRADE_COSTS = [
    0,     // Level 1 (starting level, free)
    100,   // Level 1→2 (12,500 kills)
    250,   // Level 2→3
    500,   // Level 3→4
    1000,  // Level 4→5
    2500,  // Level 5→6
    5000,  // Level 6→7
    10000, // Level 7→8
    25000, // Level 8→9
    50000, // Level 9→10
    999999 // Level 10 is max
];

export const POWERUP_INFO = {
    double_stats: {
        id: 'double_stats',
        name: 'OVERCLOCK',
        description: '3x Damage & Speed',
        color: '#ff9500',
        icon: 'overclock',
        emoji: 'overclock'
    },
    invulnerability: {
        id: 'invulnerability',
        name: 'PRIVILEGE_ESC',
        description: 'Damage Immune',
        color: '#ffee00',
        icon: 'privilege_esc',
        emoji: 'privilege_esc'
    },
    magnet: {
        id: 'magnet',
        name: 'DATA_SIPHON',
        description: 'Max Pickup Range',
        color: '#00ddff',
        icon: 'data_siphon',
        emoji: 'data_siphon'
    },
    drop_rate: {
        id: 'drop_rate',
        name: 'RNG_EXPLOIT',
        description: '+10% Drop Rate / Lvl',
        color: '#ff55ff',
        icon: 'rng_exploit',
        emoji: 'rng_exploit'
    }
};

export const DIFFICULTY_SETTINGS = {
    easy: { hpMult: 1.0, dmgMult: 1.0, spawnMult: 1.0, playerHpBonus: 0 }, // Was Normal
    medium: { hpMult: 2.2, dmgMult: 1.7, spawnMult: 1.5, playerHpBonus: 0 }, // Was Hard
    hard: { hpMult: 3.5, dmgMult: 2.5, spawnMult: 2.0, playerHpBonus: 0 } // New Hard Mode
};

export const BASE_STATS = {
    player: {
        radius: 12, // Mobile check will happen in logic or we assume desktop default
        radiusMobile: 8,
        baseSpeed: 4,
        baseHp: 300,
        xpToNext: 50,
        attackSpeed: 17, // Buffed: Faster firing (was 18)
        damage: 30,
        projectileCount: 1,
        pierce: 1,
        bulletSpeed: 16,
        bulletSize: 5,
        bulletSizeMobile: 3,
        pickupRange: 220,
        regen: 3,
        repulsionBaseRange: 90,
        repulsionBaseRangeMobile: 70,
        repulsionForce: 0.15,
        critChance: 0.25,
        critMultiplier: 1.75
    },
    enemies: {
        swarm: {
            radius: 8,
            radiusMobile: 6,
            speedBase: 1.6,
            hpBase: 15,
            xpValue: 2,
            damageBase: 5,
            mass: 0.8
        },
        tank: {
            radius: 24,
            radiusMobile: 16,
            speed: 0.85,
            hpBase: 40,
            xpValue: 15,
            damageBase: 25,
            mass: 4.0
        },
        basic: {
            radius: 12,
            radiusMobile: 9,
            speedBase: 1.5,
            hpBase: 30, // Nerfed: Allow 1-shot (was 35)
            xpValue: 5,
            damageBase: 10,
            mass: 1.2
        }
    }
};

import { IPlayer } from './game/types';

export interface Upgrade {
    id: string;
    count: number;
    name: string;
    desc: string;
    stat: string;
    maxLevel: number;
    icon: string;
    // We can't type 'p' as Player easily here without circular dep, using any or a simple interface
    apply: (p: IPlayer) => void;
    evoName?: string;
    evoDesc?: string;
    evoApply?: (p: IPlayer) => void;
    getCurrentStat?: (count: number) => string;
    isMaxed?: (p: IPlayer) => boolean;
}

export const UPGRADES_LIST: Upgrade[] = [
    {
        id: 'multishot', count: 0, name: 'FORK_PROCESS', desc: 'Splits the main thread into additional projectiles.', stat: '+1 Projectile', icon: 'fork_process', maxLevel: 15,
        apply: (p: IPlayer) => p.projectileCount++,
        evoName: 'PARALLEL_EXEC', evoDesc: 'EVOLUTION: +2 Threads instantly.', evoApply: (p: IPlayer) => p.projectileCount += 2,
        getCurrentStat: (c) => `+${c} Thread${c > 1 ? 's' : ''}`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'multishot'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'haste', count: 0, name: 'I/O_ACCELERATOR', desc: 'Optimizes output stream frequency.', stat: '+30% Attack Speed', icon: 'io_accelerator', maxLevel: 15,
        apply: (p: IPlayer) => { p.modifiers.attackSpeed += 0.30; (p as any).recalculateStats(); },
        evoName: 'BURST_MODE', evoDesc: 'EVOLUTION: Maximum throughput boost.', evoApply: (p: IPlayer) => { p.modifiers.attackSpeed += 0.6; (p as any).recalculateStats(); },
        getCurrentStat: (c) => `+${Math.round(c * 30)}% I/O Spd`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'haste'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'damage', count: 0, name: 'VOLTAGE_SPIKE', desc: 'Amplifies signal strength on impact.', stat: '+25% Damage', icon: 'voltage_spike', maxLevel: 15,
        apply: (p: IPlayer) => { p.modifiers.damage += 0.25; (p as any).recalculateStats(); },
        evoName: 'POWER_SURGE', evoDesc: 'EVOLUTION: +50% Voltage increase.', evoApply: (p: IPlayer) => { p.modifiers.damage += 0.5; (p as any).recalculateStats(); },
        getCurrentStat: (c) => `+${c * 25}% Voltage`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'damage'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'speed', count: 0, name: 'BUS_VELOCITY', desc: 'Increases data transfer across the bus.', stat: '+15% Move Speed', icon: 'bus_velocity', maxLevel: 10,
        apply: (p: IPlayer) => p.speed *= 1.15,
        evoName: 'HYPERTHREADING', evoDesc: 'EVOLUTION: Massive Speed + Max HP.', evoApply: (p: IPlayer) => { p.speed *= 1.4; p.maxHp += 50; p.hp += 50; },
        getCurrentStat: (c) => `+${Math.round((Math.pow(1.15, c) - 1) * 100)}% Velocity`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'speed'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'pierce', count: 0, name: 'POINTER_PIERCERS', desc: 'Logic passes straight through targets.', stat: '+1 Pierce', icon: 'pointer_piercers', maxLevel: 8,
        apply: (p: IPlayer) => p.pierce++,
        evoName: 'NULL_TRAVERSAL', evoDesc: 'EVOLUTION: +3 Pierce & Velocity.', evoApply: (p: IPlayer) => { p.pierce += 3; p.bulletSpeed += 5; },
        getCurrentStat: (c) => `+${c} Depth`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'pierce'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'maxhp', count: 0, name: 'ENCAP_SHIELDING', desc: 'Encapsulates core logic for protection.', stat: '+150 Max HP', icon: 'encap_shielding', maxLevel: 15,
        apply: (p: IPlayer) => { p.maxHp += 150; p.hp += 150; },
        evoName: 'SANDBOXED_CORE', evoDesc: 'EVOLUTION: +75 Max HP & 50% Heal.', evoApply: (p: IPlayer) => { p.maxHp += 75; p.hp = Math.min(p.maxHp, p.hp + (p.maxHp * 0.5)); },
        getCurrentStat: (c) => `+${c * 150} Buffer`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'maxhp'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'regen', count: 0, name: 'SECTOR_REBUILD', desc: 'Repairs corrupted sectors over time.', stat: '+5 HP / Sec', icon: 'sector_rebuild', maxLevel: 10,
        apply: (p: IPlayer) => p.regen += 5,
        evoName: 'DEFRAG_DAEMON', evoDesc: 'EVOLUTION: +5 Regeneration/sec.', evoApply: (p: IPlayer) => p.regen += 5,
        getCurrentStat: (c) => `+${c * 5} Repair/Sec`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'regen'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'size', count: 0, name: 'BUFFER_EXPANSION', desc: 'Increases packet size for larger impact.', stat: '+2 Bullet Size', icon: 'buffer_expansion', maxLevel: 5,
        apply: (p: IPlayer) => p.bulletSize += 2,
        evoName: 'HEAP_OVERFLOW', evoDesc: 'EVOLUTION: +2 Buffer Size.', evoApply: (p: IPlayer) => p.bulletSize += 2,
        getCurrentStat: (c) => `+${c * 2} Bytes`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'size'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'repulsion', count: 0, name: 'RADIUS_REJECTION', desc: 'Pushes invalid data from the core.', stat: '+Range/Force/Dmg', icon: 'radius_rejection', maxLevel: 10,
        apply: (p: IPlayer) => p.repulsionLevel++,
        evoName: 'KERNEL_PANIC_WAVE', evoDesc: 'EVOLUTION: Massive Radius & Double Burn.', evoApply: (p: IPlayer) => { p.repulsionLevel += 5; },
        getCurrentStat: (c) => `Level ${c}`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'repulsion'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'critChance', count: 0, name: 'HEURISTIC_LOGIC', desc: 'Smarter targeting for critical hits.', stat: '+25% Crit Chance', icon: 'heuristic_logic', maxLevel: 4,
        apply: (p: IPlayer) => p.critChance = Math.min(1.0, p.critChance + 0.25),
        getCurrentStat: (c) => `+${Math.round(c * 25)}% Precision`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'critChance'); return u ? u.count >= u.maxLevel : false; }
    },
    {
        id: 'critDamage', count: 0, name: 'BITWISE_BURST', desc: 'Amplifies critical hit intensity.', stat: '+25% Crit Dmg', icon: 'bitwise_burst', maxLevel: 10,
        apply: (p: IPlayer) => p.critMultiplier += 0.25,
        evoName: 'STACK_SMASH', evoDesc: 'EVOLUTION: +10% Crit Dmg.', evoApply: (p: IPlayer) => p.critMultiplier += 0.10,
        getCurrentStat: (c) => `+${c * 25}% Burst`,
        isMaxed: (p: IPlayer) => { const u = UPGRADES_LIST.find(x => x.id === 'critDamage'); return u ? u.count >= u.maxLevel : false; }
    }
];

export const resetUpgrades = () => {
    UPGRADES_LIST.forEach(u => u.count = 0);
};

