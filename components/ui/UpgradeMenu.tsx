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
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-300 p-4">
            <div className="w-full max-w-5xl flex flex-col max-h-full">
                <div className="shrink-0 mb-4 md:mb-8">
                    <h2 className="text-2xl md:text-5xl font-black text-white text-center tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                        SYSTEM UPGRADE
                    </h2>
                </div>

                <div className="overflow-y-auto min-h-0 flex-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 pb-4">
                        {options.map((u) => (
                            <div
                                key={u.id}
                                className="bg-[#0a0a12] border border-white/10 rounded-lg md:rounded-xl p-3 md:p-8 hover:border-[#ffee00] hover:bg-[#ffee00]/5 transition-all duration-300 group cursor-pointer flex flex-row md:flex-col items-center md:text-center gap-3 md:gap-4 relative overflow-hidden shrink-0"
                                onClick={() => onSelect(u.id)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-b from-[#ffee00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="text-3xl md:text-6xl group-hover:scale-110 transition-transform duration-300 transform shrink-0 w-12 md:w-auto flex justify-center">
                                    {u.icon}
                                </div>

                                <div className="space-y-0.5 md:space-y-2 relative z-10 w-full text-left md:text-center min-w-0">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between md:justify-center gap-1 md:gap-2">
                                        <h3 className="text-base md:text-2xl font-bold text-white group-hover:text-[#ffee00] transition-colors leading-tight truncate">
                                            {u.name}
                                        </h3>
                                        <div className="text-[#ffee00] font-bold text-[10px] md:text-sm tracking-widest uppercase bg-[#ffee00]/10 px-2 py-0.5 rounded-full self-start md:self-auto whitespace-nowrap">
                                            {u.stat}
                                        </div>
                                    </div>

                                    <p className="text-gray-400 text-xs md:text-sm leading-tight md:leading-relaxed line-clamp-2 md:line-clamp-none">
                                        {u.desc}
                                    </p>

                                    {u.evoName && (
                                        <div className="mt-1 md:mt-4 pt-1 md:pt-4 border-t border-white/10 w-full flex md:block gap-2 items-center">
                                            <p className="text-[10px] md:text-xs text-[#ffee00]/70 font-bold uppercase tracking-widest shrink-0">Evolves:</p>
                                            <p className="text-[10px] md:text-xs text-gray-500 truncate">{u.evoName}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
