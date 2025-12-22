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
    return 1 + Math.floor(t / 25) * 0.5;
}
