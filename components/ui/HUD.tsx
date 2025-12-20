import { useGameStore } from '@/store/useGameStore';
import { formatTime } from '@/lib/utils';
import { Heart, Skull, Volume2, VolumeX, Pause, Maximize, Minimize } from 'lucide-react';
import { useState, useEffect } from 'react';
import { soundManager } from '@/lib/game/SoundManager';

export default function HUD() {
    const { hp, maxHp, level, xp, xpToNext, time, killCount, setPaused } = useGameStore();
    const [muted, setMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleMute = () => {
        const isMuted = soundManager.toggleMute();
        setMuted(isMuted);
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const hpPercent = (hp / maxHp) * 100;
    const xpPercent = (xp / xpToNext) * 100;

    return (
        <div className="fixed inset-0 pointer-events-none">
            {/* Top Bar */}
            {/* Top Bar - Grid Layout */}
            <div className="absolute top-0 left-0 w-full p-2 md:p-4 grid grid-cols-[1fr_auto_1fr] items-start gap-2 text-white bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">

                {/* HP Bar */}
                <div className="flex flex-col gap-1 w-48 md:w-64">
                    <div className="flex items-center gap-2 text-[#00ffcc] font-bold">
                        <Heart className="w-5 h-5 fill-current" />
                        <span>{Math.ceil(hp)} / {maxHp}</span>
                    </div>
                    <div className="h-4 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative">
                        <div
                            className="h-full bg-[#00ffcc] transition-all duration-300"
                            style={{ width: `${hpPercent}%` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full opacity-30" />
                    </div>
                </div>

                {/* TIMER CENTERING FIX: Add flex-1 to push sides or absolute center */}
                <div className="absolute left-1/2 -translate-x-1/2 top-4 hidden md:block">
                    <div className="text-3xl font-mono font-bold text-white drop-shadow-lg tabular-nums">
                        {formatTime(time)}
                    </div>
                </div>
                {/* Mobile Timer (Small) */}
                <div className="md:hidden text-xl font-mono font-bold text-white drop-shadow-lg tabular-nums absolute left-1/2 -translate-x-1/2 top-4">
                    {formatTime(time)}
                </div>

                {/* Right Side Controls */}
                <div className="flex items-center justify-end gap-2 md:gap-3 pointer-events-auto">
                    {/* Kills */}
                    <div className="flex items-center gap-2 text-[#ff0055] font-bold text-xl mr-2">
                        <Skull className="w-6 h-6" />
                        <span className="hidden md:inline">{killCount}</span>
                        <span className="md:hidden text-lg">{killCount}</span>
                    </div>

                    {/* Audio Toggle */}
                    <button
                        onClick={toggleMute}
                        className="pointer-events-auto p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                        {muted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-[#00ffcc]" />}
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="pointer-events-auto p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md hidden md:block"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
                    </button>
                    {/* Mobile Fullscreen (Always Visible/Different styling if needed) */}
                    <button
                        onClick={toggleFullscreen}
                        className="pointer-events-auto p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md md:hidden"
                    >
                        {isFullscreen ? <Minimize className="w-5 h-5 text-white" /> : <Maximize className="w-5 h-5 text-white" />}
                    </button>

                    {/* Pause Button */}
                    <button
                        onClick={() => setPaused(true)}
                        className="pointer-events-auto p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                        <Pause className="w-5 h-5 text-yellow-400" />
                    </button>
                </div>
            </div>

            {/* Bottom Bar (XP) */}
            <div className="absolute bottom-0 left-0 w-full p-0">
                <div className="w-full h-2 bg-gray-900 border-t border-gray-700">
                    <div
                        className="h-full bg-[#ffee00] shadow-[0_0_10px_#ffee00] transition-all duration-300"
                        style={{ width: `${xpPercent}%` }}
                    />
                </div>
                <div className="absolute bottom-4 left-4 text-[#ffee00] font-bold flex items-center gap-2 text-xl drop-shadow-md">
                    <div className="w-8 h-8 rounded-full bg-[#ffee00] text-black flex items-center justify-center font-bold">
                        {level}
                    </div>
                    <span>LEVEL</span>
                </div>
            </div>
        </div>
    );
}
