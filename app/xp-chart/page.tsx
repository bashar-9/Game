'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function XPChartPage() {
    const [maxLevel, setMaxLevel] = useState(60);

    const data = useMemo(() => {
        const points = [];
        let cost = 20; // Base XP for level 1 -> 2
        let totalXp = 0;
        let totalGems = 0;

        for (let i = 1; i <= maxLevel; i++) {
            // Determine Avg XP per Gem based on Level
            // 1-7: 1.0 XP per gem (100% chance for 1XP)
            // 8-14: 1.1 XP per gem (90% 1XP, 10% 2XP)
            // 15+: 1.6 XP per gem (70% 1XP, 15% 2XP, 15% 4XP)
            let avgXp = 1.0;
            if (i >= 8 && i <= 14) avgXp = 1.1;
            if (i >= 15) avgXp = 1.6;

            // Gems needed to reach next level = XP Cost / Avg XP per gem
            const gemsNeeded = Math.ceil(cost / avgXp);

            points.push({
                level: i,
                costXp: cost,
                avgXp: avgXp,
                gemsNeeded: gemsNeeded,
                totalGems: totalGems
            });

            totalXp += cost;
            totalGems += gemsNeeded;
            cost = Math.floor(cost * 1.15);
        }
        return points;
    }, [maxLevel]);

    const maxGemsNeeded = Math.max(...data.map(d => d.gemsNeeded));
    const maxTotalGems = data[data.length - 1].totalGems;

    // Chart dimensions
    const width = 800;
    const height = 400;
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const getX = (level: number) => padding + ((level - 1) / (maxLevel - 1)) * graphWidth;
    const getYCost = (gems: number) => height - padding - (gems / maxGemsNeeded) * graphHeight;
    const getYTotal = (gems: number) => height - padding - (gems / maxTotalGems) * graphHeight;

    return (
        <main className="h-screen w-full overflow-y-auto bg-[#0a0a12] text-white p-8 font-sans relative z-50">
            <Link href="/" className="inline-flex items-center text-[#00ffcc] hover:underline mb-8">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Game
            </Link>

            <h1 className="text-3xl font-bold mb-6 text-[#00ffcc] glow">Levelling Curve (Gems Required)</h1>

            <div className="mb-8 p-6 bg-[#121620] rounded-lg border border-[#00ffcc]/20 shadow-[0_0_15px_rgba(0,255,204,0.1)]">
                <div className="flex items-center gap-4 mb-4">
                    <label className="text-gray-300">Max Level:</label>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        value={maxLevel}
                        onChange={(e) => setMaxLevel(Number(e.target.value))}
                        className="w-48 accent-[#00ffcc]"
                    />
                    <span className="text-[#00ffcc] font-mono">{maxLevel}</span>
                </div>

                <div className="relative w-full overflow-x-auto">
                    <svg width={width} height={height} className="bg-[#0a0a12] rounded border border-gray-800">
                        {/* Grid Lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
                            const y = height - padding - p * graphHeight;
                            return (
                                <g key={p}>
                                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#333" strokeDasharray="4" />
                                    <text x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#666">
                                        {(p * maxGemsNeeded).toFixed(0)}
                                    </text>
                                    <text x={width - padding + 10} y={y + 4} textAnchor="start" fontSize="10" fill="#666">
                                        {(p * maxTotalGems).toFixed(0)}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Event Annotations */}
                        {maxLevel >= 8 && (
                            <g>
                                <line x1={getX(8)} y1={padding} x2={getX(8)} y2={height - padding} stroke="#ffff00" strokeDasharray="4" strokeOpacity="0.3" />
                                <text x={getX(8)} y={padding - 5} textAnchor="middle" fill="#ffff00" fontSize="11">Tier 2 Gems</text>
                            </g>
                        )}
                        {maxLevel >= 15 && (
                            <g>
                                <line x1={getX(15)} y1={padding} x2={getX(15)} y2={height - padding} stroke="#ff9900" strokeDasharray="4" strokeOpacity="0.3" />
                                <text x={getX(15)} y={padding - 20} textAnchor="middle" fill="#ff9900" fontSize="11">Tier 3 Gems</text>
                            </g>
                        )}

                        {/* Cost Line (Gems to Next) */}
                        <path
                            d={`M ${data.map(p => `${getX(p.level)},${getYCost(p.gemsNeeded)}`).join(' L ')}`}
                            fill="none"
                            stroke="#00ffcc"
                            strokeWidth="3"
                        />

                        {/* Cost Area */}
                        <path
                            d={`M ${getX(1)},${height - padding} ${data.map(p => `L ${getX(p.level)},${getYCost(p.gemsNeeded)}`).join(' ')} L ${getX(maxLevel)},${height - padding} Z`}
                            fill="rgba(0, 255, 204, 0.1)"
                        />

                        {/* Total Line (Cumulative Gems) */}
                        <path
                            d={`M ${data.map(p => `${getX(p.level)},${getYTotal(p.totalGems)}`).join(' L ')}`}
                            fill="none"
                            stroke="#ff0055"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />

                        {/* Legend */}
                        <g transform={`translate(${padding + 20}, ${padding})`}>
                            <rect width="12" height="12" fill="#00ffcc" />
                            <text x="20" y="10" fill="#00ffcc" fontSize="14" fontWeight="bold">Gems per Level (Left Axis)</text>
                        </g>

                        <g transform={`translate(${width - padding - 220}, ${padding})`}>
                            <line x1="0" y1="6" x2="20" y2="6" stroke="#ff0055" strokeWidth="2" strokeDasharray="5,5" />
                            <text x="30" y="10" fill="#ff0055" fontSize="14" fontWeight="bold">Total Gems (Right Axis)</text>
                        </g>

                        {/* Axis Labels */}
                        <text x={width / 2} y={height - 20} textAnchor="middle" fill="#888" fontSize="14">Level</text>
                        <text x={15} y={height / 2} transform={`rotate(-90, 15, ${height / 2})`} textAnchor="middle" fill="#666" fontSize="12">Gems Required</text>
                        <text x={width - 15} y={height / 2} transform={`rotate(-90, ${width - 15}, ${height / 2})`} textAnchor="middle" fill="#666" fontSize="12">Total Cumulative</text>
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-[#121620] rounded-lg border border-[#00ffcc]/20">
                    <h2 className="text-xl font-bold mb-4 text-[#00ffcc]">Mechanics</h2>
                    <div className="space-y-4 text-sm text-gray-300">
                        <div>
                            <strong className="text-white block">XP Growth:</strong>
                            <code className="bg-black px-2 py-1 rounded text-[#00ffcc]">floor(prev * 1.15)</code>
                        </div>
                        <div className="space-y-2">
                            <strong className="text-white block">Gem Values (Counter-Scaling):</strong>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <span className="text-gray-400">Levels 1-7:</span>
                                <span>1 XP (Avg: 1.0)</span>

                                <span className="text-gray-400">Levels 8-14:</span>
                                <span>90% 1XP, 10% 2XP (Avg: 1.1)</span>

                                <span className="text-[#ff0055]">Levels 15+:</span>
                                <span>70% 1XP, 15% 2XP, 15% 4XP (Avg: 1.6)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-[#121620] rounded-lg border border-[#00ffcc]/20 max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-[#121620]">
                            <tr className="text-gray-500 border-b border-gray-800">
                                <th className="pb-2">Level</th>
                                <th className="pb-2">XP Need</th>
                                <th className="pb-2">Avg XP/Gem</th>
                                <th className="pb-2 text-[#00ffcc]">Gems Need</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row) => (
                                <tr key={row.level} className="border-b border-gray-800/50 hover:bg-white/5">
                                    <td className="py-2 text-white font-bold">{row.level}</td>
                                    <td className="py-2 text-gray-400">{row.costXp.toLocaleString()}</td>
                                    <td className="py-2 text-yellow-500">{row.avgXp.toFixed(2)}</td>
                                    <td className="py-2 text-[#00ffcc] font-mono">{row.gemsNeeded}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
