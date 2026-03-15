/**
 * popupWindow.js — Creates a small interactive check-in popup.
 */

const { BrowserWindow } = require('electron');
const path = require('path');

let popupWindowRef = null;

function createCheckinPopup(reminderData) {
    if (popupWindowRef && !popupWindowRef.isDestroyed()) {
        // If one is already open, focus it or return it
        return popupWindowRef;
    }

    popupWindowRef = new BrowserWindow({
        width: 400,
        height: 240,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        center: true,
        skipTaskbar: true,
        backgroundColor: '#0D1117',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    if (process.env.NODE_ENV === 'development') {
        popupWindowRef.loadURL('http://localhost:5173/#/checkin');
    } else {
        popupWindowRef.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'), { hash: '/checkin' });
    }

    // Auto-close after 30 seconds
    const timeout = setTimeout(() => {
        if (popupWindowRef && !popupWindowRef.isDestroyed()) {
            popupWindowRef.webContents.send('checkin:timeout');
        }
    }, 30000);

    popupWindowRef.on('closed', () => {
        clearTimeout(timeout);
        popupWindowRef = null;
    });

    return popupWindowRef;
}

function getPopupWindowRef() {
    return popupWindowRef;
}

module.exports = { createCheckinPopup, getPopupWindowRef };
