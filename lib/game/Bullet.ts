import { CONFIG } from '../config';
import { Particle } from './Particle';

import { IEnemy } from './types';

export class Bullet {
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    pierce: number;
    radius: number;
    life: number;
    hitList: IEnemy[];
    isCrit: boolean;

    constructor(x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.pierce = pierce;
        this.radius = size;
        this.life = 100;
        this.hitList = [];
        this.isCrit = isCrit;
    }

    update(enemies: IEnemy[], particles: Particle[]) {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        for (const e of enemies) {
            if (this.hitList.includes(e)) continue;
            const dist = Math.hypot(this.x - e.x, this.y - e.y);
            if (dist < this.radius + e.radius) {
                e.takeHit(this.damage, this.isCrit);
                const mass = e.mass || 1;
                e.pushX += (this.vx * 0.1) / mass;
                e.pushY += (this.vy * 0.1) / mass;
                this.hitList.push(e);
                this.pierce--;

                // Add particles
                const particleColor = this.isCrit ? '#ffd700' : '#fff'; // Gold for crit
                particles.push(new Particle(this.x, this.y, particleColor));
                particles.push(new Particle(this.x, this.y, particleColor));

                if (this.pierce <= 0) {
                    this.life = 0;
                    break;
                }
            }
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = CONFIG.COLORS.bullet;
        ctx.shadowBlur = 8;
        ctx.shadowColor = CONFIG.COLORS.bulletShadow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
