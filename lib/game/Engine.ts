import { CONFIG, DIFFICULTY_SETTINGS, UPGRADES_LIST, resetUpgrades } from '../config';
import { Player } from './Player';
import { Enemy } from './enemies/Enemy';
import { EnemyManager } from './enemies/EnemyManager';
import { Bullet } from './Bullet';
import { Pickup } from './Pickup';
import { Particle } from './Particle';
import { getDifficulty } from '../utils';
import { useGameStore } from '../../store/useGameStore';
import { usePowerUpProgressionStore } from '../../store/PowerUpProgressionStore';
import { InputManager } from './InputManager';
import { ObjectPool } from './ObjectPool';
import { soundManager } from './SoundManager';
import { Camera } from './Camera';
import { MapConfig, Wall, HazardZone, getWallAtPoint, MAPS_BY_DIFFICULTY } from '../maps';
import { SpatialHash } from './SpatialHash';
import { TimeManager } from './managers/TimeManager';
import { DifficultyManager } from './managers/DifficultyManager';
import { ScoreManager } from './managers/ScoreManager';
import { RenderSystem } from './rendering/RenderSystem';


export class Engine {
    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    width: number = 0;
    height: number = 0;

    player: Player;
    bullets: Bullet[] = [];
    pickups: Pickup[] = [];
    particles: Particle[] = [];

    // Pools
    bulletPool: ObjectPool<Bullet>;
    particlePool: ObjectPool<Particle>;

    enemyManager: EnemyManager;
    timeManager: TimeManager;
    difficultyManager: DifficultyManager;
    scoreManager: ScoreManager;

    inputManager: InputManager;

    animationId: number = 0;

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

        this.timeManager = new TimeManager();
        this.difficultyManager = new DifficultyManager(diffMode);
        this.scoreManager = new ScoreManager();

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

        this.enemyManager = new EnemyManager(this.worldWidth, this.worldHeight, diffMode, this.spatialHash);

        // Handle Enemy Death (Drops, Score, Particles)
        // Handle Enemy Death (Drops, Score, Particles)
        this.enemyManager.onEnemyDeath = (e, player) => {
            const currentKills = this.scoreManager.addKill();
            const multiplier = this.scoreManager.getGemMultiplier(player.level);

            this.pickups.push(new Pickup(e.x, e.y, e.xpValue * multiplier, multiplier));

            // Shield kill effect
            if (e.killedByShield) {
                for (let j = 0; j < 8; j++) {
                    const p = this.particlePool.acquire();
                    p.reset(e.x, e.y, '#ffff00');
                    this.particles.push(p);
                }
            }

            // Explosion with variance
            soundManager.play('explosion', 'sfx', 0.25, false, 0.2);

            if (this.scoreManager.shouldDropPowerup(currentKills)) {
                this.pickups.push(new Pickup(e.x, e.y, 0, 1, 'powerup', this.scoreManager.getPowerupType()));
            }
        };

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
                // Note: TimeManager doesn't support setting time directly yet, might need update if dev config is critical
                // For now, we update the store but TimeManager might desync. 
                // Ideally TimeManager.setTime()
                useGameStore.getState().setTime(devConfig.startTime * 60);
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

        if (this.enemyManager) {
            this.enemyManager.worldWidth = this.worldWidth;
            this.enemyManager.worldHeight = this.worldHeight;
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
        this.timeManager.reset();
        this.loop();
    }

    loop = () => {
        if (!this.timeManager.isPaused() && !this.timeManager.isGameOver()) {
            const now = performance.now();
            const stepMs = TimeManager.FRAME_TIME;

            // Update Time Manager with current time
            this.timeManager.update(now);

            // Fixed Timestep Update
            while (this.timeManager.shouldUpdateFixed()) {
                this.update();
                this.timeManager.consumeFixedStep();
            }

            this.draw();
        }
        this.animationId = requestAnimationFrame(this.loop);
    };

    update() {
        // Delta is always 1.0 in fixed update (matches 60 FPS logic)
        const delta = 1.0;

        // Advance frame count and update game time if needed
        this.timeManager.incrementFrame();

        // Update difficulty based on new time
        this.difficultyManager.update(this.timeManager.gameTime);

        // Enemy Manager Update (Spawning & Logic)
        // Pass stateless data
        this.enemyManager.update(delta, this.player, this.timeManager.gameTime, this.difficultyManager.difficulty, this.currentMap.walls);

        // Populate Spatial Hash for this frame
        this.spatialHash.clear();
        for (const enemy of this.enemyManager.enemies) {
            this.spatialHash.add(enemy);
        }

        const inputState = this.inputManager.getState();
        this.player.update(
            inputState,
            this.enemyManager.enemies,
            (x, y, vx, vy, damage, pierce, size, isCrit) => {
                const b = this.bulletPool.acquire();
                b.reset(x, y, vx, vy, damage, pierce, size, isCrit);
                this.bullets.push(b);
            },
            this.timeManager.frames,
            this.worldWidth,
            this.worldHeight,
            delta,
            this.currentMap.walls
        );

        // Update camera to follow player
        this.camera.follow(this.player.x, this.player.y, this.worldWidth, this.worldHeight);

        // Process hazard zones
        this.processHazards(delta);

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
        RenderSystem.draw({
            ctx: this.ctx,
            width: this.width,
            height: this.height,
            camera: this.camera,
            currentMap: this.currentMap,
            player: this.player,
            enemies: this.enemyManager.enemies,
            bullets: this.bullets,
            pickups: this.pickups,
            particles: this.particles,
            stars: this.stars,
            frames: this.timeManager.frames,
            inputManager: this.inputManager,
            worldWidth: this.worldWidth,
            worldHeight: this.worldHeight
        });
    }

    pauseGame() {
        this.timeManager.pause();
    }

    resumeGame() {
        this.timeManager.resume();
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


}
