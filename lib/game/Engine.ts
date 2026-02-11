import { CONFIG, DIFFICULTY_SETTINGS, UPGRADES_LIST, resetUpgrades } from '../config';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { Pickup } from './Pickup';
import { Particle } from './Particle';
import { drawJoystick, getDifficulty } from '../utils';
import { useGameStore } from '../../store/useGameStore';
import { usePowerUpProgressionStore } from '../../store/PowerUpProgressionStore';
import { JoystickState } from './types';
import { InputManager } from './InputManager';
import { ObjectPool } from './ObjectPool';
import { soundManager } from './SoundManager';
import { Camera } from './Camera';
import { MAPS_BY_DIFFICULTY, MapConfig, Wall, HazardZone, resolveWallCollisions, pointInWalls } from '../maps';
import { SpatialHash } from './SpatialHash';

export class Engine {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    width: number = 0;
    height: number = 0;

    player: Player;
    enemies: Enemy[] = [];
    bullets: Bullet[] = [];
    pickups: Pickup[] = [];
    particles: Particle[] = [];

    // Pools
    bulletPool: ObjectPool<Bullet>;
    particlePool: ObjectPool<Particle>;
    enemyPool: ObjectPool<Enemy>;

    inputManager: InputManager;

    animationId: number = 0;
    lastTime: number = 0;
    gameTime: number = 0;
    accumulator: number = 0;
    frames: number = 0;

    // Target FPS for delta calculations (game was tuned for 60 FPS)
    static readonly TARGET_FPS = 60;
    static readonly FRAME_TIME = 1000 / 60; // ~16.67ms

    difficulty: number = 1;
    diffMode: 'easy' | 'medium' | 'hard' = 'easy';

    // Camera and Map System
    camera: Camera;
    currentMap: MapConfig;
    worldWidth: number = 2500;
    worldHeight: number = 2500;

    stars: { x: number, y: number, size: number, alpha: number }[] = [];

    spatialHash: SpatialHash<Enemy>;

    constructor(canvas: HTMLCanvasElement, diffMode: 'easy' | 'medium' | 'hard' = 'easy') {
        // Reset global upgrade state to prevent Sticky/Double-Init issues
        resetUpgrades();

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!; // Alpha false for performance
        this.diffMode = diffMode;

        this.inputManager = new InputManager(canvas);

        // Init Spatial Hash (cell size 100 seems reasonable for enemy sizes of ~20-40)
        this.spatialHash = new SpatialHash(100);

        // Init Pools
        this.bulletPool = new ObjectPool<Bullet>(
            () => new Bullet(0, 0, 0, 0, 0, 0, 0, false),
            (b) => { /* Reset handled by acquire/Player */ }
        );
        this.particlePool = new ObjectPool<Particle>(
            () => new Particle(0, 0, '#fff'),
            (p) => { /* Reset handled by acquire */ }
        );
        this.enemyPool = new ObjectPool<Enemy>(
            () => new Enemy('basic', 0, 0, 1, 'easy', 1), // Dummy defaults
            (e) => { /* Reset handled by acquire */ }
        );

        // Initialize Map and Camera
        this.currentMap = MAPS_BY_DIFFICULTY[diffMode];
        this.worldWidth = this.currentMap.width;
        this.worldHeight = this.currentMap.height;

        // Initialize size logic (also sets width/height for viewport)
        this.resize();

        // Init Camera after resize so we have viewport dimensions
        this.camera = new Camera(this.width, this.height);

        // Center player in map
        this.player = new Player(this.worldWidth, this.worldHeight, diffMode, {
            onUpdateStats: (hp, maxHp, xp, xpToNext, level, damage) => {
                const store = useGameStore.getState();
                store.setHp(hp, maxHp);
                store.setXp(xp, xpToNext, level);
                store.setDamage(damage);
            },
            onUpdateActivePowerups: (active, maxDurations) => {
                useGameStore.getState().setActivePowerups(active, maxDurations);
            },
            onLevelUp: () => {
                this.pauseGame();
                useGameStore.getState().setUpgradeMenu(true);
                soundManager.play('level_up', 'sfx', 0.7);
            },
            onGameOver: () => {
                this.endGame();
            },
            onCreateParticles: (x, y, count, color) => {
                for (let i = 0; i < count; i++) {
                    const p = this.particlePool.acquire();
                    p.reset(x, y, color);
                    this.particles.push(p);
                }
            }
        });

        // CHECK FOR DEV CONFIG
        const devConfig = (window as any).__DEV_CONFIG__;
        if (devConfig) {
            console.log('APPLYING DEV CONFIG:', devConfig);

            // Set Level
            if (devConfig.level && devConfig.level > 1) {
                console.log(`Setting Level from ${this.player.level} to ${devConfig.level}`);
                for (let i = 1; i < devConfig.level; i++) {
                    // Manually scale XP/HP without triggering UI level up
                    this.player.level++;
                    this.player.xpToNext = Math.floor(this.player.xpToNext * 1.15) + 25;
                    this.player.hp = Math.min(this.player.hp + (this.player.maxHp * 0.3), this.player.maxHp);
                }
                console.log(`Final Player Level: ${this.player.level}`);
            }

            // Set Upgrades
            if (devConfig.upgrades) {
                Object.entries(devConfig.upgrades).forEach(([id, count]) => {
                    const upgrade = UPGRADES_LIST.find(u => u.id === id);
                    if (upgrade) {
                        for (let i = 0; i < (count as number); i++) {
                            // Logic to apply upgrade multiple times
                            // We reuse selectUpgrade logic roughly but bypass UI state
                            if (upgrade.evoName) {
                                if (upgrade.id === 'repulsion') {
                                    if (upgrade.count + 1 === 5 && upgrade.evoApply) upgrade.evoApply(this.player);
                                    else upgrade.apply(this.player);
                                } else {
                                    if ((upgrade.count + 1) % 5 === 0 && upgrade.evoApply) upgrade.evoApply(this.player);
                                    else upgrade.apply(this.player);
                                }
                            } else {
                                upgrade.apply(this.player);
                            }
                            upgrade.count++;
                        }
                    }
                });
            }

            // Sync initial state to UI
            this.player.syncStats();

            // Set Start Time
            if (devConfig.startTime) {
                console.log(`Setting Start Time to ${devConfig.startTime} min`);
                this.gameTime = devConfig.startTime * 60;
                useGameStore.getState().setTime(this.gameTime);
            }

            // Apply Active Powerups
            if (devConfig.powerups) {
                const { POWERUP_DURATIONS } = require('../config');
                Object.entries(devConfig.powerups).forEach(([key, active]) => {
                    if (active) {
                        const duration = POWERUP_DURATIONS[key] || 900;
                        console.log(`Activating powerup: ${key} for ${duration} frames`);
                        this.player.applyPowerup(key as 'double_stats' | 'invulnerability' | 'magnet', duration);
                    }
                });
            }
        }

        this.bindEvents();
        this.resize();

        // Audio Init
        soundManager.preload().then(() => {
            soundManager.playBGM(0.5);
        });

        this.startLoop();
    }

    bindEvents() {
        window.addEventListener('resize', () => this.resize());
        // Input logic moved to InputManager
    }

    resize() {
        // Handle High DPI
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;

        // Scale context to ensure all drawing operations use logical coordinates
        this.ctx.scale(dpr, dpr);

        // Update camera viewport size
        if (this.camera) {
            this.camera.resize(this.width, this.height);
        }

        // Clamp player to world bounds (not screen)
        if (this.player) {
            this.player.x = Math.min(this.worldWidth, Math.max(0, this.player.x));
            this.player.y = Math.min(this.worldHeight, Math.max(0, this.player.y));
        }

        // Re-init stars to cover the WORLD area (not just screen)
        this.stars = [];
        const starCount = Math.floor((this.worldWidth * this.worldHeight) / 10000); // ~1 star per 100x100 area
        for (let i = 0; i < Math.min(starCount, 500); i++) {
            this.stars.push({
                x: Math.random() * this.worldWidth,
                y: Math.random() * this.worldHeight,
                size: Math.random() * 2,
                alpha: Math.random() * 0.8 + 0.2
            });
        }
    }

    startLoop() {
        this.lastTime = performance.now();
        this.loop();
    }

    loop = () => {
        if (!useGameStore.getState().isPaused && !useGameStore.getState().isGameOver) {
            const now = performance.now();
            let deltaMs = now - this.lastTime;
            // Cap delta to prevent spiral of death if tab backgrounded
            if (deltaMs > 100) deltaMs = 100;

            this.lastTime = now;
            this.accumulator += deltaMs;

            // Fixed Timestep Update
            const stepMs = Engine.FRAME_TIME; // ~16.67ms
            while (this.accumulator >= stepMs) {
                this.update();
                this.accumulator -= stepMs;
            }

            this.draw();
        }
        this.animationId = requestAnimationFrame(this.loop);
    };

    update() {
        // Delta is always 1.0 in fixed update (matches 60 FPS logic)
        const delta = 1.0;

        if (this.frames % 60 === 0 && this.frames > 0) {
            this.gameTime++;
            useGameStore.getState().setTime(this.gameTime);
            this.difficulty = getDifficulty(this.gameTime);
        }
        this.frames++;

        const settings = DIFFICULTY_SETTINGS[this.diffMode];

        // Spawn Logic with Early Game Dampener & Late Game Ramp
        // 0-3 mins: Ramp from 40% to 100% capacity (was 0-3 mins 15%-100%)
        const earlyGameRamp = Math.min(1.0, 0.40 + (this.gameTime / 180) * 0.60);

        // Late Game: Uncapped density scaling for massive hordes
        const densityCap = Math.max(1, this.difficulty);

        if (Math.random() < 0.02 * settings.spawnMult * densityCap * earlyGameRamp) {
            const types: ('swarm' | 'tank' | 'basic')[] = ['basic'];
            // Allow Swarms (Yellow) basically from the start to provide "fodder"
            if (this.gameTime > 5) types.push('swarm');
            if (this.gameTime > 120) types.push('tank');
            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = this.enemyPool.acquire();
            // Spawn at WORLD edge, not screen edge
            enemy.reset(type, this.worldWidth, this.worldHeight, this.player.level, this.diffMode, this.difficulty);
            this.enemies.push(enemy);
        }

        // Populate Spatial Hash for this frame
        this.spatialHash.clear();
        for (const enemy of this.enemies) {
            this.spatialHash.add(enemy);
        }

        const inputState = this.inputManager.getState();
        this.player.update(
            inputState,
            this.enemies,
            (x, y, vx, vy, damage, pierce, size, isCrit) => {
                const b = this.bulletPool.acquire();
                b.reset(x, y, vx, vy, damage, pierce, size, isCrit);
                this.bullets.push(b);
            },
            this.frames,
            this.worldWidth,
            this.worldHeight,
            delta,
            this.currentMap.walls
        );

        // Update camera to follow player
        this.camera.follow(this.player.x, this.player.y, this.worldWidth, this.worldHeight);

        // Process hazard zones
        this.processHazards(delta);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            // Pass spatialHash instead of enemies array for separation
            e.update(this.player, this.spatialHash, delta, this.currentMap.walls);

            if (e.hp <= 0) {
                // Drop Logic: Calculate Gem Multiplier
                let multiplier = 1;
                const lvl = this.player.level;

                if (lvl >= 15) {
                    const r = Math.random();
                    if (r < 0.15) multiplier = 4;      // 15% Chance for 4x
                    else if (r < 0.30) multiplier = 2; // 15% Chance for 2x
                    // 70% Chance for 1x
                } else if (lvl >= 8) {
                    if (Math.random() < 0.10) multiplier = 2; // 10% Chance for 2x
                    // 90% Chance for 1x
                }

                // If existing XP is 2, and multiplier is 4, drop is 8xp.
                // We keep it simple: drop ONE gem with scaled value.
                // Ideally, we'd change color in Pickup but for now just value matters.
                this.pickups.push(new Pickup(e.x, e.y, e.xpValue * multiplier, multiplier));

                this.enemies.splice(i, 1);
                this.enemyPool.release(e);

                // Shield kill effect - yellow sparks burst
                if (e.killedByShield) {
                    for (let j = 0; j < 8; j++) {
                        const p = this.particlePool.acquire();
                        p.reset(e.x, e.y, '#ffff00');
                        this.particles.push(p);
                    }
                }

                // Explosion with variance
                soundManager.play('explosion', 'sfx', 0.25, false, 0.2);

                const currentKills = useGameStore.getState().killCount + 1;
                useGameStore.getState().setKillCount(currentKills);
                useGameStore.getState().addRerollPoints(1);

                // POWERUP DROP LOGIC
                // Formula: BaseRate * (DecayFactor / (DecayFactor + Kills)) * DropRateMultiplier
                // Rate = 0.5% * (750 / (750 + Kills)) * multiplier
                const baseRate = 0.005;
                const decayFactor = 750;
                const dropRateMultiplier = usePowerUpProgressionStore.getState().getDropRateMultiplier();
                const dropRate = baseRate * (decayFactor / (decayFactor + currentKills)) * dropRateMultiplier;

                if (Math.random() < dropRate) {
                    const powerupTypes: ('double_stats' | 'invulnerability' | 'magnet')[] = ['double_stats', 'invulnerability', 'magnet'];
                    const pType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                    this.pickups.push(new Pickup(e.x, e.y, 0, 1, 'powerup', pType));
                }
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            // Pass spatialHash instead of enemies array for collision
            b.update(this.spatialHash, this.particles, delta);
            // Check world bounds OR wall collision
            const hitWall = pointInWalls(b.x, b.y, this.currentMap.walls);
            if (b.life <= 0 || b.x < 0 || b.x > this.worldWidth || b.y < 0 || b.y > this.worldHeight || hitWall) {
                this.bullets.splice(i, 1);
                this.bulletPool.release(b);
            }
        }

        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            p.update(this.player, delta);
            if (p.dead) this.pickups.splice(i, 1);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(delta);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                this.particlePool.release(p);
            }
        }
    }

    draw() {
        const theme = this.currentMap.theme;

        // Clear with map background color
        this.ctx.fillStyle = theme.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Save context for world-space rendering
        this.ctx.save();

        // Apply camera transform (translate world relative to camera)
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // --- WORLD SPACE RENDERING ---

        // Stars (in world space)
        this.ctx.fillStyle = '#ffffff';
        for (const star of this.stars) {
            // Only draw visible stars
            if (this.camera.isVisible(star.x, star.y, star.size, star.size)) {
                this.ctx.globalAlpha = star.alpha;
                this.ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        }
        this.ctx.globalAlpha = 1.0;

        // Cyber Grid (in world space) - style varies by theme
        const gridSize = 50;

        // Calculate visible grid bounds
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = Math.min(this.worldWidth, this.camera.x + this.width + gridSize);
        const endY = Math.min(this.worldHeight, this.camera.y + this.height + gridSize);

        // SANDBOX - Clean holographic training ground
        if (theme.hasBlueprintStyle) {
            // Solid clean grid (no dashes - smoother)
            this.ctx.strokeStyle = 'rgba(0, 200, 255, 0.08)';
            this.ctx.lineWidth = 1;
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, Math.max(0, this.camera.y));
                this.ctx.lineTo(x, Math.min(this.worldHeight, this.camera.y + this.height));
                this.ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(Math.max(0, this.camera.x), y);
                this.ctx.lineTo(Math.min(this.worldWidth, this.camera.x + this.width), y);
                this.ctx.stroke();
            }

            // Subtle gradient overlay from edges (vignette)
            const gradient = this.ctx.createRadialGradient(
                this.worldWidth / 2, this.worldHeight / 2, 0,
                this.worldWidth / 2, this.worldHeight / 2, this.worldWidth * 0.7
            );
            gradient.addColorStop(0, 'rgba(0, 50, 80, 0)');
            gradient.addColorStop(1, 'rgba(0, 30, 60, 0.3)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

            // Clean boundary glow (static, not pulsing)
            this.ctx.strokeStyle = 'rgba(0, 180, 255, 0.4)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(10, 10, this.worldWidth - 20, this.worldHeight - 20);

            // Zone label at top
            this.ctx.font = 'bold 16px monospace';
            this.ctx.fillStyle = 'rgba(0, 220, 255, 0.5)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('[ SANDBOX // TRAINING_MODE ]', this.worldWidth / 2, 60);
        }
        // KERNEL PANIC - Glitchy chaos
        else if (theme.hasGlitchEffect) {
            // Subtle constant shake (reduced intensity)
            const shakeX = (Math.random() - 0.5) * 1.5;
            const shakeY = (Math.random() - 0.5) * 1.5;
            this.ctx.translate(shakeX, shakeY);

            // Glitchy broken grid
            this.ctx.strokeStyle = theme.gridColor;
            this.ctx.lineWidth = 1;
            for (let x = startX; x <= endX; x += gridSize) {
                if (Math.random() > 0.2) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, Math.max(0, this.camera.y));
                    this.ctx.lineTo(x, Math.min(this.worldHeight, this.camera.y + this.height));
                    this.ctx.stroke();
                }
            }
            for (let y = startY; y <= endY; y += gridSize) {
                if (Math.random() > 0.2) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(Math.max(0, this.camera.x), y);
                    this.ctx.lineTo(Math.min(this.worldWidth, this.camera.x + this.width), y);
                    this.ctx.stroke();
                }
            }

            // Scanlines
            this.ctx.fillStyle = 'rgba(255, 0, 80, 0.02)';
            for (let y = this.camera.y; y < this.camera.y + this.height; y += 3) {
                this.ctx.fillRect(this.camera.x, y, this.width, 1);
            }

            // Random glitch blocks
            if (Math.random() < 0.15) {
                this.ctx.fillStyle = `rgba(255, 0, ${50 + Math.random() * 50}, 0.12)`;
                const gx = this.camera.x + Math.random() * this.width;
                const gy = this.camera.y + Math.random() * this.height;
                this.ctx.fillRect(gx, gy, 30 + Math.random() * 80, 2 + Math.random() * 6);
            }

            // Chromatic aberration effect on boundary
            this.ctx.strokeStyle = 'rgba(255, 0, 100, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(3, 3, this.worldWidth - 6, this.worldHeight - 6);
            this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            this.ctx.strokeRect(-2, -2, this.worldWidth + 4, this.worldHeight + 4);

            // Error messages floating
            if (this.frames % 180 < 90) {
                this.ctx.font = 'bold 12px monospace';
                this.ctx.fillStyle = 'rgba(255, 50, 80, 0.5)';
                this.ctx.textAlign = 'left';
                this.ctx.fillText('!! CRITICAL_ERROR !!', this.camera.x + 50, this.camera.y + 50);
                this.ctx.fillText('MEMORY_CORRUPTION_DETECTED', this.camera.x + 50, this.camera.y + 70);
            }

            // Warning boundary
            this.ctx.strokeStyle = 'rgba(255, 0, 50, 0.5)';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);
        }
        // PRODUCTION - Data center with matrix rain effect
        else if (theme.hasBlinkingLights) {
            // Clean base grid
            this.ctx.strokeStyle = theme.gridColor;
            this.ctx.lineWidth = 1;
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, Math.max(0, this.camera.y));
                this.ctx.lineTo(x, Math.min(this.worldHeight, this.camera.y + this.height));
                this.ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(Math.max(0, this.camera.x), y);
                this.ctx.lineTo(Math.min(this.worldWidth, this.camera.x + this.width), y);
                this.ctx.stroke();
            }



            // Floor hazard stripes near slow zones (if any visible)
            this.ctx.fillStyle = 'rgba(255, 200, 0, 0.08)';
            for (const hazard of this.currentMap.hazards) {
                if (hazard.type === 'slow' && this.camera.isVisible(hazard.x, hazard.y, hazard.w, hazard.h)) {
                    // Warning stripes around slow zone
                    for (let i = 0; i < hazard.w; i += 20) {
                        this.ctx.fillRect(hazard.x + i, hazard.y - 10, 10, 5);
                        this.ctx.fillRect(hazard.x + i, hazard.y + hazard.h + 5, 10, 5);
                    }
                }
            }

            // Clean cyan boundary
            this.ctx.strokeStyle = 'rgba(0, 255, 200, 0.35)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(5, 5, this.worldWidth - 10, this.worldHeight - 10);

            // Status bar at top
            this.ctx.font = '11px monospace';
            this.ctx.fillStyle = 'rgba(0, 255, 200, 0.4)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('[ PRODUCTION_SERVER // ACTIVE ]', this.worldWidth / 2, 40);
        }
        // Default grid style
        else {
            this.ctx.strokeStyle = theme.gridColor;
            this.ctx.lineWidth = 1;
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(x, Math.max(0, this.camera.y));
                this.ctx.lineTo(x, Math.min(this.worldHeight, this.camera.y + this.height));
                this.ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath();
                this.ctx.moveTo(Math.max(0, this.camera.x), y);
                this.ctx.lineTo(Math.min(this.worldWidth, this.camera.x + this.width), y);
                this.ctx.stroke();
            }
        }

        // Draw Hazard Zones (before walls so walls overlap)
        for (const hazard of this.currentMap.hazards) {
            if (this.camera.isVisible(hazard.x, hazard.y, hazard.w, hazard.h)) {
                // Pulsing effect
                const pulseSpeed = hazard.pulseSpeed ?? 2;
                const pulse = 0.6 + 0.4 * Math.sin(this.frames * pulseSpeed / 60);

                this.ctx.fillStyle = hazard.color;
                this.ctx.globalAlpha = pulse;
                this.ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);

                // Border
                this.ctx.strokeStyle = hazard.type === 'damage' ? '#ff0055' :
                    hazard.type === 'slow' ? '#00ccff' : '#aa00ff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
                this.ctx.globalAlpha = 1.0;
            }
        }

        // Draw Walls - styled per theme
        for (let i = 0; i < this.currentMap.walls.length; i++) {
            const wall = this.currentMap.walls[i];
            if (!this.camera.isVisible(wall.x, wall.y, wall.w, wall.h)) continue;

            const cx = wall.x + wall.w / 2;
            const cy = wall.y + wall.h / 2;

            // SANDBOX - Holographic training pillars
            if (theme.hasBlueprintStyle) {
                // Outer glow
                this.ctx.fillStyle = 'rgba(0, 150, 255, 0.1)';
                this.ctx.fillRect(wall.x - 5, wall.y - 5, wall.w + 10, wall.h + 10);

                // Main body with gradient
                const grad = this.ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y + wall.h);
                grad.addColorStop(0, '#1a4a6e');
                grad.addColorStop(0.5, '#2a6a9e');
                grad.addColorStop(1, '#1a4a6e');
                this.ctx.fillStyle = grad;
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                // Inner highlight
                this.ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(wall.x + 3, wall.y + 3, wall.w - 6, wall.h - 6);

                // Outer border
                this.ctx.strokeStyle = theme.wallBorderColor;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

                // Corner accents
                const cornerSize = 8;
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                this.ctx.lineWidth = 3;
                // Top-left
                this.ctx.beginPath();
                this.ctx.moveTo(wall.x, wall.y + cornerSize);
                this.ctx.lineTo(wall.x, wall.y);
                this.ctx.lineTo(wall.x + cornerSize, wall.y);
                this.ctx.stroke();
                // Bottom-right
                this.ctx.beginPath();
                this.ctx.moveTo(wall.x + wall.w - cornerSize, wall.y + wall.h);
                this.ctx.lineTo(wall.x + wall.w, wall.y + wall.h);
                this.ctx.lineTo(wall.x + wall.w, wall.y + wall.h - cornerSize);
                this.ctx.stroke();
            }
            // PRODUCTION - Server racks with blinking lights
            else if (theme.hasBlinkingLights) {
                // Rack body with metallic gradient
                const grad = this.ctx.createLinearGradient(wall.x, wall.y, wall.x + wall.w, wall.y);
                grad.addColorStop(0, '#1a1a2e');
                grad.addColorStop(0.3, '#252540');
                grad.addColorStop(0.7, '#252540');
                grad.addColorStop(1, '#1a1a2e');
                this.ctx.fillStyle = grad;
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                // Rack border
                this.ctx.strokeStyle = theme.wallBorderColor;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

                // Horizontal rack slots
                this.ctx.strokeStyle = 'rgba(0, 255, 200, 0.15)';
                this.ctx.lineWidth = 1;
                const slotHeight = 20;
                for (let sy = wall.y + slotHeight; sy < wall.y + wall.h; sy += slotHeight) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(wall.x + 5, sy);
                    this.ctx.lineTo(wall.x + wall.w - 5, sy);
                    this.ctx.stroke();
                }

                // Blinking status lights (for tall walls)
                if (wall.h > 80) {
                    const numLights = Math.floor(wall.h / 25);
                    for (let j = 0; j < numLights; j++) {
                        const lightY = wall.y + 12 + j * 25;
                        const phase = Math.sin(this.frames * 0.12 + i * 0.7 + j * 0.4);
                        const isOn = phase > 0;

                        // Light circle
                        this.ctx.fillStyle = isOn ?
                            (j % 4 === 0 ? '#ff4444' : '#44ff88') :
                            'rgba(40, 40, 40, 0.8)';
                        this.ctx.beginPath();
                        this.ctx.arc(wall.x + wall.w - 10, lightY, 3, 0, Math.PI * 2);
                        this.ctx.fill();

                        // Glow
                        if (isOn) {
                            this.ctx.fillStyle = j % 4 === 0 ?
                                'rgba(255, 60, 60, 0.2)' : 'rgba(60, 255, 120, 0.2)';
                            this.ctx.beginPath();
                            this.ctx.arc(wall.x + wall.w - 10, lightY, 8, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    }
                }

                // Label on larger racks
                if (wall.h > 150) {
                    this.ctx.font = '8px monospace';
                    this.ctx.fillStyle = 'rgba(0, 255, 200, 0.4)';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`SRV_${i.toString().padStart(2, '0')}`, cx, wall.y + 15);
                }
            }
            // KERNEL PANIC - Corrupted glitchy debris
            else if (theme.hasGlitchEffect) {
                // Glitchy offset
                const glitchOffset = Math.random() < 0.1 ? (Math.random() - 0.5) * 4 : 0;

                // Corrupted fill with noise
                this.ctx.fillStyle = theme.wallColor;
                this.ctx.fillRect(wall.x + glitchOffset, wall.y, wall.w, wall.h);

                // Random corruption lines
                this.ctx.strokeStyle = 'rgba(255, 0, 80, 0.4)';
                this.ctx.lineWidth = 1;
                for (let j = 0; j < 3; j++) {
                    const ly = wall.y + Math.random() * wall.h;
                    this.ctx.beginPath();
                    this.ctx.moveTo(wall.x, ly);
                    this.ctx.lineTo(wall.x + wall.w, ly + (Math.random() - 0.5) * 10);
                    this.ctx.stroke();
                }

                // Flickering border
                const flicker = Math.random() > 0.9 ? 0.2 : 0.6;
                this.ctx.strokeStyle = `rgba(255, 0, 80, ${flicker})`;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(wall.x + glitchOffset, wall.y, wall.w, wall.h);

                // Chromatic split effect
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(wall.x - 2, wall.y - 1, wall.w, wall.h);

                // "ERROR" text on some blocks
                if (wall.w > 100 && Math.random() < 0.3) {
                    this.ctx.font = 'bold 10px monospace';
                    this.ctx.fillStyle = 'rgba(255, 50, 80, 0.5)';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('ERR', cx, cy + 4);
                }
            }
            // Default style
            else {
                this.ctx.fillStyle = theme.wallColor;
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                this.ctx.strokeStyle = theme.wallBorderColor;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            }
        }

        // Draw world boundary
        this.ctx.strokeStyle = theme.wallBorderColor;
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

        // Game entities (in world space, with culling)
        this.pickups.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => {
            if (this.camera.isCircleVisible(e.x, e.y, e.radius + 20)) {
                e.draw(this.ctx);
            }
        });
        this.bullets.forEach(b => b.draw(this.ctx));
        this.player.draw(this.ctx, this.frames);

        // Restore context for screen-space rendering
        this.ctx.restore();

        // --- SCREEN SPACE (HUD) ---
        this.drawMinimap();
        drawJoystick(this.ctx, this.inputManager.joystick);
    }

    pauseGame() {
        useGameStore.getState().setPaused(true);
    }

    resumeGame() {
        useGameStore.getState().setPaused(false);
        this.lastTime = performance.now();
    }

    endGame() {
        useGameStore.getState().setGameOver(true);
        soundManager.play('game_over', 'sfx', 1.0);
        soundManager.stopBGM();

        // Award kill points for this session
        const sessionKills = useGameStore.getState().killCount;
        usePowerUpProgressionStore.getState().addKills(sessionKills);
    }

    selectUpgrade(upgradeId: string) {
        const upgrade = UPGRADES_LIST.find(u => u.id === upgradeId);
        if (upgrade) {
            const nextLevel = upgrade.count + 1;
            let isEvo = false;

            if (upgrade.evoName) {
                if (upgrade.id === 'repulsion') {
                    // Repulsion: Evolve ONLY at Level 5
                    isEvo = nextLevel === 5;
                } else {
                    // Others: Evolve at 5, 10, 15, etc.
                    isEvo = nextLevel > 0 && nextLevel % 5 === 0;
                }
            }

            if (isEvo && upgrade.evoApply) {
                upgrade.evoApply(this.player);
                soundManager.play('evolution', 'sfx', 1.0);
            } else {
                upgrade.apply(this.player);
                soundManager.play('upgrade_select', 'sfx', 0.6);
            }
            upgrade.count++;
        }
        useGameStore.getState().setUpgradeMenu(false);
        this.resumeGame();
    }

    destroy() {
        soundManager.stopBGM();
        cancelAnimationFrame(this.animationId);
        this.inputManager.destroy();
    }

    // --- HAZARD PROCESSING ---
    processHazards(delta: number) {
        const hazards = this.currentMap.hazards;
        if (hazards.length === 0) return;

        for (const hazard of hazards) {
            // Check if player is in hazard zone
            const inZone = this.player.x >= hazard.x && this.player.x <= hazard.x + hazard.w &&
                this.player.y >= hazard.y && this.player.y <= hazard.y + hazard.h;

            if (inZone) {
                switch (hazard.type) {
                    case 'damage':
                        // Apply damage over time (per second, scaled by delta/60)
                        const dps = hazard.damagePerSecond ?? 5;
                        const damageThisFrame = (dps / 60) * delta;
                        this.player.takeHazardDamage(damageThisFrame);
                        break;

                    case 'slow':
                        // Apply slow effect (handled in player movement via powerup-like flag)
                        this.player.setSlowMultiplier(hazard.slowMultiplier ?? 0.5);
                        break;

                    case 'teleport':
                        // Teleport to random safe location (grant brief invincibility)
                        this.teleportPlayerRandomly();
                        break;
                }
            }
        }

        // Reset slow if not in any slow zone
        const inAnySlowZone = hazards.some(h =>
            h.type === 'slow' &&
            this.player.x >= h.x && this.player.x <= h.x + h.w &&
            this.player.y >= h.y && this.player.y <= h.y + h.h
        );
        if (!inAnySlowZone) {
            this.player.setSlowMultiplier(1.0);
        }
    }

    teleportPlayerRandomly() {
        // Cooldown check to prevent instant re-teleport
        if (this.player.teleportCooldown > 0) return;

        // Find a random safe spot (not in wall or hazard)
        let attempts = 0;
        let newX = this.player.x;
        let newY = this.player.y;

        while (attempts < 20) {
            newX = 100 + Math.random() * (this.worldWidth - 200);
            newY = 100 + Math.random() * (this.worldHeight - 200);

            // Check not in wall
            const inWall = this.currentMap.walls.some(w =>
                newX >= w.x - 30 && newX <= w.x + w.w + 30 &&
                newY >= w.y - 30 && newY <= w.y + w.h + 30
            );

            // Check not in damage hazard
            const inDamageZone = this.currentMap.hazards.some(h =>
                h.type === 'damage' &&
                newX >= h.x && newX <= h.x + h.w &&
                newY >= h.y && newY <= h.y + h.h
            );

            if (!inWall && !inDamageZone) break;
            attempts++;
        }

        this.player.x = newX;
        this.player.y = newY;
        this.player.teleportCooldown = 120; // 2 second cooldown
        this.player.teleportInvincibility = 60; // 1 second invincibility after teleport

        // Visual/audio feedback
        soundManager.play('powerup', 'sfx', 0.5);

        // Spawn particles
        for (let i = 0; i < 15; i++) {
            const p = this.particlePool.acquire();
            p.reset(newX, newY, '#aa00ff');
            this.particles.push(p);
        }
    }

    // --- MINIMAP ---
    drawMinimap() {
        const mapSize = 140;
        const padding = 15;
        const mapX = this.width - mapSize - padding;
        const mapY = this.height - mapSize - padding - 60; // Bottom-right, above joystick area

        // Calculate scale
        const scaleX = mapSize / this.worldWidth;
        const scaleY = mapSize / this.worldHeight;

        // Background
        this.ctx.fillStyle = 'rgba(10, 20, 30, 0.8)';
        this.ctx.fillRect(mapX - 3, mapY - 3, mapSize + 6, mapSize + 6);

        // Border
        this.ctx.strokeStyle = this.currentMap.theme.wallBorderColor;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(mapX - 3, mapY - 3, mapSize + 6, mapSize + 6);

        // Walls
        this.ctx.fillStyle = this.currentMap.theme.wallColor;
        for (const wall of this.currentMap.walls) {
            this.ctx.fillRect(
                mapX + wall.x * scaleX,
                mapY + wall.y * scaleY,
                Math.max(2, wall.w * scaleX),
                Math.max(2, wall.h * scaleY)
            );
        }

        // Hazards
        for (const hazard of this.currentMap.hazards) {
            this.ctx.fillStyle = hazard.color;
            this.ctx.fillRect(
                mapX + hazard.x * scaleX,
                mapY + hazard.y * scaleY,
                Math.max(2, hazard.w * scaleX),
                Math.max(2, hazard.h * scaleY)
            );
        }

        // Enemies (red dots)
        this.ctx.fillStyle = '#ff3333';
        for (const enemy of this.enemies) {
            this.ctx.beginPath();
            this.ctx.arc(
                mapX + enemy.x * scaleX,
                mapY + enemy.y * scaleY,
                2,
                0, Math.PI * 2
            );
            this.ctx.fill();
        }

        // Player (green dot, larger)
        this.ctx.fillStyle = '#00ff88';
        this.ctx.beginPath();
        this.ctx.arc(
            mapX + this.player.x * scaleX,
            mapY + this.player.y * scaleY,
            4,
            0, Math.PI * 2
        );
        this.ctx.fill();

        // Camera viewport indicator
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(
            mapX + this.camera.x * scaleX,
            mapY + this.camera.y * scaleY,
            this.width * scaleX,
            this.height * scaleY
        );
    }
}
