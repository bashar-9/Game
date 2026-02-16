<div align="center">

# ⚡ 0xSWARM ⚡

### *Outrun the Leak. Optimize the Swarm.*

![Version](https://img.shields.io/badge/version-0x020201-0bcfa8?style=for-the-badge)
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
- ⚡ **Optimized Core** — Spatial hashing for massive enemy counts

---

## ✨ Features

### ⚔️ Modular Combat System
Weapons are independent modules managed by the `WeaponManager`.

| Weapon | Description |
|--------|-------------|
| **Main Gun** | Auto-targeting projectile stream. Scales with Multishot, Speed, Pierce. |
| **Ion Orbs** | Orbital plasma defense. Scales with Count and Speed. |
| **Repulsion Field** | AOE force field. Pushes enemies away. Scales with Range and Force. |

**Core Mechanics:**
- **Auto-Fire**: Identifying nearest targets via Spatial Hash.
- **Critical Hits**: Calculating damage multipliers based on stats.
- **Pierce**: Projectiles continuing through targets based on penetration rating.

### 📈 Upgrade Paths (Code Modules)
| Module | Effect | Evolution |
|--------|--------|-----------| 
| Module | Effect | Evolution |
|--------|--------|-----------| 
| **MULTISHOT** | +1 Projectile | **MULTISHOT II** (+2 Projectiles) |
| **ATTACK SPEED** | +30% Attack Speed | **BURST_MODE** (+60% Speed) |
| **DAMAGE** | +25% Damage | **POWER_SURGE** (+50% Damage) |
| **MOVE SPEED** | +15% Speed | **HYPERTHREADING** (+40% Speed, +50 HP) |
| **PIERCE** | +1 Pierce | **SPECTRAL PIERCE** (+3 Pierce, +Velocity) |
| **MAX HP** | +150 Max HP | **IRON CORE** (+75 HP, 50% Heal) |
| **REGEN** | +5 HP/sec | **RAPID REPAIR** (+5 HP/sec) |
| **BULLET SIZE** | +1 Bullet Size | **MEGA ROUNDS** (+2 Size) |
| **REPULSION FIELD** | +Range/Force/Dmg | **NOVA WAVE** (Massive Radius) |
| **ION ORBS** | +1 Orb / Speed | **ELECTRON CLOUD** (+5 Orbs, High Speed) |
| **CRIT CHANCE** | +25% Crit Chance | **CERTAIN DOOM** (+25% Chance) |
| **CRIT DAMAGE** | +15% Crit Dmg | **FATAL ERROR** (+30% Crit Dmg) |

### ⚡ Exploit System
Collect rare exploits from terminated processes:

| Exploit | Effect | Base Duration |
|---------|--------|---------------|
| ⚡ **OVERCLOCK** | 3x Damage & Attack Speed | 15 seconds |
| 🔑 **PRIVILEGE_ESC** | Complete damage immunity | 15 seconds |
| 📡 **DATA_SIPHON** | Max Pickup range | 15 seconds |
| 💎 **RNG_EXPLOIT** | +10% Drop Rate (Passive) | — |

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
| 🟢 **SANDBOX** | 1.5x | 1.2x | 1.0x |
| 🟡 **PRODUCTION** | 3.5x | 2.5x | 1.5x |
| 🔴 **THE_VOID** | 6.0x | 4.0x | 3.0x |

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
| **TypeScript** | Type-safe game engine with Modular Architecture |
| **Zustand** | State management with Local Storage persistence |
| **HTML5 Canvas** | Hardware-accelerated rendering (Double Buffered) |
| **Spatial Hash** | O(1) Collision Detection System |
| **Design Patterns** | Component-Entity-System (Lite), Object Pooling, Managers |

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
├── components/             # React UI Components
│   ├── game/               # Game Canvas & Overlay
│   └── ui/                 # HUD, Menus, Screens
│
├── lib/
│   ├── game/
│   │   ├── Engine.ts       # Main Orchestrator
│   │   ├── managers/       # State Systems (Time, Score, Difficulty)
│   │   ├── weapons/        # Weapon Logic & Manager
│   │   ├── enemies/        # Enemy Logic & Spawning
│   │   ├── upgrades/       # Upgrade Definitions & Manager
│   │   ├── rendering/      # Visuals & Renderers
│   │   └── types.ts        # Shared Interfaces
│   │
│   └── config.ts           # Game Balance Settings
│
└── store/
    ├── useGameStore.ts           # Runtime game state
    └── PowerUpProgressionStore.ts # Persistent progression (Local Storage)
```

---

## ⚙️ Configuration

All game balance can be tuned in `lib/config.ts`:

```typescript
// Player Base Stats
BASE_STATS.player = {
  baseHp: 300,
  baseSpeed: 4,
  attackSpeed: 17,      // Lower = faster
  damage: 30,
  critChance: 0.25,     // 25%
  critMultiplier: 2.0   // 200% damage
  // ...mobile adjustments included
}

// Difficulty Multipliers
DIFFICULTY_SETTINGS = {
  easy:   { hpMult: 1.5, dmgMult: 1.2, spawnMult: 1.0 },  // SANDBOX
  medium: { hpMult: 3.5, dmgMult: 2.5, spawnMult: 1.5 },  // PRODUCTION
  hard:   { hpMult: 6.0, dmgMult: 4.0, spawnMult: 3.0 }   // THE_VOID
}
```

---

## 🎨 Design System

<div align="center">

| Color | Hex | Usage |
|:-----:|:---:|:------|
| 🟢 | `#00ffcc` | Primary / Cyan / SANDBOX Mode |
| 🟡 | `#ffee00` | XP / Warnings / PRODUCTION Mode |
| 🔴 | `#aa00ff` | Danger / Tank Enemies / THE_VOID Mode |
| 🟣 | `#ff0055` | Standard Enemy |
| ⚫ | `#0a0a12` | Background |

</div>

---

## 📊 Version History

| Version | Date | Highlights |
|---------|------|------------|
| **0x020201** | Feb 16, 2026 | **Core Re-architecture**: Modular Managers, Weapon/Enemy/Upgrade Separation |
| **0x020101** | Feb 13, 2026 | The Void map, Balance Overhaul, Spatial Hash, SVG Icons |
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
