/**
 * dbService.js — SQLite database initialization and all query operations.
 * Uses better-sqlite3 in WAL mode for performance.
 * Single file at app.getPath('userData')/vitalpulse.db
 */

const path = require('path');
const { app } = require('electron');

let db = null;

/**
 * Initialize the database connection and create tables if needed.
 */
function init() {
    const Database = require('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'vitalpulse.db');

    db = new Database(dbPath);

    // Enable WAL mode for better concurrent performance
    db.pragma('journal_mode = WAL');

    // Create tables
    db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id            INTEGER PRIMARY KEY,
      name          TEXT NOT NULL,
      age           INTEGER,
      height_cm     REAL,
      weight_kg     REAL,
      goal          TEXT,
      work_type     TEXT,
      wake_time     TEXT,
      sleep_time    TEXT,
      workout_level TEXT,
      setup_done    INTEGER DEFAULT 0,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routine (
      id         INTEGER PRIMARY KEY,
      data       TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS goals (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      text        TEXT NOT NULL,
      date        TEXT NOT NULL,
      completed   INTEGER DEFAULT 0,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      date      TEXT NOT NULL,
      type      TEXT NOT NULL,
      value     REAL NOT NULL DEFAULT 0,
      logged_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS custom_reminders (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      start_time  TEXT NOT NULL,
      end_time    TEXT,
      repeat      TEXT NOT NULL DEFAULT 'daily',
      type        TEXT NOT NULL DEFAULT 'popup',
      notes       TEXT,
      active      INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checkin_logs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      reminder_type TEXT NOT NULL,
      reminder_name TEXT,
      response      TEXT NOT NULL,
      logged_at     TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS habit_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT UNIQUE NOT NULL,
      target REAL NOT NULL
    );
    INSERT OR IGNORE INTO habit_targets (type, target) VALUES ('water', 8), ('exercise', 1), ('stretch', 4), ('sleep', 8);
  `);

    // Migrate to add priority if missing
    try {
        db.prepare('ALTER TABLE goals ADD COLUMN priority TEXT DEFAULT "med"').run();
    } catch (e) { }

    return db;
}

/* ─────────── Profile ─────────── */

/**
 * Get the user profile (there's only ever one row).
 * @returns {Object|null} Profile row or null
 */
function getProfile() {
    const stmt = db.prepare('SELECT * FROM profile WHERE id = 1');
    return stmt.get() || null;
}

/**
 * Save or update the user profile.
 * Uses upsert (INSERT OR REPLACE) to ensure only one profile row.
 * @param {Object} data - Profile fields
 * @returns {Object} The saved profile row
 */
function saveProfile(data) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO profile (id, name, age, height_cm, weight_kg, goal, work_type, wake_time, sleep_time, workout_level, setup_done)
    VALUES (1, @name, @age, @height_cm, @weight_kg, @goal, @work_type, @wake_time, @sleep_time, @workout_level, @setup_done)
  `);

    stmt.run({
        name: data.name || '',
        age: data.age || null,
        height_cm: data.height_cm || null,
        weight_kg: data.weight_kg || null,
        goal: data.goal || null,
        work_type: data.work_type || null,
        wake_time: data.wake_time || null,
        sleep_time: data.sleep_time || null,
        workout_level: data.workout_level || null,
        setup_done: data.setup_done !== undefined ? data.setup_done : 1,
    });

    return getProfile();
}

/**
 * Check if the user has completed the setup wizard.
 * @returns {boolean}
 */
function isSetupDone() {
    const profile = getProfile();
    return profile ? profile.setup_done === 1 : false;
}

/* ─────────── Routine ─────────── */

/**
 * Get the saved AI routine.
 * @returns {Object|null} Parsed routine JSON or null
 */
function getRoutine() {
    const stmt = db.prepare('SELECT * FROM routine ORDER BY id DESC LIMIT 1');
    const row = stmt.get();
    if (!row) return null;
    try {
        return JSON.parse(row.data);
    } catch {
        return null;
    }
}

/**
 * Save a routine (JSON blob).
 * Deletes previous routines and inserts the new one.
 * @param {Object} routineData - The routine object to save
 * @returns {Object} The saved routine data
 */
function saveRoutine(routineData) {
    const deleteStmt = db.prepare('DELETE FROM routine');
    deleteStmt.run();

    const insertStmt = db.prepare('INSERT INTO routine (data) VALUES (?)');
    insertStmt.run(JSON.stringify(routineData));
    return routineData;
}

function clearRoutine() {
    db.prepare('DELETE FROM routine').run();
}

/* ─────────── Goals ─────────── */

/**
 * Get today's date string in YYYY-MM-DD format.
 * @returns {string}
 */
function todayStr() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date string in YYYY-MM-DD format.
 * @returns {string}
 */
function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

/**
 * Get today's goals, including carry-forward from past uncompleted.
 * @returns {Array} Array of goal objects
 */
function getTodayGoals() {
    const today = todayStr();

    // We get all goals for today, PLUS any uncompleted goal from the past.
    // We don't need to copy them anymore, just display them and let the user complete them.
    return db.prepare('SELECT * FROM goals WHERE date = ? OR (date < ? AND completed = 0) ORDER BY created_at ASC').all(today, today);
}

/**
 * Add a new goal for today.
 * @param {string} text - Goal text
 * @param {string} priority - Priority (high, med, low)
 * @returns {Object} The newly created goal
 */
function addGoal(text, priority = 'med') {
    const today = todayStr();
    const stmt = db.prepare(
        'INSERT INTO goals (text, date, completed, priority) VALUES (?, ?, 0, ?)'
    );
    const info = stmt.run(text, today, priority);
    return db.prepare('SELECT * FROM goals WHERE id = ?').get(info.lastInsertRowid);
}

/**
 * Mark a goal as completed.
 * @param {number} id - Goal ID
 * @returns {{ success: boolean }}
 */
function completeGoal(id) {
    db.prepare('UPDATE goals SET completed = 1 WHERE id = ?').run(id);
    return { success: true };
}

/**
 * Delete a goal.
 * @param {number} id - Goal ID
 * @returns {{ success: boolean }}
 */
function deleteGoal(id) {
    db.prepare('DELETE FROM goals WHERE id = ?').run(id);
    return { success: true };
}

function getAllGoals() {
    return db.prepare('SELECT * FROM goals ORDER BY date DESC').all();
}

function deleteAllGoals() {
    db.prepare('DELETE FROM goals').run();
}

/* ─────────── Habit Logs ─────────── */

/**
 * Log a habit entry for today.
 * @param {string} type - water | exercise | stretch | sleep
 * @param {number} value - Numeric value to log
 * @returns {Object} The inserted log row
 */
function logHabit(type, value) {
    const today = todayStr();
    const stmt = db.prepare(
        'INSERT INTO habit_logs (date, type, value) VALUES (?, ?, ?)'
    );
    const info = stmt.run(today, type, value);
    return db.prepare('SELECT * FROM habit_logs WHERE id = ?').get(info.lastInsertRowid);
}

/**
 * Get today's aggregated habit data.
 * @returns {{ water: number, exercise: number, stretch: number, sleep: number }}
 */
function getTodayHabits() {
    const today = todayStr();
    const rows = db
        .prepare(
            'SELECT type, SUM(value) as total FROM habit_logs WHERE date = ? GROUP BY type'
        )
        .all(today);

    const result = { water: 0, exercise: 0, stretch: 0, sleep: 0 };
    for (const row of rows) {
        if (result.hasOwnProperty(row.type)) {
            result[row.type] = row.total;
        }
    }
    return result;
}

/**
 * Get the count of completed goals for today (for health score calculation).
 * @returns {{ completed: number, total: number }}
 */
function getTodayGoalStats() {
    const today = todayStr();
    const total = db
        .prepare('SELECT COUNT(*) as count FROM goals WHERE date = ?')
        .get(today).count;
    const completed = db
        .prepare('SELECT COUNT(*) as count FROM goals WHERE date = ? AND completed = 1')
        .get(today).count;
    return { completed, total };
}

function getAllHabitLogs() {
    return db.prepare('SELECT * FROM habit_logs ORDER BY logged_at DESC').all();
}

function clearTodayHabitLogs() {
    const today = todayStr();
    db.prepare('DELETE FROM habit_logs WHERE date = ?').run(today);
}

/* ─────────── Custom Reminders ─────────── */

function getCustomReminders() {
    return db.prepare('SELECT * FROM custom_reminders ORDER BY start_time ASC').all();
}

function addCustomReminder(data) {
    const stmt = db.prepare(`
        INSERT INTO custom_reminders (name, start_time, end_time, repeat, type, notes, active)
        VALUES (@name, @start_time, @end_time, @repeat, @type, @notes, @active)
    `);
    const info = stmt.run({
        ...data,
        end_time: data.end_time || null,
        notes: data.notes || null,
        active: data.active !== undefined ? data.active : 1,
    });
    return db.prepare('SELECT * FROM custom_reminders WHERE id = ?').get(info.lastInsertRowid);
}

function updateCustomReminder(id, data) {
    const stmt = db.prepare(`
        UPDATE custom_reminders
        SET name = @name, start_time = @start_time, end_time = @end_time,
            repeat = @repeat, type = @type, notes = @notes, active = @active
        WHERE id = @id
    `);
    stmt.run({
        id,
        ...data,
        end_time: data.end_time || null,
        notes: data.notes || null,
        active: data.active !== undefined ? data.active : 1,
    });
}

function deleteCustomReminder(id) {
    db.prepare('DELETE FROM custom_reminders WHERE id = ?').run(id);
}

function toggleCustomReminder(id, active) {
    db.prepare('UPDATE custom_reminders SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}

/* ─────────── Checkin Logs ─────────── */

function logCheckin(type, name, response) {
    const stmt = db.prepare(`
        INSERT INTO checkin_logs (reminder_type, reminder_name, response)
        VALUES (?, ?, ?)
    `);
    stmt.run(type, name || null, response);
}

function getCheckinLogs(limit = 30) {
    return db.prepare('SELECT * FROM checkin_logs ORDER BY logged_at DESC LIMIT ?').all(limit);
}

/* ─────────── Habit Targets ─────────── */

function getHabitTargets() {
    const rows = db.prepare('SELECT * FROM habit_targets').all();
    const targets = {};
    for (const row of rows) {
        targets[row.type] = row.target;
    }
    return targets;
}

function updateHabitTarget(type, target) {
    db.prepare('UPDATE habit_targets SET target = ? WHERE type = ?').run(target, type);
}

/* ─────────── Additional Utils ─────────── */

function getStreakCount() {
    // A primitive streak calculation based on dates logged in habit_logs
    // (Assuming any day with a completed goal or logged habit contributes to streak if it's recent)
    // For a real 0-100 score, we'd need to compute historical score.
    // Given the constraints and the prompt just asking for dbService.getStreakCount:
    const rows = db.prepare('SELECT DISTINCT date FROM habit_logs ORDER BY date DESC').all();
    let streak = 0;
    let expectedDate = new Date();

    for (const row of rows) {
        const rowDateStr = row.date;
        const expectedDateStr = expectedDate.toISOString().split('T')[0];

        if (rowDateStr === expectedDateStr) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (streak > 0 && new Date(rowDateStr) < expectedDate) {
            break; // Gap found
        } else if (new Date(rowDateStr) > expectedDate) {
            // Ignore future dates/same day diff timezone
        } else if (streak === 0 && new Date(rowDateStr) < expectedDate) {
            // Missed today, check if yesterday works for current streak
            expectedDate.setDate(expectedDate.getDate() - 1);
            if (rowDateStr === expectedDate.toISOString().split('T')[0]) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        }
    }
    return streak;
}

function deleteAllData() {
    const tables = ['profile', 'routine', 'goals', 'habit_logs', 'custom_reminders', 'checkin_logs', 'habit_targets'];
    for (const table of tables) {
        db.prepare(`DELETE FROM ${table}`).run();
    }
    db.prepare("INSERT OR IGNORE INTO profile (id, name, setup_done) VALUES (1, '', 0)").run();
}

module.exports = {
    init,
    getProfile,
    saveProfile,
    isSetupDone,
    getRoutine,
    saveRoutine,
    getTodayGoals,
    addGoal,
    completeGoal,
    deleteGoal,
    getAllGoals,
    deleteAllGoals,
    logHabit,
    getTodayHabits,
    getAllHabitLogs,
    clearTodayHabitLogs,
    getTodayGoalStats,
    getCustomReminders,
    addCustomReminder,
    updateCustomReminder,
    deleteCustomReminder,
    toggleCustomReminder,
    logCheckin,
    getCheckinLogs,
    getHabitTargets,
    updateHabitTarget,
    getStreakCount,
    clearRoutine,
    deleteAllData,
};
