import { create } from 'zustand';

interface GameState {
    hp: number;
    maxHp: number;
    xp: number;
    xpToNext: number;
    level: number;
    killCount: number;
    time: number;
    isPaused: boolean;
    isGameOver: boolean;
    isUpgradeMenuOpen: boolean;

    // Reroll System
    rerolls: number;
    rerollPoints: number;
    paidRerollCount: number; // To track scaling cost

    damage: number;

    setHp: (hp: number, maxHp: number) => void;
    setXp: (xp: number, xpToNext: number, level: number) => void;
    setKillCount: (kills: number) => void;
    setTime: (time: number) => void;
    setPaused: (paused: boolean) => void;
    setGameOver: (over: boolean) => void;
    setUpgradeMenu: (open: boolean) => void;
    setDamage: (damage: number) => void;

    activePowerups: Record<string, number>;
    setActivePowerups: (active: Record<string, number>) => void;

    addRerollPoints: (amount: number) => void;
    useReroll: () => boolean; // Returns true if successful

    reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    hp: 300,
    maxHp: 300,
    xp: 0,
    xpToNext: 20,
    level: 1,
    killCount: 0,
    time: 0,
    isPaused: false,
    isGameOver: false,
    isUpgradeMenuOpen: false,

    rerolls: 3,
    rerollPoints: 0,
    paidRerollCount: 0,

    damage: 25,

    setHp: (hp, maxHp) => set({ hp, maxHp }),
    setXp: (xp, xpToNext, level) => set({ xp, xpToNext, level }),
    setKillCount: (killCount) => set({ killCount }),
    setTime: (time) => set({ time }),
    setPaused: (isPaused) => set({ isPaused }),
    setGameOver: (isGameOver) => set({ isGameOver }),
    setUpgradeMenu: (isUpgradeMenuOpen) => set({ isUpgradeMenuOpen }),
    setDamage: (damage) => set({ damage }),

    addRerollPoints: (amount) => set((state) => ({ rerollPoints: state.rerollPoints + amount })),
    useReroll: () => {
        const state = useGameStore.getState();
        // 1. Try free reroll
        if (state.rerolls > 0) {
            set({ rerolls: state.rerolls - 1 });
            return true;
        }

        // 2. Try paid reroll
        // Cost = Base * (Multiplier ^ PaidCount) ? Or simple linear? 
        // User said: "first payment is x.. second one is 2x then 3x" -> Linear scaling of multiplier.
        // Cost = 75 * (paidRerollCount + 1)
        const cost = 75 * (state.paidRerollCount + 1);

        if (state.rerollPoints >= cost) {
            set({
                rerollPoints: state.rerollPoints - cost,
                paidRerollCount: state.paidRerollCount + 1
            });
            return true;
        }

        return false;
    },

    activePowerups: {},
    setActivePowerups: (active) => set({ activePowerups: active }),

    reset: () => set({
        hp: 300, maxHp: 300, xp: 0, xpToNext: 20, level: 1, damage: 25,
        killCount: 0, time: 0, isPaused: false, isGameOver: false, isUpgradeMenuOpen: false,
        rerolls: 3, rerollPoints: 0, paidRerollCount: 0,
        activePowerups: {}
    })
}));
