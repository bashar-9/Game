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

    setHp: (hp: number, maxHp: number) => void;
    setXp: (xp: number, xpToNext: number, level: number) => void;
    setKillCount: (kills: number) => void;
    setTime: (time: number) => void;
    setPaused: (paused: boolean) => void;
    setGameOver: (over: boolean) => void;
    setUpgradeMenu: (open: boolean) => void;
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

    setHp: (hp, maxHp) => set({ hp, maxHp }),
    setXp: (xp, xpToNext, level) => set({ xp, xpToNext, level }),
    setKillCount: (killCount) => set({ killCount }),
    setTime: (time) => set({ time }),
    setPaused: (isPaused) => set({ isPaused }),
    setGameOver: (isGameOver) => set({ isGameOver }),
    setUpgradeMenu: (isUpgradeMenuOpen) => set({ isUpgradeMenuOpen }),
    reset: () => set({
        hp: 300, maxHp: 300, xp: 0, xpToNext: 20, level: 1,
        killCount: 0, time: 0, isPaused: false, isGameOver: false, isUpgradeMenuOpen: false
    })
}));
