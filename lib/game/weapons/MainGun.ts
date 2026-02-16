import { Weapon } from './Weapon';
import { IPlayer, IEnemy } from '../types';
import { soundManager } from '../SoundManager';

export class MainGun implements Weapon {
    player: IPlayer;
    cooldown: number = 0;

    constructor(player: IPlayer) {
        this.player = player;
    }

    update(delta: number, enemies: IEnemy[], frameCount: number, worldWidth: number, worldHeight: number, spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void) {
        if (this.cooldown > 0) {
            this.cooldown -= delta;
        } else {
            const target = this.player.findNearestEnemy(enemies, worldWidth, worldHeight);
            if (target) {
                this.shoot(target, spawnBullet);
                this.cooldown = this.player.attackSpeed;
            }
        }
    }

    shoot(target: IEnemy, spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void) {
        const angle = Math.atan2(target.y - this.player.y, target.x - this.player.x);
        const spreadStep = 0.15;

        for (let i = 0; i < this.player.projectileCount; i++) {
            let offsetMultiplier = 0;
            if (i > 0) {
                offsetMultiplier = Math.ceil(i / 2);
                if (i % 2 === 0) offsetMultiplier *= -1;
            }

            const currentAngle = angle + (offsetMultiplier * spreadStep);
            const vx = Math.cos(currentAngle) * this.player.bulletSpeed;
            const vy = Math.sin(currentAngle) * this.player.bulletSpeed;

            const isCrit = Math.random() < this.player.critChance;
            const finalDamage = isCrit ? Math.floor(this.player.damage * this.player.critMultiplier) : this.player.damage;

            spawnBullet(this.player.x, this.player.y, vx, vy, finalDamage, this.player.pierce, this.player.bulletSize, isCrit);
        }
        soundManager.play('shoot', 'sfx', 0.15, false, 0.1);
    }
}
