import { useGameStore } from '../../../store/useGameStore';

export class TimeManager {
    lastTime: number = 0;
    accumulator: number = 0;
    frames: number = 0;
    gameTime: number = 0; // In seconds

    // Fixed Timestep
    static readonly TARGET_FPS = 60;
    static readonly FRAME_TIME = 1000 / 60; // ~16.67ms

    constructor() {
        this.reset();
    }

    reset() {
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.frames = 0;
        this.gameTime = 0;
        useGameStore.getState().setTime(0);
    }

    update(currentTime: number): number {
        let deltaMs = currentTime - this.lastTime;
        if (deltaMs > 100) deltaMs = 100; // Cap at 100ms

        this.lastTime = currentTime;
        this.accumulator += deltaMs;

        return deltaMs;
    }

    shouldUpdateFixed(): boolean {
        return this.accumulator >= TimeManager.FRAME_TIME;
    }

    consumeFixedStep() {
        this.accumulator -= TimeManager.FRAME_TIME;
    }

    incrementFrame() {
        this.frames++;
        if (this.frames % 60 === 0 && this.frames > 0) {
            this.gameTime++;
            useGameStore.getState().setTime(this.gameTime);
        }
    }

    isPaused(): boolean {
        return useGameStore.getState().isPaused;
    }

    isGameOver(): boolean {
        return useGameStore.getState().isGameOver;
    }

    pause() {
        useGameStore.getState().setPaused(true);
    }

    resume() {
        useGameStore.getState().setPaused(false);
    }

    hasElapsed(seconds: number): boolean {
        return this.gameTime >= seconds;
    }
}
