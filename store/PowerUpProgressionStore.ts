import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    MAX_POWERUP_LEVEL,
    KILLS_PER_POINT,
    POWERUP_DURATION_PER_LEVEL,
    BASE_POWERUP_DURATIONS,
    POWERUP_UPGRADE_COSTS
} from '@/lib/config';

export type PowerupType = 'double_stats' | 'invulnerability' | 'magnet' | 'drop_rate';

interface PowerUpProgressionState {
    totalLifetimeKills: number;
    spentPoints: number;
    powerUpLevels: Record<PowerupType, number>;

    // Actions
    addKills: (amount: number) => void;
    upgradePowerUp: (type: PowerupType) => boolean;
    getAvailablePoints: () => number;
    getPowerUpCost: (type: PowerupType) => number;
    getPowerUpDuration: (type: PowerupType) => number;
    getDropRateMultiplier: () => number;
    resetProgress: () => void;
}

export const usePowerUpProgressionStore = create<PowerUpProgressionState>()(
    persist(
        (set, get) => ({
            totalLifetimeKills: 0,
            spentPoints: 0,
            powerUpLevels: {
                double_stats: 1,
                invulnerability: 1,
                magnet: 1,
                drop_rate: 1
            },

            addKills: (amount) => set((state) => ({
                totalLifetimeKills: state.totalLifetimeKills + amount
            })),

            getAvailablePoints: () => {
                const state = get();
                const totalPoints = Math.floor(state.totalLifetimeKills / KILLS_PER_POINT);
                return Math.max(0, totalPoints - state.spentPoints);
            },

            getPowerUpCost: (type) => {
                const state = get();
                const currentLevel = state.powerUpLevels[type];
                if (currentLevel >= MAX_POWERUP_LEVEL) return 999999;
                // Cost index is equal to current level (e.g. if Level 1, cost is index 1 which is for 1->2)
                return POWERUP_UPGRADE_COSTS[currentLevel] || 999999;
            },

            upgradePowerUp: (type) => {
                const state = get();
                const cost = state.getPowerUpCost(type);
                const available = state.getAvailablePoints();

                if (available >= cost && state.powerUpLevels[type] < MAX_POWERUP_LEVEL) {
                    set((s) => ({
                        spentPoints: s.spentPoints + cost,
                        powerUpLevels: {
                            ...s.powerUpLevels,
                            [type]: s.powerUpLevels[type] + 1
                        }
                    }));
                    return true;
                }
                return false;
            },

            getPowerUpDuration: (type) => {
                const state = get();
                const level = state.powerUpLevels[type];
                const base = BASE_POWERUP_DURATIONS[type];
                if (!base) return 0; // drop_rate has no duration
                const bonus = (level - 1) * POWERUP_DURATION_PER_LEVEL;
                return base + bonus;
            },

            getDropRateMultiplier: () => {
                const state = get();
                const level = state.powerUpLevels['drop_rate'];
                // +10% per level, so level 1 = 1.0x, level 2 = 1.1x, level 10 = 1.9x
                return 1 + (level - 1) * 0.10;
            },

            resetProgress: () => set({
                totalLifetimeKills: 0,
                spentPoints: 0,
                powerUpLevels: {
                    double_stats: 1,
                    invulnerability: 1,
                    magnet: 1,
                    drop_rate: 1
                }
            })
        }),
        {
            name: 'void_swarm_progression', // unique name for localStorage key
            storage: createJSONStorage(() => localStorage),
            version: 2, // Bump version to trigger migration
            migrate: (persistedState: any, version: number) => {
                if (version < 2) {
                    // Add drop_rate if missing from old saves
                    if (!persistedState.powerUpLevels?.drop_rate) {
                        persistedState.powerUpLevels = {
                            ...persistedState.powerUpLevels,
                            drop_rate: 1
                        };
                    }
                }
                return persistedState;
            }
        }
    )
);
