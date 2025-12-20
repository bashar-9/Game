'use client';

import { Button } from './Button';
import { StatsDisplay } from './StatsDisplay';

interface PauseMenuProps {
    onResume: () => void;
    onQuit: () => void;
}

export default function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
            <div className="bg-[#0a0a12] border border-white/10 p-8 rounded-xl shadow-2xl text-center w-full max-w-sm">
                <h2 className="text-3xl font-bold text-white mb-8 tracking-wider">SYSTEM PAUSED</h2>
                <StatsDisplay />
                <div className="flex flex-col gap-4">
                    <Button onClick={onResume} className="w-full">RESUME</Button>
                    <Button variant="outline" onClick={onQuit} className="w-full">ABORT MISSION</Button>
                </div>
            </div>
        </div>
    );
}
