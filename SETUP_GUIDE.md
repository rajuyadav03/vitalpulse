# VitalPulse — Setup Guide

A complete guide to install and run VitalPulse on any PC.

---

## 🟢 Option 1: For Regular Users (No Coding Required)

### Windows

1. **Download** `VitalPulse-1.0.0-Windows.zip` from the [Releases](https://github.com/rajuyadav03/vitalpulse/releases) page
2. **Extract** the zip anywhere (e.g. Desktop or Documents)
3. **Open** the extracted folder and double-click **`VitalPulse.exe`**
4. That's it! The setup wizard will guide you through the rest

> **Note:** Windows may show a "Windows protected your PC" warning on first launch.  
> Click **"More info"** → **"Run anyway"** — the app is safe.

### macOS

1. Download the `.dmg` file from Releases
2. Open the `.dmg` and drag **VitalPulse** to your **Applications** folder
3. Open VitalPulse from Applications
4. If macOS blocks it: go to **System Preferences → Security & Privacy → Open Anyway**

### Linux

1. Download the `.AppImage` file from Releases
2. Make it executable: `chmod +x VitalPulse-*.AppImage`
3. Double-click or run `./VitalPulse-*.AppImage`

---

## 🔧 Option 2: For Developers (Build From Source)

### Prerequisites

| Tool | Version | How to Install |
|------|---------|----------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) — download LTS |
| **Git** | Any | [git-scm.com](https://git-scm.com) |
| **Python** | 3.x | [python.org](https://python.org) (needed for native module compilation) |
| **C++ Build Tools** | — | See platform-specific instructions below |

#### Windows C++ Build Tools
Open **PowerShell as Administrator** and run:
```powershell
npm install --global windows-build-tools
```
Or install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with the **"Desktop development with C++"** workload.

#### macOS C++ Build Tools
```bash
xcode-select --install
```

#### Linux Build Tools
```bash
sudo apt-get install build-essential libnotify-dev
```

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone https://github.com/rajuyadav03/vitalpulse.git
cd vitalpulse

# 2. Install root dependencies (Electron + native modules)
npm install

# 3. Install renderer dependencies (React + Vite)
cd renderer
npm install
cd ..

# 4. Rebuild native modules for Electron
npx @electron/rebuild -f -w better-sqlite3

# 5. Start the app in development mode
npm start
```

The app will open automatically. On first launch, you'll see the **Setup Wizard**.

### Build an Installer for Distribution

```bash
# Build the React frontend
npm run build:renderer

# Package into a portable .exe (Windows)
npx electron-builder --win portable

# The output is in dist/win-unpacked/VitalPulse.exe
# You can zip and share this folder
```

For macOS: `npx electron-builder --mac`  
For Linux: `npx electron-builder --linux`

---

## 🚀 First Launch — Setup Wizard

When VitalPulse opens for the first time, you'll see a **4-step setup wizard**:

| Step | What It Does |
|------|-------------|
| **1. Profile** | Enter your name, age, height, weight |
| **2. Lifestyle** | Select activity level and health goals |
| **3. Schedule** | Set your wake time, sleep time, work hours |
| **4. AI Key** *(optional)* | Enter a Gemini API key for AI-generated routines |

> **No API key?** No problem! VitalPulse generates a smart default routine based on your profile. The app works **100% offline** after setup.

### Getting a Gemini API Key (Optional)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Copy the key and paste it in Step 4 of the wizard

---

## 📱 Using VitalPulse

### Dashboard
- View your **health score** (0–100) with grade and motivational message
- **Quick log** buttons: Water 💧, Exercise 🏋️, Stretch 🧘, Sleep 😴
- See today's **goals** and **upcoming reminders**

### Goals
- Add daily goals and check them off as you complete them
- Incomplete goals **carry forward** to the next day automatically

### Habits
- Track water intake, exercise minutes, stretch breaks, and sleep hours
- Visual **progress rings** show how close you are to daily targets

### Focus Mode
- **Pomodoro timer**: 45 min focus → 5 min break → repeat
- After 4 sessions: 15 min long break
- Session counter tracks your daily progress

### My Routine
- View your personalized daily schedule, meal plan, workout plan, hydration times, and sleep routine

### System Tray
- **Minimize to tray**: Closing the window keeps VitalPulse running in the background
- **Right-click tray icon** to:
  - Open the app
  - Pause/Resume reminders
  - Quit completely

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Windows blocks the app | Click "More info" → "Run anyway" |
| macOS blocks the app | System Preferences → Security → Open Anyway |
| Blank white screen | Make sure Vite dev server is running (`npm start`) |
| Native module crash | Run `npx @electron/rebuild -f -w better-sqlite3` |
| "Electron failed to install" | Run `rm -rf node_modules/electron && npm install electron@28` |
| No notifications | Check your OS notification settings for VitalPulse |
| Database error | Delete `%APPDATA%/vitalpulse/vitalpulse.db` and restart |

---

## 📁 Data Location

VitalPulse stores all data locally on your machine:

| OS | Path |
|----|------|
| Windows | `%APPDATA%\vitalpulse\` |
| macOS | `~/Library/Application Support/vitalpulse/` |
| Linux | `~/.config/vitalpulse/` |

Your data is never uploaded anywhere. Everything stays on your device.
