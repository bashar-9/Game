'use client';

import { useGameStore } from '@/store/useGameStore';
import { formatTime } from '@/lib/utils';

interface GameOverScreenProps {
    onRestart: () => void;
}

export default function GameOverScreen({ onRestart }: GameOverScreenProps) {
    const { time, killCount, level, damage } = useGameStore();

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-red-950/95 via-black/95 to-red-950/95 backdrop-blur-xl z-50">
            {/* Ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#ff0055]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-[#ff0055]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md border border-[#ff0055]/30 p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-xl w-full mx-4 animate-in fade-in zoom-in duration-300">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-[#ff0055]/20 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#ff0055]/20 blur-3xl" />

                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff0055] via-[#ff3377] to-[#ff0055] mb-2 tracking-tighter">
                        CRITICAL FAILURE
                    </h2>
                    <p className="text-white/40 text-xs md:text-sm uppercase tracking-[0.3em]">System Terminated</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    <StatCard label="TIME" value={formatTime(time)} icon="⏱" />
                    <StatCard label="LEVEL" value={level.toString()} icon="⚡" />
                    <StatCard label="KILLS" value={killCount.toString()} icon="💀" />
                    <StatCard label="DAMAGE" value={damage.toString()} icon="🔥" />
                </div>

                {/* Restart Button */}
                <button
                    onClick={onRestart}
                    className="group relative w-full py-4 md:py-5 rounded-xl font-black text-lg md:text-xl uppercase tracking-wider overflow-hidden
                        bg-gradient-to-r from-[#ff0055] to-[#ff3377] border-2 border-[#ff0055]/50
                        hover:shadow-[0_0_40px_rgba(255,0,85,0.4)] hover:border-[#ff0055]
                        transition-all duration-300"
                >
                    <span className="relative z-10 text-white flex items-center justify-center gap-3">
                        <span className="text-xl">↻</span> REBOOT SYSTEM
                    </span>
                </button>
            </div>
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
