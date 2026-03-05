/**
 * notificationService.js — Cross-platform system notification wrapper.
 * Uses node-notifier for native OS notifications.
 */

const notifier = require('node-notifier');
const path = require('path');

/**
 * Send a system notification.
 * @param {{ title: string, message: string }} options
 */
function send({ title, message }) {
    const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');

    notifier.notify(
        {
            title: title || 'VitalPulse',
            message: message || '',
            icon: iconPath,
            appID: 'com.vitalpulse.app',
            sound: true,
            wait: false,
        },
        (err) => {
            if (err) {
                console.error('[NotificationService] Failed to send notification:', err.message);
            }
        }
    );
}

module.exports = { send };
