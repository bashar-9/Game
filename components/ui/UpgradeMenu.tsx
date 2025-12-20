'use client';

import { useState } from 'react';
import { UPGRADES_LIST, Upgrade } from '@/lib/config';

interface UpgradeMenuProps {
    onSelect: (id: string) => void;
}

export default function UpgradeMenu({ onSelect }: UpgradeMenuProps) {
    const [options] = useState<Upgrade[]>(() => {
        const shuffled = [...UPGRADES_LIST].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);
    });

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-300">
            <div className="max-w-5xl w-full mx-4">
                <h2 className="text-4xl md:text-5xl font-black text-white text-center mb-12 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                    SYSTEM UPGRADE
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {options.map((u) => (
                        <div
                            key={u.id}
                            className="bg-[#0a0a12] border border-white/10 rounded-xl p-8 hover:border-[#ffee00] hover:bg-[#ffee00]/5 transition-all duration-300 group cursor-pointer flex flex-col items-center text-center gap-4 relative overflow-hidden"
                            onClick={() => onSelect(u.id)}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-[#ffee00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="text-6xl mb-2 group-hover:scale-110 transition-transform duration-300 transform">
                                {u.icon}
                            </div>

                            <div className="space-y-2 relative z-10">
                                <h3 className="text-2xl font-bold text-white group-hover:text-[#ffee00] transition-colors">
                                    {u.name}
                                </h3>
                                <div className="text-[#ffee00] font-bold text-sm tracking-widest uppercase bg-[#ffee00]/10 px-3 py-1 rounded-full inline-block">
                                    {u.stat}
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed min-h-[40px]">
                                    {u.desc}
                                </p>
                            </div>

                            {u.evoName && (
                                <div className="mt-4 pt-4 border-t border-white/10 w-full">
                                    <p className="text-xs text-[#ffee00]/70 font-bold uppercase tracking-widest mb-1">Coming Soon</p>
                                    <p className="text-xs text-gray-500">{u.evoName}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
