'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import GameCanvas from '@/components/game/GameCanvas';
import HUD from '@/components/ui/HUD';
import StartScreen from '@/components/ui/StartScreen';
import GameOverScreen from '@/components/ui/GameOverScreen';
import UpgradeMenu from '@/components/ui/UpgradeMenu';
import PauseMenu from '@/components/ui/PauseMenu';
// Import DevMenu properly
import DevMenu from '@/components/ui/DevMenu';
import { useGameStore } from '@/store/useGameStore';
import { Engine } from '@/lib/game/Engine';
import { resetUpgrades } from '@/lib/config';

export default function Home() {

  const [gameState, setGameState] = useState<'start' | 'playing'>('start');
  const [diffMode, setDiffMode] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [showDevMenu, setShowDevMenu] = useState(false);
  const engineRef = useRef<Engine | null>(null);

  // Dev Menu State
  const [devClicks, setDevClicks] = useState(0);

  // Stable callback to initialization the engine ref
  const handleEngineInit = useCallback((engine: Engine) => {
    engineRef.current = engine;
  }, []);

  const isGameOver = useGameStore(s => s.isGameOver);
  const isUpgradeMenuOpen = useGameStore(s => s.isUpgradeMenuOpen);
  const isPaused = useGameStore(s => s.isPaused);
  const resetStore = useGameStore(s => s.reset);

  const startGame = (difficulty: 'easy' | 'medium' | 'hard', initialConfig?: { level: number; upgrades: Record<string, number>; startTime?: number }) => {
    resetUpgrades();
    resetStore();
    setDiffMode(difficulty);
    setGameState('playing');

    // We need to wait for the engine to mount and init, so we pass this config via a temporary window object or 
    // better yet, we just wait for the ref to be available in a useEffect, OR we modify GameCanvas to accept init props.
    // Simpler: Set a global variable or store that the Engine checks on construction.
    if (initialConfig) {
      (window as any).__DEV_CONFIG__ = initialConfig;
    } else {
      (window as any).__DEV_CONFIG__ = null;
    }
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
    <main
      className="relative w-screen h-screen overflow-hidden bg-black touch-none select-none overscroll-none"
      onTouchMove={(e) => e.preventDefault()}
    >
      {gameState === 'start' && (
        <>
          <StartScreen
            onStart={(diff) => startGame(diff)}
            onTitleClick={() => {
              const newClicks = devClicks + 1;
              setDevClicks(newClicks);
              if (newClicks >= 5) {
                setShowDevMenu(true);
                setDevClicks(0);
              }
            }}
          />
          {/* Dev Menu Overlay */}
          {showDevMenu && (
            <DevMenu
              onStart={(cfg) => {
                startGame('easy', cfg);
                setShowDevMenu(false);
              }}
              onClose={() => setShowDevMenu(false)}
            />
          )}
        </>
      )}

      {gameState === 'playing' && (
        <>
          <GameCanvas
            diffMode={diffMode}
            gameRunning={true}
            onEngineInit={handleEngineInit}
          />
          <HUD />

          {isGameOver && <GameOverScreen onRestart={handleRestart} />}
          {isUpgradeMenuOpen && <UpgradeMenu onSelect={handleUpgradeSelect} player={engineRef.current?.player} />}
          {isPaused && !isUpgradeMenuOpen && !isGameOver && (
            <PauseMenu onResume={handleResume} onQuit={handleQuit} />
          )}
        </>
      )}
    </main>
  );
}
