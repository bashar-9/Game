'use client';

import { useState, useEffect, useMemo } from 'react';
import { UPGRADES_LIST, BASE_STATS, DIFFICULTY_SETTINGS } from '@/lib/config';
import { GameIcon } from './GameIcons';
import { getDifficulty } from '@/lib/utils'; // Assumes this is exported

interface BalanceTesterProps {
    onBack: () => void;
}

export default function BalanceTester({ onBack }: BalanceTesterProps) {
    // --- STATE ---
    const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('hard');

    // Base Stats Overrides (starts with config defaults)
    const [baseStats, setBaseStats] = useState({ ...BASE_STATS.player });

    // Upgrade Levels
    const [upgradeLevels, setUpgradeLevels] = useState<Record<string, number>>({});

    // Simulation Settings
    const [simTime, setSimTime] = useState(20); // Minutes
    const [enemyType, setEnemyType] = useState<'basic' | 'tank' | 'swarm'>('basic');

    // Initialize upgrades with 0
    useEffect(() => {
        const initial: Record<string, number> = {};
        UPGRADES_LIST.forEach(u => initial[u.id] = 0);
        setUpgradeLevels(initial);
    }, []);

    // --- CALCULATIONS ---
    const simulationData = useMemo(() => {
        const data = [];
        const steps = simTime * 4; // 4 data points per minute (every 15s)

        // Calculate Player Derived Stats
        // 1. Total Level = Sum of all upgrades + 1
        const totalLevel = Object.values(upgradeLevels).reduce((a, b) => a + b, 0) + 1;

        // 2. Modifiers from Upgrades
        let dmgMod = 0;
        let hasteMod = 0;
        let speedMod = 1;
        let hpAdd = 0;
        let regenAdd = 0;
        let projAdd = 0;
        let pierceAdd = 0;
        let critChanceAdd = 0;
        let critMultAdd = 0;

        // Apply Upgrade Logic (Simplified simulation of Apply methods)
        // We know what each upgrade does based on ID
        const getCount = (id: string) => upgradeLevels[id] || 0;

        dmgMod += getCount('damage') * 0.25;
        // Evolutions (Simple approximation: checked if maxed?)
        if (getCount('damage') >= 15) dmgMod += 0.5; // Power Surge

        hasteMod += getCount('haste') * 0.30;
        if (getCount('haste') >= 15) hasteMod += 0.6; // Burst Mode

        speedMod = Math.pow(1.15, getCount('speed'));
        if (getCount('speed') >= 10) speedMod *= 1.4; // Hyperthreading

        hpAdd += getCount('maxhp') * 150;
        if (getCount('maxhp') >= 15) hpAdd += 75; // Iron Core

        regenAdd += getCount('regen') * 5;
        if (getCount('regen') >= 10) regenAdd += 5;

        projAdd += getCount('multishot');
        if (getCount('multishot') >= 15) projAdd += 2;

        pierceAdd += getCount('pierce');
        if (getCount('pierce') >= 8) pierceAdd += 3;

        critChanceAdd += getCount('critChance') * 0.25;
        critMultAdd += getCount('critDamage') * 0.25;
        if (getCount('critDamage') >= 10) critMultAdd += 0.10;


        // Player Stats
        const finalDamage = Math.floor((baseStats.damage + (totalLevel - 1)) * (1 + dmgMod));
        // Attack Speed (Attacks Per Second)
        // Original logic: Delay = Base / (1 + Mod) -> Attacks/Sec = 60 / Delay = 60 / (Base / (1+Mod)) = 60*(1+Mod)/Base
        // Base AttackSpeed is DELAY in frames (e.g. 18)
        const attackDelay = baseStats.attackSpeed / (1 + hasteMod);
        const attacksPerSec = 60 / Math.max(4, attackDelay); // Cap at 15 APS (4 frames)

        const projCount = baseStats.projectileCount + projAdd;
        const critChance = Math.min(1.0, baseStats.critChance + critChanceAdd);
        const critMult = baseStats.critMultiplier + critMultAdd;

        // DPS Calculation
        // Avg Damage per Hit = Damage * (1 - CritChance) + (Damage * CritMult * CritChance)
        const avgHit = finalDamage * (1 - critChance) + (finalDamage * critMult * critChance);
        // Raw DPS = AvgHit * AttacksPerSec * ProjectileCount
        // (Assuming all projectiles hit - simplified)
        const dps = avgHit * attacksPerSec * projCount;
        // With Pierce? Pierce linearizes AOE. Let's assume hitting 1 + Pierce targets for effective DPS
        const effectiveDps = dps * (1 + baseStats.pierce + pierceAdd);


        // --- TIME SIMULATION ---
        const diffSettings = DIFFICULTY_SETTINGS[difficulty];
        const enemyBaseStats = BASE_STATS.enemies[enemyType];

        for (let t = 0; t <= steps; t++) {
            const timeMin = t * 0.25; // 0, 0.25, 0.5 ...
            const timeSec = timeMin * 60;

            const diffValue = getDifficulty(timeSec);

            // Enemy HP Calculation (from Enemy.ts)
            // hp = base * diffScale * settingsMult * levelMult
            // Problem: Enemy level scales with Player Level. 
            // In game, player levels up over time. Here we have a FIXED player level.
            // Assumption: User wants to see how a SPECIFIC build performs vs Time.
            // OR: User might want "Auto Level" mode where Player Level = Time curve? 
            // The prompt said: "auto inscrease level, ..eg if i have level 5 spped and level 5 dmg total palyer level will be 10"
            // So the player stats are STATIC for this simulation, representing a snapshot.
            // BUT Enemy HP scales with Player Level too: `levelMult = 1 + (playerLevel * 0.1)`.

            const levelMult = 1 + (totalLevel * 0.1);
            const diffScale = 1 + (Math.max(0, diffValue - 1) * 0.7);

            const enemyHp = enemyBaseStats.hpBase * diffScale * diffSettings.hpMult * levelMult;
            const enemyDmg = enemyBaseStats.damageBase * diffSettings.dmgMult * (1 + (diffValue * 0.15));

            // Time To Kill
            const ttk = enemyHp / dps;

            data.push({
                time: timeMin,
                enemyHp,
                enemyDmg,
                playerDps: dps,
                effectiveDps,
                ttk
            });
        }

        return { data, stats: { totalLevel, dps, effectiveDps, finalDamage, attacksPerSec, hp: baseStats.baseHp + hpAdd } };
    }, [baseStats, upgradeLevels, simTime, difficulty, enemyType]);

    // --- RENDERING ---
    const { data, stats } = simulationData;
    const maxVal = Math.max(...data.map(d => Math.max(d.enemyHp, d.playerDps)));

    // Log scale helper
    const getLogY = (val: number) => {
        const min = 10;
        const max = Math.max(100000, maxVal);
        const logMin = Math.log10(min);
        const logMax = Math.log10(max);
        const logVal = Math.log10(Math.max(min, val));
        return 100 - ((logVal - logMin) / (logMax - logMin)) * 100;
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-950 text-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-900">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg">← Back</button>
                    <h1 className="text-xl font-bold text-[#00ffcc]">⚖️ Balance Tester</h1>
                </div>
                <div className="flex gap-4 text-sm font-mono">
                    <span className="text-white/50">LEVEL <b className="text-white">{stats.totalLevel}</b></span>
                    <span className="text-white/50">DPS <b className="text-[#00ffcc]">{Math.round(stats.dps).toLocaleString()}</b></span>
                    <span className="text-white/50">HP <b className="text-[#ff0055]">{stats.hp}</b></span>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* SETTINGS PANEL (Left) */}
                <div className="w-80 border-r border-white/10 overflow-y-auto p-4 space-y-6 bg-slate-900/50">

                    {/* Global Settings */}
                    <section className="space-y-3">
                        <label className="text-xs font-bold text-white/40 uppercase">Simulation</label>
                        <div className="space-y-2">
                            <select
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value as any)}
                                className="w-full bg-slate-800 border border-white/10 rounded p-2 text-sm"
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            <select
                                value={enemyType}
                                onChange={e => setEnemyType(e.target.value as any)}
                                className="w-full bg-slate-800 border border-white/10 rounded p-2 text-sm"
                            >
                                <option value="basic">Basic Enemy</option>
                                <option value="tank">Tank</option>
                                <option value="swarm">Swarm</option>
                            </select>
                        </div>
                    </section>

                    {/* Upgrades */}
                    <section className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-white/40 uppercase">Upgrades</label>
                            <button
                                onClick={() => {
                                    const next = { ...upgradeLevels };
                                    Object.keys(next).forEach(k => next[k] = 0);
                                    setUpgradeLevels(next);
                                }}
                                className="text-[10px] text-red-400 hover:text-red-300"
                            >RESET</button>
                        </div>
                        <div className="space-y-1">
                            {UPGRADES_LIST.map(u => (
                                <div key={u.id} className="space-y-1 bg-white/5 p-2 rounded">
                                    <div className="flex justify-between text-xs">
                                        <span className={upgradeLevels[u.id] ? 'text-[#00ffcc]' : 'text-white/50'}>{u.name}</span>
                                        <span className="font-mono">{upgradeLevels[u.id] || 0}/{u.maxLevel}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max={u.maxLevel}
                                        value={upgradeLevels[u.id] || 0}
                                        onChange={e => setUpgradeLevels(p => ({ ...p, [u.id]: parseInt(e.target.value) }))}
                                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ffcc]"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Base Stats */}
                    <section className="space-y-3">
                        <label className="text-xs font-bold text-white/40 uppercase">Base Stats Override</label>
                        <div className="space-y-2">
                            {Object.entries(baseStats).map(([key, val]) => {
                                if (typeof val !== 'number') return null;
                                return (
                                    <div key={key} className="flex justify-between items-center text-xs">
                                        <span className="text-white/50">{key}</span>
                                        <input
                                            type="number"
                                            value={val}
                                            onChange={e => setBaseStats(p => ({ ...p, [key]: parseFloat(e.target.value) }))}
                                            className="w-16 bg-slate-800 border border-white/10 rounded px-1 py-0.5 text-right"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </div>

                {/* VISUALIZATION (Right) */}
                <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">

                    {/* Chart 1: HP vs DPS */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-white/5 h-[350px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white/60">Enemy HP vs Player DPS (Log Scale)</h3>
                            <div className="flex gap-4 text-[10px]">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00ffcc]"></span> Player DPS</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff0055]"></span> Enemy HP</span>
                            </div>
                        </div>

                        <div className="flex-1 relative border-l border-b border-white/10 ml-8 mb-6">
                            {/* Grid Lines */}
                            {[0, 25, 50, 75, 100].map(y => (
                                <div key={y} className="absolute left-0 right-0 border-t border-white/5" style={{ top: `${y}%` }}>
                                    <span className="absolute -left-9 -top-2 text-[9px] text-white/30 w-7 text-right font-mono">
                                        10^{Math.round(5 - (y / 25))}
                                    </span>
                                </div>
                            ))}

                            {/* SVG Chart */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                {/* Player DPS Line */}
                                <polyline
                                    points={data.map((d, i) => {
                                        const x = (i / (data.length - 1)) * 100; // %
                                        const y = getLogY(d.playerDps || 1); // Clamp to 1 to avoid log(0)
                                        return `${x},${y}`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="#00ffcc"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {/* Enemy HP Line */}
                                <polyline
                                    points={data.map((d, i) => {
                                        const x = (i / (data.length - 1)) * 100; // %
                                        const y = getLogY(d.enemyHp || 1);
                                        return `${x},${y}`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="#ff0055"
                                    strokeWidth="2"
                                    strokeDasharray="4 2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>

                            {/* Time Labels */}
                            <div className="absolute top-full left-0 right-0 flex justify-between mt-2">
                                {[0, 5, 10, 15, 20].map(m => (
                                    <span key={m} className="text-[9px] text-white/30 w-4 text-center" style={{ left: `${(m / simTime) * 100}%` }}>{m}m</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chart 2: Difficulty Curve */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-white/5 h-[200px] flex flex-col">
                        <h3 className="text-sm font-bold text-white/60 mb-4">Difficulty Scaling Factor</h3>
                        <div className="flex-1 relative border-l border-b border-white/10 ml-8 mb-6">
                            {/* SVG Chart */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                <path
                                    d={`M 0 100 L ` + data.map((d, i) => {
                                        const x = (i / (data.length - 1)) * 100;
                                        // Max diff is roughly 50-60 in 20 mins currently?
                                        // Let's dynamic scale
                                        const maxDiff = Math.max(...data.map(x => getDifficulty(x.time * 60)));
                                        const diff = getDifficulty(d.time * 60);
                                        const y = 100 - (diff / maxDiff) * 100;
                                        return `${x} ${y}`;
                                    }).join(' ') + ` L 100 100 Z`}
                                    fill="rgba(255, 238, 0, 0.1)"
                                    stroke="none"
                                />
                                <polyline
                                    points={data.map((d, i) => {
                                        const x = (i / (data.length - 1)) * 100;
                                        const maxDiff = Math.max(...data.map(x => getDifficulty(x.time * 60)));
                                        const diff = getDifficulty(d.time * 60);
                                        const y = 100 - (diff / maxDiff) * 100;
                                        return `${x},${y}`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="#ffee00"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                            {/* Y-Axis Label */}
                            <div className="absolute left-0 top-0 bottom-0 -ml-8 flex flex-col justify-between text-[9px] text-white/30 py-1">
                                <span>Max</span>
                                <span>0</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart 3: TTK */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-white/5 h-[200px] flex flex-col">
                        <h3 className="text-sm font-bold text-white/60 mb-4">Time To Kill (Seconds)</h3>
                        <div className="flex-1 relative border-l border-b border-white/10 ml-8 mb-6 flex items-end px-1 gap-[1px]">
                            {/* Bars */}
                            {data.map((d, i) => {
                                const height = Math.min(100, (d.ttk / 5) * 100); // Cap at 5s for visualization
                                const color = d.ttk > 2 ? '#ff0055' : d.ttk > 0.5 ? '#ffee00' : '#00ffcc';
                                return (
                                    <div
                                        key={i}
                                        className="flex-1 hover:opacity-80 transition-opacity relative group"
                                        style={{ height: `${height}%`, backgroundColor: color }}
                                    >
                                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 bg-black/90 px-2 py-1 rounded text-[9px] whitespace-nowrap z-10 pointer-events-none mb-1 border border-white/10">
                                            {d.time}m: {d.ttk.toFixed(2)}s
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="absolute left-0 top-0 bottom-0 -ml-8 flex flex-col justify-between text-[9px] text-white/30 py-1">
                                <span>5s+</span>
                                <span>0s</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart 4: Single Enemy HP Trend */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-white/5 h-[250px] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white/60">Single Enemy HP Trend</h3>
                        </div>
                        <div className="flex-1 relative border-l border-b border-white/10 ml-8 mb-6">
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                <polyline
                                    points={data.map((d, i) => {
                                        const x = (i / (data.length - 1)) * 100; // %
                                        const y = getLogY(d.enemyHp || 1);
                                        return `${x},${y}`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="#ffee00"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                            <div className="absolute left-0 top-0 bottom-0 -ml-8 flex flex-col justify-between text-[9px] text-white/30 py-1">
                                <span>10^6</span>
                                <span>10^2</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart 5: Spawn Rate & Density */}
                    <div className="bg-slate-900 rounded-xl p-4 border border-white/5 h-[200px] flex flex-col">
                        <h3 className="text-sm font-bold text-white/60 mb-4">Spawn Rate / Sec</h3>
                        <div className="flex-1 relative border-l border-b border-white/10 ml-8 mb-6">
                            {/* SVG Chart */}
                            <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                                <polyline
                                    points={data.map((d, i) => {
                                        const timeSec = d.time * 60;
                                        const diffVal = getDifficulty(timeSec);
                                        const earlyGameRamp = Math.min(1.0, 0.40 + (timeSec / 180) * 0.60);
                                        const densityCap = Math.max(1, diffVal);
                                        const settings = DIFFICULTY_SETTINGS[difficulty];
                                        const spawnChance = Math.min(0.55, 0.02 * settings.spawnMult * densityCap * earlyGameRamp);
                                        const spawnsPerSec = spawnChance * 60;

                                        const x = (i / (data.length - 1)) * 100;
                                        // Max around 33/sec
                                        const y = 100 - (spawnsPerSec / 35) * 100;
                                        return `${x},${y}`;
                                    }).join(' ')}
                                    fill="none"
                                    stroke="#0088ff"
                                    strokeWidth="2"
                                    vectorEffect="non-scaling-stroke"
                                />
                            </svg>
                            {/* Y-Axis Label */}
                            <div className="absolute left-0 top-0 bottom-0 -ml-8 flex flex-col justify-between text-[9px] text-white/30 py-1">
                                <span>35/s</span>
                                <span>0</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
