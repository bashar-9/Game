import { BASE_STATS, DIFFICULTY_SETTINGS, CONFIG, POWERUP_DURATIONS } from '../config';
import { Bullet } from './Bullet';
import { Enemy } from './Enemy';
import { JoystickState } from './types';
import { InputState } from './InputManager';
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

    // Hazard effect properties
    slowMultiplier: number = 1.0;
    teleportCooldown: number = 0;
    teleportInvincibility: number = 0;

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

    // Hazard effect methods
    setSlowMultiplier(multiplier: number) {
        this.slowMultiplier = multiplier;
    }



    levelUp() {
        this.xp -= this.xpToNext;
        this.level++;
        this.xpToNext = Math.floor(this.xpToNext * 1.19) + 35;
        this.hp = Math.min(this.hp + (this.maxHp * 0.3), this.maxHp);

        this.recalculateStats();
        this.callbacks.onLevelUp();
    }

    // ... (existing properties)
    ionOrbsLevel: number = 0;
    ionOrbsAngle: number = 0;

    // ... (existing helper methods)

    update(input: InputState, enemies: Enemy[], spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void, frameCount: number, worldWidth: number, worldHeight: number, delta: number = 1, walls: { x: number, y: number, w: number, h: number }[] = []) {
        // Regen - use accumulator for frame-rate independence
        if (this.regen > 0 && this.hp < this.maxHp) {
            // Regen is HP per second, apply delta-scaled amount
            const regenPerFrame = (this.regen / 60) * delta;
            this.hp = Math.min(this.maxHp, this.hp + regenPerFrame);
            // Only sync stats periodically to avoid spam
            if (frameCount % 30 === 0) this.syncStats();
        }

        // Decay teleport cooldowns
        if (this.teleportCooldown > 0) this.teleportCooldown -= delta;
        if (this.teleportInvincibility > 0) this.teleportInvincibility -= delta;

        // Movement
        let mx = input.moveX;
        let my = input.moveY;

        // Simplify magnitude check since InputManager already normalizes
        const mag = Math.sqrt(mx * mx + my * my);
        if (mag > 0) {
            // Apply slow multiplier from hazard zones
            const effectiveSpeed = this.speed * this.slowMultiplier;
            this.x += mx * effectiveSpeed * delta;
            this.y += my * effectiveSpeed * delta;

            // Clamp to world bounds
            this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));

            // Wall collision resolution
            if (walls.length > 0) {
                const resolved = this.resolveWallCollisions(this.x, this.y, this.radius, walls);
                this.x = resolved.x;
                this.y = resolved.y;
            }

            // Update Rotation to face movement
            // Smooth rotation could be added here, but instant is responsive
            this.rotation = Math.atan2(my, mx);
        }

        // Attack
        if (this.attackCooldown > 0) this.attackCooldown -= delta;
        else {
            const target = this.findNearestEnemy(enemies, worldWidth, worldHeight);
            if (target) {
                // Optional: Override rotation to face target when shooting
                // this.rotation = Math.atan2(target.y - this.y, target.x - this.x); 
                this.shoot(target, spawnBullet);
                this.attackCooldown = this.attackSpeed;
            }
        }

        // Repulsion Field
        if (this.repulsionLevel > 0) this.applyRepulsionField(enemies, frameCount, delta);

        // Ion Orbs
        if (this.ionOrbsLevel && this.ionOrbsLevel > 0) this.updateIonOrbs(enemies, frameCount, delta);

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
        // Synergy: Range scales with Bullet Size
        const sizeBonus = (this.bulletSize || 0) * 4;
        const baseRange = CONFIG.IS_MOBILE ? stats.repulsionBaseRangeMobile : stats.repulsionBaseRange;
        const range = baseRange + radiusGrowth + sizeBonus;

        // Buffed: Force scales by 5% per level (Base * (1 + 0.05 * Level))
        const forceMult = 1 + (this.repulsionLevel * 0.05);
        const forceBase = stats.repulsionForce * forceMult;

        // "Juggernaut" Synergy: Damage scales with Max HP
        const hpBonusDamage = Math.floor(this.maxHp * 0.05);

        // "Juggernaut" Synergy: Pulse Rate scales with Regen
        // Base rate 15 frames. Fast regen = faster ticks.
        // Formula: 15 / (1 + Regen * 0.05). If Regen=20 -> 1 + 1 = 2 -> 7.5 frames (Double speed)
        const tickRate = Math.max(5, Math.floor(15 / (1 + this.regen * 0.05)));

        const shouldDamage = frameCount % tickRate === 0;

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

                // Burn damage
                if (shouldDamage) {
                    // New Formula: 30% Base + 10% per level + HP Bonus
                    let baseDmg = this.damage * (0.30 + (this.repulsionLevel * 0.10));
                    let totalDmg = Math.max(1, Math.floor(baseDmg + hpBonusDamage));

                    e.takeHit(totalDmg);
                    if (Math.random() > 0.7) {
                        this.callbacks.onCreateParticles(e.x, e.y, 1, '#ff5500');
                    }
                }
            }
        }
    }

    updateIonOrbs(enemies: Enemy[], frameCount: number, delta: number) {
        // Buffed Count: Start with 2 Orbs at Level 1 (Base 1 + Level 1)
        // Synergy: +1 Orb per Projectile Count (Base is 1)
        const count = 1 + (this.ionOrbsLevel || 0) + (this.projectileCount - 1);

        // Synergy: Speed scales with Move Speed
        // Buffed Speed: 0.10 rad/frame base (was 0.08) -> Even Faster spin
        const speedMult = this.speed / this.baseSpeed;
        const orbitSpeed = 0.10 * speedMult * delta;
        this.ionOrbsAngle += orbitSpeed;

        // Synergy: Size scales with Bullet Size
        // Buffed Base Size: 12 (was 8) for better visibility
        const orbSize = 12 + (this.bulletSize * 1.5);
        // Buffed Radius: Further out to be a mid-sized zone
        const orbitRadius = this.radius + 100 + (orbSize * 3);

        // REWORK: High Frequency "Damage Ring"
        // 1. Damage: Scales 25% per level (Base 60% of Player Damage)
        // Formula: PlayerDmg * (0.60 + (0.25 * Level))
        const dmgMult = 0.60 + ((this.ionOrbsLevel || 0) * 0.25);
        const dmg = Math.max(1, Math.floor(this.damage * dmgMult));

        // Tick Rate: Every 2 frames
        const shouldDamage = frameCount % 2 === 0;

        // Knockback: Constant "Drag" force
        const knockbackForce = 1.1 + ((this.ionOrbsLevel || 0) * 0.10);

        for (let i = 0; i < count; i++) {
            const angle = this.ionOrbsAngle + (i * (Math.PI * 2 / count));
            const ox = this.x + Math.cos(angle) * orbitRadius;
            const oy = this.y + Math.sin(angle) * orbitRadius;

            if (shouldDamage) {
                for (const e of enemies) {
                    const dx = e.x - ox;
                    const dy = e.y - oy;
                    const distSq = dx * dx + dy * dy;

                    // Simple circle collision
                    if (distSq < (orbSize + e.radius) * (orbSize + e.radius)) {
                        // Apply Kickback (Recoil)
                        const dist = Math.sqrt(distSq);
                        if (dist > 0) {
                            const nx = dx / dist;
                            const ny = dy / dist;
                            const impulse = (knockbackForce / e.mass) * delta;
                            e.pushX += nx * impulse;
                            e.pushY += ny * impulse;
                        }

                        e.takeHit(dmg);

                        // Reduce particle spam (only 25% chance per hit)
                        if (Math.random() < 0.25) {
                            this.callbacks.onCreateParticles(e.x, e.y, 1, '#00ccff');
                        }
                    }
                }
            }
        }
    }

    findNearestEnemy(enemies: Enemy[], canvasWidth: number, canvasHeight: number) {
        let nearest = null;
        let minDist = Infinity;
        for (const e of enemies) {
            // Ignore enemies that are outside the visible canvas (spawn buffer)
            if (e.x < 0 || e.x > canvasWidth || e.y < 0 || e.y > canvasHeight) continue;

            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist && d < 650) {
                minDist = d;
                nearest = e;
            }
        }
        return nearest;
    }

    // Wall collision resolution helper
    resolveWallCollisions(cx: number, cy: number, radius: number, walls: { x: number, y: number, w: number, h: number }[]): { x: number; y: number } {
        let x = cx;
        let y = cy;

        for (const wall of walls) {
            // Find closest point on rectangle to circle center
            const closestX = Math.max(wall.x, Math.min(x, wall.x + wall.w));
            const closestY = Math.max(wall.y, Math.min(y, wall.y + wall.h));

            const dx = x - closestX;
            const dy = y - closestY;
            const distSq = dx * dx + dy * dy;

            if (distSq < radius * radius) {
                const dist = Math.sqrt(distSq);
                if (dist === 0) {
                    // Circle center is inside rectangle - push out horizontally
                    x += radius;
                } else {
                    const depth = radius - dist;
                    x += (dx / dist) * depth;
                    y += (dy / dist) * depth;
                }
            }
        }

        return { x, y };
    }

    shoot(target: Enemy, spawnBullet: (x: number, y: number, vx: number, vy: number, damage: number, pierce: number, size: number, isCrit: boolean) => void) {
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

            spawnBullet(this.x, this.y, vx, vy, finalDamage, this.pierce, this.bulletSize, isCrit);
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
        if (this.teleportInvincibility > 0) return; // Immunity after teleport

        this.hp -= amount;
        this.invincibilityTimer = 60; // 1s Immunity
        soundManager.play('damage', 'sfx', 0.4);
        this.callbacks.onCreateParticles(this.x, this.y, 5, CONFIG.COLORS.danger);
        this.syncStats();
        this.syncStats();
        if (this.hp <= 0) this.callbacks.onGameOver();
    }

    // Hazard damage - DOT that doesn't grant invincibility
    takeHazardDamage(amount: number) {
        if (this.powerups['invulnerability'] > 0) return;
        if (this.teleportInvincibility > 0) return;

        this.hp -= amount;
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

    getIonOrbSprite(size: number): HTMLCanvasElement {
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

        // Ion Orbs Visual
        if (this.ionOrbsLevel && this.ionOrbsLevel > 0) {
            const count = (this.ionOrbsLevel || 0) + (this.projectileCount - 1);
            const orbSize = 8 + (this.bulletSize * 1.5);
            const orbitRadius = this.radius + 50 + (orbSize * 2);
            const sprite = this.getIonOrbSprite(orbSize);
            const halfSprite = orbSize * 2; // Sprite is roughly 4x radius in cache logic, so half is 2x radius

            for (let i = 0; i < count; i++) {
                const angle = this.ionOrbsAngle + (i * (Math.PI * 2 / count));
                const ox = this.x + Math.cos(angle) * orbitRadius;
                const oy = this.y + Math.sin(angle) * orbitRadius;

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
                const maxTime = this.activeMaxDurations[key] || POWERUP_DURATIONS[key] || 1;
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
