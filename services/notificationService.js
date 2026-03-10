/**
 * notificationService.js — Cross-platform system notification wrapper.
 * Uses node-notifier for native OS notifications.
 */

const notifier = require('node-notifier');
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
    notifier.notify(
        {
            title: title || 'VitalPulse',
            message: message || '',
            icon: path.join(__dirname, '..', 'assets', 'icon.png'),
            sound: true,
            wait: true,
            appID: 'com.vitalpulse.app'
        },
        (err, response) => {
            if (response === 'click' || response === 'timeout') {
                if (windowRef) {
                    windowRef.show();
                    windowRef.focus();
                }
            }
        }
    );
}

module.exports = { send, setWindowRef };
