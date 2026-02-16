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
    easy: { hpMult: 1.5, dmgMult: 1.2, spawnMult: 1.0, playerHpBonus: 0 }, // Buffed from 1.0/1.0
    medium: { hpMult: 3.5, dmgMult: 2.5, spawnMult: 1.5, playerHpBonus: 0 }, // Buffed from 2.2/1.7
    hard: { hpMult: 6.0, dmgMult: 4.0, spawnMult: 3.0, playerHpBonus: 0 } // INSANE MODE: Buffed from 3.5/2.5
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
        critMultiplier: 2.0
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

// Re-export upgrades from UpgradeManager for backward compatibility
import { UpgradeManager } from './game/upgrades/UpgradeManager';
export type { Upgrade, UpgradeType } from './game/upgrades/types';

export const UPGRADES_LIST = UpgradeManager.getAll();

export const resetUpgrades = () => {
    UpgradeManager.reset();
};
