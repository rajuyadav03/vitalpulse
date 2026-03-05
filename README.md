# VitalPulse

**AI-powered personal health and productivity assistant** — a cross-platform desktop application built with Electron, React, and SQLite.

## Features

- 🧙 **4-Step Setup Wizard** — Personalized onboarding with optional AI routine generation
- 📊 **Health Score** — 0-100 score based on water, exercise, stretch, sleep, and goals
- 🎯 **Goal Manager** — Daily goals with automatic carry-forward from yesterday
- 💧 **Habit Tracker** — Track water, exercise, stretch breaks, and sleep with progress rings
- ⏱ **Focus Mode** — Pomodoro timer (45/5/15 min) with SVG progress ring
- 🔔 **Smart Reminders** — System notifications for water, stretch, eye rest, meals, workout, and sleep
- 🤖 **AI Routines** — Gemini AI-generated daily plans or smart offline defaults
- 🖥 **System Tray** — Runs in background, minimize to tray, pause/resume reminders

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Electron | 28.x | Desktop framework |
| React | 18.x | UI layer (via Vite) |
| Vite | 5.x | Renderer build tool |
| Zustand | 4.x | State management |
| better-sqlite3 | 9.x | Local database |
| node-notifier | 10.x | System notifications |
| lucide-react | 0.323.x | Icons |
| electron-builder | 24.x | Packaging |

## Prerequisites

- **Node.js** 18+ and npm
- **Python 3.x** (for `better-sqlite3` native build)
- **Windows**: Visual Studio Build Tools (with C++ workload)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: `build-essential`, `libnotify-dev`

## Installation

```bash
# Clone or navigate to the project directory
cd vitalpulse

# Install root dependencies (Electron + native modules)
npm install

# Install renderer dependencies (React + Vite)
cd renderer
npm install
cd ..

# Rebuild native modules for Electron
npm run rebuild
```

## Running in Development

```bash
npm start
```

This starts both the Vite dev server (port 5173) and Electron concurrently.

## Building for Distribution

```bash
# Build the renderer (Vite) first, then package with electron-builder
npm run build
```

Output installers will be in the `dist/` directory:
- **Windows**: `.exe` (NSIS installer)
- **macOS**: `.dmg`
- **Linux**: `.AppImage`

## Environment Variables

Copy `.env.example` to `.env` and optionally add your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

> The API key is only used once during setup to generate your personalized routine. Without it, a smart default routine is generated based on your profile. The app works 100% offline after setup.

## Project Structure

```
vitalpulse/
├── package.json               ← Root Electron package
├── .env.example               ← GEMINI_API_KEY placeholder
├── assets/
│   └── icon.png               ← App icon
├── main/
│   ├── main.js                ← Electron entry (BrowserWindow, tray, IPC)
│   └── preload.js             ← contextBridge IPC bridge
├── services/
│   ├── dbService.js           ← SQLite init + queries
│   ├── reminderEngine.js      ← EventEmitter + timers
│   ├── notificationService.js ← node-notifier wrapper
│   ├── goalManager.js         ← Goal CRUD + carry-forward
│   ├── healthScore.js         ← 0-100 score calculator
│   └── aiService.js           ← Gemini API + fallback
└── renderer/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/global.css
        ├── store/appStore.js
        ├── components/         ← TitleBar, Sidebar, Toast, PageHeader, LoadingScreen
        └── pages/              ← Setup, Dashboard, Goals, Habits, Focus, Routine
```

## License

MIT
