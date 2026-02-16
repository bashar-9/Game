import { Pickup } from '../../Pickup';
import { createNeonSprite, CACHED_SPRITES } from '../../AssetCache';
import { CONFIG } from '../../../config';

export class PickupRenderer {
    static getSprite(pickup: Pickup): HTMLCanvasElement {
        const key = pickup.type === 'powerup'
            ? `pickup_powerup_${pickup.powerupType}`
            : `pickup_tier_${pickup.tier}`;

        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const s = (CONFIG.IS_MOBILE ? 3 : 5) + (pickup.tier - 1); // Size based on tier
        const cacheSize = (s + 20) * 2;
        const half = cacheSize / 2;

        CACHED_SPRITES[key] = createNeonSprite(cacheSize, cacheSize, (ctx, w, h) => {
            ctx.translate(half, half);

            if (pickup.type === 'powerup') {
                // Powerup Visual - SIGNIFICANTLY LARGER & DISTINCT
                const baseColor = pickup.powerupType === 'double_stats' ? '#ff0000' :
                    pickup.powerupType === 'invulnerability' ? '#ffff00' : '#0000ff';

                ctx.fillStyle = baseColor;
                ctx.shadowBlur = 20;
                ctx.shadowColor = baseColor;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;

                // Make them simpler but bolder
                if (pickup.powerupType === 'double_stats') {
                    // Huge Star
                    const size = s + 8;
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

                } else if (pickup.powerupType === 'magnet') {
                    // Big Solid Circle with M
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

                } else if (pickup.powerupType === 'invulnerability') {
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
                if (pickup.tier === 2) color = '#00ffff';
                if (pickup.tier >= 3) color = '#ff00ff';

                ctx.fillStyle = color;
                ctx.shadowBlur = pickup.tier === 1 ? 6 : 12;
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

    static draw(ctx: CanvasRenderingContext2D, pickup: Pickup) {
        const sprite = PickupRenderer.getSprite(pickup);
        const half = sprite.width / 2;

        if (pickup.type === 'powerup') {
            // Pulsing Effect
            const pulse = 1 + Math.sin(performance.now() / 200) * 0.15;
            ctx.save();
            ctx.translate(pickup.x, pickup.y);
            ctx.scale(pulse, pulse);
            ctx.drawImage(sprite, -half, -half);
            ctx.restore();
        } else {
            ctx.drawImage(sprite, pickup.x - half, pickup.y - half);
        }
    }
}
