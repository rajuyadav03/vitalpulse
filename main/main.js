/**
 * main.js — Electron main process entry point.
 * Creates a frameless BrowserWindow, system tray, and registers all IPC handlers.
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

process.on('uncaughtException', (err) => {
    console.error('Fatal Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection:', reason);
});

let pendingCheckin = null;

// Lazy-loaded services (initialized after app.whenReady)
let dbService;
let reminderEngine;
let notificationService;
let goalManager;
let healthScore;
let aiService;
let popupWindowModule;

let mainWindow = null;
let tray = null;
let isQuitting = false;
let hasShownTrayBalloon = false;

/**
 * Create the main application window (frameless with custom titlebar).
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#0D1117',
        show: false,
        icon: path.join(__dirname, '..', 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    // Load content — dev server in development, built files in production
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        // Uncomment to open DevTools automatically:
        // mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
    }

    // Show window when ready to avoid white flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Minimize to tray instead of closing
    mainWindow.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault();
            mainWindow.hide();

            if (!hasShownTrayBalloon && process.platform === 'win32' && tray) {
                tray.displayBalloon({
                    title: 'VitalPulse Minimized',
                    content: 'VitalPulse is running in the background. Click the tray icon to restore.',
                    iconType: 'info'
                });
                hasShownTrayBalloon = true;
            }
        }
    });
}

/**
 * Create the system tray icon with context menu.
 */
function createTray() {
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
    let trayIcon;
    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
    } catch {
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('VitalPulse');

    updateTrayMenu();

    // Left click: show/focus main window
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.focus();
            } else {
                mainWindow.show();
            }
        }
    });
}

/**
 * Update the tray context menu (toggles pause/resume text).
 */
function updateTrayMenu() {
    const isPaused = reminderEngine ? reminderEngine.isPaused() : false;
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Open VitalPulse',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            },
        },
        { type: 'separator' },
        {
            label: isPaused ? '▶ Resume Reminders' : '⏸ Pause Reminders',
            click: () => {
                if (reminderEngine) {
                    if (isPaused) {
                        reminderEngine.resumeAll();
                    } else {
                        reminderEngine.pauseAll();
                    }
                    updateTrayMenu();
                }
            },
        },
        { type: 'separator' },
        {
            label: '✕ Quit VitalPulse',
            click: () => {
                isQuitting = true;
                app.quit();
            },
        },
    ]);

    tray.setContextMenu(contextMenu);
}

/**
 * Initialize all services lazily.
 */
function initServices() {
    dbService = require('../services/dbService');
    const ReminderEngine = require('../services/reminderEngine');
    notificationService = require('../services/notificationService');
    goalManager = require('../services/goalManager');
    healthScore = require('../services/healthScore');
    aiService = require('../services/aiService');
    popupWindowModule = require('./popupWindow');

    // Initialize database
    dbService.init();

    // Create reminder engine instance
    reminderEngine = new ReminderEngine();

    // Listen for reminder events → send notification + push to renderer
    reminderEngine.on('reminder', (data) => {
        pendingCheckin = data;
        notificationService.send({ title: data.title, message: data.message });

        const checkinTypes = ['water', 'stretch', 'eyeRest', 'workout', 'nap', 'meal', 'custom'];
        if (checkinTypes.includes(data.type)) {
            if (data.type === 'custom' && data.popup === false) {
                // Skip if custom reminder is silent
                if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('reminder:fired', data);
                }
            } else {
                popupWindowModule.createCheckinPopup(data);
            }
        } else {
            if (mainWindow && mainWindow.webContents) {
                mainWindow.webContents.send('reminder:fired', data);
            }
        }
    });

    // Start reminder engine if routine exists
    const routine = dbService.getRoutine();
    if (routine) {
        reminderEngine.start(routine);
    } else {
        reminderEngine.startBase();
    }

    // Load custom reminders
    reminderEngine.loadCustomReminders(dbService.getCustomReminders());
}

/**
 * Register all IPC handlers for renderer communication.
 */
function registerIPC() {
    // ─── Window Controls ────────────────────────────────────
    ipcMain.handle('window:minimize', () => {
        if (mainWindow) mainWindow.minimize();
    });

    ipcMain.handle('window:maximize', () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.handle('window:close', () => {
        if (mainWindow) mainWindow.hide();
    });

    // ─── Profile ────────────────────────────────────────────
    ipcMain.handle('profile:get', () => {
        return dbService.getProfile();
    });

    ipcMain.handle('profile:save', (_event, data) => {
        return dbService.saveProfile(data);
    });

    ipcMain.handle('profile:isSetup', () => {
        return dbService.isSetupDone();
    });

    // ─── Routine ────────────────────────────────────────────
    ipcMain.handle('routine:get', () => {
        return dbService.getRoutine();
    });

    ipcMain.handle('routine:generate', async (_event, profile) => {
        const apiKey = process.env.GEMINI_API_KEY || profile.apiKey || '';
        const routine = await aiService.generateRoutineWithAI(profile, apiKey);
        dbService.saveRoutine(routine);

        // Restart reminder engine with new routine
        reminderEngine.start(routine);
        updateTrayMenu();

        return routine;
    });

    ipcMain.handle('routine:update', (_, data) => {
        dbService.saveRoutine(data);
        reminderEngine.start(data);
        updateTrayMenu();
        return { success: true };
    });

    // ─── Goals ──────────────────────────────────────────────
    ipcMain.handle('goals:getToday', () => {
        return goalManager.getTodayGoals();
    });

    ipcMain.handle('goals:add', (_event, text) => {
        const goal = goalManager.addGoal(text);
        _pushHealthScore();
        return goal;
    });

    ipcMain.handle('goals:complete', (_event, id) => {
        const result = goalManager.markComplete(id);
        _pushHealthScore();
        return result;
    });

    ipcMain.handle('goals:delete', (_event, id) => {
        const result = goalManager.deleteGoal(id);
        _pushHealthScore();
        return result;
    });

    // ─── Habits ─────────────────────────────────────────────
    ipcMain.handle('habits:getToday', () => {
        return {
            current: dbService.getTodayHabits(),
            targets: dbService.getHabitTargets()
        };
    });

    ipcMain.handle('habits:log', (_event, type, value) => {
        dbService.logHabit(type, value);
        const score = healthScore.calculate();
        _pushHealthScore();
        return score;
    });

    ipcMain.handle('habits:updateTarget', (_, type, value) => {
        dbService.updateHabitTarget(type, value);
        return dbService.getHabitTargets();
    });

    ipcMain.handle('habits:getAllLogs', () => {
        return dbService.getAllHabitLogs();
    });

    // ─── Health Score ───────────────────────────────────────
    ipcMain.handle('healthScore:get', () => {
        return healthScore.calculate();
    });

    // ─── Reminders ──────────────────────────────────────────
    ipcMain.handle('reminders:getUpcoming', () => {
        return reminderEngine ? reminderEngine.getUpcoming() : [];
    });

    ipcMain.handle('reminders:pause', () => {
        if (reminderEngine) {
            reminderEngine.pauseAll();
            updateTrayMenu();
        }
    });

    ipcMain.handle('reminders:resume', () => {
        if (reminderEngine) {
            reminderEngine.resumeAll();
            updateTrayMenu();
        }
    });

    ipcMain.handle('reminders:isPaused', () => {
        return reminderEngine ? reminderEngine.isPaused() : false;
    });

    ipcMain.handle('reminders:getCustom', () => dbService.getCustomReminders());
    ipcMain.handle('reminders:addCustom', (_, d) => {
        const r = dbService.addCustomReminder(d);
        reminderEngine.loadCustomReminders(dbService.getCustomReminders());
        return r;
    });
    ipcMain.handle('reminders:updateCustom', (_, id, d) => {
        dbService.updateCustomReminder(id, d);
        reminderEngine.loadCustomReminders(dbService.getCustomReminders());
        return { success: true };
    });
    ipcMain.handle('reminders:deleteCustom', (_, id) => {
        dbService.deleteCustomReminder(id);
        reminderEngine.loadCustomReminders(dbService.getCustomReminders());
        return { success: true };
    });
    ipcMain.handle('reminders:toggleCustom', (_, id, active) => {
        dbService.toggleCustomReminder(id, active);
        reminderEngine.loadCustomReminders(dbService.getCustomReminders());
        return { success: true };
    });
    ipcMain.handle('reminders:getCheckinLogs', () => dbService.getCheckinLogs());

    // ─── Settings ───────────────────────────────────────────
    ipcMain.handle('settings:getDataPath', () => app.getPath('userData'));

    ipcMain.handle('settings:openDataFolder', () => {
        require('electron').shell.openPath(app.getPath('userData'));
        return { success: true };
    });

    ipcMain.handle('settings:exportCSV', async (_, type) => {
        const { dialog } = require('electron');
        let rows, filename, headers;
        if (type === 'habits') {
            rows = dbService.getAllHabitLogs();
            headers = 'date,type,value,logged_at';
            filename = 'vitalpulse-habits.csv';
        } else {
            rows = dbService.getAllGoals();
            headers = 'text,date,completed,created_at';
            filename = 'vitalpulse-goals.csv';
        }
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: filename, filters: [{ name: 'CSV', extensions: ['csv'] }]
        });
        if (!result.canceled) {
            const csv = headers + '\n' + rows.map(r => Object.values(r).join(',')).join('\n');
            require('fs').writeFileSync(result.filePath, csv, 'utf8');
            return { success: true, path: result.filePath };
        }
        return { success: false };
    });

    ipcMain.handle('settings:exportJSON', async () => {
        const { dialog } = require('electron');
        const data = {
            profile: dbService.getProfile(),
            routine: dbService.getRoutine(),
            goals: dbService.getAllGoals(),
            habitLogs: dbService.getAllHabitLogs(),
            customReminders: dbService.getCustomReminders(),
            exportedAt: new Date().toISOString(),
        };
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: 'vitalpulse-export.json',
            filters: [{ name: 'JSON', extensions: ['json'] }]
        });
        if (!result.canceled) {
            require('fs').writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
            return { success: true, path: result.filePath };
        }
        return { success: false };
    });

    ipcMain.handle('settings:clearTodayHabits', () => {
        dbService.clearTodayHabitLogs();
        return { success: true };
    });

    ipcMain.handle('settings:deleteAllGoals', () => {
        dbService.deleteAllGoals();
        return { success: true };
    });

    ipcMain.handle('settings:resetRoutine', () => {
        dbService.clearRoutine();
        reminderEngine.stop();
        reminderEngine.startBase();
        updateTrayMenu();
        return { success: true };
    });

    ipcMain.handle('settings:deleteAllData', () => {
        dbService.deleteAllData();
        return { success: true };
    });

    ipcMain.handle('settings:copyToClipboard', (_, text) => {
        require('electron').clipboard.writeText(text);
        return { success: true };
    });

    // ─── Checkin ────────────────────────────────────────────
    ipcMain.handle('checkin:getData', () => pendingCheckin);

    ipcMain.handle('checkin:respond', (_, response) => {
        if (!pendingCheckin) return;
        const data = pendingCheckin;
        pendingCheckin = null;

        if (dbService.logCheckin) {
            dbService.logCheckin(data.type, data.title, response);
        }

        if (response === 'yes') {
            const habitMap = {
                water: { type: 'water', value: 1 },
                stretch: { type: 'stretch', value: 1 },
                eyeRest: { type: 'stretch', value: 0.5 },
                workout: { type: 'exercise', value: 1 },
                nap: { type: 'sleep', value: 0.5 },
                meal: { type: 'water', value: 0 },
            };
            const habitEntry = habitMap[data.type];
            if (habitEntry && habitEntry.value > 0) {
                dbService.logHabit(habitEntry.type, habitEntry.value);
            }
            const score = healthScore.calculate();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('healthScore:update', score);
                mainWindow.webContents.send('reminder:fired', {
                    ...data, response: 'yes'
                });
            }
        } else {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('reminder:fired', {
                    ...data, response: 'no',
                    nudge: "No worries! Try to do it soon 💪"
                });
            }
        }

        const popupWindowRef = popupWindowModule.getPopupWindowRef();
        if (popupWindowRef && !popupWindowRef.isDestroyed()) {
            popupWindowRef.close();
        }
    });
}

/**
 * Push updated health score to the renderer.
 * @private
 */
function _pushHealthScore() {
    if (mainWindow && mainWindow.webContents) {
        const score = healthScore.calculate();
        mainWindow.webContents.send('healthScore:update', score);
    }
}

// ─── App Lifecycle ──────────────────────────────────────────

app.whenReady().then(() => {
    app.setAppUserModelId('com.vitalpulse.app');

    initServices();
    registerIPC();
    createWindow();
    createTray();

    if (notificationService && notificationService.setWindowRef) {
        notificationService.setWindowRef(mainWindow);
    }

    app.on('activate', () => {
        // macOS: re-create window when dock icon clicked
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else if (mainWindow) {
            mainWindow.show();
        }
    });
});

// Prevent quitting when all windows are closed (tray keeps app alive)
app.on('window-all-closed', () => {
    // Intentionally empty — keep process alive in tray
    // App only quits via tray menu "Quit" button
});

app.on('before-quit', () => {
    isQuitting = true;
    if (reminderEngine) {
        reminderEngine.stop();
    }
});
