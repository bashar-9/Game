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

export const DIFFICULTY_SETTINGS = {
    easy: { hpMult: 0.7, dmgMult: 0.5, spawnMult: 0.8, playerHpBonus: 100 },
    normal: { hpMult: 1.0, dmgMult: 1.0, spawnMult: 1.0, playerHpBonus: 0 },
    hard: { hpMult: 1.4, dmgMult: 1.5, spawnMult: 1.3, playerHpBonus: -50 }
};

export const BASE_STATS = {
    player: {
        radius: 12, // Mobile check will happen in logic or we assume desktop default
        radiusMobile: 8,
        baseSpeed: 4,
        baseHp: 300,
        xpToNext: 50,
        attackSpeed: 25,
        damage: 25,
        projectileCount: 1,
        pierce: 1,
        bulletSpeed: 12,
        bulletSize: 5,
        bulletSizeMobile: 3,
        pickupRange: 220,
        regen: 1,
        repulsionBaseRange: 90,
        repulsionBaseRangeMobile: 70,
        repulsionForce: 0.15,
        critChance: 0.05,
        critMultiplier: 1.4
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
            hpBase: 60,
            xpValue: 15,
            damageBase: 25,
            mass: 4.0
        },
        basic: {
            radius: 12,
            radiusMobile: 9,
            speedBase: 1.5,
            hpBase: 35,
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
        id: 'multishot', count: 0, name: 'Split-Fire Mod', desc: 'Adds an additional projectile.', stat: '+1 Projectile', icon: '⫚',
        apply: (p: IPlayer) => p.projectileCount++,
        evoName: 'Bullet Storm', evoDesc: 'EVOLUTION: +2 Projectiles instantly.', evoApply: (p: IPlayer) => p.projectileCount += 2,
        getCurrentStat: (c) => `+${c} Projectile${c > 1 ? 's' : ''}`,
        isMaxed: (p: IPlayer) => p.projectileCount >= 17
    },
    {
        id: 'haste', count: 0, name: 'Hyper-Loader', desc: 'Increases weapon firing rate.', stat: '+25% Attack Speed', icon: '⚡',
        apply: (p: IPlayer) => { p.modifiers.attackSpeed += 0.25; (p as any).recalculateStats(); },
        evoName: 'Minigun Mech', evoDesc: 'EVOLUTION: Massive Attack Speed boost.', evoApply: (p: IPlayer) => { p.modifiers.attackSpeed += 0.6; (p as any).recalculateStats(); },
        getCurrentStat: (c) => `+${c * 25}% Atk Spd`
    },
    {
        id: 'damage', count: 0, name: 'Plasma Core', desc: 'Increases raw damage output.', stat: '+20% Damage', icon: '💥',
        apply: (p: IPlayer) => { p.modifiers.damage += 0.2; (p as any).recalculateStats(); },
        evoName: 'Fusion Reactor', evoDesc: 'EVOLUTION: +50% Bonus Damage.', evoApply: (p: IPlayer) => { p.modifiers.damage += 0.5; (p as any).recalculateStats(); },
        getCurrentStat: (c) => `+${c * 20}% Damage`
    },
    {
        id: 'speed', count: 0, name: 'Ionic Thrusters', desc: 'Enhances movement speed.', stat: '+15% Move Speed', icon: '👟',
        apply: (p: IPlayer) => p.speed *= 1.15,
        evoName: 'Warp Drive', evoDesc: 'EVOLUTION: Massive Speed + Max HP.', evoApply: (p: IPlayer) => { p.speed *= 1.4; p.maxHp += 50; p.hp += 50; },
        getCurrentStat: (c) => `+${Math.round((Math.pow(1.15, c) - 1) * 100)}% Speed`
    },
    {
        id: 'pierce', count: 0, name: 'Tungsten Rounds', desc: 'Projectiles punch through targets.', stat: '+1 Pierce', icon: '🏹',
        apply: (p: IPlayer) => p.pierce++,
        evoName: 'Spectral Shells', evoDesc: 'EVOLUTION: +3 Pierce & Velocity.', evoApply: (p: IPlayer) => { p.pierce += 3; p.bulletSpeed += 5; },
        getCurrentStat: (c) => `+${c} Pierce`
    },
    {
        id: 'maxhp', count: 0, name: 'Titan Plating', desc: 'Reinforces hull integrity.', stat: '+50 Max HP', icon: '🛡️',
        apply: (p: IPlayer) => { p.maxHp += 50; p.hp += 50; },
        evoName: 'Behemoth Hull', evoDesc: 'EVOLUTION: +100 Max HP & Full Heal.', evoApply: (p: IPlayer) => { p.maxHp += 100; p.hp = p.maxHp; },
        getCurrentStat: (c) => `+${c * 50} Max HP`
    },
    {
        id: 'regen', count: 0, name: 'Nano Repair', desc: 'Activates passive regeneration.', stat: '+3 HP / Sec', icon: '💊',
        apply: (p: IPlayer) => p.regen += 3,
        evoName: 'Living Metal', evoDesc: 'EVOLUTION: +10 Regeneration/sec.', evoApply: (p: IPlayer) => p.regen += 10,
        getCurrentStat: (c) => `+${c * 3} HP / Sec`
    },
    {
        id: 'size', count: 0, name: 'High Caliber', desc: 'Projectiles become larger.', stat: '+50% Bullet Size', icon: '🌑',
        apply: (p: IPlayer) => p.bulletSize *= 1.5,
        evoName: 'Graviton Rounds', evoDesc: 'EVOLUTION: +100% Bullet Size.', evoApply: (p: IPlayer) => p.bulletSize *= 2.0,
        getCurrentStat: (c) => `+${Math.round((Math.pow(1.5, c) - 1) * 100)}% Size`
    },
    {
        id: 'repulsion', count: 0, name: 'Repulsion Field', desc: 'Lvl 1-4: Area. Lvl 5+: Force & Burn.', stat: '+Upgrade', icon: '⭕',
        apply: (p: IPlayer) => p.repulsionLevel++,
        evoName: 'Supernova', evoDesc: 'EVOLUTION: Massive Radius & Double Burn.', evoApply: (p: IPlayer) => { p.repulsionLevel += 5; },
        getCurrentStat: (c) => `Level ${c} Active`
    },
    {
        id: 'critChance', count: 0, name: 'Targeting CPU', desc: 'Increases critical hit frequency.', stat: '+5% Crit Chance', icon: '🎯',
        apply: (p: IPlayer) => p.critChance = Math.min(1.0, p.critChance + 0.05),
        evoName: 'Eagle Eye', evoDesc: 'EVOLUTION: +10% Crit Chance.', evoApply: (p: IPlayer) => p.critChance = Math.min(1.0, p.critChance + 0.10),
        getCurrentStat: (c) => `+${Math.round(c * 5)}% Crit Chance`
    },
    {
        id: 'critDamage', count: 0, name: 'Gauss Coil', desc: 'Increases critical hit damage.', stat: '+5% Crit Dmg', icon: '🔋',
        apply: (p: IPlayer) => p.critMultiplier += 0.05,
        evoName: 'Railgun', evoDesc: 'EVOLUTION: +10% Crit Dmg.', evoApply: (p: IPlayer) => p.critMultiplier += 0.10,
        getCurrentStat: (c) => `+${c * 5}% Crit Dmg`
    }
];

export const resetUpgrades = () => {
    UPGRADES_LIST.forEach(u => u.count = 0);
};
