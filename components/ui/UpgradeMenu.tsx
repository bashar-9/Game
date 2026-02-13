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
        if (u.id === 'critChance') return nextLevel === 3; // Crit Chance "Evo" at level 3
        return nextLevel > 0 && nextLevel % 5 === 0;
    };

    const getEvoProgress = (u: Upgrade) => {
        if (!u.evoName) return { current: 0, next: 0, percent: 0 };

        let nextEvo = (Math.floor(u.count / 5) + 1) * 5;
        let prevEvo = Math.floor(u.count / 5) * 5;

        // Custom logic for non-standard evos
        if (u.id === 'repulsion') {
            nextEvo = 5;
            prevEvo = 0;
        } else if (u.id === 'critChance') {
            nextEvo = 3;
            prevEvo = 0;
        }

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
                        const isWeapon = u.type === 'weapon';

                        // Logic for "Affected Weapons" on Stat cards
                        const affectedWeapons = !isWeapon ? UPGRADES_LIST.filter(w =>
                            w.type === 'weapon' &&
                            // Show for all weapons, even if not yet acquired (helps with build planning)
                            w.scalesWith?.includes(u.id)
                        ) : [];

                        // Always add "Main Gun" if applicable
                        // Main gun stats: multishot, haste, damage, pierce, size, critChance, critDamage, speed (for weird builds?)
                        const mainGunStats = ['multishot', 'haste', 'damage', 'pierce', 'size', 'critChance', 'critDamage'];
                        if (!isWeapon && mainGunStats.includes(u.id)) {
                            // Virtual "Main Gun" entry for display
                            affectedWeapons.unshift({ id: 'main_gun', icon: 'crosshair', name: 'MAIN GUN' } as any);
                        }

                        // Logic for "Synergies" on Weapon cards
                        const scalingStats = isWeapon && u.scalesWith ? UPGRADES_LIST.filter(s => u.scalesWith?.includes(s.id)) : [];

                        return (
                            <div
                                key={`${u.id}-${rerollKey}`}
                                className={`
                                    relative overflow-hidden transition-all duration-300 group cursor-pointer 
                                    flex flex-col items-center text-center gap-3
                                    p-4 md:p-5 w-full
                                    ${evo
                                        ? 'bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border-2 border-[#ffd700] shadow-[0_0_40px_rgba(255,215,0,0.3)] rounded-2xl'
                                        : isWeapon
                                            ? 'bg-gradient-to-br from-[#ff0055]/10 to-[#ff0055]/5 border border-[#ff0055]/30 rounded-xl md:rounded-2xl hover:border-[#ff0055] hover:shadow-[0_0_30px_rgba(255,0,85,0.2)]'
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
                                <div className={`absolute top-0 right-0 w-16 h-16 ${evo ? 'bg-[#ffd700]/20' : isWeapon ? 'bg-[#ff0055]/10' : 'bg-[#00ffcc]/10'} blur-2xl`} />

                                {/* Header Badge (Weapon/Stat) */}
                                <div className={`
                                    absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border
                                    ${isWeapon
                                        ? 'bg-[#ff0055]/20 border-[#ff0055]/30 text-[#ff0055]'
                                        : 'bg-white/5 border-white/10 text-white/30'
                                    }
                                `}>
                                    {isWeapon ? 'WEAPON' : 'UPGRADE'}
                                </div>

                                {/* Icon */}
                                <div className={`
                                    mt-2 text-5xl md:text-7xl group-hover:scale-110 transition-transform duration-300 shrink-0 
                                    flex justify-center items-center w-16 h-16 md:w-20 md:h-20
                                    ${evo ? 'drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]' : isWeapon ? 'drop-shadow-[0_0_15px_rgba(255,0,85,0.4)]' : 'drop-shadow-[0_0_10px_rgba(0,255,204,0.3)]'}
                                `}>
                                    <GameIcon id={u.icon} size={undefined} className="w-full h-full" />
                                </div>

                                {/* Content */}
                                <div className="flex flex-col gap-1 w-full items-center">
                                    {/* Name */}
                                    <h3 className={`
                                        text-lg font-bold leading-tight
                                        ${evo ? 'text-[#ffd700]' : isWeapon ? 'text-[#ff0055]' : 'text-white group-hover:text-[#00ffcc]'}
                                        transition-colors
                                    `}>
                                        {/* User Request: Remove mention of other names for evos */}
                                        {u.name}
                                    </h3>

                                    {/* Level & Stat Badges */}
                                    <div className="flex flex-row items-center justify-center gap-1.5 w-full flex-wrap">
                                        <div className={`
                                            font-bold text-[10px] tracking-wider uppercase 
                                            px-2 py-0.5 rounded
                                            ${evo
                                                ? 'bg-[#ffd700] text-black shadow-[0_0_15px_rgba(255,215,0,0.4)]'
                                                : 'bg-white/10 text-white/70 border border-white/10'
                                            }
                                        `}>
                                            {/* Fix: Only say MAXED if actually max level. Otherwise EVOLUTION or Level */}
                                            {evo ? '★ EVOLUTION ★' : `LVL ${u.count} → ${u.count + 1}`}
                                        </div>
                                        <div className={`
                                            text-[10px] font-bold tracking-wider uppercase 
                                            px-2 py-0.5 rounded
                                            ${evo
                                                ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/30'
                                                : isWeapon
                                                    ? 'bg-[#ff0055]/10 text-[#ff0055] border border-[#ff0055]/20'
                                                    : 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20'
                                            }
                                        `}>
                                            {u.stat}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className={`
                                        text-xs leading-relaxed
                                        ${evo ? 'text-[#ffd700]/80' : 'text-white/50'}
                                        mt-1 h-8
                                    `}>
                                        {evo ? u.evoDesc : u.desc}
                                    </p>

                                    {/* === SYNERGY SECTION === */}

                                    {/* Case A: Weapon - Show what stats scale it */}
                                    {isWeapon && scalingStats.length > 0 && (
                                        <div className="flex flex-col items-center gap-1.5 mt-2 w-full">
                                            <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Scales With</span>
                                            <div className="flex flex-wrap justify-center gap-1.5">
                                                {scalingStats.map(s => (
                                                    <div key={s.id} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5" title={s.desc}>
                                                        <div className="w-3 h-3 text-white/70"><GameIcon id={s.icon} size={undefined} className="w-full h-full" /></div>
                                                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-wide">{s.name}</span>
                                                    </div>
                                                ))}
                                                {/* Add "LVL" chip since everything scales with Level */}
                                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md border border-white/5" title="Scales with Level">
                                                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-wide">LEVEL</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Case B: Stat - Show what weapons it improves */}
                                    {!isWeapon && affectedWeapons.length > 0 && (
                                        <div className="flex flex-col items-center gap-1.5 mt-2 w-full">
                                            <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold">Improves</span>
                                            <div className="flex flex-wrap justify-center gap-1.5">
                                                {affectedWeapons.map((w, idx) => (
                                                    <div key={idx} className="flex items-center gap-1.5 bg-[#ff0055]/10 px-2 py-1 rounded-md border border-[#ff0055]/20" title={w.desc}>
                                                        <div className="w-3 h-3 text-[#ff0055]"><GameIcon id={w.icon} size={undefined} className="w-full h-full" /></div>
                                                        <span className="text-[9px] font-bold text-[#ff0055] uppercase tracking-wide">{w.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Evolution Progress */}
                                    {u.evoName && !evo && evoProgress.next > u.count && (
                                        <div className="flex flex-col items-center gap-1 mt-3 w-full border-t border-white/5 pt-2">
                                            <div className="flex items-center justify-between w-full">
                                                <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">
                                                    Evo Progress
                                                </p>
                                                <p className="text-[9px] text-[#ffee00] font-bold">
                                                    Lv.{evoProgress.next}
                                                </p>
                                            </div>
                                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#ffee00] to-[#ffd700] rounded-full shadow-[0_0_10px_rgba(255,238,0,0.5)]"
                                                    style={{ width: `${evoProgress.percent}%` }}
                                                />
                                            </div>
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
