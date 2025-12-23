import { CONFIG } from '../config';
import { Particle } from './Particle';
import { IEnemy } from './types';
import { createNeonSprite, CACHED_SPRITES } from './AssetCache';

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

    static CACHE_SIZE = 32;
    static CACHE_HALF = 16;
    // Base radius used for generation, we scale drawImage if needed
    static BASE_GEN_RADIUS = 5;

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

        this.getSprite();
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

    getSprite(): HTMLCanvasElement {
        const key = this.isCrit ? 'bullet_crit' : 'bullet_standard';
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const size = Bullet.CACHE_SIZE;
        const half = Bullet.CACHE_HALF;
        const r = Bullet.BASE_GEN_RADIUS; // Generate at a fixed size 5

        CACHED_SPRITES[key] = createNeonSprite(size, size, (ctx, w, h) => {
            ctx.translate(half, half);

            ctx.fillStyle = CONFIG.COLORS.bullet;
            ctx.shadowBlur = 8;
            ctx.shadowColor = CONFIG.COLORS.bulletShadow;
            if (this.isCrit) {
                ctx.fillStyle = '#ffeeaa'; // lighter gold
                ctx.shadowColor = '#d4af37'; // gold shadow
                ctx.shadowBlur = 12;
            }

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
        });

        return CACHED_SPRITES[key];
    }

    draw(ctx: CanvasRenderingContext2D) {
        const sprite = this.getSprite();

        // Scale logic: cache is built for radius 5. 
        // If current radius is 5, scale=1. 
        // If radius is 10, scale=2.
        const scale = this.radius / Bullet.BASE_GEN_RADIUS;

        // Optimized draw
        // We want to center it. 
        // Image is 32x32, center is 16,16.
        // We draw at x-16, y-16 if scale is 1.
        // If scale is 2, we draw width 64, height 64. 
        // DestX should be x - (16*scale)

        const size = Bullet.CACHE_SIZE * scale;
        const offset = Bullet.CACHE_HALF * scale;

        ctx.drawImage(sprite, this.x - offset, this.y - offset, size, size);
    }
}
