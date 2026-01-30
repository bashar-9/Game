import { BASE_STATS, DIFFICULTY_SETTINGS, CONFIG, POWERUP_DURATIONS } from '../config';
import { Bullet } from './Bullet';
import { Enemy } from './Enemy';
import { JoystickState } from './types';
import { soundManager } from './SoundManager';
import { createNeonSprite, CACHED_SPRITES } from './AssetCache';

export interface PlayerCallbacks {
    onUpdateStats: (hp: number, maxHp: number, xp: number, xpToNext: number, level: number, damage: number) => void;
    onUpdateActivePowerups: (active: Record<string, number>, maxDurations: Record<string, number>) => void;
    onLevelUp: () => void;
    onGameOver: () => void;
    onCreateParticles: (x: number, y: number, count: number, color: string) => void;
}

export type PowerupType = 'double_stats' | 'invulnerability' | 'magnet';

export class Player {
    x: number;
    y: number;
    radius: number;
    baseSpeed: number;
    speed: number;
    maxHp: number;
    hp: number;
    level: number;
    xp: number;
    xpToNext: number;
    color: string;

    attackCooldown: number;
    attackSpeed: number;
    damage: number;
    projectileCount: number;
    pierce: number;
    bulletSpeed: number;
    bulletSize: number;
    pickupRange: number;
    regen: number;
    repulsionLevel: number;
    critChance: number;
    critMultiplier: number;

    modifiers: { damage: number; attackSpeed: number };
    invincibilityTimer: number;
    callbacks: PlayerCallbacks;

    powerups: Record<PowerupType, number> = {
        'double_stats': 0,
        'invulnerability': 0,
        'magnet': 0
    };
    activeMaxDurations: Record<PowerupType, number> = {
        'double_stats': 900,
        'invulnerability': 900,
        'magnet': 900
    };

    rotation: number;

    static CACHE_SIZE = 80; // Larger for player
    static CACHE_HALF = 40;

    constructor(canvasWidth: number, canvasHeight: number, diffMode: 'easy' | 'medium' | 'hard', callbacks: PlayerCallbacks) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.rotation = 0;
        this.callbacks = callbacks;
        this.invincibilityTimer = 0;
        this.modifiers = { damage: 0, attackSpeed: 0 };

        const stats = BASE_STATS.player;
        this.radius = CONFIG.IS_MOBILE ? stats.radiusMobile : stats.radius;
        this.baseSpeed = stats.baseSpeed;
        this.speed = stats.baseSpeed;

        const hpBonus = DIFFICULTY_SETTINGS[diffMode].playerHpBonus;
        this.maxHp = stats.baseHp + hpBonus;
        this.hp = this.maxHp;

        this.level = 1;
        this.xp = 0;
        this.xpToNext = stats.xpToNext;
        this.color = CONFIG.COLORS.primary;

        this.attackCooldown = 0;
        this.attackSpeed = stats.attackSpeed;
        this.damage = stats.damage;
        this.projectileCount = stats.projectileCount;
        this.pierce = stats.pierce;
        this.bulletSpeed = stats.bulletSpeed;
        this.bulletSize = CONFIG.IS_MOBILE ? stats.bulletSizeMobile : stats.bulletSize;
        this.pickupRange = stats.pickupRange;
        this.regen = stats.regen;
        this.repulsionLevel = 0;
        this.critChance = stats.critChance;
        this.critMultiplier = stats.critMultiplier;

        this.recalculateStats();
        // Preload
        this.getSprite();
    }

    recalculateStats() {
        // Multiplier from Powerups
        const powerupMult = this.powerups['double_stats'] > 0 ? 3 : 1;

        // Damage = (Base + Level) * (1 + Modifiers)
        const baseDmg = BASE_STATS.player.damage + (this.level - 1); // +1 Base DMG per level
        this.damage = Math.floor(baseDmg * (1 + this.modifiers.damage) * powerupMult);

        // Attack Speed (Delay) = BaseDelay / (1 + Modifiers)
        // Cap speed at 15 shots/sec (4 frames at 60fps)
        const newDelay = BASE_STATS.player.attackSpeed / (1 + this.modifiers.attackSpeed);
        // If Double Stats, Attack Speed Delay is HALVED (Speed Doubled)
        const finalDelay = powerupMult > 1 ? newDelay / 2 : newDelay;

        this.attackSpeed = Math.max(4, finalDelay);

        // Pickup Range Magnet
        const magnetMult = this.powerups['magnet'] > 0 ? 5 : 1;
        this.pickupRange = BASE_STATS.player.pickupRange * magnetMult;
    }

    // ... (Keep existing update method)

    levelUp() {
        this.xp -= this.xpToNext;
        this.level++;
        this.xpToNext = Math.floor(this.xpToNext * 1.15) + 25;
        this.hp = Math.min(this.hp + (this.maxHp * 0.3), this.maxHp);

        this.recalculateStats();
        this.callbacks.onLevelUp();
    }

    update(keys: Record<string, boolean>, joystick: JoystickState, enemies: Enemy[], bullets: Bullet[], frameCount: number, canvasWidth: number, canvasHeight: number, delta: number = 1) {
        // Regen - use accumulator for frame-rate independence
        if (this.regen > 0 && this.hp < this.maxHp) {
            // Regen is HP per second, apply delta-scaled amount
            const regenPerFrame = (this.regen / 60) * delta;
            this.hp = Math.min(this.maxHp, this.hp + regenPerFrame);
            // Only sync stats periodically to avoid spam
            if (frameCount % 30 === 0) this.syncStats();
        }

        // Movement
        let mx = 0; let my = 0;
        if (keys['w'] || keys['ArrowUp']) my -= 1;
        if (keys['s'] || keys['ArrowDown']) my += 1;
        if (keys['a'] || keys['ArrowLeft']) mx -= 1;
        if (keys['d'] || keys['ArrowRight']) mx += 1;

        if (joystick.active) {
            mx = joystick.dx;
            my = joystick.dy;
        }

        const mag = Math.sqrt(mx * mx + my * my);
        if (mag > 0) {
            const divisor = (mag > 1 || !joystick.active) ? mag : 1;
            mx /= divisor;
            my /= divisor;
            this.x += mx * this.speed * delta;
            this.y += my * this.speed * delta;
            this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));

            // Update Rotation to face movement
            // Smooth rotation could be added here, but instant is responsive
            this.rotation = Math.atan2(my, mx);
        }

        // Attack
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        else {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                // If shooting, face target?
                // Optional: Override rotation to face target when shooting
                // this.rotation = Math.atan2(target.y - this.y, target.x - this.x); 
                this.shoot(target, bullets);
                this.attackCooldown = this.attackSpeed;
            }
        }

        // Repulsion Field
        if (this.repulsionLevel > 0) this.applyRepulsionField(enemies, frameCount, delta);

        if (this.invincibilityTimer > 0) this.invincibilityTimer -= delta;

        // Update Powerups
        let statsChanged = false;
        let hasActivePowerups = false;
        (Object.keys(this.powerups) as PowerupType[]).forEach(key => {
            if (this.powerups[key] > 0) {
                hasActivePowerups = true;
                this.powerups[key] -= delta;
                if (this.powerups[key] <= 0) {
                    this.powerups[key] = 0;
                    statsChanged = true;
                }
            }
        });
        if (statsChanged) {
            this.recalculateStats();
            // Sync immediately on expiry to hide UI
            this.callbacks.onUpdateActivePowerups({ ...this.powerups }, { ...this.activeMaxDurations });
        } else if (hasActivePowerups && frameCount % 30 === 0) {
            // Sync every ~0.5s to update durations for blinking effect
            this.callbacks.onUpdateActivePowerups({ ...this.powerups }, { ...this.activeMaxDurations });
        }
    }

    applyRepulsionField(enemies: Enemy[], frameCount: number, delta: number = 1) {
        const stats = BASE_STATS.player;
        const levelCapArea = Math.min(this.repulsionLevel, 8); // Buffed: Cap raised to 8 (was 4)
        const radiusGrowth = levelCapArea * 20;
        const baseRange = CONFIG.IS_MOBILE ? stats.repulsionBaseRangeMobile : stats.repulsionBaseRange;
        const range = baseRange + radiusGrowth;

        // Buffed: Force scales by 5% per level (Base * (1 + 0.05 * Level))
        const forceMult = 1 + (this.repulsionLevel * 0.05);
        const forceBase = stats.repulsionForce * forceMult;

        for (const e of enemies) {
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const distSq = dx * dx + dy * dy;
            const rangeSq = (range + e.radius) * (range + e.radius);

            if (distSq < rangeSq) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;

                const effectiveForce = (forceBase / e.mass) * delta;
                e.pushX += nx * effectiveForce;
                e.pushY += ny * effectiveForce;

                // Burn damage every ~15 frames (use frame count for consistency)
                if (frameCount % 15 === 0) {
                    // New Formula: 30% Base + 10% per level (Buffed from 5%)
                    const burnDmg = Math.max(1, Math.floor(this.damage * (0.30 + (this.repulsionLevel * 0.10))));
                    e.takeHit(burnDmg);
                    if (Math.random() > 0.7) {
                        this.callbacks.onCreateParticles(e.x, e.y, 1, '#ff5500');
                    }
                }
            }
        }
    }

    findNearestEnemy(enemies: Enemy[]) {
        let nearest = null;
        let minDist = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist && d < 650) {
                minDist = d;
                nearest = e;
            }
        }
        return nearest;
    }

    shoot(target: Enemy, bullets: Bullet[]) {
        const angle = Math.atan2(target.y - this.y, target.x - this.x);

        // Center-Anchored Spread Logic (Option 2)
        // 1st bullet: Center (0)
        // 2nd bullet: +Spread
        // 3rd bullet: -Spread
        // 4th bullet: +2*Spread ...

        const spreadStep = 0.15; // ~8.5 degrees spacing

        for (let i = 0; i < this.projectileCount; i++) {
            let offsetMultiplier = 0;
            if (i > 0) {
                // i=1 -> 1, i=2 -> -1, i=3 -> 2, i=4 -> -2
                offsetMultiplier = Math.ceil(i / 2);
                if (i % 2 === 0) offsetMultiplier *= -1;
            }

            const currentAngle = angle + (offsetMultiplier * spreadStep);

            const vx = Math.cos(currentAngle) * this.bulletSpeed;
            const vy = Math.sin(currentAngle) * this.bulletSpeed;

            const isCrit = Math.random() < this.critChance;
            const finalDamage = isCrit ? Math.floor(this.damage * this.critMultiplier) : this.damage;

            bullets.push(new Bullet(this.x, this.y, vx, vy, finalDamage, this.pierce, this.bulletSize, isCrit));
        }
        // Lower volume for rapid fire, add pitch variance of 0.1
        soundManager.play('shoot', 'sfx', 0.15, false, 0.1);
    }

    gainXp(amount: number) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) this.levelUp();
        this.syncStats();
    }

    takeDamage(amount: number) {
        if (this.invincibilityTimer > 0) return;
        if (this.powerups['invulnerability'] > 0) return;

        this.hp -= amount;
        this.invincibilityTimer = 60; // 1s Immunity
        soundManager.play('damage', 'sfx', 0.4);
        this.callbacks.onCreateParticles(this.x, this.y, 5, CONFIG.COLORS.danger);
        this.syncStats();
        this.syncStats();
        if (this.hp <= 0) this.callbacks.onGameOver();
    }

    applyPowerup(type: PowerupType, durationFrames: number) {
        this.powerups[type] = durationFrames;
        this.activeMaxDurations[type] = durationFrames;
        this.recalculateStats();

        // Helper: Restore full HP on any powerup? Or just invulnerability?
        // User didn't ask, but Invulnerability usually implies safety.

        // Visual Effect
        this.callbacks.onCreateParticles(this.x, this.y, 20, '#ffffff');
    }

    syncStats() {
        this.callbacks.onUpdateStats(this.hp, this.maxHp, this.xp, this.xpToNext, this.level, this.damage);
        this.callbacks.onUpdateActivePowerups({ ...this.powerups }, { ...this.activeMaxDurations });
    }

    hasInvulnerabilityShield(): boolean {
        return this.powerups['invulnerability'] > 0;
    }

    getSprite(): HTMLCanvasElement {
        const key = 'player_ship';
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        const size = Player.CACHE_SIZE;
        const half = Player.CACHE_HALF;

        CACHED_SPRITES[key] = createNeonSprite(size, size, (ctx, w, h) => {
            ctx.translate(half, half);

            ctx.shadowBlur = 15;
            ctx.shadowColor = this.color;

            // Draw Fighter Jet Shape
            const r = this.radius * 1.5;
            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(-r * 0.6, r * 0.8);
            ctx.lineTo(-r * 0.3, 0);
            ctx.lineTo(-r * 0.6, -r * 0.8);
            ctx.closePath();

            ctx.fillStyle = '#001a1a';
            ctx.fill();

            ctx.lineWidth = 2;
            ctx.strokeStyle = this.color;
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


    draw(ctx: CanvasRenderingContext2D, frameCount: number) {
        // Invulnerability Shield Visual
        if (this.powerups['invulnerability'] > 0) {
            const shieldRadius = this.radius * 4.5;
            const pulseScale = 1 + Math.sin(frameCount * 0.15) * 0.1;
            const effectiveRadius = shieldRadius * pulseScale;

            // Outer glow
            ctx.beginPath();
            ctx.arc(this.x, this.y, effectiveRadius + 10, 0, Math.PI * 2);
            const outerAlpha = 0.15 + Math.sin(frameCount * 0.1) * 0.05;
            ctx.fillStyle = `rgba(255, 255, 0, ${outerAlpha})`;
            ctx.fill();

            // Main shield ring
            ctx.beginPath();
            ctx.arc(this.x, this.y, effectiveRadius, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            const ringAlpha = 0.6 + Math.sin(frameCount * 0.2) * 0.2;
            ctx.strokeStyle = `rgba(255, 255, 100, ${ringAlpha})`;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ffff00';
            ctx.stroke();

            // Inner shimmer
            ctx.beginPath();
            ctx.arc(this.x, this.y, effectiveRadius * 0.85, 0, Math.PI * 2);
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(255, 255, 200, ${ringAlpha * 0.5})`;
            ctx.stroke();

            ctx.shadowBlur = 0;
        }

        // Repulsion Visual (Dynamic, keep drawing it)
        if (this.repulsionLevel > 0) {
            const stats = BASE_STATS.player;
            const levelCapArea = Math.min(this.repulsionLevel, 8); // Buffed: Match logic in applyRepulsionField
            const radiusGrowth = levelCapArea * 20;
            const baseRange = CONFIG.IS_MOBILE ? stats.repulsionBaseRangeMobile : stats.repulsionBaseRange;
            const range = baseRange + radiusGrowth;

            ctx.beginPath();
            ctx.arc(this.x, this.y, range, 0, Math.PI * 2);
            const alpha = 0.1 + (Math.sin(frameCount * 0.1) * 0.05);
            ctx.fillStyle = `rgba(0, 255, 204, ${alpha})`;
            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = `rgba(0, 255, 204, ${alpha + 0.2})`;
            ctx.stroke();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Flash if invincible
        if (this.invincibilityTimer > 0 && Math.floor(frameCount / 4) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        const sprite = this.getSprite();
        ctx.drawImage(sprite, -Player.CACHE_HALF, -Player.CACHE_HALF);

        ctx.restore();

        // Draw Powerup Indicators (Bars)
        let barYOffset = 0;
        const barWidth = 40;
        const barHeight = 4;

        (Object.keys(this.powerups) as PowerupType[]).forEach(key => {
            const timeLeft = this.powerups[key];
            if (timeLeft > 0) {
                const maxTime = POWERUP_DURATIONS[key] || 1;
                const pct = Math.max(0, timeLeft / maxTime);

                const color = key === 'double_stats' ? '#ff0000' :
                    key === 'invulnerability' ? '#ffff00' : '#0000ff';

                // Bar Background
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 15 - barYOffset, barWidth, barHeight);

                // Bar Progress
                ctx.fillStyle = color;
                ctx.fillRect(this.x - barWidth / 2, this.y - this.radius - 15 - barYOffset, barWidth * pct, barHeight);

                // Border
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.strokeRect(this.x - barWidth / 2, this.y - this.radius - 15 - barYOffset, barWidth, barHeight);

                barYOffset += 6; // Stack bars upwards or downwards? 
                // Let's stack upwards:
                // Actually the current logic subtracts offset, so it stacks upwards (y becomes smaller)
            }
        });
    }
}
