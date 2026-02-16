import { BASE_STATS, DIFFICULTY_SETTINGS, CONFIG } from '../../config';
import { showDamage } from '../../utils';
import { IPlayer } from '../types';
import { EnemyType, IEnemy } from './types';
import { SpatialHash } from '../SpatialHash';

export class Enemy implements IEnemy {
    x!: number;
    y!: number;
    type!: EnemyType;
    pushX!: number;
    pushY!: number;
    radius!: number;
    speed!: number;
    hp!: number;
    maxHp!: number;
    xpValue!: number;
    damage!: number;
    mass!: number;
    color!: string;
    killedByShield!: boolean;
    rotation!: number;

    constructor(type: EnemyType, canvasWidth: number, canvasHeight: number, playerLevel: number, diffMode: 'easy' | 'medium' | 'hard', diffLevel: number) {
        this.reset(type, canvasWidth, canvasHeight, playerLevel, diffMode, diffLevel);
    }

    reset(type: EnemyType, canvasWidth: number, canvasHeight: number, playerLevel: number, diffMode: 'easy' | 'medium' | 'hard', diffLevel: number) {
        // Spawn logic needs to be moved out ideally, but keeping internal for now for pool reset
        const edge = Math.floor(Math.random() * 4);
        const buffer = 50;
        if (edge === 0) { this.x = Math.random() * canvasWidth; this.y = -buffer; }
        else if (edge === 1) { this.x = canvasWidth + buffer; this.y = Math.random() * canvasHeight; }
        else if (edge === 2) { this.x = Math.random() * canvasWidth; this.y = canvasHeight + buffer; }
        else { this.x = -buffer; this.y = Math.random() * canvasHeight; }

        this.type = type;
        this.pushX = 0;
        this.pushY = 0;
        this.rotation = 0;

        const settings = DIFFICULTY_SETTINGS[diffMode];
        const levelMult = 1 + (playerLevel * 0.1);

        let stats;
        if (type === 'swarm') {
            stats = BASE_STATS.enemies.swarm;
            this.color = CONFIG.COLORS.swarmForEnemy;
        } else if (type === 'tank') {
            stats = BASE_STATS.enemies.tank;
            this.color = CONFIG.COLORS.tankEnemy;
        } else {
            stats = BASE_STATS.enemies.basic;
            this.color = CONFIG.COLORS.standardEnemy;
        }

        this.radius = CONFIG.IS_MOBILE ? stats.radiusMobile : stats.radius;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baseSpeed = (stats as any).speedBase || (stats as any).speed;
        this.speed = baseSpeed + (type === 'swarm' || type === 'basic' ? Math.random() * (type === 'swarm' ? 1.0 : 0.5) : 0);

        const diffScale = 1 + (Math.max(0, diffLevel - 1) * 0.7);
        this.hp = stats.hpBase * diffScale * settings.hpMult * levelMult;
        this.xpValue = Math.floor(stats.xpValue * (1 + (diffLevel * 0.35)));
        this.damage = stats.damageBase * settings.dmgMult * (1 + (diffLevel * 0.15));
        this.mass = stats.mass;

        this.maxHp = this.hp;
        this.killedByShield = false;
    }

    takeHit(amount: number, isCrit: boolean = false) {
        this.hp -= amount;
        showDamage(this.x, this.y, amount, isCrit);
    }

    update(player: IPlayer, spatialHash: SpatialHash<Enemy>, delta: number = 1, walls: { x: number, y: number, w: number, h: number }[] = []) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.rotation = angle; // Face player

        this.x += (Math.cos(angle) * this.speed + this.pushX) * delta;
        this.y += (Math.sin(angle) * this.speed + this.pushY) * delta;

        // Wall collision resolution
        if (walls.length > 0) {
            for (const wall of walls) {
                const closestX = Math.max(wall.x, Math.min(this.x, wall.x + wall.w));
                const closestY = Math.max(wall.y, Math.min(this.y, wall.y + wall.h));
                const dx = this.x - closestX;
                const dy = this.y - closestY;
                const distSq = dx * dx + dy * dy;

                if (distSq < this.radius * this.radius) {
                    const dist = Math.sqrt(distSq);
                    if (dist > 0) {
                        const depth = this.radius - dist;
                        this.x += (dx / dist) * depth;
                        this.y += (dy / dist) * depth;
                    } else {
                        this.x += this.radius;
                    }
                }
            }
        }

        // Push decay with delta (exponential decay)
        const decayFactor = Math.pow(0.8, delta);
        this.pushX *= decayFactor;
        this.pushY *= decayFactor;

        // Soft collision between NEARBY enemies only (via spatial hash)
        // Wider query radius (5x) so enemies start separating before full overlap
        const nearby = spatialHash.query(this.x, this.y, this.radius * 5);
        for (const other of nearby) {
            if (other === this) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distSq = dx * dx + dy * dy;
            const radSum = this.radius + other.radius;

            if (distSq < radSum * radSum) {
                const dist = Math.sqrt(distSq);
                if (dist < 0.01) {
                    // Nearly identical positions — push in random direction
                    const randAngle = Math.random() * Math.PI * 2;
                    this.x += Math.cos(randAngle) * 2;
                    this.y += Math.sin(randAngle) * 2;
                    continue;
                }
                const force = (radSum - dist) / radSum;
                const separationStrength = 1.5;
                const rawFx = (dx / dist) * force * separationStrength * delta;
                const rawFy = (dy / dist) * force * separationStrength * delta;
                // Minimum push so deeply overlapping enemies always separate
                const minPush = 0.5;
                const fx = Math.abs(rawFx) < minPush ? Math.sign(rawFx || 1) * minPush : rawFx;
                const fy = Math.abs(rawFy) < minPush ? Math.sign(rawFy || 1) * minPush : rawFy;
                this.x += fx; this.y += fy;
                other.x -= fx; other.y -= fy;
            }
        }

        const d = Math.hypot(player.x - this.x, player.y - this.y);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shieldActive = (player as any).hasInvulnerabilityShield && (player as any).hasInvulnerabilityShield();
        // Shield radius is 4.5x player radius (matching Player.ts visual) - otherwise normal hull radius
        const effectivePlayerRadius = shieldActive ? (player.radius * 4.5) : player.radius;

        if (d < effectivePlayerRadius + this.radius) {
            // Check if player has invulnerability shield active
            if (shieldActive) {
                // Shield kills enemy on contact
                this.hp = 0;
                this.killedByShield = true;
            } else {
                player.takeDamage(this.damage);
            }
            this.pushX = -Math.cos(angle) * 15;
            this.pushY = -Math.sin(angle) * 15;
        }
    }
}
