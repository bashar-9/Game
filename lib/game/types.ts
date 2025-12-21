export interface IPlayer {
    x: number;
    y: number;
    radius: number;
    speed: number;
    maxHp: number;
    hp: number;
    xp: number;
    xpToNext: number;
    level: number;
    attackSpeed: number;
    damage: number;
    projectileCount: number;
    pierce: number;
    bulletSpeed: number;
    bulletSize: number;
    pickupRange: number;
    regen: number;
    repulsionLevel: number;

    gainXp: (amount: number) => void;
    takeDamage: (amount: number) => void;
}

export interface IEnemy {
    x: number;
    y: number;
    radius: number;
    hp: number;
    maxHp: number;
    takeHit: (amount: number) => void;
    pushX: number;
    pushY: number;
    mass?: number;
}

export interface JoystickState {
    active: boolean;
    originX: number;
    originY: number;
    dx: number;
    dy: number;
    id: number | null;
}
