import { IEnemy } from '../types';

export interface Weapon {
    update(delta: number, enemies: IEnemy[], frameCount: number, worldWidth: number, worldHeight: number, spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void): void;
}
