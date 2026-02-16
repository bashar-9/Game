import { Enemy } from '../../enemies/Enemy';
import { createNeonSprite, CACHED_SPRITES } from '../../AssetCache';
import { CONFIG } from '../../../config';

export class EnemyRenderer {
    static CACHE_SIZE = 64;
    static CACHE_HALF = 32;

    static getSprite(enemy: Enemy): HTMLCanvasElement {
        const key = `enemy_${enemy.type}`;
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        // Generate Sprite
        const size = EnemyRenderer.CACHE_SIZE;
        const half = EnemyRenderer.CACHE_HALF;

        CACHED_SPRITES[key] = createNeonSprite(size, size, (ctx, w, h) => {
            // Center context
            ctx.translate(half, half);

            // Determine color based on actual config if possible, or use defaults from logic
            // We use the color property from the enemy instance for shadow, but for sprite generation
            // we might need a consistent color per type to cache effectively.
            // In the original code, `this.color` was used. We'll use a lookup or passed color.
            // Since we cache by type, we should use a fixed color for the sprite or assumes all enemies of type T have same color.
            // Let's assume color is consistent per type for now.

            let color = '#ff0055'; // Default
            if (enemy.type === 'swarm') color = CONFIG.COLORS.swarmForEnemy;
            else if (enemy.type === 'tank') color = CONFIG.COLORS.tankEnemy;
            else if (enemy.type === 'basic') color = CONFIG.COLORS.standardEnemy;

            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fillStyle = color;

            // Use a standard radius for sprite generation to ensure cache hits
            // Logic used `this.radius` but we'll use a fixed reference radius
            const r = enemy.type === 'tank' ? 24 : (enemy.type === 'swarm' ? 8 : 12);
            // NOTE: Mobile radius might differ. If we cache by type, we might need type_mobile vs type_desktop keys 
            // if we want pixel perfect.
            // For now, let's just use the enemy's current radius if strict, OR simply rely on the fact 
            // that `enemy.type` implies a specific visual style. 
            // The original used `this.radius`. 

            if (enemy.type === 'basic') {
                ctx.beginPath();
                ctx.moveTo(r, 0);
                ctx.lineTo(0, r * 0.7);
                ctx.lineTo(-r * 0.6, 0);
                ctx.lineTo(0, -r * 0.7);
                ctx.closePath();

                ctx.fillStyle = '#1a0505';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = color;
                ctx.stroke();

            } else if (enemy.type === 'tank') {
                ctx.beginPath();
                const sides = 8;
                for (let i = 0; i < sides; i++) {
                    const theta = (i / sides) * Math.PI * 2;
                    const rx = Math.cos(theta) * r;
                    const ry = Math.sin(theta) * r;
                    if (i === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.closePath();

                ctx.fillStyle = '#1a001a';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = color;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.fill();

            } else if (enemy.type === 'swarm') {
                const sr = r * 1.2;
                ctx.beginPath();
                ctx.moveTo(sr, 0);
                ctx.lineTo(-sr * 0.8, sr * 0.6);
                ctx.lineTo(-sr * 0.4, 0); // Notch
                ctx.lineTo(-sr * 0.8, -sr * 0.6);
                ctx.closePath();

                ctx.fillStyle = '#1a1000';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = color;
                ctx.stroke();
            }
        });

        return CACHED_SPRITES[key];
    }

    static draw(ctx: CanvasRenderingContext2D, enemy: Enemy) {
        const sprite = EnemyRenderer.getSprite(enemy);

        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        ctx.rotate(enemy.rotation);

        // offset by half cache size to center
        ctx.drawImage(sprite, -EnemyRenderer.CACHE_HALF, -EnemyRenderer.CACHE_HALF);

        ctx.restore();

        // HP Bar
        if (enemy.hp < enemy.maxHp) {
            ctx.shadowBlur = 0;
            const w = enemy.radius * 2;
            const barY = enemy.y - enemy.radius - (CONFIG.IS_MOBILE ? 8 : 12);

            ctx.fillStyle = '#330000';
            ctx.fillRect(enemy.x - enemy.radius, barY, w, 4);

            ctx.fillStyle = '#0f0';
            ctx.fillRect(enemy.x - enemy.radius, barY, w * (enemy.hp / enemy.maxHp), 4);
        }
    }
}
