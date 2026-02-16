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
import { MAPS_BY_DIFFICULTY, MapConfig, Wall, HazardZone, resolveWallCollisions, pointInWalls, getWallAtPoint } from '../maps';
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
        // 0-3 mins: Ramp from 40% to 100% capacity
        const earlyGameRamp = Math.min(1.0, 0.40 + (this.gameTime / 180) * 0.60);

        // Density scaling (bounded)
        const densityCap = Math.max(1, this.difficulty);

        // Hard enemy cap — Time-based (120 + 0.8 * seconds) -> ~600 at 10 mins
        // NO HARD CAP (User Request)
        const maxEnemies = 120 + (this.gameTime * 0.8);

        // Spawn rate cap at 0.55/frame (~33 enemies/sec max) — chaotic but bounded
        const spawnChance = Math.min(0.55, 0.02 * settings.spawnMult * densityCap * earlyGameRamp);

        if (this.enemies.length < maxEnemies && Math.random() < spawnChance) {
            const types: ('swarm' | 'tank' | 'basic')[] = ['basic'];
            // Allow Swarms (Yellow) basically from the start to provide "fodder"
            if (this.gameTime > 5) types.push('swarm');
            if (this.gameTime > 120) types.push('tank');
            const type = types[Math.floor(Math.random() * types.length)];
            const enemy = this.enemyPool.acquire();
            // Spawn at WORLD edge, not screen edge
            enemy.reset(type, this.worldWidth, this.worldHeight, this.player.level, this.diffMode, this.difficulty);

            // Smart spawn: avoid spawning into existing clusters
            let retries = 0;
            while (retries < 3) {
                const nearbyCount = this.spatialHash.query(enemy.x, enemy.y, 100).size;
                if (nearbyCount < 3) break;
                enemy.reset(type, this.worldWidth, this.worldHeight, this.player.level, this.diffMode, this.difficulty);
                retries++;
            }

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
            b.update(this.spatialHash, this.particles, delta);
            // Check world bounds OR wall collision
            // Check for wall collision using getWallAtPoint to handle destructibles
            const hitWall = getWallAtPoint(b.x, b.y, this.currentMap.walls);

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
        const width = this.width;
        const height = this.height;

        // Clear with map background color
        this.ctx.fillStyle = theme.backgroundColor;
        this.ctx.fillRect(0, 0, width, height);

        // Save context for world-space rendering
        this.ctx.save();

        // Apply camera transform (translate world relative to camera)
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // --- WORLD SPACE RENDERING ---

        // 1. Stars / Background Particles
        this.ctx.fillStyle = '#ffffff';
        for (const star of this.stars) {
            if (this.camera.isVisible(star.x, star.y, star.size, star.size)) {
                this.ctx.globalAlpha = star.alpha;
                this.ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        }
        this.ctx.globalAlpha = 1.0;

        // 2. Grid & Floor Patterns
        const gridSize = 100; // Larger grid for better performance
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = Math.min(this.worldWidth, this.camera.x + width + gridSize);
        const endY = Math.min(this.worldHeight, this.camera.y + height + gridSize);

        this.ctx.lineWidth = 1;

        if (theme.isIndustrial) {
            // Industrial: Concrete tiles with caution stripes
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); this.ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); this.ctx.stroke();
            }
        } else if (theme.isDatacenter) {
            // Datacenter: Glowing hexagonal or square grid
            this.ctx.strokeStyle = theme.gridColor;
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = theme.gridColor;
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); this.ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); this.ctx.stroke();
            }
            this.ctx.shadowBlur = 0;
        } else {
            // Default / Void: Clean solid grid
            this.ctx.strokeStyle = theme.gridColor;
            for (let x = startX; x <= endX; x += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(x, startY); this.ctx.lineTo(x, endY); this.ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridSize) {
                this.ctx.beginPath(); this.ctx.moveTo(startX, y); this.ctx.lineTo(endX, y); this.ctx.stroke();
            }
        }

        // 3. Decorations (Floor Decals, Cables)
        if (this.currentMap.decorations) {
            for (const dec of this.currentMap.decorations) {
                if (!this.camera.isVisible(dec.x, dec.y, dec.w, dec.h)) continue;

                this.ctx.save();
                this.ctx.translate(dec.x + dec.w / 2, dec.y + dec.h / 2);
                if (dec.rotation) this.ctx.rotate(dec.rotation);
                this.ctx.translate(-dec.w / 2, -dec.h / 2);

                this.ctx.fillStyle = dec.color;
                this.ctx.globalAlpha = dec.opacity ?? 0.8;

                if (dec.type === 'cable') {
                    this.ctx.fillRect(0, 0, dec.w, dec.h);
                } else if (dec.type === 'floor_decal') {
                    this.ctx.fillRect(0, 0, dec.w, dec.h);
                    // Hazard stripes
                    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
                    for (let i = 0; i < dec.w; i += 20) this.ctx.fillRect(i, 0, 10, dec.h);
                } else if (dec.type === 'symbol') {
                    this.ctx.font = `${dec.w}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('⚠', dec.w / 2, dec.h / 2);
                } else if (dec.type === 'crack') {
                    this.ctx.strokeStyle = dec.color;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(dec.w, dec.h);
                    this.ctx.moveTo(dec.w, 0);
                    this.ctx.lineTo(0, dec.h);
                    this.ctx.stroke();
                }

                this.ctx.restore();
            }
            this.ctx.globalAlpha = 1.0;
        }

        // 4. Hazards
        for (const hazard of this.currentMap.hazards) {
            if (this.camera.isVisible(hazard.x, hazard.y, hazard.w, hazard.h)) {
                const pulse = 0.5 + 0.3 * Math.sin(this.frames * (hazard.pulseSpeed || 3) * 0.05);
                this.ctx.fillStyle = hazard.color;
                this.ctx.globalAlpha = pulse;
                this.ctx.fillRect(hazard.x, hazard.y, hazard.w, hazard.h);

                // Border
                this.ctx.strokeStyle = hazard.color;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(hazard.x, hazard.y, hazard.w, hazard.h);
                this.ctx.globalAlpha = 1.0;

                // Label
                if (hazard.type === 'damage') {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = '12px monospace';
                    this.ctx.fillText('! DANGER !', hazard.x + hazard.w / 2, hazard.y + hazard.h / 2);
                }
            }
        }

        // 5. Walls -> Use specific renderers
        for (const wall of this.currentMap.walls) {
            if (!this.camera.isVisible(wall.x, wall.y, wall.w, wall.h)) continue;

            // Draw wall shadow
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(wall.x + 10, wall.y + 10, wall.w, wall.h);

            const wallColor = wall.color || theme.wallColor;

            if (wall.type === 'crate') {
                // Industrial Crate
                this.ctx.fillStyle = '#3a3a4a'; // Dark container
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                // X-Brace
                this.ctx.strokeStyle = '#2a2a35';
                this.ctx.lineWidth = 6;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
                this.ctx.beginPath();
                this.ctx.moveTo(wall.x, wall.y); this.ctx.lineTo(wall.x + wall.w, wall.y + wall.h);
                this.ctx.moveTo(wall.x + wall.w, wall.y); this.ctx.lineTo(wall.x, wall.y + wall.h);
                this.ctx.stroke();

                // Border Highlight
                this.ctx.strokeStyle = '#555';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);



            } else if (wall.type === 'server') {
                // Database Server Rack
                this.ctx.fillStyle = '#0a0a10';
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

                // Blinking Lights
                for (let ly = wall.y + 5; ly < wall.y + wall.h; ly += 15) {
                    if (Math.random() > 0.3) {
                        this.ctx.fillStyle = Math.random() > 0.5 ? '#00ffcc' : '#ff0055';
                        this.ctx.fillRect(wall.x + 5, ly, 4, 4);
                        this.ctx.fillRect(wall.x + 15, ly, 4, 4);
                    }
                }

                // Glass Door reflection
                this.ctx.fillStyle = 'rgba(100, 200, 255, 0.1)';
                this.ctx.fillRect(wall.x + 2, wall.y + 2, wall.w - 4, wall.h - 4);

                this.ctx.strokeStyle = '#00ccff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

            } else if (wall.type === 'glass') {
                // Glass Barrier
                this.ctx.fillStyle = 'rgba(200, 255, 255, 0.15)';
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

            } else {
                // Default Wall
                this.ctx.fillStyle = wallColor;
                this.ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
                this.ctx.strokeStyle = theme.wallBorderColor;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
            }
        }

        // 6. Projectiles
        for (const b of this.bullets) {
            b.draw(this.ctx);
        }

        // 7. Pickups
        for (const p of this.pickups) {
            p.draw(this.ctx);
        }

        // 8. Enemies
        for (const e of this.enemies) {
            e.draw(this.ctx);
        }

        // 9. Player
        this.player.draw(this.ctx, this.frames);

        // 10. Particles
        for (const p of this.particles) {
            p.draw(this.ctx);
        }

        this.ctx.restore();

        // --- UI / Overlay ---
        if (theme.isDatacenter) {
            // CRT Scanline effect for Datacenter
            this.ctx.fillStyle = 'rgba(0, 255, 255, 0.02)';
            for (let y = 0; y < height; y += 4) {
                this.ctx.fillRect(0, y, width, 1);
            }
        }

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
