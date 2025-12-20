'use client';

import { useGameStore } from '@/store/useGameStore';
import { Button } from './Button';
import { formatTime } from '@/lib/utils';

interface GameOverScreenProps {
    onRestart: () => void;
}

export default function GameOverScreen({ onRestart }: GameOverScreenProps) {
    const { time, killCount, level } = useGameStore();

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-red-950/80 backdrop-blur-md z-50">
            <div className="bg-[#1a0505] border border-[#ff0055]/50 p-12 rounded-2xl shadow-[0_0_100px_rgba(255,0,85,0.4)] text-center max-w-xl w-full mx-4 animate-in fade-in zoom-in duration-300">
                <h2 className="text-6xl font-black text-[#ff0055] mb-8 tracking-tighter drop-shadow-[0_0_10px_rgba(255,0,85,0.8)]">
                    CRITICAL FAILURE
                </h2>

                <div className="space-y-6 mb-12">
                    <StatRow label="SURVIVAL TIME" value={formatTime(time)} />
                    <StatRow label="THREATS NEUTRALIZED" value={killCount.toString()} />
                    <StatRow label="SYSTEM LEVEL" value={level.toString()} />
                </div>

                <Button
                    variant="danger"
                    onClick={onRestart}
                    className="w-full text-xl py-4"
                >
                    REBOOT SYSTEM
                </Button>
            </div>
        </div>
    );
}

function StatRow({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex justify-between items-center border-b border-[#ff0055]/20 pb-2">
            <span className="text-[#ff0055]/70 font-bold tracking-widest">{label}</span>
            <span className="text-white font-mono text-2xl font-bold">{value}</span>
        </div>
    );
}
