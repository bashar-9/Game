import { Weapon } from './Weapon';
import { IPlayer, IEnemy } from '../types';
import { BASE_STATS, CONFIG } from '../../config';

export class RepulsionField implements Weapon {
    player: IPlayer;

    constructor(player: IPlayer) {
        this.player = player;
    }

    update(delta: number, enemies: IEnemy[], frameCount: number, worldWidth: number, worldHeight: number, spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void) {
        if (this.player.repulsionLevel <= 0) return;

        const stats = BASE_STATS.player;
        const levelCapArea = Math.min(this.player.repulsionLevel, 8);
        const radiusGrowth = levelCapArea * 20;
        const sizeBonus = (this.player.bulletSize || 0) * 4;
        const baseRange = CONFIG.IS_MOBILE ? stats.repulsionBaseRangeMobile : stats.repulsionBaseRange;
        const range = baseRange + radiusGrowth + sizeBonus;

        const forceMult = 0.5 + (this.player.repulsionLevel * 0.05);
        const forceBase = stats.repulsionForce * forceMult;
        const hpBonusDamage = Math.floor(this.player.maxHp * 0.05);

        const tickRate = Math.max(5, Math.floor(15 / (1 + this.player.regen * 0.05)));
        const shouldDamage = frameCount % tickRate === 0;

        for (const e of enemies) {
            const dx = e.x - this.player.x;
            const dy = e.y - this.player.y;
            const distSq = dx * dx + dy * dy;
            const rangeSq = (range + e.radius) * (range + e.radius);

            if (distSq < rangeSq) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;

                const effectiveForce = (forceBase / e.mass) * delta;
                e.pushX += nx * effectiveForce;
                e.pushY += ny * effectiveForce;

                if (shouldDamage) {
                    let baseDmg = this.player.damage * (0.40 + (this.player.repulsionLevel * 0.10));
                    let totalDmg = Math.max(1, Math.floor(baseDmg + hpBonusDamage));

                    e.takeHit(totalDmg);
                    if (Math.random() > 0.7) {
                        this.player.callbacks.onCreateParticles(e.x, e.y, 1, '#ff5500');
                    }
                }
            }
        }
    }
}
