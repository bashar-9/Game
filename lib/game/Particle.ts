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


}
