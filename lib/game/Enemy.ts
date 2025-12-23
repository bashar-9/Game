import { BASE_STATS, DIFFICULTY_SETTINGS, CONFIG } from '../config';
import { showDamage } from '../utils';
import { IPlayer } from './types';
import { createNeonSprite, CACHED_SPRITES } from './AssetCache';

export class Enemy {
    x: number;
    y: number;
    type: 'basic' | 'tank' | 'swarm';
    pushX: number;
    pushY: number;
    radius: number;
    speed: number;
    hp: number;
    maxHp: number;
    xpValue: number;
    damage: number;
    mass: number;
    color: string;

    rotation: number;

    // Static size config for caching
    // We add buffer for glow/shadow
    static CACHE_SIZE = 64;
    static CACHE_HALF = 32;

    constructor(type: 'basic' | 'tank' | 'swarm', canvasWidth: number, canvasHeight: number, playerLevel: number, diffMode: 'easy' | 'normal' | 'hard', diffLevel: number) {
        // Spawn logic
        const edge = Math.floor(Math.random() * 4);
        const buffer = 50;
        if (edge === 0) { this.x = Math.random() * canvasWidth; this.y = -buffer; }
        else if (edge === 1) { this.x = canvasWidth + buffer; this.y = Math.random() * canvasHeight; }
        else if (edge === 2) { this.x = Math.random() * canvasWidth; this.y = canvasHeight + buffer; }
        else { this.x = -buffer; this.y = Math.random() * canvasHeight; }

        this.type = type;
        this.pushX = 0;
        this.pushY = 0;
        this.rotation = 0; // Init rotation

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
        // Speed variation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const baseSpeed = (stats as any).speedBase || (stats as any).speed;
        this.speed = baseSpeed + (type === 'swarm' || type === 'basic' ? Math.random() * (type === 'swarm' ? 1.0 : 0.5) : 0);

        // New Scaling: Milder (Additive per level) rather than Multiplicative
        const diffScale = 1 + (diffLevel * 1.5); // Diff 10 = 16x (was 7.0x)
        this.hp = stats.hpBase * diffScale * settings.hpMult * levelMult;
        this.xpValue = Math.floor(stats.xpValue * (1 + (diffLevel * 0.15)));
        this.damage = stats.damageBase * settings.dmgMult * (1 + (diffLevel * 0.15));
        this.mass = stats.mass;

        this.maxHp = this.hp;

        // Ensure we preload sprite if not exists
        this.getSprite();
    }

    takeHit(amount: number, isCrit: boolean = false) {
        this.hp -= amount;
        showDamage(this.x, this.y, amount, isCrit);
    }

    update(player: IPlayer, enemies: Enemy[]) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
        this.rotation = angle; // Face player

        this.x += Math.cos(angle) * this.speed + this.pushX;
        this.y += Math.sin(angle) * this.speed + this.pushY;

        this.pushX *= 0.8;
        this.pushY *= 0.8;

        // Soft collision between enemies
        for (const other of enemies) {
            if (other === this) continue;
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const distSq = dx * dx + dy * dy;
            const radSum = this.radius + other.radius;

            if (distSq < radSum * radSum) {
                const dist = Math.sqrt(distSq);
                const force = (radSum - dist) / radSum;
                const fx = (dx / dist) * force * 0.4;
                const fy = (dy / dist) * force * 0.4;
                this.x += fx; this.y += fy;
                other.x -= fx; other.y -= fy;
            }
        }

        const d = Math.hypot(player.x - this.x, player.y - this.y);
        if (d < player.radius + this.radius) {
            player.takeDamage(this.damage);
            this.pushX = -Math.cos(angle) * 15;
            this.pushY = -Math.sin(angle) * 15;
        }
    }

    getSprite(): HTMLCanvasElement {
        const key = `enemy_${this.type}`;
        if (CACHED_SPRITES[key]) return CACHED_SPRITES[key];

        // Generate Sprite
        const size = Enemy.CACHE_SIZE;
        const half = Enemy.CACHE_HALF;

        CACHED_SPRITES[key] = createNeonSprite(size, size, (ctx, w, h) => {
            // Center context
            ctx.translate(half, half);

            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
            ctx.fillStyle = this.color;

            const r = this.radius; // Use current radius property (might need base radius if scaling happens?)
            // Note: For caching to work with variable radii (if any), we need to cache by Type+Size 
            // OR just use a standard size and scale via drawImage (better for memory)
            // Here we assume standard size per type for the sprite generation relative to cache box

            // Re-use draw logic relative to 0,0
            if (this.type === 'basic') {
                ctx.beginPath();
                ctx.moveTo(r, 0);
                ctx.lineTo(0, r * 0.7);
                ctx.lineTo(-r * 0.6, 0);
                ctx.lineTo(0, -r * 0.7);
                ctx.closePath();

                ctx.fillStyle = '#1a0505';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = this.color;
                ctx.stroke();

            } else if (this.type === 'tank') {
                ctx.beginPath();
                const sides = 8;
                for (let i = 0; i < sides; i++) {
                    const theta = (i / sides) * Math.PI * 2;
                    const rx = Math.cos(theta) * r;
                    const ry = Math.sin(theta) * r;
                    if (i === 0) ctx.moveTo(rx, ry);
                    else ctx.lineTo(rx, ry);
                }
                ctx.closePath();

                ctx.fillStyle = '#1a001a';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = this.color;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

            } else if (this.type === 'swarm') {
                // Adjust radius for swarm specific scale in cache if needed, 
                // but 'r' here comes from instance. If instance 'r' varies, this might fail uniqueness.
                // Assuming all 'swarm' have same base radius.
                const sr = r * 1.2;
                ctx.beginPath();
                ctx.moveTo(sr, 0);
                ctx.lineTo(-sr * 0.8, sr * 0.6);
                ctx.lineTo(-sr * 0.4, 0); // Notch
                ctx.lineTo(-sr * 0.8, -sr * 0.6);
                ctx.closePath();

                ctx.fillStyle = '#1a1000';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = this.color;
                ctx.stroke();
            }
        });

        return CACHED_SPRITES[key];
    }

    draw(ctx: CanvasRenderingContext2D) {
        const sprite = this.getSprite();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // offset by half cache size to center
        ctx.drawImage(sprite, -Enemy.CACHE_HALF, -Enemy.CACHE_HALF);

        ctx.restore();

        // HP Bar remains absolute
        if (this.hp < this.maxHp) {
            ctx.shadowBlur = 0;
            const w = this.radius * 2;
            ctx.fillStyle = '#330000';
            ctx.fillRect(this.x - this.radius, this.y - this.radius - (CONFIG.IS_MOBILE ? 8 : 12), w, 4);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(this.x - this.radius, this.y - this.radius - (CONFIG.IS_MOBILE ? 8 : 12), w * (this.hp / this.maxHp), 4);
        }
    }
}
