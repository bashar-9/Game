'use client';

import { useGameStore } from '@/store/useGameStore';
import { POWERUP_INFO, POWERUP_DURATIONS } from '@/lib/config';
import { useEffect, useState } from 'react';

// Circular progress ring component
function CircularProgress({
    progress,
    size,
    strokeWidth,
    color
}: {
    progress: number;
    size: number;
    strokeWidth: number;
    color: string;
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress * circumference);

    return (
        <svg width={size} height={size} className="absolute inset-0">
            {/* Background ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={strokeWidth}
            />
            {/* Progress ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{
                    filter: `drop-shadow(0 0 6px ${color})`,
                    transition: 'stroke-dashoffset 0.1s linear'
                }}
            />
        </svg>
    );
}

// Single powerup slot component
function PowerupSlot({
    type,
    duration,
    isActive,
    isMobile
}: {
    type: string;
    duration: number;
    maxDuration: number;
    isActive: boolean;
    isMobile: boolean;
}) {
    const info = POWERUP_INFO[type as keyof typeof POWERUP_INFO];
    if (!info) return null;

    // Use dynamic maxDuration if available, otherwise fallback to config default
    const progress = isActive ? Math.min(1, Math.max(0, duration / maxDuration)) : 0;
    const secondsLeft = Math.ceil(duration / 60);

    // Blinking when low
    const isLow = isActive && duration < 180; // < 3 seconds
    const [blink, setBlink] = useState(false);

    useEffect(() => {
        if (!isLow) {
            setBlink(false);
            return;
        }
        const interval = setInterval(() => setBlink(b => !b), 200);
        return () => clearInterval(interval);
    }, [isLow]);

    const opacity = isLow && blink ? 0.4 : 1;

    // Desktop: Full chip with name
    // Mobile: Compact icon only
    const size = isMobile ? 44 : 56;
    const ringStroke = isMobile ? 3 : 4;

    return (
        <div
            className={`
                relative flex items-center gap-2 
                ${isMobile ? 'p-1' : 'p-2 pr-4'}
                rounded-xl backdrop-blur-md transition-all duration-200
                ${isActive
                    ? 'bg-black/60 border border-white/20'
                    : 'bg-black/30 border border-white/5 opacity-40'
                }
            `}
            style={{
                opacity,
                boxShadow: isActive ? `0 0 20px ${info.color}40` : 'none'
            }}
        >
            {/* Icon with circular progress */}
            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                <CircularProgress
                    progress={progress}
                    size={size}
                    strokeWidth={ringStroke}
                    color={isActive ? info.color : '#444'}
                />
                <span
                    className="text-2xl z-10"
                    style={{
                        filter: isActive ? `drop-shadow(0 0 8px ${info.color})` : 'none',
                        fontSize: isMobile ? '1.25rem' : '1.5rem'
                    }}
                >
                    {info.emoji}
                </span>
            </div>

            {/* Desktop: Show name and timer */}
            {!isMobile && (
                <div className="flex flex-col min-w-[80px]">
                    <span
                        className="text-xs font-bold tracking-wide"
                        style={{ color: isActive ? info.color : '#666' }}
                    >
                        {info.name}
                    </span>
                    <span className="text-[10px] text-white/60">
                        {isActive ? `${secondsLeft}s` : 'Ready'}
                    </span>
                </div>
            )}

            {/* Mobile: Show timer badge when active */}
            {isMobile && isActive && (
                <div
                    className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                        backgroundColor: info.color,
                        color: '#000'
                    }}
                >
                    {secondsLeft}
                </div>
            )}
        </div>
    );
}

export default function PowerupsHUD() {
    const activePowerups = useGameStore(state => state.activePowerups || {});
    const activeMaxDurations = useGameStore(state => state.activePowerupMaxDurations || {});
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const powerupTypes = ['double_stats', 'invulnerability', 'magnet'] as const;

    return (
        <div
            className={`
                fixed z-20 pointer-events-none
                ${isMobile
                    ? 'right-2 top-1/2 -translate-y-1/2'
                    : 'right-4 top-1/2 -translate-y-1/2'
                }
            `}
        >
            <div className={`flex flex-col ${isMobile ? 'gap-2' : 'gap-3'}`}>
                {powerupTypes.map(type => {
                    const duration = activePowerups[type] || 0;

                    // Only show active powerups
                    if (duration <= 0) return null;

                    return (
                        <PowerupSlot
                            key={type}
                            type={type}
                            duration={duration}
                            maxDuration={activeMaxDurations[type] || POWERUP_DURATIONS[type] || 900}
                            isActive={true}
                            isMobile={isMobile}
                        />
                    );
                })}
            </div>
        </div>
    );
}
