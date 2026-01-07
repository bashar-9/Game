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
        const isMuted = soundManager.toggleMute('master');
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
            {/* Top Bar - Optimized Layout */}
            <div className="absolute top-0 left-0 w-full p-2 md:p-4 flex items-start justify-between gap-2 text-white bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none">

                {/* Left: HP & Timer (Mobile optimized group) */}
                <div className="flex flex-col gap-2 pointer-events-auto">
                    {/* HP Bar */}
                    <div className="flex flex-col gap-1 w-32 md:w-64">
                        <div className="flex items-center gap-2 text-[#00ffcc] font-bold text-xs md:text-base">
                            <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                            <span>{Math.ceil(hp)} / {maxHp}</span>
                        </div>
                        <div className="h-2 md:h-4 bg-gray-800 rounded-full border border-gray-600 overflow-hidden relative">
                            <div
                                className="h-full bg-[#00ffcc] transition-all duration-300"
                                style={{ width: `${hpPercent}%` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full opacity-30" />
                        </div>
                    </div>
                </div>

                {/* Center: Timer */}
                <div className="absolute left-1/2 -translate-x-1/2 top-2 md:top-4">
                    <div className="text-xl md:text-3xl font-mono font-bold text-white drop-shadow-lg tabular-nums">
                        {formatTime(time)}
                    </div>
                </div>

                {/* Right: Kills & Controls */}
                <div className="flex items-center gap-1 md:gap-3 pointer-events-auto">
                    {/* Kills */}
                    <div className="flex items-center gap-1 md:gap-2 text-[#ff0055] font-bold text-sm md:text-xl mr-1 md:mr-2">
                        <Skull className="w-4 h-4 md:w-6 md:h-6" />
                        <span>{killCount}</span>
                    </div>

                    {/* Audio Toggle */}
                    <button
                        onClick={toggleMute}
                        className="p-1.5 md:p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                        {muted ? <VolumeX className="w-4 h-4 md:w-5 md:h-5 text-gray-400" /> : <Volume2 className="w-4 h-4 md:w-5 md:h-5 text-[#00ffcc]" />}
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 md:p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                    </button>

                    {/* Pause Button */}
                    <button
                        onClick={() => setPaused(true)}
                        className="p-1.5 md:p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"
                    >
                        <Pause className="w-4 h-4 md:w-5 md:h-5 text-[#ffee00]" />
                    </button>
                </div>
            </div>

            {/* Active Powerups Display */}
            <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                {Object.entries(useGameStore(state => state.activePowerups || {})).map(([type, duration]) => {
                    if (duration <= 0) return null;

                    let label = "";
                    let sub = "";
                    let color = "";

                    switch (type) {
                        case 'double_stats':
                            label = "DOUBLE STATS";
                            sub = "3x Damage & Speed";
                            color = "text-[#ff0055]";
                            break;
                        case 'invulnerability':
                            label = "INVULNERABLE";
                            sub = "Damage Immune";
                            color = "text-[#ffee00]";
                            break;
                        case 'magnet':
                            label = "MAGNET";
                            sub = "Max Range";
                            color = "text-blue-400";
                            break;
                    }

                    if (!label) return null;

                    // Blink when low duration (< 2 seconds = 120 frames)
                    const isLow = duration < 120;
                    const opacity = isLow && Math.floor(Date.now() / 100) % 2 === 0 ? "opacity-30" : "opacity-100";

                    return (
                        <div key={type} className={`flex flex-col items-center ${opacity} transition-opacity`}>
                            <div className={`text-xl md:text-2xl font-black ${color} tracking-widest drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] stroke-black`}>
                                {label}
                            </div>
                            <div className="text-xs md:text-sm font-bold text-white/90 drop-shadow-md">
                                {sub}
                            </div>
                        </div>
                    );
                })}
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
