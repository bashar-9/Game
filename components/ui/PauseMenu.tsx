'use client';

import { Button } from './Button';
import { StatsDisplay } from './StatsDisplay';

interface PauseMenuProps {
    onResume: () => void;
    onQuit: () => void;
}

import { useEffect } from 'react';
import { soundManager } from '@/lib/game/SoundManager';

export default function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
    useEffect(() => {
        soundManager.play('menu_open', 'ui');
    }, []);
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black/90 via-slate-900/90 to-black/90 backdrop-blur-xl z-50 p-4">
            {/* Ambient glow effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#00ffcc]/10 rounded-full blur-[80px]" />
                <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[#ff0055]/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl text-center w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-5 md:p-6 shrink-0 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-3 h-3 bg-[#ffee00] rounded-full animate-pulse shadow-[0_0_10px_rgba(255,238,0,0.5)]" />
                        <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 tracking-wider">
                            SYSTEM PAUSED
                        </h2>
                        <div className="w-3 h-3 bg-[#ffee00] rounded-full animate-pulse shadow-[0_0_10px_rgba(255,238,0,0.5)]" />
                    </div>
                    <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">Mission Status</p>
                </div>

                {/* Stats Content */}
                <div className="flex-1 overflow-y-auto px-5 md:px-6 py-4 custom-scrollbar">
                    <StatsDisplay />
                </div>

                {/* Buttons */}
                <div className="p-4 md:p-5 flex flex-row gap-3 shrink-0 border-t border-white/5 bg-white/[0.02]">
                    {/* Abort - Left */}
                    <button
                        onClick={onQuit}
                        className="py-2.5 md:py-3 px-5 rounded-lg font-bold uppercase tracking-wider text-xs
                            bg-[#ff0055]/10 border-2 border-[#ff0055]/40 text-[#ff0055]
                            hover:bg-[#ff0055]/20 hover:border-[#ff0055] hover:shadow-[0_0_20px_rgba(255,0,85,0.3)]
                            transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                        <span>✕</span> Abort
                    </button>
                    {/* Resume - Right */}
                    <button
                        onClick={onResume}
                        className="group relative flex-1 py-2.5 md:py-3 rounded-lg font-bold text-sm md:text-base uppercase tracking-wider overflow-hidden
                            bg-gradient-to-r from-[#00ffcc] to-[#00ddaa] border-2 border-[#00ffcc]/50
                            hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] hover:border-[#00ffcc]
                            transition-all duration-300"
                    >
                        <span className="relative z-10 text-black font-black flex items-center justify-center gap-2">
                            <span>▶</span> RESUME
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
