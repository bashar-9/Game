'use client';

import { useState } from 'react';
import { UPGRADES_LIST } from '@/lib/config';

interface DevMenuProps {
    onStart: (config: { level: number; upgrades: Record<string, number> }) => void;
    onClose: () => void;
}

export default function DevMenu({ onStart, onClose }: DevMenuProps) {
    const [level, setLevel] = useState(1);
    const [upgrades, setUpgrades] = useState<Record<string, number>>({});

    const handleUpgradeChange = (id: string, delta: number) => {
        setUpgrades(prev => {
            const current = prev[id] || 0;
            const next = Math.max(0, current + delta);
            if (next === 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: next };
        });
    };

    const handleStart = () => {
        onStart({ level, upgrades });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-200">
            <div className="w-full max-w-2xl bg-[#0a0a12] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.1)] flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-cyan-400 tracking-tighter">DEV // OVERRIDE</h2>
                        <p className="text-xs text-white/50 font-mono mt-1">CONFIGURE INITIAL STATE</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/30 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">

                    {/* Level Config */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest">Starting Level</label>
                        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-lg border border-white/5">
                            <button
                                onClick={() => setLevel(l => Math.max(1, l - 1))}
                                className="w-10 h-10 flex items-center justify-center bg-black rounded border border-white/20 hover:border-cyan-500 text-white font-mono text-xl"
                            >
                                -
                            </button>
                            <span className="text-3xl font-black text-white w-20 text-center font-mono">{level}</span>
                            <button
                                onClick={() => setLevel(l => Math.min(100, l + 1))}
                                className="w-10 h-10 flex items-center justify-center bg-black rounded border border-white/20 hover:border-cyan-500 text-white font-mono text-xl"
                            >
                                +
                            </button>
                            <span className="text-xs text-white/30 ml-2">Sets XP base automatically</span>
                        </div>
                    </div>

                    {/* Upgrades Config */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-cyan-500/80 uppercase tracking-widest">Initial Upgrades</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {UPGRADES_LIST.map(u => {
                                const count = upgrades[u.id] || 0;
                                const isEvo = u.evoName && count >= 5 && u.id === 'repulsion' ? count >= 5 : count >= 5; // Simplified visual check, distinct logic exists in engine

                                return (
                                    <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${count > 0 ? 'bg-cyan-500/10 border-cyan-500/50' : 'bg-white/5 border-white/5'}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{u.icon}</span>
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-sm ${count > 0 ? 'text-cyan-400' : 'text-white/70'}`}>{u.name}</span>
                                                <span className="text-[10px] text-white/30">{u.stat}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {count > 0 && (
                                                <button
                                                    onClick={() => handleUpgradeChange(u.id, -1)}
                                                    className="w-6 h-6 flex items-center justify-center bg-black rounded text-white/50 hover:text-white"
                                                >
                                                    -
                                                </button>
                                            )}
                                            <span className={`font-mono font-bold w-6 text-center ${count >= 5 ? 'text-[#ffd700]' : 'text-white'}`}>
                                                {count}
                                            </span>
                                            <button
                                                onClick={() => handleUpgradeChange(u.id, 1)}
                                                disabled={u.id === 'multishot' && count >= 17}
                                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${u.id === 'multishot' && count >= 17 ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-white/10 hover:bg-cyan-500 hover:text-black'}`}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 bg-black/40 shrink-0">
                    <button
                        onClick={handleStart}
                        className="w-full py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xl tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all transform hover:scale-[1.02]"
                    >
                        Initialize Simulation
                    </button>
                </div>
            </div>
        </div>
    );
}
