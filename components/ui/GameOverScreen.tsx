'use client';

import { useGameStore } from '@/store/useGameStore';
import { formatTime } from '@/lib/utils';
import { RotateCw, Home, ArrowUpCircle } from 'lucide-react';
import { usePowerUpProgressionStore } from '@/store/PowerUpProgressionStore';
import { useState } from 'react';
import PowerUpUpgradeScreen from './PowerUpUpgradeScreen';
import { KILLS_PER_POINT } from '@/lib/config';

interface GameOverScreenProps {
    onRestart: () => void;
}

export default function GameOverScreen({ onRestart }: GameOverScreenProps) {
    const { time, killCount, level, damage } = useGameStore();
    const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);

    // Points calculation roughly matches store logic (just for display)
    const pointsEarned = Number((killCount / KILLS_PER_POINT).toFixed(2));
    const availablePoints = usePowerUpProgressionStore((state) => state.getAvailablePoints());

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-red-950/95 via-black/95 to-red-950/95 backdrop-blur-xl z-50">
            {/* Ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#ff0055]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-[#ff0055]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md border border-[#ff0055]/30 p-4 sm:p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-xl w-full mx-4 animate-in fade-in zoom-in duration-300 overflow-hidden">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-[#ff0055]/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#ff0055]/20 blur-3xl" />

                {/* Header */}
                <div className="mb-4 sm:mb-8">
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff0055] via-[#ff3377] to-[#ff0055] mb-1 sm:mb-2 tracking-tighter">
                        CRITICAL FAILURE
                    </h2>
                    <p className="text-white/40 text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em]">System Terminated</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <StatCard label="TIME" value={formatTime(time)} icon="⏱" />
                    <StatCard label="LEVEL" value={level.toString()} icon="⚡" />
                    <StatCard label="KILLS" value={killCount.toString()} icon="💀" />
                    <StatCard label="DAMAGE" value={damage.toString()} icon="🔥" />
                </div>

                {/* Buttons - equal height, side by side */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowUpgradeScreen(true)}
                        className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 border border-white/10"
                    >
                        <ArrowUpCircle className="w-5 h-5 text-[#ffee00]" />
                        <span className="text-white text-sm sm:text-base">UPGRADES</span>
                        {availablePoints > 0 && <span className="bg-[#ffee00] text-black text-[10px] px-1.5 py-0.5 rounded-full font-black">{availablePoints}</span>}
                    </button>

                    <button
                        onClick={onRestart}
                        className="flex-[1.5] py-4 bg-[#00ffcc] hover:bg-[#00ffd5] text-black rounded-xl font-black text-base sm:text-lg uppercase tracking-wider hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <RotateCw className="w-5 h-5" />
                        RETRY
                    </button>
                </div>

                {/* Kill Points Summary */}
                <div className="mt-4 sm:mt-6 text-center">
                    <p className="text-white/30 text-[10px] sm:text-xs uppercase tracking-widest">PROGRESSION EARNED</p>
                    <div className="text-[#ffee00] font-mono text-xs sm:text-sm mt-1">
                        +{pointsEarned} POINTS ({killCount} Kills)
                    </div>
                </div>
            </div>

            {/* Render PowerUpUpgradeScreen OUTSIDE the card container */}
            {showUpgradeScreen && (
                <PowerUpUpgradeScreen onClose={() => setShowUpgradeScreen(false)} />
            )}
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
    return (
        <div className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/5">
            <span className="text-lg mb-1">{icon}</span>
            <span className="text-white/40 text-[9px] uppercase tracking-wider font-medium">{label}</span>
            <span className="text-[#ff0055] text-xl md:text-2xl font-mono font-bold">{value}</span>
        </div>
    );
}
