import { CONFIG, DIFFICULTY_SETTINGS, UPGRADES_LIST, resetUpgrades } from '../config';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { Bullet } from './Bullet';
import { Pickup } from './Pickup';
import { Particle } from './Particle';
import { drawJoystick, getDifficulty } from '../utils';
import { useGameStore } from '../../store/useGameStore';
import { JoystickState } from './types';
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

    keys: Record<string, boolean> = {};
    joystick: JoystickState = {
        active: false, originX: 0, originY: 0, dx: 0, dy: 0, id: null
    };

    animationId: number = 0;
    lastTime: number = 0;
    gameTime: number = 0;
    gameTimeAccumulator: number = 0;
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
        this.ctx = canvas.getContext('2d')!;
        this.diffMode = diffMode;

        // Initialize size logic
        this.resize();

        this.player = new Player(this.width, this.height, diffMode, {
            onUpdateStats: (hp, maxHp, xp, xpToNext, level, damage) => {
                const store = useGameStore.getState();
                store.setHp(hp, maxHp);
                store.setXp(xp, xpToNext, level);
                store.setDamage(damage);
                store.setDamage(damage);
            },
            onUpdateActivePowerups: (active) => {
                useGameStore.getState().setActivePowerups(active);
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
                for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color));
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
                    this.player.xpToNext = Math.floor(this.player.xpToNext * 1.15);
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
        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('resize', () => this.resize());

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                // Increased activation zone to 75% to account for broad thumbs/small screens
                // and ignore inputs clearly meant for the right side (action buttons if any, or just empty)
                if (!this.joystick.active && t.clientX < window.innerWidth * 0.75) {
                    this.joystick.active = true;
                    this.joystick.id = t.identifier;
                    this.joystick.originX = t.clientX;
                    this.joystick.originY = t.clientY;
                    this.joystick.dx = 0;
                    this.joystick.dy = 0;
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (this.joystick.active && t.identifier === this.joystick.id) {
                    const maxDist = 50;
                    const diffX = t.clientX - this.joystick.originX;
                    const diffY = t.clientY - this.joystick.originY;
                    const dist = Math.sqrt(diffX * diffX + diffY * diffY);

                    if (dist > maxDist) {
                        this.joystick.dx = (diffX / dist);
                        this.joystick.dy = (diffY / dist);
                    } else {
                        this.joystick.dx = diffX / maxDist;
                        this.joystick.dy = diffY / maxDist;
                    }
                }
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.joystick.id) {
                    this.joystick.active = false;
                    this.joystick.id = null;
                    this.joystick.dx = 0;
                    this.joystick.dy = 0;
                }
            }
        });
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
            this.update();
            this.draw();
        }
        this.animationId = requestAnimationFrame(this.loop);
    };

    update() {
        const now = performance.now();
        const deltaMs = now - this.lastTime;
        this.lastTime = now;

        // Delta multiplier: 1.0 at 60 FPS, 0.5 at 120 FPS, 2.0 at 30 FPS
        // Clamp to prevent physics issues on very slow frames
        const delta = Math.min(deltaMs / Engine.FRAME_TIME, 3.0);

        // Time tracking using accumulator for frame-rate independence
        this.gameTimeAccumulator += deltaMs;
        if (this.gameTimeAccumulator >= 1000) {
            this.gameTime++;
            this.gameTimeAccumulator -= 1000;
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
            this.enemies.push(new Enemy(type, this.width, this.height, this.player.level, this.diffMode, this.difficulty));
        }

        this.player.update(this.keys, this.joystick, this.enemies, this.bullets, this.frames, this.width, this.height, delta);

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

                // Shield kill effect - yellow sparks burst
                if (e.killedByShield) {
                    for (let j = 0; j < 8; j++) {
                        this.particles.push(new Particle(e.x, e.y, '#ffff00'));
                    }
                }

                // Explosion with variance
                soundManager.play('explosion', 'sfx', 0.25, false, 0.2);

                const currentKills = useGameStore.getState().killCount + 1;
                useGameStore.getState().setKillCount(currentKills);
                useGameStore.getState().addRerollPoints(1);

                // POWERUP DROP LOGIC
                // Formula: BaseRate * (DecayFactor / (DecayFactor + Kills))
                // Rate = 0.5% * (500 / (500 + Kills))
                const baseRate = 0.005;
                const decayFactor = 500;
                const dropRate = baseRate * (decayFactor / (decayFactor + currentKills));

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
            if (p.life <= 0) this.particles.splice(i, 1);
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

        drawJoystick(this.ctx, this.joystick);
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
        useGameStore.getState().setGameOver(true);
        soundManager.play('game_over', 'sfx', 1.0);
        soundManager.stopBGM();
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
    }
}
