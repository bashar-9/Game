export type EnemyType = 'basic' | 'tank' | 'swarm';

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
    type: EnemyType;
}
