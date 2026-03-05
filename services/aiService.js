/**
 * aiService.js — Generates a personalized daily routine via Gemini API.
 * Falls back to a mathematically derived default routine if the API key
 * is missing or the call fails. Never throws to the user.
 */

const axios = require('axios');

const GEMINI_ENDPOINT =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generate a full daily routine using Gemini AI or fallback logic.
 * @param {Object} profile - The user's profile data
 * @param {string|null} apiKey - Optional Gemini API key
 * @returns {Object} The generated routine object
 */
async function generateRoutineWithAI(profile, apiKey) {
    // Attempt AI generation if API key is provided
    if (apiKey && apiKey.trim()) {
        try {
            const routine = await _callGemini(profile, apiKey.trim());
            if (routine) return routine;
        } catch (err) {
            console.warn('[AIService] Gemini call failed, using fallback:', err.message);
        }
    }

    // Fallback: generate default routine from profile data
    return _generateDefaultRoutine(profile);
}

/**
 * Call the Gemini API to generate a personalized routine.
 * @param {Object} profile
 * @param {string} apiKey
 * @returns {Object|null} Parsed routine or null on failure
 * @private
 */
async function _callGemini(profile, apiKey) {
    const prompt = `You are a health and productivity AI assistant. Based on the following user profile, generate a personalized daily routine.

User Profile:
- Name: ${profile.name}
- Age: ${profile.age}
- Height: ${profile.height_cm} cm
- Weight: ${profile.weight_kg} kg
- Goal: ${profile.goal}
- Work type: ${profile.work_type}
- Wake time: ${profile.wake_time}
- Sleep time: ${profile.sleep_time}
- Workout level: ${profile.workout_level}

Return ONLY a valid JSON object (no markdown, no code blocks, no explanation) with this EXACT structure:
{
  "dailySchedule": [{ "time":"HH:MM", "activity":"...", "detail":"...", "type":"health|workout|meal|nap|sleep", "title":"..." }],
  "mealSchedule": [{ "time":"HH:MM", "name":"...", "suggestion":"..." }],
  "workoutTime": "HH:MM",
  "workoutNote": "...",
  "workoutPlan": ["step1", "step2", "step3"],
  "napTime": "HH:MM",
  "napDuration": 20,
  "waterIntakeGoal": 8,
  "waterSchedule": ["HH:MM"],
  "dietTips": ["tip1", "tip2", "tip3"],
  "sleepRoutine": { "windDownTime":"HH:MM", "sleepTime":"HH:MM", "wakeTime":"HH:MM" },
  "summary": "One sentence describing the plan"
}

Make the plan realistic and personalized. Use 24-hour time format. Include at least 3 meals, a workout plan matching their level, and proper sleep/wake scheduling.`;

    const response = await axios.post(
        `${GEMINI_ENDPOINT}?key=${apiKey}`,
        {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            },
        },
        {
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
        }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    // Clean up any markdown formatting the model might add
    const cleaned = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/gi, '')
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        console.warn('[AIService] Failed to parse Gemini response as JSON');
        return null;
    }
}

/**
 * Generate a mathematically derived default routine based on wake/sleep times.
 * @param {Object} profile
 * @returns {Object} Default routine object
 * @private
 */
function _generateDefaultRoutine(profile) {
    const wakeTime = profile.wake_time || '07:00';
    const sleepTime = profile.sleep_time || '23:00';

    const [wH, wM] = wakeTime.split(':').map(Number);
    const [sH, sM] = sleepTime.split(':').map(Number);

    // Helper: add minutes to a base time and return "HH:MM"
    function addMinutes(baseH, baseM, addMin) {
        let totalMin = baseH * 60 + baseM + addMin;
        if (totalMin >= 1440) totalMin -= 1440;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // Derive key times from wake time offset
    const breakfastTime = addMinutes(wH, wM, 30);    // wake + 30min
    const lunchTime = addMinutes(wH, wM, 300);       // wake + 5h
    const dinnerTime = addMinutes(wH, wM, 660);      // wake + 11h
    const workoutTime = addMinutes(wH, wM, 90);      // wake + 1.5h
    const napTime = addMinutes(wH, wM, 420);         // wake + 7h
    const windDownTime = addMinutes(sH, sM, -60);    // sleep - 1h

    // Water schedule: every 2h from wake to sleep
    const waterSchedule = [];
    for (let i = 0; i < 8; i++) {
        waterSchedule.push(addMinutes(wH, wM, i * 120));
    }

    // Workout plan based on level
    const workoutPlans = {
        beginner: [
            '5 min warm-up walk',
            '10 min light bodyweight exercises',
            '5 min cool-down stretches',
        ],
        intermediate: [
            '5 min dynamic stretching',
            '20 min strength training',
            '10 min cardio',
            '5 min cool-down',
        ],
        advanced: [
            '10 min warm-up',
            '30 min high-intensity training',
            '15 min strength circuits',
            '5 min stretching',
        ],
        athlete: [
            '10 min dynamic warm-up',
            '40 min sport-specific training',
            '20 min conditioning',
            '10 min recovery stretches',
        ],
    };

    const level = profile.workout_level || 'beginner';
    const workoutPlan = workoutPlans[level] || workoutPlans.beginner;

    // Workout note based on goal
    const workoutNotes = {
        weight_loss: 'Focus on calorie-burning cardio and strength training',
        gain: 'Focus on progressive overload and protein-rich meals',
        stay_healthy: 'Maintain balanced exercise across cardio and strength',
        focus: 'Light exercise to boost mental clarity and reduce stress',
    };

    return {
        dailySchedule: [
            { time: wakeTime, activity: 'Wake Up', detail: 'Start your day with a glass of water', type: 'health', title: '☀️ Rise & Shine' },
            { time: breakfastTime, activity: 'Breakfast', detail: 'Protein-rich breakfast to fuel your morning', type: 'meal', title: '🍳 Breakfast' },
            { time: workoutTime, activity: 'Workout', detail: workoutNotes[profile.goal] || 'Daily exercise session', type: 'workout', title: '💪 Workout' },
            { time: addMinutes(wH, wM, 180), activity: 'Focus Block', detail: 'Deep work session — minimize distractions', type: 'health', title: '🎯 Focus Time' },
            { time: lunchTime, activity: 'Lunch', detail: 'Balanced meal with vegetables and lean protein', type: 'meal', title: '🥗 Lunch' },
            { time: napTime, activity: 'Power Nap', detail: 'Quick 20-minute rest to recharge', type: 'nap', title: '😴 Power Nap' },
            { time: addMinutes(wH, wM, 480), activity: 'Afternoon Focus', detail: 'Second productive work block', type: 'health', title: '📊 Afternoon Focus' },
            { time: dinnerTime, activity: 'Dinner', detail: 'Light, nutritious evening meal', type: 'meal', title: '🍽 Dinner' },
            { time: windDownTime, activity: 'Wind Down', detail: 'Dim lights, no screens, light reading', type: 'sleep', title: '🌙 Wind Down' },
            { time: sleepTime, activity: 'Sleep', detail: 'Get 7-9 hours of quality rest', type: 'sleep', title: '💤 Bedtime' },
        ],
        mealSchedule: [
            { time: breakfastTime, name: 'Breakfast', suggestion: 'Oatmeal with fruits, eggs, or whole grain toast' },
            { time: lunchTime, name: 'Lunch', suggestion: 'Grilled chicken salad, quinoa bowl, or lean protein with vegetables' },
            { time: dinnerTime, name: 'Dinner', suggestion: 'Baked fish with steamed vegetables, or a light stir-fry' },
        ],
        workoutTime,
        workoutNote: workoutNotes[profile.goal] || 'Maintain a balanced exercise routine',
        workoutPlan,
        napTime,
        napDuration: 20,
        waterIntakeGoal: 8,
        waterSchedule,
        dietTips: [
            'Drink water before each meal to aid digestion',
            'Include protein in every meal to maintain energy levels',
            'Limit processed foods and added sugars',
        ],
        sleepRoutine: {
            windDownTime,
            sleepTime,
            wakeTime,
        },
        summary: `Personalized ${level} routine: wake at ${wakeTime}, workout at ${workoutTime}, sleep at ${sleepTime}`,
    };
}

module.exports = { generateRoutineWithAI };
