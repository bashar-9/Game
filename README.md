# Void Swarm - Operation Anima

A high-intensity browser-based survival game built with **Next.js**, **TypeScript**, and **Canvas API**.

## 🎮 Game Overview
Defend the system core against endless waves of viral entities. Collect data (XP), upgrade your defense protocols, and survive as long as possible.

**Current Version:** 2.0 (Next.js Refactor)

## 🚀 Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Graphics:** HTML5 Canvas (Custom Engine)

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1.  Navigate to the project directory:
    ```bash
    cd swarmjs
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🕹️ Controls
- **Movement:** `W`, `A`, `S`, `D` or Arrow Keys
- **Pause:** `Esc`
- **Mobile:** Touch Joystick enabled on touch devices

## 📂 Project Structure
```
swarmjs/
├── app/                  # Next.js App Router pages
├── components/
│   ├── game/             # Game Canvas component
│   └── ui/               # React UI Logic (HUD, Modals)
├── lib/
│   ├── game/             # Pure TypeScript Game Engine & Entity Classes
│   ├── config.ts         # Game Constants & Balance Settings
│   └── utils.ts          # Helpers
└── store/                # Zustand State Store
```

## ⚙️ Configuration
Game balance (Health, Damage, Spawn Rates) can be tweaked in:
`lib/config.ts`

## 📄 License
MIT
