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
    // VISUAL CLUTTER REDUCTION
    const existing = document.getElementsByClassName('damage-popup');
    const count = existing.length;

    // 1. Hard Global Cap: Absolute max 25 numbers on screen
    if (count >= 25) return;

    // 2. Non-Crit Throttling:
    // If > 10 items, stop showing non-crits
    if (!isCrit) {
        if (count > 10) return;
        // Even if low count, only show 10% of non-crits to keep it clean
        if (Math.random() > 0.1) return;
    }

    // 3. Crit Throttling:
    // If > 15 items, randomly skip 50% of crits to prevent "Wall of Gold"
    if (isCrit && count > 15) {
        if (Math.random() > 0.5) return;
    }

    const el = document.createElement('div');
    el.className = 'damage-popup';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.textContent = Math.floor(amount).toString();

    if (isCrit) {
        el.style.color = '#ffd700'; // Gold
        el.style.fontSize = '24px'; // Reduced from 28px
        el.style.fontWeight = 'bold';
        el.style.textShadow = '0 0 5px #ff9900'; // Reduced bloom
        el.style.zIndex = '101';
    } else {
        // Standard hit styling for visibility if needed
        el.style.fontSize = '14px';
        el.style.opacity = '0.8';
    }

    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600); // Faster fade (was 800)
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

    // 5+ mins: Quadratic Kicker (Aggressive Ramp)
    // At 10 mins (5 over): 5^2.2 * 1.5 ~= 34 * 1.5 = +51
    let quadratic = 0;
    if (t > 300) {
        const minutesOver = (t - 300) / 60;
        quadratic = Math.pow(minutesOver, 2.2) * 1.5;
    }

    return linear + quadratic;
}
