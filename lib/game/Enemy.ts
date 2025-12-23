import { BASE_STATS, DIFFICULTY_SETTINGS, CONFIG } from '../config';
import { showDamage } from '../utils';
import { IPlayer } from './types';

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
        const diffScale = 1 + (diffLevel * 0.60); // Diff 10 = 7.0x (was 5.5x)
        this.hp = stats.hpBase * diffScale * settings.hpMult * levelMult;
        this.xpValue = Math.floor(stats.xpValue * (1 + (diffLevel * 0.15)));
        this.damage = stats.damageBase * settings.dmgMult * (1 + (diffLevel * 0.15));
        this.mass = stats.mass;

        this.maxHp = this.hp;
    }

    takeHit(amount: number, isCrit: boolean = false) {
        this.hp -= amount;
        showDamage(this.x, this.y, amount, isCrit);
    }

    update(player: IPlayer, enemies: Enemy[]) {
        const angle = Math.atan2(player.y - this.y, player.x - this.x);
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

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        if (this.hp < this.maxHp) {
            const w = this.radius * 2;
            ctx.fillStyle = '#330000';
            ctx.fillRect(this.x - this.radius, this.y - this.radius - (CONFIG.IS_MOBILE ? 4 : 8), w, 4);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(this.x - this.radius, this.y - this.radius - (CONFIG.IS_MOBILE ? 4 : 8), w * (this.hp / this.maxHp), 4);
        }
    }
}
