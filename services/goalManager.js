/**
 * goalManager.js — Goal CRUD operations with carry-forward logic.
 * Delegates to dbService for actual database operations.
 */

const dbService = require('./dbService');

/**
 * Get today's goals with carry-forward from yesterday.
 * Automatically inserts yesterday's incomplete goals into today.
 * @returns {Array} Array of goal objects for today
 */
function getTodayGoals() {
    return dbService.getTodayGoals();
}

/**
 * Add a new goal for today.
 * @param {string} text - The goal text
 * @returns {Object} The newly created goal object
 */
function addGoal(text) {
    if (!text || !text.trim()) {
        throw new Error('Goal text cannot be empty');
    }
    return dbService.addGoal(text.trim());
}

/**
 * Mark a goal as completed.
 * @param {number} id - Goal ID
 * @returns {{ success: boolean }}
 */
function markComplete(id) {
    return dbService.completeGoal(id);
}

/**
 * Delete a goal.
 * @param {number} id - Goal ID
 * @returns {{ success: boolean }}
 */
function deleteGoal(id) {
    return dbService.deleteGoal(id);
}

module.exports = {
    getTodayGoals,
    addGoal,
    markComplete,
    deleteGoal,
};
