# VOID SWARM

A high-intensity browser-based survival shooter built with **Next.js 14**, **TypeScript**, and **HTML5 Canvas**.

## 🎮 About

Defend against endless waves of viral entities. Collect XP, upgrade your systems, and survive as long as possible. Features procedural difficulty scaling, 10+ upgrades with evolution paths, and a premium cyberpunk UI.

## ✨ Features

- **Survival Gameplay** - Endless waves with dynamic difficulty scaling
- **Upgrade System** - 10+ unique upgrades with evolution milestones
- **3 Difficulty Modes** - Easy, Medium, Hard
- **Responsive Design** - Desktop & mobile optimized
- **Touch Controls** - Virtual joystick for mobile devices
- **Premium UI** - Glassmorphism, animations, and visual effects

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 14 | Framework (App Router) |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling |
| Zustand | State management |
| HTML5 Canvas | Game rendering |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000)

## 🕹️ Controls

| Input | Action |
|-------|--------|
| WASD / Arrow Keys | Move |
| ESC | Pause |
| Touch | Virtual joystick (mobile) |

## 📁 Structure

```
├── app/              # Next.js pages & global styles
├── components/
│   ├── game/         # Canvas game component
│   └── ui/           # UI components (HUD, menus)
├── lib/
│   ├── game/         # Game engine & entities
│   └── config.ts     # Balance & settings
└── store/            # Zustand state
```

## ⚙️ Configuration

Game balance can be adjusted in `lib/config.ts`:
- Player stats (HP, speed, damage)
- Enemy parameters
- Upgrade values & max levels
- Difficulty multipliers

## 🎨 Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Cyan | `#00ffcc` | Primary, Easy mode |
| Yellow | `#ffee00` | XP, Medium mode |
| Red | `#ff0055` | Danger, Hard mode |

## 📄 License

MIT
