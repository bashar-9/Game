import { CONFIG, POWERUP_DURATIONS } from '../config';
import { IPlayer } from './types';
import { soundManager } from './SoundManager';
import { createNeonSprite, CACHED_SPRITES } from './AssetCache';

type PickupType = 'xp' | 'powerup';
// Helper type from Player (need to import or redeclare if circular dep issue, but TS should handle import type)
// We will use string for loose coupling or cast
type PowerupType = 'double_stats' | 'invulnerability' | 'magnet';

export class Pickup {
    x: number;
    y: number;
    value: number;
    magnetized: boolean;
    dead: boolean;

    tier: number; // 1, 2, or 3
    type: PickupType;
    powerupType?: PowerupType;

    constructor(x: number, y: number, value: number, tier: number = 1, type: PickupType = 'xp', powerupType?: PowerupType) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.tier = tier;
        this.type = type;
        this.powerupType = powerupType;
        this.magnetized = false;
        this.dead = false;
    }

    update(player: IPlayer, delta: number = 1) { // Type 'any' for now to avoid circular dependency
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < player.pickupRange) this.magnetized = true;

        if (this.magnetized) {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            const speed = 14 * delta;
            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;
            if (dist < player.radius + 10) {
                if (this.type === 'powerup' && this.powerupType) {
                    // Duration: 10 seconds (600 frames)
                    // If Double Stats -> 5 seconds per request? User said "double stats for 10 sec, 3x dmg for 5 sec".
                    // Let's standardize or switch based on type.
                    // User: "double stats for 10 sec", "magnet for 5 sec", "invuln for 10 sec"
                    let duration = POWERUP_DURATIONS[this.powerupType] || 600;

                    // We need to cast player to Player class to use applyPowerup
                    // ideally IPlayer interface should have it, but for now:
                    if ((player as any).applyPowerup) {
                        (player as any).applyPowerup(this.powerupType, duration);
                    }
                    soundManager.play('powerup', 'sfx', 0.5); // Unified powerup sound
                } else {
                    player.gainXp(this.value);
                    // Low volume for XP, slight pitch variance to make it sparkly
                    soundManager.play('collect', 'sfx', 0.15, false, 0.1);
                }
                this.dead = true;
            }
        }
    }


    getSprite(): HTMLCanvasElement {
        const key = this.type === 'powerup'
            ? `pickup_powerup_${this.powerupType}`
            : `pickup_tier_${this.tier}`;

        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const s = (CONFIG.IS_MOBILE ? 3 : 5) + (this.tier - 1); // Size based on tier
        const cacheSize = (s + 20) * 2;
        const half = cacheSize / 2;

        CACHED_SPRITES[key] = createNeonSprite(cacheSize, cacheSize, (ctx, w, h) => {
            ctx.translate(half, half);

            if (this.type === 'powerup') {
                // Powerup Visual - SIGNIFICANTLY LARGER & DISTINCT
                const baseColor = this.powerupType === 'double_stats' ? '#ff0000' :
                    this.powerupType === 'invulnerability' ? '#ffff00' : '#0000ff';

                ctx.fillStyle = baseColor;
                ctx.shadowBlur = 20;
                ctx.shadowColor = baseColor;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3; // Thicker border

                // Make them simpler but bolder
                if (this.powerupType === 'double_stats') {
                    // Huge Star
                    const size = s + 8; // Much bigger
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * size,
                            -Math.sin((18 + i * 72) * Math.PI / 180) * size);
                        ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * size * 0.5,
                            -Math.sin((54 + i * 72) * Math.PI / 180) * size * 0.5);
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                } else if (this.powerupType === 'magnet') {
                    // Big Solid Circle with M (Simpler than complex U-shape which gets lost)
                    const size = s + 6;
                    ctx.beginPath();
                    ctx.arc(0, 0, size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    // M symbol
                    ctx.fillStyle = '#fff';
                    ctx.font = `bold ${size}px monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.shadowBlur = 0;
                    ctx.fillText("M", 0, 2);

                } else if (this.powerupType === 'invulnerability') {
                    // Big Shield / Hexagon
                    const size = s + 7;
                    ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        ctx.lineTo(size * Math.cos(i * Math.PI / 3), size * Math.sin(i * Math.PI / 3));
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Inner Shield
                    ctx.strokeStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
                    ctx.stroke();
                } else {
                    ctx.fillRect(-(s + 5), -(s + 5), (s + 5) * 2, (s + 5) * 2);
                }

            } else {
                // XP Visual
                let color = CONFIG.COLORS.xp;
                if (this.tier === 2) color = '#00ffff';
                if (this.tier >= 3) color = '#ff00ff';

                ctx.fillStyle = color;
                ctx.shadowBlur = this.tier === 1 ? 6 : 12;
                ctx.shadowColor = color;

                ctx.beginPath();
                ctx.moveTo(0, -s);
                ctx.lineTo(s, 0);
                ctx.lineTo(0, s);
                ctx.lineTo(-s, 0);
                ctx.fill();
            }
        });

        return CACHED_SPRITES[key];
    }

    draw(ctx: CanvasRenderingContext2D) {
        const sprite = this.getSprite();
        const half = sprite.width / 2;

        if (this.type === 'powerup') {
            // Pulsing Effect
            const pulse = 1 + Math.sin(performance.now() / 200) * 0.15;
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.scale(pulse, pulse);
            ctx.drawImage(sprite, -half, -half);
            ctx.restore();
        } else {
            ctx.drawImage(sprite, this.x - half, this.y - half);
        }
    }
}
