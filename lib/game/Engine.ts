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

    stars: { x: number, y: number, size: number, alpha: number }[] = [];

    constructor(canvas: HTMLCanvasElement, diffMode: 'easy' | 'medium' | 'hard' = 'easy') {
        // Reset global upgrade state to prevent Sticky/Double-Init issues
        resetUpgrades();

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!; // Alpha false for performance
        this.diffMode = diffMode;

        this.inputManager = new InputManager(canvas);

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

        // Initialize size logic
        this.resize();

        this.player = new Player(this.width, this.height, diffMode, {
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

        if (this.player) {
            this.player.x = Math.min(this.width, Math.max(0, this.player.x));
            this.player.y = Math.min(this.height, Math.max(0, this.player.y));
        }

        // Re-init stars to cover new area properly
        this.stars = [];
        for (let i = 0; i < 150; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
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
            enemy.reset(type, this.width, this.height, this.player.level, this.diffMode, this.difficulty);
            this.enemies.push(enemy);
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
            this.width,
            this.height,
            delta
        );

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player, this.enemies, delta);
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
            b.update(this.enemies, this.particles, delta);
            if (b.life <= 0 || b.x < 0 || b.x > this.width || b.y < 0 || b.y > this.height) {
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
        // Deep Space Background
        this.ctx.fillStyle = '#050510';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Stars
        this.ctx.fillStyle = '#ffffff';
        for (const star of this.stars) {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        }
        this.ctx.globalAlpha = 1.0;

        // Cyber Grid
        this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;

        // Optional: Pulse grid
        // const offset = (this.frames % gridSize); 
        // For now static is fine, maybe slow scroll later if camera moved
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.height); this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.width, y); this.ctx.stroke();
        }

        this.pickups.forEach(p => p.draw(this.ctx));
        this.particles.forEach(p => p.draw(this.ctx));
        this.enemies.forEach(e => e.draw(this.ctx));
        this.bullets.forEach(b => b.draw(this.ctx));
        this.player.draw(this.ctx, this.frames);

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
}
