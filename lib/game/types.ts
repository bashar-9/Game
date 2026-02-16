// Force update
import { CONFIG } from '../config';
export interface PlayerCallbacks {
    onUpdateStats: (hp: number, maxHp: number, xp: number, xpToNext: number, level: number, damage: number) => void;
    onUpdateActivePowerups: (active: Record<string, number>, maxDurations: Record<string, number>) => void;
    onLevelUp: () => void;
    onGameOver: () => void;
    hasInvulnerabilityShield?: () => boolean;
    onCreateParticles: (x: number, y: number, count: number, color: string) => void;
}

export interface IPlayer {
    x: number;
    y: number;
    radius: number;
    baseSpeed: number;
    speed: number;
    maxHp: number;
    hp: number;
    xp: number;
    xpToNext: number;
    level: number;
    attackSpeed: number;
    // attackCooldown removed
    damage: number;
    projectileCount: number;
    pierce: number;
    bulletSpeed: number;
    bulletSize: number;
    pickupRange: number;
    regen: number;
    repulsionLevel: number;
    ionOrbsLevel?: number;
    // ionOrbsAngle removed
    modifiers: { damage: number; attackSpeed: number };
    critChance: number;
    critMultiplier: number;
    callbacks: PlayerCallbacks;

    recalculateStats: () => void;
    gainXp: (amount: number) => void;
    takeDamage: (amount: number) => void;

    findNearestEnemy: (enemies: IEnemy[], width: number, height: number) => IEnemy | null;
}

export interface IEnemy {
    x: number;
    y: number;
    radius: number;
    hp: number;
    maxHp: number;
    takeHit: (amount: number, isCrit?: boolean) => void;
    pushX: number;
    pushY: number;
    mass: number;
}

export interface JoystickState {
    active: boolean;
    originX: number;
    originY: number;
    dx: number;
    dy: number;
    id: number | null;
}
