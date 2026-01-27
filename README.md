<div align="center">

# ⚔️ VOID SWARM ⚔️

### *Survive the Infinite. Evolve Beyond Limits.*

![Version](https://img.shields.io/badge/version-1.2.0-00ffcc?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

---

**A high-octane browser survival shooter with roguelike progression, infinite scaling, and a premium cyberpunk aesthetic.**

[🎮 Play Now](#-quick-start) • [📖 Features](#-features) • [🎯 Gameplay](#-gameplay) • [⚙️ Configuration](#%EF%B8%8F-configuration)

</div>

---

## 🌟 Overview

**VOID SWARM** is a fast-paced survival game where you defend against endless waves of hostile entities. Built with modern web technologies, it delivers a smooth 60 FPS experience on both desktop and mobile devices.

> *"How long can you survive?"*

- 🔥 **Infinite Scaling** — Difficulty ramps forever. No safety nets.
- 🎲 **Roguelike Elements** — Each run is unique with randomized upgrade choices
- 💎 **Permanent Progression** — Unlock and enhance power-ups across runs
- 📱 **Cross-Platform** — Play anywhere with responsive touch controls

---

## ✨ Features

### 🔫 Combat System
| Feature | Description |
|---------|-------------|
| **Auto-Fire** | Continuous projectile stream towards nearest threat |
| **Critical Hits** | Up to 100% crit chance with massive damage multipliers |
| **Pierce** | Bullets pass through multiple enemies |
| **Repulsion Field** | AOE damage aura that pushes and burns enemies |

### 📈 Upgrade Paths (10+ Upgrades)
| Upgrade | Effect | Evolution |
|---------|--------|-----------|
| Split-Fire Mod | +1 Projectile | **Bullet Storm** (+2 Projectiles) |
| Hyper-Loader | +30% Attack Speed | **Minigun Mech** (+60% Attack Speed) |
| Plasma Core | +25% Damage | **Fusion Reactor** (+50% Damage) |
| Ionic Thrusters | +15% Move Speed | **Warp Drive** (+40% Speed, +50 HP) |
| Tungsten Rounds | +1 Pierce | **Spectral Shells** (+3 Pierce, +Velocity) |
| Titan Plating | +150 Max HP | **Behemoth Hull** (+75 HP, 50% Heal) |
| Nano Repair | +5 HP/sec | **Living Metal** (+5 HP/sec) |
| High Caliber | +2 Bullet Size | **Graviton Rounds** (+2 Size) |
| Repulsion Field | +Range/Force/Burn | **Supernova** (Massive Radius) |
| Targeting CPU | +25% Crit Chance | — |
| Gauss Coil | +25% Crit Damage | **Railgun** (+10% Crit) |

### ⚡ Power-Up System
Collect rare power-ups from defeated enemies:

| Power-Up | Effect | Base Duration |
|----------|--------|---------------|
| 🌟 **Hyperdrive** | 3x Damage & Attack Speed | 15 seconds |
| 🛡️ **Invulnerability** | Complete damage immunity | 15 seconds |
| 🧲 **Magnet** | 5x Pickup range | 15 seconds |

### 🍀 Permanent Upgrades
Spend lifetime kill points to permanently enhance power-ups:

| Upgrade | Effect per Level | Max Bonus |
|---------|------------------|-----------|
| Hyperdrive Duration | +3 seconds | +27 seconds |
| Invulnerability Duration | +3 seconds | +27 seconds |
| Magnet Duration | +3 seconds | +27 seconds |
| **Lucky Star** | +10% Drop Rate | +90% Drop Rate |

---

## 🎯 Gameplay

### Difficulty Modes
| Mode | Enemy HP | Enemy Damage | Spawn Rate |
|------|----------|--------------|------------|
| 🟢 **Easy** | 1.0x | 1.0x | 1.0x |
| 🟡 **Medium** | 2.2x | 1.7x | 1.5x |
| 🔴 **Hard** | 3.5x | 2.5x | 2.0x |

### Enemy Types
| Type | Behavior | Threat Level |
|------|----------|--------------|
| 🔴 **Basic** | Standard pursuit | ★★☆ |
| 🟡 **Swarm** | Fast, weak fodder | ★☆☆ |
| 🟣 **Tank** | Slow, massive HP | ★★★ |

### Controls
| Platform | Control | Action |
|----------|---------|--------|
| Desktop | `W` `A` `S` `D` | Move |
| Desktop | `Arrow Keys` | Move |
| Desktop | `ESC` | Pause |
| Mobile | Touch & Drag | Virtual Joystick |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────┐
│  VOID SWARM - Technical Architecture               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐    ┌─────────────┐                │
│  │  Next.js 14 │───▶│   React 18  │                │
│  │  App Router │    │  Components │                │
│  └─────────────┘    └─────────────┘                │
│         │                  │                        │
│         ▼                  ▼                        │
│  ┌─────────────┐    ┌─────────────┐                │
│  │  TypeScript │    │   Zustand   │                │
│  │   Engine    │    │    State    │                │
│  └─────────────┘    └─────────────┘                │
│         │                  │                        │
│         └────────┬─────────┘                        │
│                  ▼                                  │
│         ┌─────────────────┐                        │
│         │  HTML5 Canvas   │                        │
│         │   60 FPS Loop   │                        │
│         └─────────────────┘                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe game engine |
| **Tailwind CSS** | Utility-first styling |
| **Zustand** | Lightweight state management |
| **HTML5 Canvas** | Hardware-accelerated rendering |

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/bashar-9/Game.git
cd Game

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build && npm start
```

Open **[http://localhost:3000](http://localhost:3000)** and start surviving!

---

## 📁 Project Structure

```
void-swarm/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main game page
│   └── globals.css        # Global styles
│
├── components/
│   ├── game/
│   │   └── GameCanvas.tsx # Canvas wrapper component
│   └── ui/
│       ├── StartScreen.tsx
│       ├── GameOverScreen.tsx
│       ├── UpgradeMenu.tsx
│       ├── PowerUpUpgradeScreen.tsx
│       └── HUD.tsx
│
├── lib/
│   ├── game/
│   │   ├── Engine.ts      # Core game loop
│   │   ├── Player.ts      # Player entity
│   │   ├── Enemy.ts       # Enemy entities
│   │   ├── Bullet.ts      # Projectile system
│   │   ├── Pickup.ts      # XP & Power-ups
│   │   └── SoundManager.ts
│   ├── config.ts          # Game balance & settings
│   └── utils.ts           # Helper functions
│
└── store/
    ├── useGameStore.ts           # Runtime game state
    └── PowerUpProgressionStore.ts # Persistent progression
```

---

## ⚙️ Configuration

All game balance can be tuned in `lib/config.ts`:

```typescript
// Player Base Stats
BASE_STATS.player = {
  baseHp: 300,
  baseSpeed: 4,
  damage: 30,
  attackSpeed: 17,      // Lower = faster
  critChance: 0.25,     // 25%
  critMultiplier: 1.75  // 175% damage
}

// Difficulty Multipliers
DIFFICULTY_SETTINGS = {
  easy:   { hpMult: 1.0, dmgMult: 1.0, spawnMult: 1.0 },
  medium: { hpMult: 2.2, dmgMult: 1.7, spawnMult: 1.5 },
  hard:   { hpMult: 3.5, dmgMult: 2.5, spawnMult: 2.0 }
}
```

---

## 🎨 Design System

<div align="center">

| Color | Hex | Usage |
|:-----:|:---:|:------|
| 🟢 | `#00ffcc` | Primary / Cyan / Easy Mode |
| 🟡 | `#ffee00` | XP / Warnings / Medium Mode |
| 🔴 | `#ff0055` | Danger / Enemies / Hard Mode |
| 🟣 | `#aa00ff` | Tank Enemies / Rare |
| ⚫ | `#0a0a12` | Background |

</div>

---

## 📊 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **1.2.0** | Jan 2026 | Lucky Star drop rate upgrade, improved decay |
| **1.1.0** | Jan 2026 | Power-up upgrade screen, Hyperdrive rename |
| **1.0.0** | Dec 2025 | Initial release |

---

<div align="center">

## 📄 License

MIT © 2025-2026

---

**Built with 💜 and caffeine**

*Survive. Evolve. Dominate.*

</div>
