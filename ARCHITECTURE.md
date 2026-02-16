# 0xSWARM Architecture & Development Guide

> **STATUS**: ACTIVE // **BLUEPRINT**: 0x03
> This document serves as the master blueprint for the game's architecture. All future edits must adhere to the patterns defined here.

## 🏛️ Core Architecture Principles

0xSWARM follows a **Modular Component-Based Architecture** with strict Separation of Concerns.

1.  **Logic vs. Visuals**: Game logic (physics, state) is completely decoupled from Rendering (Canvas API).
    *   *Logic* resides in `lib/game/` (e.g., `Enemy.ts`, `Player.ts`).
    *   *Visuals* reside in `lib/game/rendering/` (e.g., `EnemyRenderer.ts`, `PlayerRenderer.ts`).
2.  **Manager Pattern**: The `Engine` class is a thin orchestrator. It delegates domain-specific logic to specialized Managers.
3.  **Data-Driven Design**: Upgrades, Enemies, and Weapons are defined as data structures or distinct classes, making expansion easy.

---

## 📂 Directory Structure

```
lib/game/
├── Engine.ts               # Main Game Loop (Orchestrator, not God Class)
│
├── managers/               # Core State Systems
│   ├── TimeManager.ts      # Loop timing, delta, pause state
│   ├── ScoreManager.ts     # Score, Kills, Drop rates
│   └── DifficultyManager.ts # Scaling logic
│
├── weapons/                # Offensive capabilities (Logic Only)
│   ├── WeaponManager.ts
│   ├── definitions/        # Individual weapon logic
│   └── types.ts
│
├── enemies/                # Hostile Entities (Logic Only)
│   ├── EnemyManager.ts     # Spawning, Pooling, Updates
│   ├── variants/           # Distinct enemy behaviors
│   └── types.ts
│
├── upgrades/               # Progression System
│   ├── UpgradeManager.ts   # Selection, Application, History
│   ├── definitions/        # One file per upgrade tree
│   └── types.ts
│
└── rendering/              # VISUALS ONLY (No game state mutation)
    ├── RenderSystem.ts     # Main Draw Loop
    └── renderers/          # Component-specific drawers
```

---

## 🛠️ How-To Guides

### 1. How to Add a New Enemy
1.  **Define Type**: Add a new string definition to `EnemyType` in `lib/game/enemies/types.ts`.
2.  **Create Variant**: Create `lib/game/enemies/variants/NewEnemy.ts` (if it needs unique logic) OR just add stats to `BASE_STATS` in `lib/config.ts`.
3.  **Renderer**: Update `lib/game/rendering/renderers/EnemyRenderer.ts` to handle the visual representation of the new type.
4.  **Register**: If using a new class, register it in `EnemyManager` (though most enemies share the base `Enemy` class and just differ by stats/color).

### 2. How to Add a New Weapon
1.  **Create Logic**: Create `lib/game/weapons/definitions/NewWeapon.ts`. It must implement/extend the base Weapon pattern.
2.  **Visuals**: Create a renderer in `lib/game/rendering/renderers/WeaponRenderer.ts` (or a dedicated file if complex).
3.  **Register**: Add it to `WeaponManager` and the `UPGRADES_LIST` (if unlocked via upgrade).

### 3. How to Add a New Upgrade
1.  **Definition**: Create `lib/game/upgrades/definitions/NewUpgrade.ts`.
2.  **Implement**: Implement `Upgrade` interface. Define `id`, `name`, `description`, `apply()`, and optional `evo*` properties.
3.  **Register**: `UpgradeManager` automatically collects it if imported, but ensure it's added to `lib/game/upgrades/definitions/index.ts` (if exists) or imported in `UpgradeManager`.

---

## 🧩 System Details

### Engine & Managers
- **Engine**: Handles the `requestAnimationFrame` loop. It calls `TimeManager.update()`, then only if enough time passed, calls `FixedUpdate()` on other managers. Finally calls `RenderSystem.draw()`.
- **TimeManager**: Handles the "Spiral of Death" prevention/capping and fixed timestep logic.
- **ScoreManager**: Central place for "Kill Event" logic (e.g., drop rates, score multipliers).

### Rendering
- All draw calls use the `RenderContext` object which contains **Read-Only** snapshots of the game state.
- **NEVER** modify game state inside a Renderer (e.g., don't update positions or cooldowns).

### State Management
- **Zustand (`useGameStore`)**: Used for **UI data** (Score, HP bar, Upgrade Menu visibility).
- **Class Properties**: Used for **High-frequency game data** (Position, Velocity, Cooldowns) to avoid React overhead per frame.

---

## ⚠️ Common Pitfalls (Do Not Violate)

1.  **Circular Imports**: `Engine` imports `Managers`. `Managers` should generally NOT import `Engine`. Pass dependencies via methods or constructors.
2.  **God Classes**: Do not add game logic to `Engine.ts`. Find the appropriate Manager.
3.  **Magic Numbers**: Put balance constants in `lib/config.ts` or the specific definition file.
