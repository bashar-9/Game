import { BASE_STATS, DIFFICULTY_SETTINGS, CONFIG } from '../config';
import { Bullet } from './Bullet';
import { Enemy } from './Enemy';
import { JoystickState } from './types';
import { soundManager } from './SoundManager';

export interface PlayerCallbacks {
    onUpdateStats: (hp: number, maxHp: number, xp: number, xpToNext: number, level: number) => void;
    onLevelUp: () => void;
    onGameOver: () => void;
    onCreateParticles: (x: number, y: number, count: number, color: string) => void;
}

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

    callbacks: PlayerCallbacks;

    constructor(canvasWidth: number, canvasHeight: number, diffMode: 'easy' | 'normal' | 'hard', callbacks: PlayerCallbacks) {
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.callbacks = callbacks;

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
    }

    update(keys: Record<string, boolean>, joystick: JoystickState, enemies: Enemy[], bullets: Bullet[], frameCount: number, canvasWidth: number, canvasHeight: number) {
        // Regen
        if (this.regen > 0 && frameCount % 60 === 0 && this.hp < this.maxHp) {
            this.hp = Math.min(this.maxHp, this.hp + this.regen);
            this.syncStats();
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
            this.x += mx * this.speed;
            this.y += my * this.speed;
            this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
        }

        // Attack
        if (this.attackCooldown > 0) this.attackCooldown--;
        else {
            const target = this.findNearestEnemy(enemies);
            if (target) {
                this.shoot(target, bullets);
                this.attackCooldown = this.attackSpeed;
            }
        }

        // Repulsion Field
        if (this.repulsionLevel > 0) this.applyRepulsionField(enemies, frameCount);
    }

    applyRepulsionField(enemies: Enemy[], frameCount: number) {
        const stats = BASE_STATS.player;
        const levelCapArea = Math.min(this.repulsionLevel, 4);
        const radiusGrowth = levelCapArea * 20;
        const baseRange = CONFIG.IS_MOBILE ? stats.repulsionBaseRangeMobile : stats.repulsionBaseRange;
        const range = baseRange + radiusGrowth;

        const forceBase = stats.repulsionForce;
        const extraLevels = Math.max(0, this.repulsionLevel - 4);

        for (const e of enemies) {
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const distSq = dx * dx + dy * dy;
            const rangeSq = (range + e.radius) * (range + e.radius);

            if (distSq < rangeSq) {
                const dist = Math.sqrt(distSq);
                const nx = dx / dist;
                const ny = dy / dist;

                const effectiveForce = forceBase / e.mass;
                e.pushX += nx * effectiveForce;
                e.pushY += ny * effectiveForce;

                if (frameCount % 15 === 0) {
                    const burnDmg = Math.max(2, (this.damage * 0.15) + (extraLevels * 5));
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

        // Spread logic: Max 180 degrees (PI) total spread
        const defaultSpread = 0.2;
        const totalSpread = Math.min((this.projectileCount - 1) * defaultSpread, Math.PI);
        const spreadIter = this.projectileCount > 1 ? totalSpread / (this.projectileCount - 1) : 0;

        const startAngle = angle - totalSpread / 2;

        for (let i = 0; i < this.projectileCount; i++) {
            const currentAngle = startAngle + i * spreadIter;
            const vx = Math.cos(currentAngle) * this.bulletSpeed;
            const vy = Math.sin(currentAngle) * this.bulletSpeed;
            bullets.push(new Bullet(this.x, this.y, vx, vy, this.damage, this.pierce, this.bulletSize));
        }
        soundManager.play('shoot', 0.05);
    }

    gainXp(amount: number) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) this.levelUp();
        this.syncStats();
    }

    levelUp() {
        this.xp -= this.xpToNext;
        this.level++;
        this.xpToNext = Math.floor(this.xpToNext * 1.15);
        this.hp = Math.min(this.hp + (this.maxHp * 0.3), this.maxHp);
        this.callbacks.onLevelUp();
    }

    takeDamage(amount: number) {
        this.hp -= amount;
        soundManager.play('damage', 0.3);
        this.callbacks.onCreateParticles(this.x, this.y, 5, CONFIG.COLORS.danger);
        this.syncStats();
        if (this.hp <= 0) this.callbacks.onGameOver();
    }

    syncStats() {
        this.callbacks.onUpdateStats(this.hp, this.maxHp, this.xp, this.xpToNext, this.level);
    }

    draw(ctx: CanvasRenderingContext2D, frameCount: number) {
        // Repulsion Visual
        if (this.repulsionLevel > 0) {
            const stats = BASE_STATS.player;
            const levelCapArea = Math.min(this.repulsionLevel, 4);
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

        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        const inner = CONFIG.IS_MOBILE ? 3 : 5;
        ctx.arc(this.x, this.y, inner, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}
