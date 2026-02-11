'use client';

import React from 'react';

interface IconProps {
    size?: number | string;
    color?: string;
    className?: string;
    style?: React.CSSProperties;
}

// ─── UPGRADE ICONS ───────────────────────────────────────────────

/** multishot / FORK_PROCESS — branching circuit traces, cyan/teal neon */
function ForkProcess({ size = 24, className, style }: IconProps) {
    const id = 'fp' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00ffcc" />
                    <stop offset="1" stopColor="#0088ff" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <path d="M16 28V18" stroke={`url(#${id}g)`} strokeWidth="2.5" strokeLinecap="round" />
                <path d="M16 18L7 6" stroke={`url(#${id}g)`} strokeWidth="2" strokeLinecap="round" />
                <path d="M16 18L25 6" stroke={`url(#${id}g)`} strokeWidth="2" strokeLinecap="round" />
                <path d="M16 18L10 13" stroke="#00ffcc" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                <path d="M16 18L22 13" stroke="#00ffcc" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
                <circle cx="7" cy="5" r="2.5" fill="#00ffcc" />
                <circle cx="25" cy="5" r="2.5" fill="#0088ff" />
                <circle cx="16" cy="28" r="2.5" fill="#00ffcc" />
                <circle cx="16" cy="18" r="2" fill="#00eebb" opacity="0.8" />
            </g>
        </svg>
    );
}

/** haste / I/O_ACCELERATOR — spinning speed ring with inner bolt, yellow/orange */
function IoAccelerator({ size = 24, className, style }: IconProps) {
    const id = 'io' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffee00" />
                    <stop offset="1" stopColor="#ff8800" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <path d="M16 3A13 13 0 0 1 29 16" stroke="#ffee00" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M29 16A13 13 0 0 1 16 29" stroke="#ffaa00" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M16 29A13 13 0 0 1 3 16" stroke="#ff8800" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <path d="M3 16A13 13 0 0 1 16 3" stroke="#ffee00" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
                <path d="M17 8L13 17H18L15 25" stroke={`url(#${id}g)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 8L13 17H18L15 25" fill="#ffee00" fillOpacity="0.15" />
            </g>
        </svg>
    );
}

/** damage / VOLTAGE_SPIKE — electric arc burst, red/magenta */
function VoltageSpike({ size = 24, className, style }: IconProps) {
    const id = 'vs' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <radialGradient id={`${id}g`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#ff4488" />
                    <stop offset="100%" stopColor="#ff0055" />
                </radialGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <circle cx="16" cy="16" r="5" fill="#ff0055" opacity="0.3" />
                <circle cx="16" cy="16" r="2.5" fill="#ff4488" />
                {/* Electric arcs radiating outward */}
                <path d="M16 11L14 7L17 9L16 4" stroke="#ff4488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 16L25 14L23 17L28 16" stroke="#ff0055" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 21L18 25L15 23L16 28" stroke="#ff4488" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 16L7 18L9 15L4 16" stroke="#ff0055" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M20 12L23 8" stroke="#ff6699" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                <path d="M12 20L9 24" stroke="#ff6699" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            </g>
        </svg>
    );
}

/** speed / BUS_VELOCITY — data chevrons streaming, cyan with motion blur */
function BusVelocity({ size = 24, className, style }: IconProps) {
    const id = 'bv' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="0" y1="16" x2="32" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00ffcc" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#00ffcc" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <path d="M20 8L28 16L20 24" stroke="#00ffcc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 10L18 16L12 22" stroke="#00ffcc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                <path d="M5 12L9 16L5 20" stroke="#00ffcc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                {/* Speed lines */}
                <line x1="2" y1="16" x2="8" y2="16" stroke={`url(#${id}g)`} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="4" y1="10" x2="10" y2="10" stroke="#00ffcc" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                <line x1="4" y1="22" x2="10" y2="22" stroke="#00ffcc" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
            </g>
        </svg>
    );
}

/** pierce / POINTER_PIERCERS — laser beam piercing through barriers, green/lime */
function PointerPiercers({ size = 24, className, style }: IconProps) {
    const id = 'pp' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="2" y1="16" x2="30" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#88ff00" />
                    <stop offset="1" stopColor="#00ff88" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Barriers being pierced */}
                <rect x="10" y="7" width="2" height="18" rx="1" fill="#88ff00" opacity="0.2" />
                <rect x="20" y="7" width="2" height="18" rx="1" fill="#00ff88" opacity="0.2" />
                {/* Main laser beam */}
                <line x1="3" y1="16" x2="29" y2="16" stroke={`url(#${id}g)`} strokeWidth="3" strokeLinecap="round" />
                <line x1="3" y1="16" x2="29" y2="16" stroke="#ccff88" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
                {/* Impact sparks at barriers */}
                <path d="M11 12L13 10" stroke="#88ff00" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                <path d="M11 20L13 22" stroke="#88ff00" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                <path d="M21 12L23 10" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                <path d="M21 20L23 22" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                {/* Arrow tip */}
                <path d="M26 12L30 16L26 20" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#00ff88" fillOpacity="0.2" />
            </g>
        </svg>
    );
}

/** maxhp / ENCAP_SHIELDING — hex shield with energy field, blue/purple */
function EncapShielding({ size = 24, className, style }: IconProps) {
    const id = 'es' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="16" y1="1" x2="16" y2="31" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#4488ff" />
                    <stop offset="1" stopColor="#8844ff" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Hexagonal shield shape */}
                <path d="M16 2L27 8V20L16 30L5 20V8L16 2Z" fill={`url(#${id}g)`} fillOpacity="0.2" stroke={`url(#${id}g)`} strokeWidth="2" />
                {/* Inner hex */}
                <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" fill="#4488ff" fillOpacity="0.15" stroke="#4488ff" strokeWidth="1.2" opacity="0.6" />
                {/* Plus/cross */}
                <path d="M16 12V20M12 16H20" stroke="#88bbff" strokeWidth="2.5" strokeLinecap="round" />
            </g>
        </svg>
    );
}

/** regen / SECTOR_REBUILD — rotating repair helix, green/teal */
function SectorRebuild({ size = 24, className, style }: IconProps) {
    const id = 'sr' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00ff88" />
                    <stop offset="1" stopColor="#00ccaa" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Circular sweep */}
                <path d="M16 4A12 12 0 1 1 4 16" stroke={`url(#${id}g)`} strokeWidth="2" strokeLinecap="round" />
                <path d="M4 16A12 12 0 0 1 16 4" stroke="#00ff88" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 4" opacity="0.4" />
                {/* Arrow on arc */}
                <path d="M16 4L19 2L18 6" fill="#00ff88" stroke="#00ff88" strokeWidth="1" strokeLinejoin="round" />
                {/* Center heal cross */}
                <path d="M16 11V21M11 16H21" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="16" cy="16" r="2" fill="#00ffaa" opacity="0.4" />
            </g>
        </svg>
    );
}

/** size / BUFFER_EXPANSION — expanding concentric hexagons, purple/magenta */
function BufferExpansion({ size = 24, className, style }: IconProps) {
    const id = 'be' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <radialGradient id={`${id}g`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#cc44ff" />
                    <stop offset="100%" stopColor="#8800ff" />
                </radialGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <circle cx="16" cy="16" r="4" fill={`url(#${id}g)`} />
                <circle cx="16" cy="16" r="8" stroke="#cc44ff" strokeWidth="1.5" opacity="0.6" />
                <circle cx="16" cy="16" r="12" stroke="#aa22ff" strokeWidth="1.2" opacity="0.35" />
                {/* Expansion arrows */}
                <path d="M16 4V1" stroke="#cc44ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M16 31V28" stroke="#cc44ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M4 16H1" stroke="#cc44ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M31 16H28" stroke="#cc44ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M7 7L5 5" stroke="#aa22ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <path d="M25 25L27 27" stroke="#aa22ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <path d="M25 7L27 5" stroke="#aa22ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
                <path d="M7 25L5 27" stroke="#aa22ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            </g>
        </svg>
    );
}

/** repulsion / RADIUS_REJECTION — shockwave pulse ring, orange/amber */
function RadiusRejection({ size = 24, className, style }: IconProps) {
    const id = 'rr' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <radialGradient id={`${id}g`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#ff8800" />
                    <stop offset="100%" stopColor="#ff4400" />
                </radialGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <circle cx="16" cy="16" r="3" fill={`url(#${id}g)`} />
                <circle cx="16" cy="16" r="7" stroke="#ff8800" strokeWidth="2" opacity="0.7" />
                <circle cx="16" cy="16" r="11" stroke="#ff6600" strokeWidth="1.5" opacity="0.4" />
                <circle cx="16" cy="16" r="14.5" stroke="#ff4400" strokeWidth="1" opacity="0.2" />
                {/* Push arrows */}
                <path d="M16 5L14 7H18L16 5Z" fill="#ff8800" opacity="0.8" />
                <path d="M16 27L14 25H18L16 27Z" fill="#ff8800" opacity="0.8" />
                <path d="M5 16L7 14V18L5 16Z" fill="#ff8800" opacity="0.8" />
                <path d="M27 16L25 14V18L27 16Z" fill="#ff8800" opacity="0.8" />
            </g>
        </svg>
    );
}

/** critChance / HEURISTIC_LOGIC — precision targeting reticle, red/crimson */
function HeuristicLogic({ size = 24, className, style }: IconProps) {
    const id = 'hl' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <radialGradient id={`${id}g`} cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#ff4444" />
                    <stop offset="100%" stopColor="#cc0022" />
                </radialGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <circle cx="16" cy="16" r="10" stroke="#ff2222" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="5.5" stroke="#ff4444" strokeWidth="1.2" />
                <circle cx="16" cy="16" r="2" fill={`url(#${id}g)`} />
                {/* Crosshair lines */}
                <line x1="16" y1="2" x2="16" y2="9" stroke="#ff2222" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="16" y1="23" x2="16" y2="30" stroke="#ff2222" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="2" y1="16" x2="9" y2="16" stroke="#ff2222" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="23" y1="16" x2="30" y2="16" stroke="#ff2222" strokeWidth="1.8" strokeLinecap="round" />
                {/* Corner ticks */}
                <path d="M8 8L10 10" stroke="#ff6666" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                <path d="M24 8L22 10" stroke="#ff6666" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                <path d="M8 24L10 22" stroke="#ff6666" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                <path d="M24 24L22 22" stroke="#ff6666" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </g>
        </svg>
    );
}

/** critDamage / BITWISE_BURST — overcharged cell exploding, magenta/pink */
function BitwiseBurst({ size = 24, className, style }: IconProps) {
    const id = 'bb' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff44aa" />
                    <stop offset="1" stopColor="#ff0088" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Battery body */}
                <rect x="6" y="8" width="18" height="16" rx="2.5" fill={`url(#${id}g)`} fillOpacity="0.2" stroke={`url(#${id}g)`} strokeWidth="1.8" />
                <rect x="24" y="13" width="3" height="6" rx="1" fill="#ff44aa" />
                {/* Lightning inside */}
                <path d="M16 10L12 17H17L14 24" stroke="#ff88cc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 10L12 17H17L14 24" stroke="#ffaadd" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                {/* Overcharge sparks */}
                <path d="M8 8L6 5" stroke="#ff44aa" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                <path d="M22 8L24 5" stroke="#ff44aa" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
                <path d="M8 24L6 27" stroke="#ff0088" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            </g>
        </svg>
    );
}


// ─── POWERUP ICONS ───────────────────────────────────────────────

/** double_stats / OVERCLOCK — CPU chip radiating heat, orange/red */
function Overclock({ size = 24, className, style }: IconProps) {
    const id = 'oc' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff9500" />
                    <stop offset="1" stopColor="#ff3300" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Chip body */}
                <rect x="9" y="9" width="14" height="14" rx="2" fill={`url(#${id}g)`} fillOpacity="0.25" stroke={`url(#${id}g)`} strokeWidth="1.8" />
                {/* Inner die */}
                <rect x="12" y="12" width="8" height="8" rx="1" fill="#ff6600" opacity="0.5" />
                {/* Pins */}
                <path d="M12 9V5M16 9V5M20 9V5" stroke="#ff9500" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 23V27M16 23V27M20 23V27" stroke="#ff6600" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M9 12H5M9 16H5M9 20H5" stroke="#ff9500" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M23 12H27M23 16H27M23 20H27" stroke="#ff6600" strokeWidth="1.8" strokeLinecap="round" />
                {/* Heat waves */}
                <path d="M14 6C14.5 4 15.5 3.5 16 2" stroke="#ff4400" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                <path d="M18 6C18.5 4 17.5 3 18 1" stroke="#ff4400" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
            </g>
        </svg>
    );
}

/** invulnerability / PRIVILEGE_ESC — broken lock, gold/yellow */
function PrivilegeEsc({ size = 24, className, style }: IconProps) {
    const id = 'pe' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="8" y1="4" x2="24" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffee00" />
                    <stop offset="1" stopColor="#ffaa00" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Lock body */}
                <rect x="8" y="15" width="16" height="13" rx="2.5" fill={`url(#${id}g)`} fillOpacity="0.25" stroke={`url(#${id}g)`} strokeWidth="1.8" />
                {/* Shackle (broken/open) */}
                <path d="M12 15V10C12 7 14 5 16 5C18 5 20 7 20 10" stroke="#ffee00" strokeWidth="2" strokeLinecap="round" />
                <path d="M20 10L22 7" stroke="#ffee00" strokeWidth="2" strokeLinecap="round" />
                {/* Keyhole */}
                <circle cx="16" cy="21" r="2" fill="#ffcc00" />
                <rect x="15" y="22" width="2" height="3" rx="0.5" fill="#ffcc00" />
                {/* Crack/break sparks */}
                <path d="M22 9L25 7" stroke="#ffee00" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                <path d="M23 11L26 10" stroke="#ffaa00" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </g>
        </svg>
    );
}

/** magnet / DATA_SIPHON — magnetic field with data particles, cyan/blue */
function DataSiphon({ size = 24, className, style }: IconProps) {
    const id = 'ds' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="4" y1="16" x2="28" y2="16" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00ddff" />
                    <stop offset="1" stopColor="#0066ff" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Magnet U shape */}
                <path d="M8 6V18A8 8 0 0 0 24 18V6" stroke={`url(#${id}g)`} strokeWidth="2.5" strokeLinecap="round" />
                {/* Pole caps */}
                <rect x="5" y="4" width="6" height="4" rx="1" fill="#00ddff" opacity="0.5" />
                <rect x="21" y="4" width="6" height="4" rx="1" fill="#0066ff" opacity="0.5" />
                {/* Field lines */}
                <path d="M12 14A4 4 0 0 0 20 14" stroke="#44eeff" strokeWidth="1" opacity="0.4" fill="none" />
                <path d="M10 11A6 6 0 0 0 22 11" stroke="#44eeff" strokeWidth="0.8" opacity="0.25" fill="none" />
                {/* Data particles being siphoned */}
                <circle cx="16" cy="26" r="1.5" fill="#00ddff" opacity="0.8" />
                <circle cx="12" cy="28" r="1" fill="#00bbff" opacity="0.5" />
                <circle cx="20" cy="28" r="1" fill="#00bbff" opacity="0.5" />
                <path d="M16 24V20" stroke="#00ddff" strokeWidth="1" strokeLinecap="round" strokeDasharray="1.5 2" opacity="0.6" />
            </g>
        </svg>
    );
}

/** drop_rate / RNG_EXPLOIT — glitching die with code, magenta/purple */
function RngExploit({ size = 24, className, style }: IconProps) {
    const id = 'rng' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff55ff" />
                    <stop offset="1" stopColor="#aa00ff" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Die body */}
                <rect x="5" y="5" width="22" height="22" rx="4" fill={`url(#${id}g)`} fillOpacity="0.2" stroke={`url(#${id}g)`} strokeWidth="1.8" />
                {/* Pips */}
                <circle cx="11" cy="11" r="2" fill="#ff55ff" />
                <circle cx="21" cy="11" r="2" fill="#ff55ff" />
                <circle cx="16" cy="16" r="2" fill="#cc44ff" />
                <circle cx="11" cy="21" r="2" fill="#aa00ff" />
                <circle cx="21" cy="21" r="2" fill="#aa00ff" />
                {/* Glitch offset lines */}
                <rect x="3" y="14" width="8" height="2" fill="#ff55ff" opacity="0.3" />
                <rect x="22" y="18" width="7" height="1.5" fill="#aa00ff" opacity="0.25" />
            </g>
        </svg>
    );
}


// ─── STAT ICONS ──────────────────────────────────────────────────

/** Timer icon — neon clock */
function TimerIcon({ size = 24, className, style }: IconProps) {
    const id = 'ti' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00ffcc" />
                    <stop offset="1" stopColor="#00aaff" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <circle cx="16" cy="17" r="11" stroke={`url(#${id}g)`} strokeWidth="2" />
                <path d="M16 10V17L21 20" stroke="#00ffcc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="13" y1="4" x2="19" y2="4" stroke="#00aaff" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="4" x2="16" y2="6" stroke="#00aaff" strokeWidth="1.5" strokeLinecap="round" />
            </g>
        </svg>
    );
}

/** Skull icon — cyber skull */
function SkullIcon({ size = 24, className, style }: IconProps) {
    const id = 'sk' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ff4466" />
                    <stop offset="1" stopColor="#cc0033" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                <path d="M16 3C9 3 5 7.5 5 13C5 17 7 19.5 9 21V26H12L13 23H19L20 26H23V21C25 19.5 27 17 27 13C27 7.5 23 3 16 3Z" fill={`url(#${id}g)`} fillOpacity="0.2" stroke={`url(#${id}g)`} strokeWidth="1.8" strokeLinejoin="round" />
                {/* Eyes */}
                <ellipse cx="11.5" cy="13" rx="2.5" ry="3" fill="#ff4466" opacity="0.7" />
                <ellipse cx="20.5" cy="13" rx="2.5" ry="3" fill="#ff4466" opacity="0.7" />
                {/* Teeth */}
                <line x1="13" y1="26" x2="13" y2="23" stroke="#cc0033" strokeWidth="1" opacity="0.5" />
                <line x1="16" y1="26" x2="16" y2="23" stroke="#cc0033" strokeWidth="1" opacity="0.5" />
                <line x1="19" y1="26" x2="19" y2="23" stroke="#cc0033" strokeWidth="1" opacity="0.5" />
            </g>
        </svg>
    );
}

/** Fire icon — neon flame */
function FireIcon({ size = 24, className, style }: IconProps) {
    const id = 'fi' + React.useId().replace(/:/g, '');
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style}>
            <defs>
                <linearGradient id={`${id}g`} x1="16" y1="2" x2="16" y2="30" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffee00" />
                    <stop offset="0.5" stopColor="#ff6600" />
                    <stop offset="1" stopColor="#ff0044" />
                </linearGradient>
                <filter id={`${id}gl`}><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <g filter={`url(#${id}gl)`}>
                {/* Outer flame */}
                <path d="M16 2C16 2 10 9 10 16C10 20 12 23 14 25C12 22 13 18 16 16C19 18 20 22 18 25C20 23 22 20 22 16C22 9 16 2 16 2Z" fill={`url(#${id}g)`} fillOpacity="0.3" stroke={`url(#${id}g)`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Inner flame */}
                <path d="M16 12C14.5 15 14 17 15 19C15.5 18 16 17 16.5 17C17 17 17.5 18 17 19C18 17 17.5 15 16 12Z" fill="#ffee00" opacity="0.6" />
                {/* Embers */}
                <circle cx="12" cy="27" r="1" fill="#ff4400" opacity="0.5" />
                <circle cx="20" cy="28" r="0.8" fill="#ff6600" opacity="0.4" />
                <circle cx="16" cy="29" r="1.2" fill="#ff2200" opacity="0.5" />
            </g>
        </svg>
    );
}


// ─── ICON MAP ────────────────────────────────────────────────────

const ICON_COMPONENTS: Record<string, React.FC<IconProps>> = {
    // Upgrade icons
    fork_process: ForkProcess,
    io_accelerator: IoAccelerator,
    voltage_spike: VoltageSpike,
    bus_velocity: BusVelocity,
    pointer_piercers: PointerPiercers,
    encap_shielding: EncapShielding,
    sector_rebuild: SectorRebuild,
    buffer_expansion: BufferExpansion,
    radius_rejection: RadiusRejection,
    heuristic_logic: HeuristicLogic,
    bitwise_burst: BitwiseBurst,
    // Powerup icons
    overclock: Overclock,
    privilege_esc: PrivilegeEsc,
    data_siphon: DataSiphon,
    rng_exploit: RngExploit,
    // Stat icons
    timer: TimerIcon,
    skull: SkullIcon,
    fire: FireIcon,
};

/**
 * Render a game icon by ID.
 * Falls back to the ID as text if not found.
 */
export function GameIcon({
    id,
    size = 24,
    className,
    style
}: Omit<IconProps, 'color'> & { id: string }) {
    const Component = ICON_COMPONENTS[id];
    if (Component) {
        return <Component size={size} className={className} style={style} />;
    }
    return <span className={className} style={style}>{id}</span>;
}

export {
    ForkProcess,
    IoAccelerator,
    VoltageSpike,
    BusVelocity,
    PointerPiercers,
    EncapShielding,
    SectorRebuild,
    BufferExpansion,
    RadiusRejection,
    HeuristicLogic,
    BitwiseBurst,
    Overclock,
    PrivilegeEsc,
    DataSiphon,
    RngExploit,
    TimerIcon,
    SkullIcon,
    FireIcon,
};
