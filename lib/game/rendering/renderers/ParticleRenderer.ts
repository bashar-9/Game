import { Particle } from '../../Particle';

export class ParticleRenderer {
    static draw(ctx: CanvasRenderingContext2D, particle: Particle) {
        // Fake Glow (2-pass) is much faster than shadowBlur
        ctx.fillStyle = particle.color;

        // Glow spread
        ctx.globalAlpha = particle.life * 0.3;
        ctx.fillRect(particle.x - 2, particle.y - 2, 8, 8);

        // Core
        ctx.globalAlpha = particle.life;
        ctx.fillRect(particle.x, particle.y, 4, 4);

        ctx.globalAlpha = 1.0;
    }
}
