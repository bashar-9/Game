import { CONFIG } from '../config';
import { IPlayer } from './types';
import { soundManager } from './SoundManager';
import { createNeonSprite, CACHED_SPRITES } from './AssetCache';

export class Pickup {
    x: number;
    y: number;
    value: number;
    magnetized: boolean;
    dead: boolean;

    tier: number; // 1, 2, or 3

    constructor(x: number, y: number, value: number, tier: number = 1) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.tier = tier;
        this.magnetized = false;
        this.dead = false;
    }

    update(player: IPlayer) { // Type 'any' for now to avoid circular dependency
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < player.pickupRange) this.magnetized = true;

        if (this.magnetized) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const speed = 14;
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
            if (dist < player.radius + 10) {
                player.gainXp(this.value);
                // Dynamic import or check if soundManager is available globally/imported
                // Since Pickup is in same dir as SoundManager
                soundManager.play('collect', 0.1);
                this.dead = true;
            }
        }
    }


    getSprite(): HTMLCanvasElement {
        const key = `pickup_tier_${this.tier}`;
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const s = (CONFIG.IS_MOBILE ? 3 : 5) + (this.tier - 1); // Size based on tier
        // Cache size needs to be enough for shadow
        const cacheSize = (s + 20) * 2;
        const half = cacheSize / 2;

        CACHED_SPRITES[key] = createNeonSprite(cacheSize, cacheSize, (ctx, w, h) => {
            let color = CONFIG.COLORS.xp;
            if (this.tier === 2) color = '#00ffff';
            if (this.tier >= 3) color = '#ff00ff';

            ctx.translate(half, half);
            ctx.fillStyle = color;
            ctx.shadowBlur = this.tier === 1 ? 6 : 12;
            ctx.shadowColor = color;

            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(s, 0);
            ctx.lineTo(0, s);
            ctx.lineTo(-s, 0);
            ctx.fill();
        });

        return CACHED_SPRITES[key];
    }

    draw(ctx: CanvasRenderingContext2D) {
        const sprite = this.getSprite();
        // The sprite is centered at half, half. 
        // We want to draw it at this.x, this.y
        const half = sprite.width / 2;
        ctx.drawImage(sprite, this.x - half, this.y - half);
    }
}
