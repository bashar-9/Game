'use client';

import { useGameStore } from '@/store/useGameStore';
import { formatTime } from '@/lib/utils';
import { Heart, Skull } from 'lucide-react';

export default function HUD() {
    const { hp, maxHp, level, xp, xpToNext, time, killCount } = useGameStore();

    const hpPercent = (hp / maxHp) * 100;
    const xpPercent = (xp / xpToNext) * 100;

    return (
        <div className="fixed inset-0 pointer-events-none">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start text-white bg-gradient-to-b from-black/80 to-transparent">

                {/* HP Bar */}
                <div className="flex flex-col gap-1 w-48 md:w-64">
                    <div className="flex items-center gap-2 text-[#00ffcc] font-bold">
                        <Heart className="w-5 h-5 fill-current" />
                        <span>{Math.ceil(hp)} / {maxHp}</span>
                    </div>
                    <div className="h-4 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative">
                        <div
                            className="h-full bg-[#00ffcc] transition-all duration-300"
                            style={{ width: `${hpPercent}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full opacity-30" />
                    </div>
                </div>

                {/* Timer */}
                <div className="text-3xl font-mono font-bold text-white drop-shadow-lg tabular-nums">
                    {formatTime(time)}
                </div>

                {/* Kills */}
                <div className="flex items-center gap-2 text-[#ff0055] font-bold text-xl">
                    <Skull className="w-6 h-6" />
                    <span>{killCount}</span>
                </div>
            </div>

            {/* Bottom Bar (XP) */}
            <div className="absolute bottom-0 left-0 w-full p-0">
                <div className="w-full h-2 bg-gray-900 border-t border-gray-700">
                    <div
                        className="h-full bg-[#ffee00] shadow-[0_0_10px_#ffee00] transition-all duration-300"
                        style={{ width: `${xpPercent}%` }}
                    />
                </div>
                <div className="absolute bottom-4 left-4 text-[#ffee00] font-bold flex items-center gap-2 text-xl drop-shadow-md">
                    <div className="w-8 h-8 rounded-full bg-[#ffee00] text-black flex items-center justify-center font-bold">
                        {level}
                    </div>
                    <span>LEVEL</span>
                </div>
            </div>
        </div>
    );
}
