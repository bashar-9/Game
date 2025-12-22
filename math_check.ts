
// math_check.ts
const simulate = () => {
    console.log("Time (min) | Level | Upgrades | Old Dmg | New Dmg | Diff");
    console.log("---------------------------------------------------------");

    // Scenarios: Early, Mid, Late
    const scenarios = [
        { time: 2, level: 5, upgrades: 2 },
        { time: 5, level: 15, upgrades: 6 },
        { time: 10, level: 35, upgrades: 15 },
        { time: 15, level: 55, upgrades: 25 }, // Super late game
    ];

    const baseDmg = 25;

    scenarios.forEach(s => {
        // Old: Dmg * 1.2^upgrades
        // Note: In old system base damage never changed
        const oldDmg = Math.floor(baseDmg * Math.pow(1.2, s.upgrades));

        // New: (Dmg + Level) * (1 + 0.2 * upgrades)
        const newBase = baseDmg + s.level;
        const newMult = 1 + (s.upgrades * 0.2);
        const newDmg = Math.floor(newBase * newMult);

        console.log(`${s.time.toString().padStart(9)} | ${s.level.toString().padStart(5)} | ${s.upgrades.toString().padStart(8)} | ${oldDmg.toString().padStart(7)} | ${newDmg.toString().padStart(7)} | ${newDmg - oldDmg}`);
    });
};

simulate();
