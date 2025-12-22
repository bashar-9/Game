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
    frames: number = 0;

    difficulty: number = 1;
    diffMode: 'easy' | 'normal' | 'hard' = 'normal';

    constructor(canvas: HTMLCanvasElement, diffMode: 'easy' | 'normal' | 'hard' = 'normal') {
        // Reset global upgrade state to prevent Sticky/Double-Init issues
        resetUpgrades();

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.diffMode = diffMode;

        this.player = new Player(canvas.width, canvas.height, diffMode, {
            onUpdateStats: (hp, maxHp, xp, xpToNext, level, damage) => {
                const store = useGameStore.getState();
                store.setHp(hp, maxHp);
                store.setXp(xp, xpToNext, level);
                store.setDamage(damage);
            },
            onLevelUp: () => {
                this.pauseGame();
                useGameStore.getState().setUpgradeMenu(true);
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
        }

        this.bindEvents();
        this.resize();

        // Audio Init
        soundManager.preload();

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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.player) {
            this.player.x = Math.min(this.canvas.width, Math.max(0, this.player.x));
            this.player.y = Math.min(this.canvas.height, Math.max(0, this.player.y));
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
        // const dt = (now - this.lastTime) / 1000; // Unused
        this.lastTime = now;

        if (this.frames % 60 === 0) {
            this.gameTime++;
            useGameStore.getState().setTime(this.gameTime);
            this.difficulty = getDifficulty(this.gameTime);
        }
        this.frames++;

        const settings = DIFFICULTY_SETTINGS[this.diffMode];

        // Spawn Logic with Early Game Dampener & Late Game Ramp
        // 0-2 mins: Ramp from 25% to 100% capacity to prevent early overwhelmed state.
        const earlyGameRamp = Math.min(1.0, 0.25 + (this.gameTime / 120) * 0.75);

        // Late Game: Cap density at 15x (was 8x) for massive hordes later
        const densityCap = Math.min(15, this.difficulty);

        if (Math.random() < 0.02 * settings.spawnMult * densityCap * earlyGameRamp) {
            const types: ('swarm' | 'tank' | 'basic')[] = ['basic'];
            if (this.gameTime > 30) types.push('swarm');
            if (this.gameTime > 120) types.push('tank');
            const type = types[Math.floor(Math.random() * types.length)];
            this.enemies.push(new Enemy(type, this.canvas.width, this.canvas.height, this.player.level, this.diffMode, this.difficulty));
        }

        this.player.update(this.keys, this.joystick, this.enemies, this.bullets, this.frames, this.canvas.width, this.canvas.height);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player, this.enemies);
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
                soundManager.play('explosion', 0.2);

                const currentKills = useGameStore.getState().killCount + 1;
                useGameStore.getState().setKillCount(currentKills);
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(this.enemies, this.particles);
            if (b.life <= 0 || b.x < 0 || b.x > this.canvas.width || b.y < 0 || b.y > this.canvas.height) {
                this.bullets.splice(i, 1);
            }
        }

        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            p.update(this.player);
            if (p.dead) this.pickups.splice(i, 1);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update();
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        this.ctx.fillStyle = CONFIG.COLORS.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        this.ctx.lineWidth = 1;
        const gridSize = 50;

        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke();
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
        soundManager.play('game_over', 0.3);
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
            } else {
                upgrade.apply(this.player);
            }
            upgrade.count++;
        }
        useGameStore.getState().setUpgradeMenu(false);
        this.resumeGame();
    }

    destroy() {
        cancelAnimationFrame(this.animationId);
    }
}
