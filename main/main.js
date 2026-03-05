/**
 * main.js — Electron main process entry point.
 * Creates a frameless BrowserWindow, system tray, and registers all IPC handlers.
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Lazy-loaded services (initialized after app.whenReady)
let dbService;
let reminderEngine;
let notificationService;
let goalManager;
let healthScore;
let aiService;

let mainWindow = null;
let tray = null;
let isQuitting = false;

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

    // Initialize database
    dbService.init();

    // Create reminder engine instance
    reminderEngine = new ReminderEngine();

    // Listen for reminder events → send notification + push to renderer
    reminderEngine.on('reminder', (data) => {
        notificationService.send({ title: data.title, message: data.message });
        if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('reminder:fired', data);
        }
    });

    // Start reminder engine if routine exists
    const routine = dbService.getRoutine();
    if (routine) {
        reminderEngine.start(routine);
    }
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
        return dbService.getTodayHabits();
    });

    ipcMain.handle('habits:log', (_event, type, value) => {
        dbService.logHabit(type, value);
        const score = healthScore.calculate();
        _pushHealthScore();
        return score;
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
    initServices();
    registerIPC();
    createWindow();
    createTray();

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
    if (process.platform !== 'darwin') {
        // On non-macOS, we keep the app running via tray
        // Only quit when isQuitting is true
    }
});

app.on('before-quit', () => {
    isQuitting = true;
    if (reminderEngine) {
        reminderEngine.stop();
    }
});
