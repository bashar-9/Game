'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { UPGRADES_LIST } from '@/lib/config';
import { Shield, Zap, Skull } from 'lucide-react';

interface DevMenuProps {
    onStart: (config: { level: number; upgrades: Record<string, number>; startTime?: number; difficulty?: 'easy' | 'medium' | 'hard' }) => void;
    onClose: () => void;
}

export default function DevMenu({ onStart, onClose }: DevMenuProps) {
    const [level, setLevel] = useState(1);
    const [startTime, setStartTime] = useState(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [upgrades, setUpgrades] = useState<Record<string, number>>({});

    const difficulties = [
        { id: 'easy', label: 'EASY', color: 'text-[#00ffcc]', borderColor: 'border-[#00ffcc]', icon: Shield },
        { id: 'medium', label: 'MED', color: 'text-[#ffee00]', borderColor: 'border-[#ffee00]', icon: Zap },
        { id: 'hard', label: 'HARD', color: 'text-[#ff0055]', borderColor: 'border-[#ff0055]', icon: Skull },
    ];

    // Long press handling
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startLongPress = useCallback((action: () => void) => {
        action(); // Immediate action
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(action, 80);
        }, 400);
    }, []);

    const stopLongPress = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
    }, []);

    useEffect(() => {
        return () => stopLongPress();
    }, [stopLongPress]);

    const handleUpgradeChange = (id: string, delta: number) => {
        const upgrade = UPGRADES_LIST.find(u => u.id === id);
        if (!upgrade) return;

        setUpgrades(prev => {
            const current = prev[id] || 0;
            const next = Math.max(0, Math.min(upgrade.maxLevel, current + delta));
            if (next === 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: next };
        });
    };

    const handleStart = () => {
        onStart({ level, upgrades, startTime, difficulty });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-black/95 via-slate-900/95 to-black/95 backdrop-blur-xl p-4 animate-in fade-in zoom-in duration-200">
            {/* Ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00ffcc]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-[#ffee00]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-[#00ffcc]/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#ffee00]/10 blur-3xl" />

                {/* Header */}
                <div className="p-5 md:p-6 border-b border-white/5 flex justify-between items-center shrink-0 bg-white/[0.02]">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] via-white to-[#00ffcc] tracking-tighter">
                            DEV // OVERRIDE
                        </h2>
                        <p className="text-[10px] md:text-xs text-white/40 font-mono mt-1 tracking-wider">CONFIGURE INITIAL STATE</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Difficulty Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Difficulty</label>
                        <div className="grid grid-cols-3 gap-2">
                            {difficulties.map((mode) => {
                                const Icon = mode.icon;
                                const isSelected = difficulty === mode.id;
                                return (
                                    <button
                                        key={mode.id}
                                        onClick={() => setDifficulty(mode.id as 'easy' | 'medium' | 'hard')}
                                        className={`
                                            p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5
                                            ${isSelected
                                                ? `${mode.borderColor} bg-white/10`
                                                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 ${isSelected ? mode.color : 'text-white/40'}`} />
                                        <span className={`font-bold text-[10px] tracking-wider ${isSelected ? 'text-white' : 'text-white/40'}`}>
                                            {mode.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Level & Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Level Config */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Starting Level</label>
                            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                <button
                                    onMouseDown={() => startLongPress(() => setLevel(l => Math.max(1, l - 1)))}
                                    onMouseUp={stopLongPress}
                                    onMouseLeave={stopLongPress}
                                    onTouchStart={() => startLongPress(() => setLevel(l => Math.max(1, l - 1)))}
                                    onTouchEnd={stopLongPress}
                                    className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 hover:border-[#00ffcc]/50 hover:bg-[#00ffcc]/10 text-white font-mono text-lg transition-all"
                                >
                                    -
                                </button>
                                <span className="text-2xl font-black text-[#00ffcc] flex-1 text-center font-mono">{level}</span>
                                <button
                                    onMouseDown={() => startLongPress(() => setLevel(l => Math.min(100, l + 1)))}
                                    onMouseUp={stopLongPress}
                                    onMouseLeave={stopLongPress}
                                    onTouchStart={() => startLongPress(() => setLevel(l => Math.min(100, l + 1)))}
                                    onTouchEnd={stopLongPress}
                                    className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 hover:border-[#00ffcc]/50 hover:bg-[#00ffcc]/10 text-white font-mono text-lg transition-all"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Start Time Config */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Start Time (Min)</label>
                            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                                <button
                                    onMouseDown={() => startLongPress(() => setStartTime(t => Math.max(0, t - 1)))}
                                    onMouseUp={stopLongPress}
                                    onMouseLeave={stopLongPress}
                                    onTouchStart={() => startLongPress(() => setStartTime(t => Math.max(0, t - 1)))}
                                    onTouchEnd={stopLongPress}
                                    className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 hover:border-[#ffee00]/50 hover:bg-[#ffee00]/10 text-white font-mono text-lg transition-all"
                                >
                                    -
                                </button>
                                <span className="text-2xl font-black text-[#ffee00] flex-1 text-center font-mono">{startTime}</span>
                                <button
                                    onMouseDown={() => startLongPress(() => setStartTime(t => t + 1))}
                                    onMouseUp={stopLongPress}
                                    onMouseLeave={stopLongPress}
                                    onTouchStart={() => startLongPress(() => setStartTime(t => t + 1))}
                                    onTouchEnd={stopLongPress}
                                    className="w-9 h-9 flex items-center justify-center bg-white/5 rounded-lg border border-white/10 hover:border-[#ffee00]/50 hover:bg-[#ffee00]/10 text-white font-mono text-lg transition-all"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Upgrades Config */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Initial Upgrades</label>
                            <span className="text-[10px] text-white/30 font-mono">Hold +/- for quick adjust</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {UPGRADES_LIST.map(u => {
                                const count = upgrades[u.id] || 0;
                                const isMaxed = count >= u.maxLevel;
                                const hasUpgrade = count > 0;

                                return (
                                    <div
                                        key={u.id}
                                        className={`
                                            flex items-center justify-between p-3 rounded-xl border transition-all
                                            ${hasUpgrade
                                                ? 'bg-[#00ffcc]/10 border-[#00ffcc]/30'
                                                : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                                            }
                                            ${isMaxed ? 'bg-[#ffd700]/10 border-[#ffd700]/30' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{u.icon}</span>
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-xs ${isMaxed ? 'text-[#ffd700]' : hasUpgrade ? 'text-[#00ffcc]' : 'text-white/60'}`}>
                                                    {u.name}
                                                </span>
                                                <span className="text-[9px] text-white/30">{u.stat} • Max: {u.maxLevel}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onMouseDown={() => startLongPress(() => handleUpgradeChange(u.id, -1))}
                                                onMouseUp={stopLongPress}
                                                onMouseLeave={stopLongPress}
                                                onTouchStart={() => startLongPress(() => handleUpgradeChange(u.id, -1))}
                                                onTouchEnd={stopLongPress}
                                                disabled={count === 0}
                                                className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all
                                                    ${count > 0
                                                        ? 'bg-white/10 hover:bg-[#ff0055]/20 hover:text-[#ff0055] text-white/70'
                                                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                                                    }
                                                `}
                                            >
                                                -
                                            </button>
                                            <span className={`font-mono font-bold w-8 text-center text-sm ${isMaxed ? 'text-[#ffd700]' : hasUpgrade ? 'text-[#00ffcc]' : 'text-white/50'}`}>
                                                {count}
                                            </span>
                                            <button
                                                onMouseDown={() => startLongPress(() => handleUpgradeChange(u.id, 1))}
                                                onMouseUp={stopLongPress}
                                                onMouseLeave={stopLongPress}
                                                onTouchStart={() => startLongPress(() => handleUpgradeChange(u.id, 1))}
                                                onTouchEnd={stopLongPress}
                                                disabled={isMaxed}
                                                className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all
                                                    ${isMaxed
                                                        ? 'bg-white/5 text-white/20 cursor-not-allowed'
                                                        : 'bg-white/10 hover:bg-[#00ffcc]/20 hover:text-[#00ffcc] text-white/70'
                                                    }
                                                `}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.02] shrink-0">
                    <button
                        onClick={handleStart}
                        className="w-full py-3 md:py-4 rounded-xl font-black text-base md:text-lg uppercase tracking-wider
                            bg-gradient-to-r from-[#00ffcc] to-[#00ddaa] border-2 border-[#00ffcc]/50 text-black
                            hover:shadow-[0_0_40px_rgba(0,255,204,0.4)] hover:border-[#00ffcc]
                            transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <span>▶</span> Initialize Simulation
                    </button>
                </div>
            </div>
        </div>
    );
}
