'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { UPGRADES_LIST } from '@/lib/config';
import { Shield, Zap, Skull, Volume2, Music, Speaker } from 'lucide-react';
import { soundManager, AudioCategory } from '@/lib/game/SoundManager';
import { GameIcon } from './GameIcons';

interface DevMenuProps {
    onStart: (config: { level: number; upgrades: Record<string, number>; startTime?: number; difficulty?: 'easy' | 'medium' | 'hard'; powerups?: Record<string, boolean> }) => void;
    onClose: () => void;
    onOpenBalanceTester: () => void;
}

export default function DevMenu({ onStart, onClose, onOpenBalanceTester }: DevMenuProps) {
    const [level, setLevel] = useState(1);
    const [startTime, setStartTime] = useState(0);
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [upgrades, setUpgrades] = useState<Record<string, number>>({});
    const [volumes, setVolumes] = useState<Record<AudioCategory, number>>({
        master: 1, music: 0.6, sfx: 0.8, ui: 1
    });
    const [powerups, setPowerups] = useState<Record<string, boolean>>({
        double_stats: false,
        invulnerability: false,
        magnet: false
    });

    useEffect(() => {
        // Sync initial volumes
        setVolumes({
            master: soundManager.getChannelState('master').volume,
            music: soundManager.getChannelState('music').volume,
            sfx: soundManager.getChannelState('sfx').volume,
            ui: soundManager.getChannelState('ui').volume
        });
    }, []);

    const handleVolumeChange = (cat: AudioCategory, val: number) => {
        const newVol = parseFloat(val.toFixed(2));
        setVolumes(prev => ({ ...prev, [cat]: newVol }));
        soundManager.setVolume(cat, newVol);
    };

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
        const activePowerups = Object.entries(powerups)
            .filter(([_, active]) => active)
            .reduce((acc, [key]) => ({ ...acc, [key]: true }), {} as Record<string, boolean>);

        onStart({
            level,
            upgrades,
            startTime,
            difficulty,
            powerups: Object.keys(activePowerups).length > 0 ? activePowerups : undefined
        });
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

                    {/* Audio Mixer */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Audio Mixer</label>
                        <div className="grid grid-cols-1 gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                            {(['master', 'music', 'sfx'] as AudioCategory[]).map(cat => (
                                <div key={cat} className="flex items-center gap-3">
                                    <div className="w-6 text-white/40">
                                        {cat === 'master' ? <Volume2 size={14} /> : cat === 'music' ? <Music size={14} /> : <Speaker size={14} />}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex justify-between text-[9px] uppercase font-bold text-white/40 mb-1">
                                            <span>{cat}</span>
                                            <span className="text-[#00ffcc]">{Math.round(volumes[cat] * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={volumes[cat]}
                                            onChange={(e) => handleVolumeChange(cat, parseFloat(e.target.value))}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffcc]"
                                        />
                                    </div>
                                </div>
                            ))}
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

                    {/* Active Powerups */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Active Powerups</label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: 'double_stats', label: '3X STATS', color: '#ff0055', icon: 'overclock' },
                                { id: 'invulnerability', label: 'SHIELD', color: '#ffff00', icon: 'privilege_esc' },
                                { id: 'magnet', label: 'MAGNET', color: '#0088ff', icon: 'data_siphon' }
                            ].map(p => {
                                const isActive = powerups[p.id];
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setPowerups(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                        className={`
                                            p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5
                                            ${isActive
                                                ? `border-[${p.color}] bg-white/10`
                                                : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                                            }
                                        `}
                                        style={isActive ? { borderColor: p.color, backgroundColor: `${p.color}20` } : {}}
                                    >
                                        <span className="text-xl"><GameIcon id={p.icon} size={20} /></span>
                                        <span className={`font-bold text-[9px] tracking-wider ${isActive ? 'text-white' : 'text-white/40'}`}>
                                            {p.label}
                                        </span>
                                    </button>
                                );
                            })}
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
                                            <span className="text-xl"><GameIcon id={u.icon} size={20} /></span>
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
                <div className="p-4 md:p-5 border-t border-white/5 bg-white/[0.02] shrink-0 flex gap-3">
                    <button
                        onClick={onOpenBalanceTester}
                        className="flex-1 py-3 md:py-4 rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider
                            bg-white/5 border-2 border-white/10 text-white/60
                            hover:bg-white/10 hover:text-white hover:border-white/20
                            transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <span>⚖️</span> Balance Tester
                    </button>
                    <button
                        onClick={handleStart}
                        className="flex-[2] py-3 md:py-4 rounded-xl font-black text-base md:text-lg uppercase tracking-wider
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
