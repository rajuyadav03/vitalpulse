/**
 * appStore.js — Zustand global state store for VitalPulse.
 * Manages profile, routine, goals, habits, health score, reminders, focus timer, and toasts.
 */

import { create } from 'zustand';

// Safety helper: check if Electron IPC bridge is available
const api = typeof window !== 'undefined' && window.api ? window.api : null;

const useAppStore = create((set, get) => ({
    // ─── Profile ────────────────────────────────────────────
    profile: null,
    isSetup: false,
    loading: true,

    initApp: async () => {
        if (!api) {
            console.warn('[VitalPulse] window.api not available — running outside Electron');
            set({ loading: false });
            return;
        }
        try {
            const isSetup = await api.profile.isSetup();
            const profile = await api.profile.get();
            set({ isSetup, profile, loading: false });
        } catch (err) {
            console.error('Failed to init app:', err);
            set({ loading: false });
        }
    },

    saveProfile: async (data) => {
        const profile = await api.profile.save(data);
        set({ profile, isSetup: true });
        return profile;
    },

    setProfile: (profile) => set({ profile }),

    resetApp: () => {
        set({
            profile: null,
            isSetup: false,
            routine: null,
            goals: [],
            habits: { water: 0, exercise: 0, stretch: 0, sleep: 0 },
            habitTargets: { water: 8, exercise: 1, stretch: 4, sleep: 8 },
            healthScore: { total: 0, grade: 'D', message: '', breakdown: {} },
            reminders: [],
            toasts: []
        });
    },

    // ─── Routine ────────────────────────────────────────────
    routine: null,
    routineLoading: false,

    loadRoutine: async () => {
        const routine = await api.routine.get();
        set({ routine });
        return routine;
    },

    generateRoutine: async (profile) => {
        set({ routineLoading: true });
        try {
            const routine = await api.routine.generate(profile);
            set({ routine, routineLoading: false });
            return routine;
        } catch (err) {
            console.error('Failed to generate routine:', err);
            set({ routineLoading: false });
            return null;
        }
    },

    // ─── Goals ──────────────────────────────────────────────
    goals: [],

    loadGoals: async () => {
        const goals = await api.goals.getToday();
        set({ goals });
        return goals;
    },

    addGoal: async (text, priority = 'med') => {
        const goal = await api.goals.add(text, priority);
        const goals = await api.goals.getToday();
        set({ goals });
        return goal;
    },

    completeGoal: async (id) => {
        await api.goals.complete(id);
        const goals = await api.goals.getToday();
        set({ goals });
    },

    deleteGoal: async (id) => {
        await api.goals.delete(id);
        const goals = await api.goals.getToday();
        set({ goals });
    },

    // ─── Habits ─────────────────────────────────────────────
    habits: { water: 0, exercise: 0, stretch: 0, sleep: 0 },
    habitTargets: { water: 8, exercise: 1, stretch: 4, sleep: 8 },

    loadHabits: async () => {
        const { current, targets } = await api.habits.getToday();
        set({ habits: current, habitTargets: targets });
        return { current, targets };
    },

    logHabit: async (type, value) => {
        const score = await api.habits.log(type, value);
        const { current } = await api.habits.getToday();
        set({ habits: current, healthScore: score });
        return score;
    },

    updateHabitTarget: async (type, target) => {
        const targets = await api.habits.updateTarget(type, target);
        set({ habitTargets: targets });
        return targets;
    },

    // ─── Health Score ───────────────────────────────────────
    healthScore: { total: 0, grade: 'D', message: '', breakdown: {} },

    loadHealthScore: async () => {
        const score = await api.healthScore.get();
        set({ healthScore: score });
        return score;
    },

    // ─── Reminders ──────────────────────────────────────────
    reminders: [],
    remindersPaused: false,

    loadReminders: async () => {
        const reminders = await api.reminders.getUpcoming();
        const paused = await api.reminders.isPaused();
        set({ reminders, remindersPaused: paused });
    },

    pauseReminders: async () => {
        await api.reminders.pause();
        set({ remindersPaused: true });
    },

    resumeReminders: async () => {
        await api.reminders.resume();
        set({ remindersPaused: false });
    },

    // ─── Focus Timer (Pomodoro) ─────────────────────────────
    focusMode: 'focus', // 'focus' | 'shortBreak' | 'longBreak'
    focusTimeLeft: 45 * 60, // seconds
    focusRunning: false,
    focusSessions: 0,
    focusIntervalId: null,

    setFocusMode: (mode) => {
        const durations = { focus: 45 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
        set({
            focusMode: mode,
            focusTimeLeft: durations[mode],
            focusRunning: false,
        });
    },

    startFocus: () => {
        const { focusIntervalId } = get();
        if (focusIntervalId) clearInterval(focusIntervalId);

        const id = setInterval(() => {
            const { focusTimeLeft, focusMode, focusSessions } = get();
            if (focusTimeLeft <= 0) {
                clearInterval(id);
                // Auto-transition
                if (focusMode === 'focus') {
                    const newSessions = focusSessions + 1;
                    set({ focusSessions: newSessions, focusRunning: false, focusIntervalId: null });
                    // Switch to break
                    const nextMode = newSessions % 4 === 0 ? 'longBreak' : 'shortBreak';
                    get().setFocusMode(nextMode);
                    // Add toast for session complete
                    get().addToast({
                        title: '🎯 Focus Session Complete!',
                        message: `Session ${newSessions} done. Time for a ${nextMode === 'longBreak' ? 'long' : 'short'} break!`,
                        type: 'success',
                    });
                } else {
                    set({ focusRunning: false, focusIntervalId: null });
                    get().setFocusMode('focus');
                    get().addToast({
                        title: '⏰ Break Over',
                        message: 'Ready for another focus session?',
                        type: 'info',
                    });
                }
                return;
            }
            set({ focusTimeLeft: focusTimeLeft - 1 });
        }, 1000);

        set({ focusRunning: true, focusIntervalId: id });
    },

    pauseFocus: () => {
        const { focusIntervalId } = get();
        if (focusIntervalId) {
            clearInterval(focusIntervalId);
            set({ focusRunning: false, focusIntervalId: null });
        }
    },

    resetFocus: () => {
        const { focusIntervalId, focusMode } = get();
        if (focusIntervalId) clearInterval(focusIntervalId);
        const durations = { focus: 45 * 60, shortBreak: 5 * 60, longBreak: 15 * 60 };
        set({
            focusTimeLeft: durations[focusMode],
            focusRunning: false,
            focusIntervalId: null,
        });
    },

    skipFocus: () => {
        const { focusIntervalId, focusMode, focusSessions } = get();
        if (focusIntervalId) clearInterval(focusIntervalId);
        if (focusMode === 'focus') {
            const nextMode = (focusSessions + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
            set({ focusSessions: focusSessions + 1, focusRunning: false, focusIntervalId: null });
            get().setFocusMode(nextMode);
        } else {
            set({ focusRunning: false, focusIntervalId: null });
            get().setFocusMode('focus');
        }
    },

    // ─── Toasts (in-app notifications) ──────────────────────
    toasts: [],

    addToast: (toast) => {
        const id = Date.now() + Math.random();
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }],
        }));
        // Auto-remove after 5 seconds
        setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        }, 5000);
    },

    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
        }));
    },
}));

export default useAppStore;
