---
description: How to test and fix bugs in VitalPulse desktop application
---

# VitalPulse — Test & Fix Bugs

## Prerequisites
// turbo
1. Make sure you are in the vitalpulse project root:
   ```bash
   cd E:\maintainer\vitalpulse
   ```

## Step 1: Verify Dependencies Are Installed
// turbo
```bash
ls node_modules/electron/dist/electron.exe && ls renderer/node_modules/.package-lock.json && echo "DEPS OK"
```
If missing, run:
```bash
npm install && cd renderer && npm install && cd .. && npx @electron/rebuild -f -w better-sqlite3
```

## Step 2: Build the Renderer
// turbo
```bash
cd renderer && npx vite build 2>&1 && cd ..
```
- Check for TypeScript/JSX errors in output
- Fix any import errors or missing dependencies

## Step 3: Test Electron Main Process (No UI)
// turbo
Verify main process loads without crashing:
```bash
NODE_ENV=development npx electron . --no-sandbox 2>err.txt &
sleep 5
cat err.txt
kill %1 2>/dev/null
```
- If `err.txt` has errors, fix the reported module/path/require issues
- Common issues: missing native module, wrong require path, SQLite compile mismatch

## Step 4: Launch Full App for UI Testing
```bash
npm start
```
This starts Vite dev server (port 5173) + Electron concurrently.

### What to check:
1. **Window** — App window opens, custom titlebar renders, minimize/maximize/close work
2. **Setup Wizard** (first launch only) — All 4 steps navigate correctly, form validation works, submit saves to DB
3. **Dashboard** — Greeting shows correct name, health score renders, quick log buttons update score
4. **Goals** — Add/complete/delete goals, carry-forward badge appears for yesterday's incomplete goals
5. **Habits** — Progress rings update on log, score contribution displays correctly
6. **Focus Mode** — Timer counts down, auto-switches modes, session dots appear
7. **Routine** — Daily schedule, meals, workout, hydration, sleep sections render
8. **System Tray** — Tray icon visible, right-click menu works, pause/resume toggles
9. **Close to Tray** — Clicking X hides window (not quits), tray "Open" restores it
10. **Notifications** — System notification fires on reminder interval

## Step 5: Check Database
// turbo
```bash
node -e "
  const Database = require('better-sqlite3');
  const path = require('path');
  const db = new Database(path.join(process.env.APPDATA || process.env.HOME, 'vitalpulse', 'vitalpulse.db'));
  console.log('Tables:', db.prepare(\"SELECT name FROM sqlite_master WHERE type='table'\").all());
  console.log('Profile:', db.prepare('SELECT * FROM profile').all());
  console.log('Goals:', db.prepare('SELECT * FROM goals LIMIT 5').all());
  console.log('Habits:', db.prepare('SELECT * FROM habit_logs LIMIT 5').all());
  db.close();
"
```

## Step 6: Test Production Build
// turbo
```bash
npm run build:renderer
```
Then test the production-mode app:
```bash
npx electron . 2>err.txt &
sleep 5
cat err.txt
kill %1 2>/dev/null
```

## Step 7: Build Distributable
// turbo
```bash
npx electron-builder --win portable 2>&1 | tail -20
```
Verify output:
```bash
ls -lh dist/win-unpacked/VitalPulse.exe
```

---

## Common Bug Fixes

### Native module crash (better-sqlite3)
```bash
npx @electron/rebuild -f -w better-sqlite3
```

### Electron binary missing
```bash
rm -rf node_modules/electron && npm install electron@28
```

### Renderer build fails
```bash
cd renderer && rm -rf node_modules && npm install && npx vite build
```

### IPC channel not found
- Check `main/preload.js` — ensure channel name matches between `ipcMain.handle()` in `main.js` and `ipcRenderer.invoke()` in `preload.js`
- All channels must follow pattern: `namespace:action` (e.g., `profile:get`, `goals:add`)

### Blank white window
- Check if Vite dev server is running on port 5173
- In production mode, check if `renderer/dist/index.html` exists
- Check browser console: Right-click tray icon → Open DevTools (or press Ctrl+Shift+I if the window is focused during development)

### SQLite "database is locked"
- Ensure only one instance of the app is running
- Check WAL mode is enabled: `db.pragma('journal_mode = WAL')`

### System tray icon not showing
- Verify `assets/icon.png` exists and is a valid image
- On Linux, `libappindicator` may be needed
