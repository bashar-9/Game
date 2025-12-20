'use client';

import { useState, useRef, useEffect } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import HUD from '@/components/ui/HUD';
import StartScreen from '@/components/ui/StartScreen';
import GameOverScreen from '@/components/ui/GameOverScreen';
import UpgradeMenu from '@/components/ui/UpgradeMenu';
import PauseMenu from '@/components/ui/PauseMenu';
import { useGameStore } from '@/store/useGameStore';
import { Engine } from '@/lib/game/Engine';

export default function Home() {
  const [gameState, setGameState] = useState<'start' | 'playing'>('start');
  const [diffMode, setDiffMode] = useState<'easy' | 'normal' | 'hard'>('normal');
  const engineRef = useRef<Engine | null>(null);

  const isGameOver = useGameStore(s => s.isGameOver);
  const isUpgradeMenuOpen = useGameStore(s => s.isUpgradeMenuOpen);
  const isPaused = useGameStore(s => s.isPaused);
  const resetStore = useGameStore(s => s.reset);

  const startGame = (difficulty: 'easy' | 'normal' | 'hard') => {
    resetStore();
    setDiffMode(difficulty);
    setGameState('playing');
  };

  const handleRestart = () => {
    setGameState('start');
  };

  const handleResume = () => {
    engineRef.current?.resumeGame();
  };

  const handleQuit = () => {
    setGameState('start');
  };

  const handleUpgradeSelect = (id: string) => {
    engineRef.current?.selectUpgrade(id);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const store = useGameStore.getState();
      if (e.key === 'Escape' && gameState === 'playing' && !store.isGameOver && !store.isUpgradeMenuOpen) {
        if (store.isPaused) {
          engineRef.current?.resumeGame();
        } else {
          engineRef.current?.pauseGame();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      {gameState === 'start' && (
        <StartScreen onStart={startGame} />
      )}

      {gameState === 'playing' && (
        <>
          <GameCanvas
            diffMode={diffMode}
            gameRunning={true}
            onEngineInit={(engine) => engineRef.current = engine}
          />
          <HUD />

          {isGameOver && <GameOverScreen onRestart={handleRestart} />}
          {isUpgradeMenuOpen && <UpgradeMenu onSelect={handleUpgradeSelect} />}
          {isPaused && !isUpgradeMenuOpen && !isGameOver && (
            <PauseMenu onResume={handleResume} onQuit={handleQuit} />
          )}
        </>
      )}
    </main>
  );
}
