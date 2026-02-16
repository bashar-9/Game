import { Camera } from '../Camera';
import { Player } from '../Player';
import { Enemy } from '../enemies/Enemy';
import { Bullet } from '../Bullet';
import { Pickup } from '../Pickup';
import { Particle } from '../Particle';
import { MapConfig } from '../../maps';
import { InputManager } from '../InputManager';
import { PlayerRenderer } from './renderers/PlayerRenderer';
import { EnemyRenderer } from './renderers/EnemyRenderer';
import { BulletRenderer } from './renderers/BulletRenderer';
import { PickupRenderer } from './renderers/PickupRenderer';
import { ParticleRenderer } from './renderers/ParticleRenderer';
import { drawJoystick } from '../../utils';

export interface RenderContext {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    camera: Camera;
    currentMap: MapConfig;
    player: Player;
    enemies: Enemy[];
    bullets: Bullet[];
    pickups: Pickup[];
    particles: Particle[];
    stars: { x: number, y: number, size: number, alpha: number }[];
    frames: number;
    inputManager: InputManager;
    worldWidth: number;
    worldHeight: number;
}

export class RenderSystem {
    static draw(game: RenderContext) {
        const {
            ctx, width, height, camera, currentMap,
            player, enemies, bullets, pickups, particles, stars,
            frames, inputManager, worldWidth, worldHeight
        } = game;

        const theme = currentMap.theme;

        // Clear with map background color
        ctx.fillStyle = theme.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Save context for world-space rendering
        ctx.save();

        // Apply camera transform
        ctx.translate(-camera.x, -camera.y);

        // --- WORLD SPACE RENDERING ---

        // 1. Stars / Background Particles
        ctx.fillStyle = '#ffffff';
        for (const star of stars) {
            if (camera.isVisible(star.x, star.y, star.size, star.size)) {
                ctx.globalAlpha = star.alpha;
                ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        }
        ctx.globalAlpha = 1.0;

        // 2. Grid & Floor Patterns
        RenderSystem.drawGrid(ctx, camera, width, height, worldWidth, worldHeight, theme);

        // 3. Decorations
        if (currentMap.decorations) {
            RenderSystem.drawDecorations(ctx, currentMap.decorations, camera);
        }

        // 4. Hazards
        RenderSystem.drawHazards(ctx, currentMap.hazards, camera, frames);

        // 5. Walls
        RenderSystem.drawWalls(ctx, currentMap.walls, camera, theme);

        // 6. Projectiles
        for (const b of bullets) {
            BulletRenderer.draw(ctx, b);
        }

        // 7. Pickups
        for (const p of pickups) {
            PickupRenderer.draw(ctx, p);
        }

        // 8. Enemies
        for (const e of enemies) {
            EnemyRenderer.draw(ctx, e);
        }

        // 9. Player
        PlayerRenderer.draw(ctx, player, frames);

        // 10. Particles
        for (const p of particles) {
            ParticleRenderer.draw(ctx, p);
        }

        ctx.restore();

        // --- UI / Overlay ---
        if (theme.isDatacenter) {
            // CRT Scanline effect
            ctx.fillStyle = 'rgba(0, 255, 255, 0.02)';
            for (let y = 0; y < height; y += 4) {
                ctx.fillRect(0, y, width, 1);
            }
        }

        // --- SCREEN SPACE (HUD) ---
        RenderSystem.drawMinimap(ctx, width, height, worldWidth, worldHeight, player, enemies, camera);

        drawJoystick(ctx, inputManager.joystick);
    }

    static drawGrid(ctx: CanvasRenderingContext2D, camera: Camera, width: number, height: number, worldWidth: number, worldHeight: number, theme: any) {
        const gridSize = 100;
        const startX = Math.floor(camera.x / gridSize) * gridSize;
        const startY = Math.floor(camera.y / gridSize) * gridSize;
        const endX = Math.min(worldWidth, camera.x + width + gridSize);
        const endY = Math.min(worldHeight, camera.y + height + gridSize);

        ctx.lineWidth = 1;

        if (theme.isIndustrial) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            for (let x = startX; x <= endX; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
            }
        } else if (theme.isDatacenter) {
            ctx.strokeStyle = theme.gridColor;
            ctx.shadowBlur = 4;
            ctx.shadowColor = theme.gridColor;
            for (let x = startX; x <= endX; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
            }
            ctx.shadowBlur = 0;
        } else {
            ctx.strokeStyle = theme.gridColor;
            for (let x = startX; x <= endX; x += gridSize) {
                ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
            }
        }
    }

    static drawDecorations(ctx: CanvasRenderingContext2D, decorations: any[], camera: Camera) {
        for (const dec of decorations) {
            if (!camera.isVisible(dec.x, dec.y, dec.w, dec.h)) continue;

            ctx.save();
            ctx.translate(dec.x + dec.w / 2, dec.y + dec.h / 2);
            if (dec.rotation) ctx.rotate(dec.rotation);
            ctx.translate(-dec.w / 2, -dec.h / 2);

            ctx.fillStyle = dec.color;
            ctx.globalAlpha = dec.opacity ?? 0.8;

            if (dec.type === 'cable') {
                ctx.fillRect(0, 0, dec.w, dec.h);
            } else if (dec.type === 'floor_decal') {
                ctx.fillRect(0, 0, dec.w, dec.h);
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                for (let i = 0; i < dec.w; i += 20) ctx.fillRect(i, 0, 10, dec.h);
            } else if (dec.type === 'symbol') {
                ctx.font = `${dec.w}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('⚠', dec.w / 2, dec.h / 2);
            } else if (dec.type === 'crack') {
                ctx.strokeStyle = dec.color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(dec.w, dec.h);
                ctx.moveTo(dec.w, 0);
                ctx.lineTo(0, dec.h);
                ctx.stroke();
            }

            ctx.restore();
        }
        ctx.globalAlpha = 1.0;
    }

    static drawHazards(ctx: CanvasRenderingContext2D, hazards: any[], camera: Camera, frames: number) {
        for (const hazard of hazards) {
            if (camera.isVisible(hazard.x, hazard.y, hazard.w, hazard.h)) {
                const pulse = 0.5 + 0.3 * Math.sin(frames * (hazard.pulseSpeed || 3) * 0.05);
                ctx.fillStyle = hazard.color;
                ctx.globalAlpha = pulse;
                ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);

                ctx.strokeStyle = hazard.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
                ctx.globalAlpha = 1.0;

                if (hazard.type === 'damage') {
                    ctx.fillStyle = '#fff';
                    ctx.font = '12px monospace';
                    ctx.fillText('! DANGER !', hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
                }
            }
        }
    }

    static drawWalls(ctx: CanvasRenderingContext2D, walls: any[], camera: Camera, theme: any) {
        for (const wall of walls) {
            if (!camera.isVisible(wall.x, wall.y, wall.w, wall.h)) continue;

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(wall.x + 10, wall.y + 10, wall.w, wall.h);

            const wallColor = wall.color || theme.wallColor;

            if (wall.type === 'crate') {
                ctx.fillStyle = '#3a3a4a';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                ctx.strokeStyle = '#2a2a35';
                ctx.lineWidth = 6;
                ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
                ctx.beginPath();
                ctx.moveTo(wall.x, wall.y); ctx.lineTo(wall.x + wall.w, wall.y + wall.h);
                ctx.moveTo(wall.x + wall.w, wall.y); ctx.lineTo(wall.x, wall.y + wall.h);
                ctx.stroke();

                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1;
                ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            } else if (wall.type === 'server') {
                ctx.fillStyle = '#0a0a10';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                for (let ly = wall.y + 5; ly < wall.y + wall.h; ly += 15) {
                    if (Math.random() > 0.3) {
                        ctx.fillStyle = Math.random() > 0.5 ? '#00ffcc' : '#ff0055';
                        ctx.fillRect(wall.x + 5, ly, 4, 4);
                        ctx.fillRect(wall.x + 15, ly, 4, 4);
                    }
                }

                ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
                ctx.fillRect(wall.x + 2, wall.y + 2, wall.w - 4, wall.h - 4);

                ctx.strokeStyle = '#00ccff';
                ctx.lineWidth = 1;
                ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            } else if (wall.type === 'glass') {
                ctx.fillStyle = 'rgba(200, 255, 255, 0.15)';
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            } else {
                ctx.fillStyle = wallColor;
                ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                ctx.strokeStyle = theme.wallBorderColor;
                ctx.lineWidth = 2;
                ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            }
        }
    }

    static drawMinimap(ctx: CanvasRenderingContext2D, width: number, height: number, worldWidth: number, worldHeight: number, player: Player, enemies: Enemy[], camera: Camera) {
        const padding = 20;
        const size = 150;
        const scale = size / Math.max(worldWidth, worldHeight);

        const mx = width - size - padding;
        const my = padding;

        ctx.save();
        ctx.translate(mx, my);

        // BG
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, size, size);

        // Enemies
        ctx.fillStyle = '#ff0000';
        for (const e of enemies) {
            ctx.fillRect(e.x * scale, e.y * scale, 2, 2);
        }

        // Player
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(player.x * scale - 2, player.y * scale - 2, 4, 4);

        // Viewport rect
        ctx.strokeStyle = '#fff';
        ctx.globalAlpha = 0.3;
        ctx.strokeRect(camera.x * scale, camera.y * scale, width * scale, height * scale);

        ctx.restore();
    }
}
