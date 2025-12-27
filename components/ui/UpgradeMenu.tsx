'use client';

import { useState } from 'react';
import { UPGRADES_LIST, Upgrade } from '@/lib/config';

import { IPlayer } from '@/lib/game/types';
import { useGameStore } from '@/store/useGameStore';

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
        // Filter out maxed upgrades AND excluded upgrades
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

    const handleReroll = () => {
        if (useReroll()) {
            const currentIds = options.map(o => o.id);
            setOptions(generateOptions(currentIds));
        }
    };

    // Calculate next cost
    const currentCost = 75 * (paidRerollCount + 1);
    const canAfford = rerolls > 0 || rerollPoints >= currentCost;

    // Helper to determine if the NEXT level is an evolution
    const isEvoReady = (u: Upgrade) => {
        if (!u.evoName) return false;
        const nextLevel = u.count + 1;
        if (u.id === 'repulsion') return nextLevel === 5;
        return nextLevel > 0 && nextLevel % 5 === 0;
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-300 p-4">
            <div className="w-full max-w-5xl flex flex-col max-h-full">
                <div className="shrink-0 mb-4 md:mb-8">
                    <h2 className="text-2xl md:text-5xl font-black text-white text-center tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        SYSTEM UPGRADE
                    </h2>
                    <div className="flex justify-center items-center gap-4 mt-2">
                        <div className="text-white/70 text-sm font-mono bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            POINTS: <span className="text-[#ffee00] font-bold">{rerollPoints}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-y-auto min-h-0 flex-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 pb-4">
                        {options.map((u) => {
                            const evo = isEvoReady(u);
                            return (
                                <div
                                    key={u.id}
                                    className={`
                                        relative overflow-hidden shrink-0 transition-all duration-500 group cursor-pointer 
                                        flex flex-row md:flex-col items-center md:items-center text-left md:text-center gap-4
                                        p-4 md:p-6 w-full
                                        ${evo
                                            ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 border-2 border-[#ffd700] shadow-[0_0_30px_#ffd700] scale-[1.02] md:scale-105'
                                            : 'bg-[#0a0a12] border border-white/10 rounded-lg md:rounded-xl hover:border-[#ffee00] hover:bg-[#ffee00]/5'
                                        }
                                        ${evo ? 'clip-path-polygon-[5%_0%_95%_0%_100%_5%_100%_95%_95%_100%_5%_100%_0%_95%_0%_5%]' : ''}
                                    `}
                                    style={evo ? {
                                        clipPath: 'polygon(5% 0, 100% 0, 100% 90%, 95% 100%, 0 100%, 0 10%)'
                                    } : {}}
                                    onClick={() => onSelect(u.id)}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-r md:bg-gradient-to-b ${evo ? 'from-[#ffd700]/20 via-transparent to-[#ffd700]/10' : 'from-[#ffee00]/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity`} />

                                    {evo && (
                                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                                    )}

                                    {/* SECTION 1: Icon (Left on mobile, Top on desktop) */}
                                    <div className={`text-4xl md:text-7xl group-hover:scale-110 transition-transform duration-300 transform shrink-0 flex justify-center items-center h-full md:h-auto w-16 md:w-auto ${evo ? 'animate-bounce drop-shadow-[0_0_10px_#ffd700]' : ''}`}>
                                        {u.icon}
                                    </div>

                                    {/* SECTION 2: Content (Right on mobile, Bottom on desktop) */}
                                    <div className="flex flex-col gap-1 md:gap-2 flex-1 min-w-0 w-full items-start md:items-center">

                                        {/* Name */}
                                        <h3 className={`text-lg md:text-2xl font-black leading-tight ${evo ? 'text-[#ffd700]' : 'text-white group-hover:text-[#ffee00]'}`}>
                                            {evo ? `★ ${u.evoName} ★` : u.name}
                                        </h3>

                                        {/* Level & Stat */}
                                        <div className="flex flex-row md:flex-col items-center md:items-center gap-2 md:gap-1 w-full flex-wrap">
                                            <div className={`font-bold text-[10px] md:text-sm tracking-widest uppercase px-2 py-0.5 md:px-3 md:py-1 rounded-full whitespace-nowrap ${evo ? 'bg-[#ffd700] text-black shadow-lg' : 'bg-[#ffee00]/10 text-[#ffee00]'}`}>
                                                {evo ? 'EVOLUTION' : `Lvl ${u.count} → ${u.count + 1}`}
                                            </div>
                                            {!evo ? (
                                                <div className="text-[#00ffcc] font-bold text-[10px] md:text-sm tracking-widest uppercase bg-[#00ffcc]/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full whitespace-nowrap">
                                                    {u.stat}
                                                </div>
                                            ) : null}
                                            {evo && (
                                                <div className="text-[#00ffcc] font-bold text-[10px] md:text-sm tracking-widest uppercase bg-[#00ffcc]/10 px-2 py-0.5 md:px-3 md:py-1 rounded-full whitespace-nowrap">
                                                    {u.stat}
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p className={`text-xs md:text-sm leading-tight md:leading-relaxed ${evo ? 'text-[#ffd700]/90 font-medium' : 'text-gray-400 '} md:mt-2 md:min-h-[3em] line-clamp-2 md:line-clamp-none`}>
                                            {evo ? u.evoDesc : u.desc}
                                        </p>

                                        {/* Mobile-Only Evolution Hint (Inline) or Desktop Divider + Hint */}
                                        <div className="md:w-full md:h-px md:bg-white/10 md:my-2 hidden md:block" />

                                        {u.evoName && !evo && (
                                            <div className="flex flex-col items-start md:items-center gap-1 mt-1 md:mt-0">
                                                <p className="text-[9px] md:text-xs text-[#ffee00]/70 font-bold uppercase tracking-widest">
                                                    Next Evo: Lvl {u.id === 'repulsion' ? 5 : (Math.floor((u.count) / 5) + 1) * 5}
                                                </p>
                                            </div>
                                        )}
                                        {evo && (
                                            <div className="flex flex-col items-center gap-1 hidden md:flex">
                                                <p className="text-xs md:text-sm text-[#ffd700] font-bold animate-pulse tracking-widest uppercase">
                                                    Overriding System...
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* REROLL SECTION */}
                        <div className="shrink-0 pt-4 flex justify-center border-t border-white/10 mt-4">
                            <button
                                onClick={handleReroll}
                                disabled={!canAfford}
                                className={`
                            group flex flex-col items-center justify-center gap-1
                            px-8 py-3 rounded-full border-2 transition-all duration-300
                            ${canAfford
                                        ? 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-[#ffee00] hover:scale-105 cursor-pointer'
                                        : 'bg-black/40 border-white/5 opacity-50 cursor-not-allowed'
                                    }
                        `}
                            >
                                <span className="text-lg font-black uppercase tracking-widest text-white group-hover:text-[#ffee00]">
                                    REROLL SYSTEM
                                </span>
                                <div className="text-xs font-mono flex items-center gap-2">
                                    {rerolls > 0 ? (
                                        <span className="text-[#00ffcc]">FREE REROLLS: {rerolls}</span>
                                    ) : (
                                        <span className={rerollPoints >= currentCost ? 'text-[#ffee00]' : 'text-red-500'}>
                                            COST: {currentCost} PTS
                                        </span>
                                    )}
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
