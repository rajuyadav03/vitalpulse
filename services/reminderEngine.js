/**
 * reminderEngine.js — Manages recurring and scheduled health reminders.
 * Extends EventEmitter to emit 'reminder' events that the main process listens to.
 */

const { EventEmitter } = require('events');

class ReminderEngine extends EventEmitter {
    constructor() {
        super();
        this.paused = false;
        this.recurringTimers = [];
        this.scheduledTimers = [];
        this.routine = null;
    }

    /**
     * Start the reminder engine with recurring reminders and (optionally) a routine.
     * @param {Object|null} routine - The AI-generated routine data
     */
    start(routine) {
        this.stop(); // Clear any existing timers
        this.routine = routine;
        this._startRecurring();
        if (routine) {
            this._startScheduled(routine);
        }
    }

    /**
     * Stop all timers.
     */
    stop() {
        for (const timer of this.recurringTimers) {
            clearInterval(timer);
        }
        for (const timer of this.scheduledTimers) {
            clearTimeout(timer);
        }
        this.recurringTimers = [];
        this.scheduledTimers = [];
    }

    /**
     * Pause all reminders (they keep ticking but won't fire events).
     */
    pauseAll() {
        this.paused = true;
    }

    /**
     * Resume all reminders.
     */
    resumeAll() {
        this.paused = false;
    }

    /**
     * Check if reminders are currently paused.
     * @returns {boolean}
     */
    isPaused() {
        return this.paused;
    }

    /**
     * Get upcoming reminders for the next period.
     * Returns sorted list of upcoming reminders with minutesAway.
     * @returns {Array} Next 6 upcoming reminders
     */
    getUpcoming() {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        const upcoming = [];

        // Add recurring reminders (show next occurrence)
        const recurringTypes = [
            { type: 'water', intervalMin: 60, title: '💧 Drink Water', message: 'Drink a glass of water' },
            { type: 'stretch', intervalMin: 45, title: '🧘 Stretch Break', message: 'Stand up and stretch for 2 minutes' },
            { type: 'eyeRest', intervalMin: 20, title: '👁 Eye Rest', message: 'Look 20 feet away for 20 seconds (20-20-20 rule)' },
        ];

        for (const r of recurringTypes) {
            const minutesAway = r.intervalMin - (nowMinutes % r.intervalMin);
            upcoming.push({
                type: r.type,
                title: r.title,
                message: r.message,
                minutesAway,
                isRecurring: true,
            });
        }

        // Add scheduled reminders from routine
        if (this.routine) {
            const scheduled = this._getScheduledList(this.routine);
            for (const s of scheduled) {
                const [h, m] = s.time.split(':').map(Number);
                const targetMinutes = h * 60 + m;
                let minutesAway = targetMinutes - nowMinutes;
                if (minutesAway < 0) minutesAway += 1440; // wrap to next day
                upcoming.push({
                    ...s,
                    minutesAway,
                    isRecurring: false,
                });
            }
        }

        // Sort by minutesAway, return top 6
        upcoming.sort((a, b) => a.minutesAway - b.minutesAway);
        return upcoming.slice(0, 6);
    }

    /**
     * Start recurring interval-based reminders.
     * @private
     */
    _startRecurring() {
        const reminders = [
            {
                type: 'water',
                interval: 60 * 60 * 1000, // 60 minutes
                title: '💧 Drink Water',
                message: 'Drink a glass of water',
            },
            {
                type: 'stretch',
                interval: 45 * 60 * 1000, // 45 minutes
                title: '🧘 Stretch Break',
                message: 'Stand up and stretch for 2 minutes',
            },
            {
                type: 'eyeRest',
                interval: 20 * 60 * 1000, // 20 minutes
                title: '👁 Eye Rest',
                message: 'Look 20 feet away for 20 seconds (20-20-20 rule)',
            },
        ];

        for (const r of reminders) {
            const timer = setInterval(() => {
                if (!this.paused) {
                    this.emit('reminder', {
                        type: r.type,
                        title: r.title,
                        message: r.message,
                    });
                }
            }, r.interval);
            this.recurringTimers.push(timer);
        }
    }

    /**
     * Start daily scheduled reminders from the routine data.
     * @param {Object} routine - The routine data containing meal, workout, nap, sleep schedules
     * @private
     */
    _startScheduled(routine) {
        const scheduled = this._getScheduledList(routine);

        for (const s of scheduled) {
            this._scheduleDaily(s.time, s.title, s.message, s.type);
        }
    }

    /**
     * Build a list of scheduled reminder entries from routine data.
     * @param {Object} routine - The routine data
     * @returns {Array} List of {time, title, message, type}
     * @private
     */
    _getScheduledList(routine) {
        const list = [];

        // Meal reminders
        if (routine.mealSchedule && Array.isArray(routine.mealSchedule)) {
            for (const meal of routine.mealSchedule) {
                list.push({
                    time: meal.time,
                    title: `🍽 ${meal.name || 'Meal Time'}`,
                    message: meal.suggestion || `Time for ${meal.name}`,
                    type: 'meal',
                });
            }
        }

        // Workout reminder
        if (routine.workoutTime) {
            list.push({
                time: routine.workoutTime,
                title: '💪 Workout Time',
                message: routine.workoutNote || 'Time for your workout session!',
                type: 'workout',
            });
        }

        // Nap reminder
        if (routine.napTime) {
            list.push({
                time: routine.napTime,
                title: '😴 Power Nap',
                message: `Take a ${routine.napDuration || 20}-minute power nap`,
                type: 'nap',
            });
        }

        // Sleep wind-down reminder
        if (routine.sleepRoutine && routine.sleepRoutine.windDownTime) {
            list.push({
                time: routine.sleepRoutine.windDownTime,
                title: '🌙 Wind Down',
                message: 'Start winding down for bed — dim lights, no screens',
                type: 'sleep',
            });
        }

        return list;
    }

    /**
     * Schedule a daily timeout for a specific time.
     * Automatically reschedules for the next day once fired.
     * @param {string} timeStr - "HH:MM" format
     * @param {string} title
     * @param {string} message
     * @param {string} type
     * @private
     */
    _scheduleDaily(timeStr, title, message, type) {
        if (!timeStr || !timeStr.includes(':')) return;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(hours, minutes, 0, 0);

        // If the target time already passed today, schedule for tomorrow
        if (target <= now) {
            target.setDate(target.getDate() + 1);
        }

        const msUntil = target.getTime() - now.getTime();

        const timer = setTimeout(() => {
            if (!this.paused) {
                this.emit('reminder', { type, title, message });
            }
            // Reschedule for next day
            this._scheduleDaily(timeStr, title, message, type);
        }, msUntil);

        this.scheduledTimers.push(timer);
    }
}

module.exports = ReminderEngine;
