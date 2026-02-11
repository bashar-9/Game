'use client';

import { useState } from 'react';
import { UPGRADES_LIST, Upgrade } from '@/lib/config';
import { GameIcon } from './GameIcons';

import { IPlayer } from '@/lib/game/types';
import { useGameStore } from '@/store/useGameStore';
import { soundManager } from '@/lib/game/SoundManager';

interface UpgradeMenuProps {
    onSelect: (id: string) => void;
    player?: IPlayer;
}

export default function UpgradeMenu({ onSelect, player }: UpgradeMenuProps) {
    const rerolls = useGameStore(s => s.rerolls);
    const rerollPoints = useGameStore(s => s.rerollPoints);
    const paidRerollCount = useGameStore(s => s.paidRerollCount);
    const useReroll = useGameStore(s => s.useReroll);

    const generateOptions = (excludeIds: string[] = []) => {
        const available = UPGRADES_LIST.filter(u => {
            if (excludeIds.includes(u.id)) return false;
            if (u.isMaxed && player) {
                return !u.isMaxed(player);
            }
            return true;
        });

        const shuffled = [...available].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    };

    const [options, setOptions] = useState<Upgrade[]>(() => generateOptions([]));
    const [rerollKey, setRerollKey] = useState(0);

    const handleReroll = () => {
        if (useReroll()) {
            const currentIds = options.map(o => o.id);
            setOptions(generateOptions(currentIds));
            setRerollKey(k => k + 1);
            soundManager.play('upgrade_reroll', 'sfx', 0.8);
        }
    };

    const currentCost = 75 * (paidRerollCount + 1);
    const canAfford = rerolls > 0 || rerollPoints >= currentCost;

    const isEvoReady = (u: Upgrade) => {
        if (!u.evoName) return false;
        const nextLevel = u.count + 1;
        if (u.id === 'repulsion') return nextLevel === 5;
        return nextLevel > 0 && nextLevel % 5 === 0;
    };

    const getEvoProgress = (u: Upgrade) => {
        if (!u.evoName) return { current: 0, next: 0, percent: 0 };
        const nextEvo = u.id === 'repulsion' ? 5 : (Math.floor(u.count / 5) + 1) * 5;
        const prevEvo = u.id === 'repulsion' ? 0 : Math.floor(u.count / 5) * 5;
        const progress = u.count - prevEvo;
        const needed = nextEvo - prevEvo;
        return {
            current: u.count,
            next: nextEvo,
            percent: Math.min(100, (progress / needed) * 100)
        };
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black/90 via-slate-900/90 to-black/90 backdrop-blur-xl z-50 animate-in fade-in duration-300 p-4">
            {/* Ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00ffcc]/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffee00]/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-5xl flex flex-col max-h-full relative z-10">
                {/* Header */}
                <div className="shrink-0 mb-4 md:mb-8 text-center">
                    <h2 className="text-2xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] via-white to-[#00ffcc] tracking-tighter">
                        PATCH_DETECTED!
                    </h2>
                    <p className="text-white/40 text-xs md:text-sm mt-1 tracking-widest uppercase">INJECT_CODE_MODULE</p>
                    <div className="flex justify-center items-center gap-4 mt-3">
                        <div className="text-white/70 text-sm font-mono bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10 shadow-lg">
                            <span className="text-white/50">⚡</span> POINTS: <span className="text-[#ffee00] font-bold">{rerollPoints}</span>
                        </div>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                    {options.map((u, index) => {
                        const evo = isEvoReady(u);
                        const evoProgress = getEvoProgress(u);

                        return (
                            <div
                                key={`${u.id}-${rerollKey}`}
                                className={`
                                    relative overflow-hidden transition-all duration-300 group cursor-pointer 
                                    flex flex-row md:flex-col items-center md:items-center text-left md:text-center gap-4
                                    p-4 md:p-6 w-full
                                    ${evo
                                        ? 'bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border-2 border-[#ffd700] shadow-[0_0_40px_rgba(255,215,0,0.3)] rounded-2xl'
                                        : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 rounded-xl md:rounded-2xl hover:border-[#00ffcc]/50 hover:shadow-[0_0_30px_rgba(0,255,204,0.15)]'
                                    }
                                    backdrop-blur-md
                                `}
                                style={{
                                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                                }}
                                onClick={() => onSelect(u.id)}
                            >
                                {/* Shine effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                                {/* Corner accent */}
                                <div className={`absolute top-0 right-0 w-16 h-16 ${evo ? 'bg-[#ffd700]/20' : 'bg-[#00ffcc]/10'} blur-2xl`} />

                                {/* Icon */}
                                <div className={`
                                    text-4xl md:text-6xl group-hover:scale-110 transition-transform duration-300 shrink-0 
                                    flex justify-center items-center h-full md:h-auto w-16 md:w-auto
                                    ${evo ? 'drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]' : 'drop-shadow-[0_0_10px_rgba(0,255,204,0.3)]'}
                                `}>
                                    <GameIcon id={u.icon} size={undefined} className="w-full h-full" />
                                </div>

                                {/* Content */}
                                <div className="flex flex-col gap-1.5 md:gap-2 flex-1 min-w-0 w-full items-start md:items-center">
                                    {/* Name */}
                                    <h3 className={`
                                        text-lg md:text-xl font-bold leading-tight
                                        ${evo ? 'text-[#ffd700]' : 'text-white group-hover:text-[#00ffcc]'}
                                        transition-colors
                                    `}>
                                        {evo ? `✦ ${u.evoName}` : u.name}
                                    </h3>

                                    {/* Level & Stat Badges */}
                                    <div className="flex flex-row md:flex-col items-center md:items-center gap-2 md:gap-1.5 w-full flex-wrap">
                                        <div className={`
                                            font-bold text-[10px] md:text-xs tracking-wider uppercase 
                                            px-2.5 py-1 rounded-lg
                                            ${evo
                                                ? 'bg-[#ffd700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                                                : 'bg-white/10 text-white/70 border border-white/10'
                                            }
                                        `}>
                                            {evo ? '★ EVOLUTION ★' : `Lvl ${u.count} → ${u.count + 1} / ${u.maxLevel}`}
                                        </div>
                                        <div className={`
                                            text-[10px] md:text-xs font-bold tracking-wider uppercase 
                                            px-2.5 py-1 rounded-lg
                                            ${evo
                                                ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/30'
                                                : 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20'
                                            }
                                        `}>
                                            {u.stat}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className={`
                                        text-xs md:text-sm leading-relaxed
                                        ${evo ? 'text-[#ffd700]/80' : 'text-white/50'}
                                        md:mt-1 line-clamp-2 md:line-clamp-none
                                    `}>
                                        {evo ? u.evoDesc : u.desc}
                                    </p>

                                    {/* Evolution Progress */}
                                    {u.evoName && !evo && (
                                        <div className="flex flex-col items-start md:items-center gap-1.5 mt-2 md:mt-3 w-full md:border-t md:border-white/5 md:pt-3">
                                            <div className="flex items-center justify-between w-full">
                                                <p className="text-[9px] md:text-[10px] text-white/40 font-medium uppercase tracking-wider">
                                                    Evolution Progress
                                                </p>
                                                <p className="text-[9px] md:text-[10px] text-[#ffee00] font-bold">
                                                    Lv.{evoProgress.next}
                                                </p>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#ffee00] to-[#ffd700] rounded-full shadow-[0_0_10px_rgba(255,238,0,0.5)]"
                                                    style={{ width: `${evoProgress.percent}%` }}
                                                />
                                            </div>
                                            <p className="text-[8px] md:text-[9px] text-[#ffee00]/60 font-medium">
                                                ✦ {u.evoName}
                                            </p>
                                        </div>
                                    )}
                                    {evo && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="w-2 h-2 bg-[#ffd700] rounded-full animate-pulse" />
                                            <p className="text-xs text-[#ffd700] font-bold tracking-wider uppercase">
                                                Ready to Override
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Reroll Button */}
                <div className="shrink-0 pt-4 flex justify-center mt-4">
                    <button
                        onClick={handleReroll}
                        disabled={!canAfford}
                        className={`
                            group flex items-center gap-3
                            px-5 py-2.5 rounded-xl border-2 transition-all duration-300
                            ${canAfford
                                ? 'bg-gradient-to-r from-white/5 to-white/10 border-[#00ffcc]/30 hover:border-[#00ffcc] hover:shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:scale-105'
                                : 'bg-black/40 border-white/10 opacity-40 cursor-not-allowed'
                            }
                        `}
                    >
                        <span className="text-2xl group-hover:rotate-180 transition-transform duration-500"><GameIcon id="sector_rebuild" size={24} /></span>
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-bold uppercase tracking-wider text-white group-hover:text-[#00ffcc] transition-colors">
                                Reroll
                            </span>
                            <span className={`text-xs font-mono ${rerolls > 0 ? 'text-[#00ffcc]' : rerollPoints >= currentCost ? 'text-[#ffee00]' : 'text-red-400'}`}>
                                {rerolls > 0 ? `${rerolls} free` : `${currentCost} pts`}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
