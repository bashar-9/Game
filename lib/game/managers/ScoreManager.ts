import { useGameStore } from '../../../store/useGameStore';
import { usePowerUpProgressionStore } from '../../../store/PowerUpProgressionStore';

export class ScoreManager {

    constructor() { }

    addKill() {
        const currentKills = useGameStore.getState().killCount + 1;
        useGameStore.getState().setKillCount(currentKills);
        useGameStore.getState().addRerollPoints(1);
        return currentKills;
    }

    getGemMultiplier(playerLevel: number): number {
        let multiplier = 1;
        if (playerLevel >= 15) {
            const r = Math.random();
            if (r < 0.15) multiplier = 4;      // 15% Chance for 4x
            else if (r < 0.30) multiplier = 2; // 15% Chance for 2x
        } else if (playerLevel >= 8) {
            if (Math.random() < 0.10) multiplier = 2; // 10% Chance for 2x
        }
        return multiplier;
    }

    shouldDropPowerup(currentKills: number): boolean {
        // Formula: BaseRate * (DecayFactor / (DecayFactor + Kills)) * DropRateMultiplier
        const baseRate = 0.005;
        const decayFactor = 750;
        const dropRateMultiplier = usePowerUpProgressionStore.getState().getDropRateMultiplier();
        const dropRate = baseRate * (decayFactor / (decayFactor + currentKills)) * dropRateMultiplier;

        return Math.random() < dropRate;
    }

    getPowerupType(): 'magnet' | 'double_stats' | 'invulnerability' {
        return Math.random() > 0.5 ? 'magnet' : (Math.random() > 0.5 ? 'double_stats' : 'invulnerability');
    }
}
