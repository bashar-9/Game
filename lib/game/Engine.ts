import { CONFIG, DIFFICULTY_SETTINGS, UPGRADES_LIST } from '../config';
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
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.diffMode = diffMode;

        this.player = new Player(canvas.width, canvas.height, diffMode, {
            onUpdateStats: (hp, maxHp, xp, xpToNext, level) => {
                useGameStore.getState().setHp(hp, maxHp);
                useGameStore.getState().setXp(xp, xpToNext, level);
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

        this.bindEvents();
        this.resize();

        // Audio Init
        soundManager.preload().then(() => {
            soundManager.playBGM();
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
                if (!this.joystick.active && t.clientX < window.innerWidth / 2) {
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
        if (Math.random() < 0.02 * settings.spawnMult * Math.min(3, this.difficulty)) {
            const types: ('swarm' | 'tank' | 'basic')[] = ['basic'];
            if (this.gameTime > 30) types.push('swarm');
            if (this.gameTime > 60) types.push('tank');
            const type = types[Math.floor(Math.random() * types.length)];
            this.enemies.push(new Enemy(type, this.canvas.width, this.canvas.height, this.player.level, this.diffMode, this.difficulty));
        }

        this.player.update(this.keys, this.joystick, this.enemies, this.bullets, this.frames, this.canvas.width, this.canvas.height);

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player, this.enemies);
            if (e.hp <= 0) {
                this.pickups.push(new Pickup(e.x, e.y, e.xpValue));
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
            if (upgrade.count >= 5 && upgrade.evoApply) {
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
