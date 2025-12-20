'use client';

import { Button } from './Button';
import { StatsDisplay } from './StatsDisplay';

interface PauseMenuProps {
    onResume: () => void;
    onQuit: () => void;
}

export default function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <div className="bg-[#0a0a12] border border-white/10 rounded-xl shadow-2xl text-center w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 md:p-8 shrink-0">
                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wider">SYSTEM PAUSED</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-6 md:px-8 custom-scrollbar">
                    <StatsDisplay />
                </div>

                <div className="p-6 md:p-8 flex flex-col gap-3 shrink-0 bg-[#0a0a12] border-t border-white/5 rounded-b-xl">
                    <Button onClick={onResume} className="w-full text-lg py-4">RESUME</Button>
                    <Button variant="outline" onClick={onQuit} className="w-full">ABORT MISSION</Button>
                </div>
            </div>
        </div>
    );
}
