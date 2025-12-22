import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(t: number): string {
    const m = Math.floor(t / 60).toString().padStart(2, '0');
    const s = Math.floor(t % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function showDamage(x: number, y: number, amount: number, isCrit: boolean = false) {
    if (Math.random() > 0.4 && !isCrit) return; // Always show crits
    const el = document.createElement('div');
    el.className = 'damage-popup';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.textContent = Math.floor(amount).toString();

    if (isCrit) {
        el.style.color = '#ffd700'; // Gold
        el.style.fontSize = '28px';
        el.style.textShadow = '0 0 10px #ff9900';
        el.style.zIndex = '101';
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 800);
}

import { JoystickState } from './game/types';

export function drawJoystick(ctx: CanvasRenderingContext2D, joystick: JoystickState) {
    if (joystick.active) {
        ctx.beginPath();
        ctx.arc(joystick.originX, joystick.originY, 50, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(joystick.originX + joystick.dx * 50, joystick.originY + joystick.dy * 50, 25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 204, 0.4)';
        ctx.fill();
    }
}

export function getDifficulty(t: number): number {
    // 0-5 mins: Linear 1.0 -> 6.0 (approx)
    const linear = 1 + Math.floor(t / 30) * 0.5;

    // 5+ mins: Quadratic Kicker
    // At 10 mins (600s): (300/60)^2 * 0.1 = 25 * 0.1 = +2.5
    // At 20 mins (1200s): (900/60)^2 * 0.1 = 225 * 0.1 = +22.5 (Insane)
    let quadratic = 0;
    if (t > 300) {
        const minutesOver = (t - 300) / 60;
        quadratic = Math.pow(minutesOver, 2) * 0.1;
    }

    return linear + quadratic;
}
