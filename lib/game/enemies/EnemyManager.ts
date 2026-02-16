import { ObjectPool } from '../ObjectPool';
import { Enemy } from './Enemy';
import { IPlayer } from '../types';
import { SpatialHash } from '../SpatialHash';
import { DIFFICULTY_SETTINGS } from '../../config';
import { EnemyType } from './types';

export class EnemyManager {
    enemies: Enemy[] = [];
    enemyPool: ObjectPool<Enemy>;
    spatialHash: SpatialHash<Enemy>;

    // Spawning State
    gameTime: number = 0;
    difficulty: number = 1;
    diffMode: 'easy' | 'medium' | 'hard' = 'easy';
    worldWidth: number;
    worldHeight: number;

    constructor(worldWidth: number, worldHeight: number, diffMode: 'easy' | 'medium' | 'hard', spatialHash: SpatialHash<Enemy>) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.diffMode = diffMode;
        this.spatialHash = spatialHash;

        // Shared pool for now, as Enemy.reset handles the type
        this.enemyPool = new ObjectPool<Enemy>(
            () => new Enemy('basic', 0, 0, 1, 'easy', 1),
            (e) => { /* Reset handled by acquire/spawner */ }
        );
    }

    update(delta: number, player: IPlayer, gameTime: number, difficulty: number, walls: { x: number, y: number, w: number, h: number }[]) {
        this.gameTime = gameTime;
        this.difficulty = difficulty;

        this.spawnLogic(player.level);

        // Update active enemies using reverse loop for safe removal
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(player, this.spatialHash, delta, walls);

            if (e.hp <= 0) {
                // Determine if we should drop a pickup
                // Note: Pickup logic is currently in Engine. We might need a callback here.
                this.onEnemyDeath(e, player);
                this.enemyPool.release(e);
                this.enemies.splice(i, 1);
            }
        }
    }

    spawnLogic(playerLevel: number) {
        const settings = DIFFICULTY_SETTINGS[this.diffMode];

        // 0-3 mins: Ramp from 40% to 100% capacity
        const earlyGameRamp = Math.min(1.0, 0.40 + (this.gameTime / 180) * 0.60);
        const densityCap = Math.max(1, this.difficulty);

        // NO HARD CAP (User Request)
        const maxEnemies = 120 + (this.gameTime * 0.8);
        const spawnChance = Math.min(0.55, 0.02 * settings.spawnMult * densityCap * earlyGameRamp);

        if (this.enemies.length < maxEnemies && Math.random() < spawnChance) {
            const types: EnemyType[] = ['basic'];
            if (this.gameTime > 5) types.push('swarm');
            if (this.gameTime > 120) types.push('tank');

            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = this.enemyPool.acquire();

            // Spawn at random edge
            enemy.reset(type, this.worldWidth, this.worldHeight, playerLevel, this.diffMode, this.difficulty);

            // Smart spawn: avoid cluster
            let retries = 0;
            while (retries < 3) {
                const nearbyCount = this.spatialHash.query(enemy.x, enemy.y, 100).size;
                if (nearbyCount < 3) break;
                enemy.reset(type, this.worldWidth, this.worldHeight, playerLevel, this.diffMode, this.difficulty);
                retries++;
            }

            this.enemies.push(enemy);
        }
    }

    setDifficulty(diff: number) {
        this.difficulty = diff;
    }

    // Callback for death events (xp, score, pickups)
    onEnemyDeath: (enemy: Enemy, player: IPlayer) => void = () => { };
}
