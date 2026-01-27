'use client';

import { useState, useEffect } from 'react';
import { Shield, Skull, Zap, ArrowUpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { soundManager } from '@/lib/game/SoundManager';
import PowerUpUpgradeScreen from './PowerUpUpgradeScreen';
import { usePowerUpProgressionStore } from '@/store/PowerUpProgressionStore';

interface StartScreenProps {
    onStart: (diff: 'easy' | 'medium' | 'hard') => void;
    onTitleClick?: () => void;
}

export default function StartScreen({ onStart, onTitleClick }: StartScreenProps) {
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [showUpgradeScreen, setShowUpgradeScreen] = useState(false);
    const availablePoints = usePowerUpProgressionStore((state) => state.getAvailablePoints());

    useEffect(() => {
        // Preload and play menu music
        soundManager.preload().then(() => {
            soundManager.playMenuBGM(0.6);
        });
        return () => {
            soundManager.stopMenuBGM();
        };
    }, []);

    const difficulties = [
        { id: 'easy', label: 'EASY', color: 'text-[#00ffcc]', borderColor: 'border-[#00ffcc]', bgColor: 'bg-[#00ffcc]', glowColor: 'rgba(0,255,204,0.3)', icon: Shield },
        { id: 'medium', label: 'MEDIUM', color: 'text-[#ffee00]', borderColor: 'border-[#ffee00]', bgColor: 'bg-[#ffee00]', glowColor: 'rgba(255,238,0,0.3)', icon: Zap },
        { id: 'hard', label: 'HARD', color: 'text-[#ff0055]', borderColor: 'border-[#ff0055]', bgColor: 'bg-[#ff0055]', glowColor: 'rgba(255,0,85,0.3)', icon: Skull },
    ];

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black/95 via-slate-900/95 to-black/95 backdrop-blur-xl z-50">
            {/* Ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00ffcc]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#00ffcc]/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md border border-white/10 p-8 md:p-12 rounded-2xl shadow-2xl text-center max-w-2xl w-full mx-4">
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-[#00ffcc]/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#00ffcc]/10 blur-3xl" />

                {/* Title */}
                <h1
                    onClick={onTitleClick}
                    className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] via-white to-[#00ffcc] mb-2 tracking-tighter cursor-pointer select-none hover:opacity-80 transition-opacity"
                >
                    VOID SWARM
                </h1>
                <p className="text-white/40 text-sm md:text-base mb-8 md:mb-10 uppercase tracking-[0.3em] font-medium">
                    System Compromised // Defense Required
                </p>

                {/* Difficulty Selection */}
                <div className="mb-8 md:mb-10">
                    <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Select Difficulty</p>
                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                        {difficulties.map((mode) => {
                            const Icon = mode.icon;
                            const isSelected = difficulty === mode.id;
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => setDifficulty(mode.id as 'easy' | 'medium' | 'hard')}
                                    className={cn(
                                        "p-4 md:p-6 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-2 md:gap-3 group relative overflow-hidden",
                                        isSelected
                                            ? `${mode.borderColor} bg-gradient-to-br from-white/10 to-white/5`
                                            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                                    )}
                                    style={isSelected ? { boxShadow: `0 0 30px ${mode.glowColor}` } : {}}
                                >
                                    {/* Shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                    <Icon className={cn(
                                        "w-6 h-6 md:w-8 md:h-8 transition-all duration-300",
                                        isSelected ? `${mode.color} drop-shadow-lg` : "text-white/40"
                                    )} />
                                    <span className={cn(
                                        "font-bold text-xs md:text-sm tracking-wider transition-colors",
                                        isSelected ? "text-white" : "text-white/40"
                                    )}>
                                        {mode.label}
                                    </span>

                                    {/* Selection indicator */}
                                    {isSelected && (
                                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 ${mode.bgColor} rounded-t-full`} />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Upgrade Button */}
                <button
                    onClick={() => setShowUpgradeScreen(true)}
                    className="group relative w-full py-3 mb-4 rounded-xl font-bold text-base uppercase tracking-wider
                        bg-white/5 border border-white/10 hover:border-[#ffee00]/50 hover:bg-[#ffee00]/10
                        hover:shadow-[0_0_20px_rgba(255,238,0,0.1)]
                        transition-all duration-300"
                >
                    <span className="flex items-center justify-center gap-3 text-white/80 group-hover:text-[#ffee00] transition-colors">
                        <ArrowUpCircle className="w-5 h-5" />
                        POWER-UP UPGRADES
                        {availablePoints > 0 && (
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-[#ffee00] text-black text-xs font-black animate-pulse">
                                {availablePoints} PTS
                            </span>
                        )}
                    </span>
                </button>

                {/* Start Button */}
                <button
                    onClick={() => onStart(difficulty)}
                    className="group relative w-full py-4 md:py-5 rounded-xl font-black text-lg md:text-xl uppercase tracking-wider overflow-hidden
                        bg-gradient-to-r from-[#00ffcc] to-[#00ddaa] border-2 border-[#00ffcc]/50
                        hover:shadow-[0_0_40px_rgba(0,255,204,0.4)] hover:border-[#00ffcc]
                        transition-all duration-300"
                >
                    <span className="relative z-10 text-black flex items-center justify-center gap-3">
                        <span className="text-2xl">▶</span> INITIALIZE DEFENSE
                    </span>
                </button>

                {/* Version */}
                <p className="text-white/20 text-xs mt-6 font-mono">v1.2.0</p>
            </div>

            {/* Upgrade Screen Overlay */}
            {showUpgradeScreen && (
                <PowerUpUpgradeScreen onClose={() => setShowUpgradeScreen(false)} />
            )}
        </div>
    );
}
