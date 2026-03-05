/**
 * preload.js — Electron preload script.
 * Exposes a safe API bridge via contextBridge.
 * The renderer can ONLY access window.api — no direct Node.js access.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // ─── Window Controls ────────────────────────────────────
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        maximize: () => ipcRenderer.invoke('window:maximize'),
        close: () => ipcRenderer.invoke('window:close'),
    },

    // ─── Profile ────────────────────────────────────────────
    profile: {
        get: () => ipcRenderer.invoke('profile:get'),
        save: (data) => ipcRenderer.invoke('profile:save', data),
        isSetup: () => ipcRenderer.invoke('profile:isSetup'),
    },

    // ─── Routine ────────────────────────────────────────────
    routine: {
        get: () => ipcRenderer.invoke('routine:get'),
        generate: (profile) => ipcRenderer.invoke('routine:generate', profile),
    },

    // ─── Goals ──────────────────────────────────────────────
    goals: {
        getToday: () => ipcRenderer.invoke('goals:getToday'),
        add: (text) => ipcRenderer.invoke('goals:add', text),
        complete: (id) => ipcRenderer.invoke('goals:complete', id),
        delete: (id) => ipcRenderer.invoke('goals:delete', id),
    },

    // ─── Habits ─────────────────────────────────────────────
    habits: {
        getToday: () => ipcRenderer.invoke('habits:getToday'),
        log: (type, value) => ipcRenderer.invoke('habits:log', type, value),
    },

    // ─── Health Score ───────────────────────────────────────
    healthScore: {
        get: () => ipcRenderer.invoke('healthScore:get'),
    },

    // ─── Reminders ──────────────────────────────────────────
    reminders: {
        getUpcoming: () => ipcRenderer.invoke('reminders:getUpcoming'),
        pause: () => ipcRenderer.invoke('reminders:pause'),
        resume: () => ipcRenderer.invoke('reminders:resume'),
        isPaused: () => ipcRenderer.invoke('reminders:isPaused'),
    },

    // ─── Event Listeners (main → renderer pushes) ──────────
    on: (channel, callback) => {
        // Whitelist allowed channels
        const allowedChannels = ['reminder:fired', 'healthScore:update'];
        if (!allowedChannels.includes(channel)) {
            console.warn(`[Preload] Blocked subscription to unknown channel: ${channel}`);
            return () => { };
        }

        const handler = (_event, ...args) => callback(...args);
        ipcRenderer.on(channel, handler);

        // Return cleanup function
        return () => {
            ipcRenderer.removeListener(channel, handler);
        };
    },
});
