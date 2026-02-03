export class Particle {
    x!: number;
    y!: number;
    vx!: number;
    vy!: number;
    color!: string;
    life!: number;
    decay!: number;

    constructor(x: number, y: number, color: string) {
        this.reset(x, y, color);
    }

    reset(x: number, y: number, color: string) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = 0.08;
    }

    update(delta: number = 1) {
        this.x += this.vx * delta;
        this.y += this.vy * delta;
        this.life -= this.decay * delta;
    }

    draw(ctx: CanvasRenderingContext2D) {
        // Fake Glow (2-pass) is much faster than shadowBlur
        ctx.fillStyle = this.color;

        // Glow spread
        ctx.globalAlpha = this.life * 0.3;
        ctx.fillRect(this.x - 2, this.y - 2, 8, 8);

        // Core
        ctx.globalAlpha = this.life;
        ctx.fillRect(this.x, this.y, 4, 4);

        ctx.globalAlpha = 1.0;
    }
}
