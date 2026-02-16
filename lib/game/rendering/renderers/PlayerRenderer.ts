import { Player } from '../../Player';
import { createNeonSprite, CACHED_SPRITES } from '../../AssetCache';
import { BASE_STATS, CONFIG, POWERUP_DURATIONS } from '../../../config';

export class PlayerRenderer {
    static CACHE_SIZE = 80;
    static CACHE_HALF = 40;

    static getSprite(player: Player): HTMLCanvasElement {
        const key = 'player_ship';
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const size = PlayerRenderer.CACHE_SIZE;
        const half = PlayerRenderer.CACHE_HALF;

        CACHED_SPRITES[key] = createNeonSprite(size, size, (ctx, w, h) => {
            ctx.translate(half, half);

            ctx.shadowBlur = 15;
            ctx.shadowColor = player.color;

            // Draw Fighter Jet Shape
            const r = player.radius * 1.5;
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(-r * 0.6, r * 0.8);
            ctx.lineTo(-r * 0.3, 0);
            ctx.lineTo(-r * 0.6, -r * 0.8);
            ctx.closePath();

            ctx.fillStyle = '#001a1a';
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = player.color;
            ctx.stroke();

            // Engine Glow
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#00ffff';
            ctx.fillStyle = '#ccffff';
            ctx.beginPath();
            ctx.arc(-r * 0.4, 0, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
        });

        return CACHED_SPRITES[key];
    }

    static getIonOrbSprite(size: number): HTMLCanvasElement {
        // Cache by size to handle growing orbs (bucket by integer size)
        const intSize = Math.floor(size);
        const key = `ion_orb_${intSize}`;
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const canvasSize = intSize * 4; // Allowance for glow
        const half = canvasSize / 2;

        CACHED_SPRITES[key] = createNeonSprite(canvasSize, canvasSize, (ctx, w, h) => {
            ctx.translate(half, half);

            // Core
            ctx.beginPath();
            ctx.arc(0, 0, intSize, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00ccff';
            ctx.fill();

            // Outer Ring
            ctx.beginPath();
            ctx.arc(0, 0, intSize * 0.7, 0, Math.PI * 2);
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00ffff';
            ctx.stroke();

            // Aura
            ctx.beginPath();
            ctx.arc(0, 0, intSize * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 204, 255, 0.2)';
            ctx.fill();
        });

        return CACHED_SPRITES[key];
    }

    static draw(ctx: CanvasRenderingContext2D, player: Player, frameCount: number) {
        // Invulnerability Shield Visual
        if (player.powerups['invulnerability'] > 0) {
            const shieldRadius = player.radius * 4.5;
            const pulseScale = 1 + Math.sin(frameCount * 0.15) * 0.1;
            const effectiveRadius = shieldRadius * pulseScale;

            // Outer glow
            ctx.beginPath();
            ctx.arc(player.x, player.y, effectiveRadius + 10, 0, Math.PI * 2);
            const outerAlpha = 0.15 + Math.sin(frameCount * 0.1) * 0.05;
            ctx.fillStyle = `rgba(255, 255, 0, ${outerAlpha})`;
            ctx.fill();

            // Main shield ring
            ctx.beginPath();
            ctx.arc(player.x, player.y, effectiveRadius, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            const ringAlpha = 0.6 + Math.sin(frameCount * 0.2) * 0.2;
            ctx.strokeStyle = `rgba(255, 255, 100, ${ringAlpha})`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';
            ctx.stroke();

            // Inner shimmer
            ctx.beginPath();
            ctx.arc(player.x, player.y, effectiveRadius * 0.85, 0, Math.PI * 2);
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(255, 255, 200, ${ringAlpha * 0.5})`;
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        // Repulsion Visual (Dynamic, keep drawing it)
        if (player.repulsionLevel > 0) {
            const stats = BASE_STATS.player;
            const levelCapArea = Math.min(player.repulsionLevel, 8); // Buffed: Match logic in applyRepulsionField
            const radiusGrowth = levelCapArea * 20;
            const baseRange = CONFIG.IS_MOBILE ? stats.repulsionBaseRangeMobile : stats.repulsionBaseRange;
            const range = baseRange + radiusGrowth;

            ctx.beginPath();
            ctx.arc(player.x, player.y, range, 0, Math.PI * 2);
            const alpha = 0.1 + (Math.sin(frameCount * 0.1) * 0.05);
            ctx.fillStyle = `rgba(0, 255, 204, ${alpha})`;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(0, 255, 204, ${alpha + 0.2})`;
            ctx.stroke();
        }

        // Ion Orbs Visual
        if (player.ionOrbsLevel && player.ionOrbsLevel > 0) {
            const count = 1 + (player.ionOrbsLevel || 0) + (player.projectileCount - 1); // Fixed: Match update logic (Base 1)

            const orbSize = 12 + (player.bulletSize * 1.5);
            const orbitRadius = player.radius + 100 + (orbSize * 3);

            const sprite = PlayerRenderer.getIonOrbSprite(orbSize);
            const halfSprite = orbSize * 2; // Sprite is roughly 4x radius in cache logic, so half is 2x radius

            // Check if weaponManager exists (it should, but renderer might access incomplete player during init?)
            const angleBase = player.weaponManager ? player.weaponManager.ionOrbs.angle : 0;

            for (let i = 0; i < count; i++) {
                const angle = angleBase + (i * (Math.PI * 2 / count));
                const ox = player.x + Math.cos(angle) * orbitRadius;
                const oy = player.y + Math.sin(angle) * orbitRadius;

                // Trail effect?
                ctx.save();
                ctx.translate(ox, oy);
                // Rotate sprite to face direction of travel? (Tangent)
                ctx.rotate(angle + Math.PI / 2);
                ctx.drawImage(sprite, -halfSprite, -halfSprite);
                ctx.restore();
            }
        }

        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.rotation);

        // Flash if invincible
        if (player.invincibilityTimer > 0 && Math.floor(frameCount / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const sprite = PlayerRenderer.getSprite(player);
        ctx.drawImage(sprite, -PlayerRenderer.CACHE_HALF, -PlayerRenderer.CACHE_HALF);

        ctx.restore();

        // Draw Powerup Indicators (Bars)
        let barYOffset = 0;
        const barWidth = 40;
        const barHeight = 4;

        (Object.keys(player.powerups) as Array<keyof typeof player.powerups>).forEach(key => {
            const timeLeft = player.powerups[key];
            if (timeLeft > 0) {
                const maxTime = player.activeMaxDurations[key] || POWERUP_DURATIONS[key] || 1;
                const pct = Math.max(0, timeLeft / maxTime);

                const color = key === 'double_stats' ? '#ff0000' :
                    key === 'invulnerability' ? '#ffff00' : '#0000ff';

                // Bar Background
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(player.x - barWidth / 2, player.y - player.radius - 15 - barYOffset, barWidth, barHeight);

                // Bar Progress
                ctx.fillStyle = color;
                ctx.fillRect(player.x - barWidth / 2, player.y - player.radius - 15 - barYOffset, barWidth * pct, barHeight);

                // Border
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(player.x - barWidth / 2, player.y - player.radius - 15 - barYOffset, barWidth, barHeight);

                barYOffset += 6;
            }
        });
    }
}
