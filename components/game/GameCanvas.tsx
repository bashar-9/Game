'use client';

import { useEffect, useRef } from 'react';
import { Engine } from '@/lib/game/Engine';

interface GameCanvasProps {
    diffMode: 'easy' | 'normal' | 'hard';
    gameRunning: boolean;
    onEngineInit?: (engine: Engine) => void;
}

export default function GameCanvas({ diffMode, gameRunning, onEngineInit }: GameCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<Engine | null>(null);

    useEffect(() => {
        if (!canvasRef.current || !gameRunning) return;

        const engine = new Engine(canvasRef.current, diffMode);
        engineRef.current = engine;
        if (onEngineInit) onEngineInit(engine);

        return () => {
            engine.destroy();
            engineRef.current = null;
        };
    }, [gameRunning, diffMode, onEngineInit]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full bg-[#0a0a12] touch-none"
        />
    );
}
