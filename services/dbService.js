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
  `);

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
 * Get today's goals, including carry-forward from yesterday.
 * @returns {Array} Array of goal objects
 */
function getTodayGoals() {
    const today = todayStr();
    const yesterday = yesterdayStr();

    // Carry-forward: fetch yesterday's incomplete goals
    const yesterdayIncomplete = db
        .prepare('SELECT * FROM goals WHERE date = ? AND completed = 0')
        .all(yesterday);

    // Get today's goal texts for dedup
    const todayGoals = db.prepare('SELECT * FROM goals WHERE date = ?').all(today);
    const todayTexts = new Set(todayGoals.map((g) => g.text));

    // Insert carried-forward goals that aren't already in today
    const insertStmt = db.prepare(
        'INSERT INTO goals (text, date, completed) VALUES (?, ?, 0)'
    );
    for (const g of yesterdayIncomplete) {
        if (!todayTexts.has(g.text)) {
            insertStmt.run(g.text, today);
        }
    }

    // Return fresh list
    return db.prepare('SELECT * FROM goals WHERE date = ? ORDER BY id ASC').all(today);
}

/**
 * Add a new goal for today.
 * @param {string} text - Goal text
 * @returns {Object} The newly created goal
 */
function addGoal(text) {
    const today = todayStr();
    const stmt = db.prepare(
        'INSERT INTO goals (text, date, completed) VALUES (?, ?, 0)'
    );
    const info = stmt.run(text, today);
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
    logHabit,
    getTodayHabits,
    getTodayGoalStats,
};
