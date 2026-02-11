'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Skull } from 'lucide-react';
import { GameIcon } from './GameIcons';
import { usePowerUpProgressionStore } from '@/store/PowerUpProgressionStore';
import { POWERUP_INFO, MAX_POWERUP_LEVEL, POWERUP_DURATION_PER_LEVEL, BASE_POWERUP_DURATIONS } from '@/lib/config';
import { soundManager } from '@/lib/game/SoundManager';
import { PowerupType } from '@/store/PowerUpProgressionStore';

interface PowerUpUpgradeScreenProps {
    onClose: () => void;
}

export default function PowerUpUpgradeScreen({ onClose }: PowerUpUpgradeScreenProps) {
    const {
        powerUpLevels,
        getAvailablePoints,
        getPowerUpCost,
        upgradePowerUp,
        totalLifetimeKills,
        spentPoints
    } = usePowerUpProgressionStore();

    const [points, setPoints] = useState(getAvailablePoints());
    const [flashMessage, setFlashMessage] = useState<string | null>(null);

    useEffect(() => {
        setPoints(getAvailablePoints());
    }, [getAvailablePoints, spentPoints, totalLifetimeKills]);

    const handleUpgrade = (id: PowerupType) => {
        const success = upgradePowerUp(id);
        if (success) {
            soundManager.play('evolution', 'sfx', 0.8);
            setPoints(getAvailablePoints());
            setFlashMessage(`⚡ ${POWERUP_INFO[id].name.toUpperCase()} ENHANCED!`);
            setTimeout(() => setFlashMessage(null), 2000);
        } else {
            soundManager.play('explosion', 'sfx', 0.5);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black/95 via-purple-950/80 to-black/95 backdrop-blur-xl z-[200] animate-in fade-in duration-300 p-2 sm:p-4">
            {/* Intense ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#ff0055]/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00ffcc]/20 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#ffee00]/10 rounded-full blur-[180px]" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#ff0055]/10 to-transparent" />
            </div>

            {/* Card Container with rounded corners */}
            <div className="w-full max-w-md sm:max-w-xl lg:max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl p-3 sm:p-4 lg:p-6 relative z-10 shadow-2xl">
                {/* Header - compact on mobile */}
                <div className="mb-2 sm:mb-4 lg:mb-6 text-center">
                    <h2 className="text-xl sm:text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff0055] via-[#ffee00] to-[#ff0055] tracking-tighter">
                        POWER UPGRADES
                    </h2>
                    <p className="text-white/40 text-[10px] sm:text-xs mt-0.5 tracking-widest uppercase hidden sm:block">Permanent Enhancement Modules</p>

                    {/* Stats Bar - compact */}
                    <div className="flex justify-center items-center gap-2 sm:gap-4 mt-2">
                        <div className="text-white/70 text-xs sm:text-sm font-mono bg-white/5 px-2 sm:px-4 py-1 rounded-full border border-white/10 flex items-center gap-1">
                            <Skull className="w-3 h-3 text-[#ff0055]" />
                            <span className="text-white font-bold">{totalLifetimeKills.toLocaleString()}</span>
                        </div>
                        <div className="text-white/70 text-xs sm:text-sm font-mono bg-[#ffee00]/10 px-2 sm:px-4 py-1 rounded-full border border-[#ffee00]/30">
                            ⚡ <span className="text-[#ffee00] font-bold">{points}</span> pts
                        </div>
                    </div>
                </div>

                {/* Flash Message */}
                {flashMessage && (
                    <div className="mb-2 p-2 bg-[#00ffcc]/20 border border-[#00ffcc]/50 text-[#00ffcc] font-bold text-center rounded-lg text-xs">
                        {flashMessage}
                    </div>
                )}

                {/* Cards Grid - consistent 2x2 */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {(Object.keys(POWERUP_INFO) as PowerupType[]).map((key, index) => {
                        const info = POWERUP_INFO[key];
                        const level = powerUpLevels[key];
                        const cost = getPowerUpCost(key);
                        const isMaxed = level >= MAX_POWERUP_LEVEL;
                        const canAfford = !isMaxed && points >= cost;

                        // For drop_rate, show percentage instead of duration
                        const isDropRate = key === 'drop_rate';
                        const currentDuration = isDropRate ? 0 : Math.round((BASE_POWERUP_DURATIONS[key] + (level - 1) * POWERUP_DURATION_PER_LEVEL) / 60);
                        const nextDuration = isDropRate ? 0 : Math.round((BASE_POWERUP_DURATIONS[key] + (level) * POWERUP_DURATION_PER_LEVEL) / 60);
                        const currentDropBonus = (level - 1) * 10; // +10% per level above 1
                        const nextDropBonus = level * 10;

                        return (
                            <div
                                key={key}
                                className={`
                                    relative overflow-hidden transition-all duration-300 group
                                    flex flex-col items-center text-center gap-1 sm:gap-2
                                    p-2 sm:p-3 lg:p-4 w-full h-full
                                    ${isMaxed
                                        ? 'bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border-2 border-[#ffd700] shadow-[0_0_40px_rgba(255,215,0,0.3)] rounded-xl'
                                        : canAfford
                                            ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/20 rounded-xl hover:border-[#00ffcc]/50 hover:shadow-[0_0_30px_rgba(0,255,204,0.2)] cursor-pointer'
                                            : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5 rounded-xl opacity-60'
                                    }
                                    backdrop-blur-md
                                `}
                                style={{
                                    animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                                }}
                                onClick={() => canAfford && handleUpgrade(key)}
                            >
                                {/* Shine effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />

                                {/* Corner accent */}
                                <div className={`absolute top-0 right-0 w-20 h-20 ${isMaxed ? 'bg-[#ffd700]/30' : 'bg-[#00ffcc]/10'} blur-3xl`} />

                                {/* Icon */}
                                <div
                                    className={`
                                        text-4xl sm:text-5xl lg:text-7xl group-hover:scale-110 transition-transform duration-300 shrink-0 
                                        flex justify-center items-center w-12 h-12 sm:w-16 sm:h-16 lg:w-auto lg:h-auto
                                        ${isMaxed ? 'drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]' : 'drop-shadow-[0_0_15px_rgba(0,255,204,0.4)]'}
                                    `}
                                    style={{ filter: isMaxed ? undefined : `drop-shadow(0 0 10px ${info.color})` }}
                                >
                                    <GameIcon id={info.icon} size={undefined} className="w-full h-full" />
                                </div>

                                {/* Content */}
                                <div className="flex flex-col gap-0.5 sm:gap-1 w-full items-center">
                                    {/* Name */}
                                    <h3 className={`
                                        text-[11px] sm:text-sm lg:text-base font-bold leading-tight
                                        ${isMaxed ? 'text-[#ffd700]' : 'text-white group-hover:text-[#00ffcc]'}
                                        transition-colors
                                    `}>
                                        {isMaxed ? `★ ${info.name.toUpperCase()}` : info.name.toUpperCase()}
                                    </h3>

                                    {/* Level Badge & Description - stacked */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className={`
                                            font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded
                                            ${isMaxed
                                                ? 'bg-[#ffd700] text-black'
                                                : 'bg-white/10 text-white/70'
                                            }
                                        `}>
                                            {isMaxed ? '★ MAX ★' : `LVL ${level}→${level + 1}`}
                                        </div>
                                        <div className="text-[10px] font-medium px-2 py-0.5 rounded bg-white/5" style={{ color: info.color }}>
                                            {info.description}
                                        </div>
                                    </div>

                                    {/* Duration Stats OR Drop Rate Stats */}
                                    {isDropRate ? (
                                        <div className="flex items-center gap-1.5 text-xs lg:text-sm">
                                            <span className="text-white/50">Bonus:</span>
                                            <span className="text-white font-mono font-bold">+{currentDropBonus}%</span>
                                            {!isMaxed && (
                                                <>
                                                    <span className="text-white/30">→</span>
                                                    <span className="text-[#00ffcc] font-mono font-bold">+{nextDropBonus}%</span>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-xs lg:text-sm">
                                            <span className="text-white/50">Duration:</span>
                                            <span className="text-white font-mono font-bold">{currentDuration}s</span>
                                            {!isMaxed && (
                                                <>
                                                    <span className="text-white/30">→</span>
                                                    <span className="text-[#00ffcc] font-mono font-bold">{nextDuration}s</span>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Upgrade Progress Bar */}
                                    <div className="w-full mt-1">
                                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(level / MAX_POWERUP_LEVEL) * 100}%`,
                                                    backgroundColor: isMaxed ? '#ffd700' : info.color
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Cost / Action Area */}
                                    {!isMaxed && (
                                        <div className={`
                                            mt-1 lg:mt-2 px-3 py-1.5 rounded-lg font-bold text-[10px] lg:text-xs uppercase tracking-wider
                                            w-full flex items-center justify-center gap-1.5
                                            ${canAfford
                                                ? 'bg-[#00ffcc] text-black'
                                                : 'bg-white/5 text-white/30'
                                            }
                                        `}>
                                            <Zap className="w-3 h-3" />
                                            {canAfford ? `UPGRADE ${cost}pts` : `${cost}pts`}
                                        </div>
                                    )}
                                    {isMaxed && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-[#ffd700] rounded-full animate-pulse" />
                                            <p className="text-xs text-[#ffd700] font-bold tracking-wider uppercase">
                                                Maximum Output
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}


                </div>

                {/* Info Banner */}
                <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg border border-[#ffee00]/20 bg-[#ffee00]/5 flex gap-2 text-[#ffee00]/70 text-[10px] sm:text-xs">
                    <span className="text-sm sm:text-lg">💡</span>
                    <p>
                        <span className="font-bold text-[#ffee00]">125 Kills = 1 Point.</span> Upgrades are permanent.
                    </p>
                </div>

                {/* Close Button */}
                <div className="pt-3 sm:pt-4 flex justify-center">
                    <button
                        onClick={onClose}
                        className="group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300 bg-white/5 border-white/20 hover:border-[#ff0055]/50 hover:bg-white/10"
                    >
                        <X className="w-4 h-4 text-white/50 group-hover:text-[#ff0055]" />
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white/70 group-hover:text-white">
                            Close
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
