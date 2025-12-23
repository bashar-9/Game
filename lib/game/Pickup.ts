import { CONFIG } from '../config';
import { IPlayer } from './types';
import { soundManager } from './SoundManager';

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

    draw(ctx: CanvasRenderingContext2D) {
        // Colors for tiers
        // Tier 1 (1x): default (Yellow)
        // Tier 2 (2x): Cyan/Blue
        // Tier 3 (4x): Purple/Magenta
        let color = CONFIG.COLORS.xp;
        if (this.tier === 2) color = '#00ffff'; // Cyan
        if (this.tier === 3) color = '#ff00ff'; // Magenta
        if (this.tier === 4) color = '#ff3300'; // Red (if 4x exists as tier 4? logic used 4x multiplier)

        // Logic maps multiplier to visual tier: 
        // 1x -> Yellow
        // 2x -> Cyan
        // 4x -> Magenta

        ctx.fillStyle = color;
        ctx.shadowBlur = this.tier === 1 ? 6 : 12;
        ctx.shadowColor = color;

        ctx.beginPath();
        // Using mobile check from CONFIG which might be static for now, or we pass state
        const s = (CONFIG.IS_MOBILE ? 3 : 5) + (this.tier - 1); // Grow slightly with tier
        ctx.moveTo(this.x, this.y - s);
        ctx.lineTo(this.x + s, this.y);
        ctx.lineTo(this.x, this.y + s);
        ctx.lineTo(this.x - s, this.y);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}
