import { BASE_STATS, DIFFICULTY_SETTINGS, CONFIG, POWERUP_DURATIONS } from '../config';
import { Bullet } from './Bullet';
import { Enemy } from './enemies/Enemy';
import { JoystickState, PlayerCallbacks, IPlayer, IEnemy } from './types';
import { InputState } from './InputManager';
import { soundManager } from './SoundManager';
import { WeaponManager } from './weapons/WeaponManager';

export type PowerupType = 'double_stats' | 'invulnerability' | 'magnet';

export class Player implements IPlayer {
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

    weaponManager: WeaponManager;

    // Hazard effect properties
    slowMultiplier: number = 1.0;
    teleportCooldown: number = 0;
    teleportInvincibility: number = 0;



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

        this.weaponManager = new WeaponManager(this);

        this.recalculateStats();
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

        // Weapon System
        this.weaponManager.update(delta, enemies, frameCount, worldWidth, worldHeight, spawnBullet);

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

    findNearestEnemy(enemies: IEnemy[], canvasWidth: number, canvasHeight: number): IEnemy | null {
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


}
