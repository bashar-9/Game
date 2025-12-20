import { CONFIG } from '../config';
import { IPlayer } from './types';
import { soundManager } from './SoundManager';

export class Pickup {
    x: number;
    y: number;
    value: number;
    magnetized: boolean;
    dead: boolean;

    constructor(x: number, y: number, value: number) {
        this.x = x;
        this.y = y;
        this.value = value;
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
        ctx.fillStyle = CONFIG.COLORS.xp;
        ctx.beginPath();
        // Using mobile check from CONFIG which might be static for now, or we pass state
        const s = CONFIG.IS_MOBILE ? 3 : 5;
        ctx.moveTo(this.x, this.y - s);
        ctx.lineTo(this.x + s, this.y);
        ctx.lineTo(this.x, this.y + s);
        ctx.lineTo(this.x - s, this.y);
        ctx.fill();
    }
}
