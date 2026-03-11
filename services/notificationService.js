/**
 * notificationService.js — Cross-platform system notification wrapper.
 * Uses Electron's native Notification API for reliable OS notifications.
 */

const { Notification } = require('electron');
const path = require('path');

let windowRef = null;

function setWindowRef(win) {
    windowRef = win;
}

/**
 * Send a system notification.
 * @param {{ title: string, message: string }} options
 */
function send({ title, message }) {
    if (Notification.isSupported()) {
        const notification = new Notification({
            title: title || 'VitalPulse',
            body: message || '',
            icon: path.join(__dirname, '..', 'assets', 'icon.png'),
            silent: false,
        });

        notification.on('click', () => {
            if (windowRef) {
                if (windowRef.isMinimized()) windowRef.restore();
                windowRef.show();
                windowRef.focus();
            }
        });

        notification.show();
    } else {
        console.warn('System notifications are not supported on this OS.');
    }
}

module.exports = { send, setWindowRef };
