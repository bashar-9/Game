import { Bullet } from '../../Bullet';
import { createNeonSprite, CACHED_SPRITES } from '../../AssetCache';
import { CONFIG } from '../../../config';

export class BulletRenderer {
    static CACHE_SIZE = 32;
    static CACHE_HALF = 16;
    static BASE_GEN_RADIUS = 5;

    static getSprite(bullet: Bullet): HTMLCanvasElement {
        const key = bullet.isCrit ? 'bullet_crit' : 'bullet_standard';
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const size = BulletRenderer.CACHE_SIZE;
        const half = BulletRenderer.CACHE_HALF;
        const r = BulletRenderer.BASE_GEN_RADIUS;

        CACHED_SPRITES[key] = createNeonSprite(size, size, (ctx, w, h) => {
            ctx.translate(half, half);

            ctx.fillStyle = CONFIG.COLORS.bullet;
            ctx.shadowBlur = 8;
            ctx.shadowColor = CONFIG.COLORS.bulletShadow;
            if (bullet.isCrit) {
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

    static draw(ctx: CanvasRenderingContext2D, bullet: Bullet) {
        const sprite = BulletRenderer.getSprite(bullet);

        // Scale logic: cache is built for radius 5.
        // If radius is 10, scale=2.
        const scale = bullet.radius / BulletRenderer.BASE_GEN_RADIUS;

        const size = BulletRenderer.CACHE_SIZE * scale;
        const offset = BulletRenderer.CACHE_HALF * scale;

        ctx.drawImage(sprite, bullet.x - offset, bullet.y - offset, size, size);
    }
}
