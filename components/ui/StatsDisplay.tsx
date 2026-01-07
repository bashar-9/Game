'use client';

import { useGameStore } from '@/store/useGameStore';
import { UPGRADES_LIST } from '@/lib/config';

export function StatsDisplay() {
    const { level, xp, xpToNext, hp, maxHp, killCount, time, damage } = useGameStore();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const acquiredUpgrades = UPGRADES_LIST.filter(u => u.count > 0);

    return (
        <div className="w-full text-sm">
            {/* Core Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                <StatCard label="LVL" value={level.toString()} color="text-[#ffee00]" glow="shadow-[0_0_15px_rgba(255,238,0,0.2)]" />
                <StatCard label="TIME" value={formatTime(time)} color="text-white" />
                <StatCard label="DMG" value={damage.toString()} color="text-[#ff0055]" glow="shadow-[0_0_15px_rgba(255,0,85,0.2)]" />
                <StatCard label="KILLS" value={killCount.toString()} color="text-[#00ffcc]" glow="shadow-[0_0_15px_rgba(0,255,204,0.2)]" />
            </div>

            {/* HP & XP Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {/* HP Bar */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white/50 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <span className="text-red-400">❤</span> Health
                        </span>
                        <span className="text-white font-mono text-sm font-bold">
                            {Math.floor(hp)} / {maxHp}
                        </span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            style={{ width: `${Math.max(0, Math.min(100, (hp / maxHp) * 100))}%` }}
                        />
                    </div>
                </div>

                {/* XP Bar */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white/50 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <span className="text-[#ffee00]">⚡</span> Experience
                        </span>
                        <span className="text-white font-mono text-sm font-bold">
                            {Math.floor(xp)} / {xpToNext}
                        </span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-[#ffee00] to-[#ffd700] rounded-full shadow-[0_0_10px_rgba(255,238,0,0.5)]"
                            style={{ width: `${Math.max(0, Math.min(100, (xp / xpToNext) * 100))}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Acquired Upgrades */}
            {acquiredUpgrades.length > 0 && (
                <div className="border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-white/50 text-xs uppercase tracking-wider font-bold flex items-center gap-2">
                            <span className="text-[#00ffcc]">⚙</span> Active Upgrades
                        </span>
                        <span className="text-[#00ffcc] text-xs font-mono bg-[#00ffcc]/10 px-2 py-0.5 rounded-full">
                            {acquiredUpgrades.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {acquiredUpgrades.map(u => (
                            <UpgradeCard key={u.id} upgrade={u} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color, glow = '' }: { label: string; value: string; color: string; glow?: string }) {
    return (
        <div className={`flex flex-col items-center p-3 md:p-5 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/5 ${glow}`}>
            <span className="text-white/40 text-[9px] md:text-xs uppercase tracking-wider font-medium">{label}</span>
            <span className={`${color} text-lg md:text-3xl font-mono font-bold`}>{value}</span>
        </div>
    );
}

function UpgradeCard({ upgrade: u }: { upgrade: typeof UPGRADES_LIST[0] }) {
    const isMaxed = u.count >= u.maxLevel;
    const progress = (u.count / u.maxLevel) * 100;

    return (
        <div className={`
            relative flex items-center gap-3 p-3 rounded-xl transition-all
            bg-gradient-to-br from-white/[0.06] to-white/[0.02] border
            ${isMaxed
                ? 'border-[#ffd700]/30 shadow-[0_0_15px_rgba(255,215,0,0.1)]'
                : 'border-white/5 hover:border-white/10'
            }
        `}>
            {/* Icon */}
            <span className="text-2xl shrink-0">{u.icon}</span>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold truncate ${isMaxed ? 'text-[#ffd700]' : 'text-white'}`}>
                        {u.name}
                    </span>
                    <span className={`text-[10px] font-mono ${isMaxed ? 'text-[#ffd700]' : 'text-[#00ffcc]'}`}>
                        {u.count}/{u.maxLevel}
                    </span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${isMaxed ? 'bg-[#ffd700]' : 'bg-gradient-to-r from-[#00ffcc]/60 to-[#00ffcc]'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
