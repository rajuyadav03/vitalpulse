/**
 * healthScore.js — Calculates a 0-100 health score based on daily habits and goals.
 *
 * Scoring breakdown:
 *   water    → 25 pts (8 glasses = full, linear)
 *   exercise → 25 pts (1+ session = full)
 *   stretch  → 20 pts (4+ breaks = full, linear)
 *   sleep    → 15 pts (7-9 hours = full, logged once per day)
 *   goals    → 15 pts (% of today's goals completed × 15)
 */

const dbService = require('./dbService');

/**
 * Calculate the full health score with breakdown.
 * @returns {{ total: number, grade: string, message: string, breakdown: Object }}
 */
function calculate() {
    const habits = dbService.getTodayHabits();
    const goalStats = dbService.getTodayGoalStats();

    // Water: 25 pts max, 8 glasses target, linear scale
    const waterScore = Math.min(25, (habits.water / 8) * 25);

    // Exercise: 25 pts max, 1+ session = full
    const exerciseScore = habits.exercise >= 1 ? 25 : 0;

    // Stretch: 20 pts max, 4 breaks target, linear scale
    const stretchScore = Math.min(20, (habits.stretch / 4) * 20);

    // Sleep: 15 pts max, 7-9 hours = full
    let sleepScore = 0;
    if (habits.sleep >= 7 && habits.sleep <= 9) {
        sleepScore = 15;
    } else if (habits.sleep > 0) {
        // Partial score based on proximity to ideal range
        if (habits.sleep < 7) {
            sleepScore = Math.max(0, (habits.sleep / 7) * 15);
        } else {
            // Over 9 hours — slight penalty
            sleepScore = Math.max(0, 15 - (habits.sleep - 9) * 3);
        }
    }

    // Goals: 15 pts max, % of today's goals completed
    let goalsScore = 0;
    if (goalStats.total > 0) {
        goalsScore = (goalStats.completed / goalStats.total) * 15;
    }

    const total = Math.round(waterScore + exerciseScore + stretchScore + sleepScore + goalsScore);

    // Determine grade
    let grade;
    if (total >= 90) grade = 'A+';
    else if (total >= 80) grade = 'A';
    else if (total >= 70) grade = 'B';
    else if (total >= 60) grade = 'C';
    else grade = 'D';

    // Motivational message based on grade
    let message;
    switch (grade) {
        case 'A+':
            message = 'Outstanding! You\'re crushing it today! 🏆';
            break;
        case 'A':
            message = 'Great job! Keep up the healthy momentum! 💪';
            break;
        case 'B':
            message = 'Good progress! A few more habits to go! 🌟';
            break;
        case 'C':
            message = 'Decent start — keep building those habits! 🔥';
            break;
        default:
            message = 'Every step counts — let\'s get moving! 🚀';
    }

    return {
        total,
        grade,
        message,
        breakdown: {
            water: { score: Math.round(waterScore), max: 25, current: habits.water, target: 8 },
            exercise: { score: Math.round(exerciseScore), max: 25, current: habits.exercise, target: 1 },
            stretch: { score: Math.round(stretchScore), max: 20, current: habits.stretch, target: 4 },
            sleep: { score: Math.round(sleepScore), max: 15, current: habits.sleep, target: 8 },
            goals: { score: Math.round(goalsScore), max: 15, completed: goalStats.completed, total: goalStats.total },
        },
    };
}

module.exports = { calculate };
