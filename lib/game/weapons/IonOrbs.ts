import { Weapon } from './Weapon';
import { IPlayer, IEnemy } from '../types';

export class IonOrbs implements Weapon {
    player: IPlayer;
    angle: number = 0;

    constructor(player: IPlayer) {
        this.player = player;
    }

    update(delta: number, enemies: IEnemy[], frameCount: number, worldWidth: number, worldHeight: number, spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void) {
        if (!this.player.ionOrbsLevel || this.player.ionOrbsLevel <= 0) return;

        const count = 1 + (this.player.ionOrbsLevel || 0) + (this.player.projectileCount - 1);
        const speedMult = this.player.speed / this.player.baseSpeed;
        const orbitSpeed = 0.10 * speedMult * delta;
        this.angle += orbitSpeed;

        const orbSize = 12 + (this.player.bulletSize * 1.5);
        const orbitRadius = this.player.radius + 100 + (orbSize * 3);

        const dmgMult = 0.07 + ((this.player.ionOrbsLevel || 0) * 0.05);
        const dmg = Math.max(1, Math.floor(this.player.damage * dmgMult));

        const shouldDamage = frameCount % 2 === 0;
        const knockbackForce = 0.25 + ((this.player.ionOrbsLevel || 0) * 0.02);

        for (let i = 0; i < count; i++) {
            const angle = this.angle + (i * (Math.PI * 2 / count));
            const ox = this.player.x + Math.cos(angle) * orbitRadius;
            const oy = this.player.y + Math.sin(angle) * orbitRadius;

            if (shouldDamage) {
                for (const e of enemies) {
                    const dx = e.x - ox;
                    const dy = e.y - oy;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < (orbSize + e.radius) * (orbSize + e.radius)) {
                        const dist = Math.sqrt(distSq);
                        if (dist > 0) {
                            const nx = dx / dist;
                            const ny = dy / dist;
                            const impulse = (knockbackForce / e.mass) * delta;
                            e.pushX += nx * impulse;
                            e.pushY += ny * impulse;
                        }

                        e.takeHit(dmg);

                        if (Math.random() < 0.25) {
                            this.player.callbacks.onCreateParticles(e.x, e.y, 1, '#00ccff');
                        }
                    }
                }
            }
        }
    }
}
