'use client';

import { useGameStore } from '@/store/useGameStore';
import { UPGRADES_LIST } from '@/lib/config';

export function StatsDisplay() {
    const { level, xp, xpToNext, hp, maxHp, killCount, time } = useGameStore();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const acquiredUpgrades = UPGRADES_LIST.filter(u => u.count > 0);

    return (
        <div className="w-full text-left text-sm mb-6 bg-white/5 p-4 rounded-lg border border-white/5">
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1">
                    <span className="text-white/50 text-xs uppercase tracking-widest">Level</span>
                    <span className="text-white text-xl font-mono">{level}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-white/50 text-xs uppercase tracking-widest">Time</span>
                    <span className="text-white text-xl font-mono">{formatTime(time)}</span>
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-white/50 text-xs uppercase tracking-widest">HP</span>
                        <span className="text-white font-mono text-xs">{Math.floor(hp)} / {maxHp}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }}
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1 col-span-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-white/50 text-xs uppercase tracking-widest">XP</span>
                        <span className="text-white font-mono text-xs">{Math.floor(xp)} / {xpToNext}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                            style={{ width: `${Math.max(0, Math.min(100, (xp / xpToNext) * 100))}%` }}
                        />
                    </div>
                </div>
            </div>

            {acquiredUpgrades.length > 0 && (
                <div className="border-t border-white/10 pt-4 mb-4">
                    <h3 className="text-white/50 text-xs uppercase tracking-widest mb-3">System Upgrades</h3>
                    <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {acquiredUpgrades.map(u => (
                            <div key={u.id} className="flex items-center gap-3 bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-2xl">{u.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-white font-bold text-xs truncate">{u.name}</span>
                                        <span className="text-[#ffee00] font-mono text-xs">Lvl {u.count}</span>
                                    </div>
                                    <p className="text-white/50 text-[10px] truncate">{u.stat}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center">
                    <span className="text-white/50 text-xs uppercase tracking-widest">Enemies Defeated</span>
                    <span className="text-white font-mono">{killCount}</span>
                </div>
            </div>
        </div>
    );
}
