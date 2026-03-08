/**
 * notificationService.js — Cross-platform system notification wrapper.
 * Uses node-notifier for native OS notifications.
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
    if (!Notification.isSupported()) return;
    const n = new Notification({
        title: title || 'VitalPulse',
        body: message || '',
        icon: path.join(__dirname, '..', 'assets', 'icon.png'),
        silent: false,
        urgency: 'normal',
        timeoutType: 'default'
    });
    n.on('click', () => {
        if (windowRef) {
            windowRef.show();
            windowRef.focus();
        }
    });
    n.show();
}

module.exports = { send, setWindowRef };
