'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Shield, Skull, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StartScreenProps {
    onStart: (diff: 'easy' | 'normal' | 'hard') => void;
    onTitleClick?: () => void;
}

export default function StartScreen({ onStart, onTitleClick }: StartScreenProps) {
    const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
            <div className="bg-[#0a0a12] border border-[#00ffcc]/30 p-12 rounded-2xl shadow-[0_0_50px_rgba(0,255,204,0.2)] text-center max-w-2xl w-full mx-4">
                <h1
                    onClick={onTitleClick}
                    className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-t from-[#00ffcc] to-white mb-2 tracking-tighter cursor-pointer select-none hover:opacity-80 transition-opacity"
                >
                    VOID SWARM
                </h1>
                <p className="text-[#00ffcc]/60 text-xl mb-12 uppercase tracking-widest font-bold">
                    System Compromised // Defense Required
                </p>

                <div className="grid grid-cols-3 gap-4 mb-12">
                    {[
                        { id: 'easy', label: 'EASY', color: 'text-green-400', icon: Shield },
                        { id: 'normal', label: 'NORMAL', color: 'text-[#00ffcc]', icon: Zap },
                        { id: 'hard', label: 'HARD', color: 'text-[#ff0055]', icon: Skull },
                    ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = difficulty === mode.id;
                        return (
                            <button
                                key={mode.id}
                                onClick={() => setDifficulty(mode.id as 'easy' | 'normal' | 'hard')}
                                className={cn(
                                    "p-6 rounded-xl border transition-all duration-300 flex flex-col items-center gap-3 group relative overflow-hidden",
                                    isSelected
                                        ? "border-[#00ffcc] bg-[#00ffcc]/10 shadow-[0_0_20px_rgba(0,255,204,0.2)]"
                                        : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                                )}
                            >
                                <Icon className={cn("w-8 h-8 transition-colors", isSelected ? mode.color : "text-gray-400")} />
                                <span className={cn("font-bold tracking-wider", isSelected ? "text-white" : "text-gray-400")}>
                                    {mode.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <Button
                    onClick={() => onStart(difficulty)}
                    className="w-full text-2xl py-6"
                >
                    INITIALIZE DEFENSE
                </Button>
            </div>
        </div>
    );
}
