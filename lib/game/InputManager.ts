import { JoystickState } from './types';

export interface InputState {
    moveX: number;
    moveY: number;
    fire: boolean;
    // For UI or other actions
    pause: boolean;
    select: boolean;
}

export class InputManager {
    keys: Record<string, boolean> = {};
    joystick: JoystickState = {
        active: false, originX: 0, originY: 0, dx: 0, dy: 0, id: null
    };

    constructor(private canvas: HTMLCanvasElement) {
        this.bindEvents();
    }

    private bindEvents() {
        // Use 'code' for physical key location (Standard QWERTY layout assumption for games)
        // KeyW is always the W position, regardless of language
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Touch Events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                // Left side of screen for movement (75% width)
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

    getState(): InputState {
        let mx = 0;
        let my = 0;

        // Physical Keys (Layout Independent)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

        if (this.joystick.active) {
            mx = this.joystick.dx;
            my = this.joystick.dy;
        }

        // Normalize vector
        const mag = Math.sqrt(mx * mx + my * my);
        if (mag > 1) {
            mx /= mag;
            my /= mag;
        }

        return {
            moveX: mx,
            moveY: my,
            fire: true, // Auto-fire 
            pause: this.keys['Escape'] || false,
            select: this.keys['Enter'] || this.keys['Space'] || false
        };
    }

    destroy() {
        // Clean up listeners if necessary (though window listeners are usually global)
        // Ideally we'd remove them but anonymous functions make it hard. 
        // For a SPA, we might want to store the bound functions.
    }
}
