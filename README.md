<div align="center">

# ⚡ 0xSWARM ⚡

### *Outrun the Leak. Optimize the Swarm.*

![Version](https://img.shields.io/badge/version-0x010200-0bcfa8?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

---

**A high-octane browser survival shooter with roguelike progression, infinite scaling, and a premium cyberpunk aesthetic.**

[🎮 Play Now](swarm.basharramadan.com) • [📖 Features](#-features) • [🎯 Gameplay](#-gameplay) • [⚙️ Configuration](#%EF%B8%8F-configuration)

</div>

---

## 🌟 Overview

**0xSWARM** is a fast-paced survival game where you defend against endless waves of hostile entities. Built with modern web technologies, it delivers a smooth 60 FPS experience on both desktop and mobile devices.

> *"EXECUTE: SURVIVAL_LOOP // DUMP_THE_VOID"*

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
| **Radius Rejection** | AOE damage aura that pushes and burns enemies |

### 📈 Upgrade Paths (Code Modules)
| Module | Effect | Evolution |
|--------|--------|-----------| 
| FORK_PROCESS | +1 Thread | **PARALLEL_EXEC** (+2 Threads) |
| I/O_ACCELERATOR | +30% I/O Speed | **BURST_MODE** (+60% Throughput) |
| VOLTAGE_SPIKE | +25% Voltage | **POWER_SURGE** (+50% Voltage) |
| BUS_VELOCITY | +15% Bus Speed | **HYPERTHREADING** (+40% Speed, +50 HP) |
| POINTER_PIERCERS | +1 Depth | **NULL_TRAVERSAL** (+3 Pierce, +Velocity) |
| ENCAP_SHIELDING | +150 Buffer | **SANDBOXED_CORE** (+75 HP, 50% Heal) |
| SECTOR_REBUILD | +5 Repair/sec | **DEFRAG_DAEMON** (+5 Repair/sec) |
| BUFFER_EXPANSION | +2 Bytes | **HEAP_OVERFLOW** (+2 Size) |
| RADIUS_REJECTION | +Range/Force/Burn | **KERNEL_PANIC_WAVE** (Massive Radius) |
| HEURISTIC_LOGIC | +25% Precision | — |
| BITWISE_BURST | +25% Burst | **STACK_SMASH** (+10% Crit) |

### ⚡ Exploit System
Collect rare exploits from terminated processes:

| Exploit | Effect | Base Duration |
|---------|--------|---------------|
| ⚡ **OVERCLOCK** | 3x Damage & Attack Speed | 15 seconds |
| 🔑 **PRIVILEGE_ESC** | Complete damage immunity | 15 seconds |
| 📡 **DATA_SIPHON** | 5x Pickup range | 15 seconds |

### 🎲 Permanent Upgrades
Spend lifetime deletion points to permanently enhance exploits:

| Upgrade | Effect per Level | Max Bonus |
|---------|------------------|-----------|
| OVERCLOCK Duration | +3 seconds | +27 seconds |
| PRIVILEGE_ESC Duration | +3 seconds | +27 seconds |
| DATA_SIPHON Duration | +3 seconds | +27 seconds |
| **RNG_EXPLOIT** | +10% Drop Rate | +90% Drop Rate |

---

## 🎯 Gameplay

### Difficulty Modes
| Mode | Enemy HP | Enemy Damage | Spawn Rate |
|------|----------|--------------|------------|
| 🟢 **SANDBOX** | 1.0x | 1.0x | 1.0x |
| 🟡 **PRODUCTION** | 2.2x | 1.7x | 1.5x |
| 🔴 **KERNEL_PANIC** | 3.5x | 2.5x | 2.0x |

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
│  0xSWARM - Technical Architecture                  │
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
0xswarm/
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
  easy:   { hpMult: 1.0, dmgMult: 1.0, spawnMult: 1.0 },  // SANDBOX
  medium: { hpMult: 2.2, dmgMult: 1.7, spawnMult: 1.5 },  // PRODUCTION
  hard:   { hpMult: 3.5, dmgMult: 2.5, spawnMult: 2.0 }   // KERNEL_PANIC
}
```

---

## 🎨 Design System

<div align="center">

| Color | Hex | Usage |
|:-----:|:---:|:------|
| 🟢 | `#00ffcc` | Primary / Cyan / SANDBOX Mode |
| 🟡 | `#ffee00` | XP / Warnings / PRODUCTION Mode |
| 🔴 | `#ff0055` | Danger / Enemies / KERNEL_PANIC Mode |
| 🟣 | `#aa00ff` | Tank Enemies / Rare |
| ⚫ | `#0a0a12` | Background |

</div>

---

## 📊 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **0x010200** | Jan 2026 | 0xSWARM rebrand, cyber-glitch aesthetic |
| **1.1.0** | Jan 2026 | Power-up upgrade screen, Hyperdrive rename |
| **1.0.0** | Dec 2025 | Initial release |

---

<div align="center">

## 📄 License

MIT © 2025-2026

---

**Built with 💜 and caffeine**

*Outrun the Leak. Optimize the Swarm.*

</div>
