/**
 * Dashboard.jsx — Main overview page.
 * Shows greeting, health score, quick log buttons, today's goals, habits summary, and upcoming reminders.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Droplets,
    Dumbbell,
    Expand,
    Moon,
    Target,
    Clock,
    CheckCircle2,
    Circle,
    Bell,
    Zap,
    Plus,
    X,
    Flame,
    List,
} from 'lucide-react';
import useAppStore from '../store/appStore';
import PageHeader from '../components/PageHeader';

function Dashboard() {
    const navigate = useNavigate();
    const {
        profile,
        healthScore,
        habits,
        habitTargets,
        goals,
        reminders,
        loadHealthScore,
        loadHabits,
        loadGoals,
        loadReminders,
        logHabit,
        completeGoal,
        addToast,
    } = useAppStore();

    const [showLogModal, setShowLogModal] = useState(false);
    const [habitLogs, setHabitLogs] = useState([]);

    const fetchLogs = async () => {
        const logs = await window.api.habits.getAllLogs ? await window.api.habits.getAllLogs() : [];
        setHabitLogs(logs);
    };

    // Load all data on mount
    useEffect(() => {
        loadHealthScore();
        loadHabits();
        loadGoals();
        loadReminders();
        // Refresh reminders every 60s
        const interval = setInterval(loadReminders, 60000);
        return () => clearInterval(interval);
    }, [loadHealthScore, loadHabits, loadGoals, loadReminders]);

    // Time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        const name = profile?.name || 'there';
        if (hour < 12) return `Good morning, ${name}`;
        if (hour < 17) return `Good afternoon, ${name}`;
        return `Good evening, ${name}`;
    };

    const todayStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    // Quick log helper
    const handleQuickLog = useCallback(async (type, value, label) => {
        await logHabit(type, value);
        addToast({ title: `✅ ${label}`, message: 'Logged successfully!', type: 'success' });
    }, [logHabit, addToast]);

    const getScoreColor = (grade) => {
        switch (grade) {
            case 'A+': return 'var(--accent)';
            case 'A': return 'var(--green)';
            case 'B': return 'var(--blue)';
            case 'C': return 'var(--yellow)';
            default: return 'var(--red)';
        }
    };

    const completedGoals = goals.filter((g) => g.completed).length;
    const totalGoals = goals.length;

    return (
        <div className="page-content">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <PageHeader title={getGreeting()} subtitle={todayStr}>
                    <button className="btn btn-primary" onClick={() => navigate('/focus')}>
                        <Zap size={16} /> Start Focus
                    </button>
                    <button className="btn btn-secondary" onClick={() => { fetchLogs(); setShowLogModal(true); }}>
                        <List size={16} /> History
                    </button>
                </PageHeader>
            </div>

            <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px', background: 'var(--bg-glass)', backdropFilter: 'blur(8px)', padding: '16px 20px', borderRadius: 'var(--radius-lg)', borderLeft: '4px solid var(--accent)', boxShadow: 'var(--shadow-sm)' }}>
                "{[
                    "Small disciplines repeated with consistency every day lead to great achievements.",
                    "Your health is your greatest wealth.",
                    "Success is the sum of small efforts repeated day in and day out.",
                    "Take care of your body. It's the only place you have to live."
                ][new Date().getDay() % 4]}"
            </div>

            {/* Row 1: Health Score + Quick Log */}
            <div className="grid-2 mb-lg" style={{ animationDelay: '0.05s' }}>
                {/* Health Score Card */}
                <div className="card animate-fade-in stagger-1">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="card-title">Health Score</span>
                            <span className="badge" style={{ background: `${getScoreColor(healthScore.grade)}20`, color: getScoreColor(healthScore.grade) }}>
                                {healthScore.grade}
                            </span>
                        </div>
                        {healthScore.streak > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--orange)', fontSize: '13px', fontWeight: 'bold' }}>
                                <Flame size={16} /> {healthScore.streak} Day Streak!
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
                        <div
                            className="num-xl"
                            style={{ color: getScoreColor(healthScore.grade) }}
                        >
                            {healthScore.total || 0}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                {healthScore.message}
                            </div>
                            <div className="progress-bar" style={{ height: '6px' }}>
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${healthScore.total || 0}%`,
                                        background: getScoreColor(healthScore.grade),
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Bars */}
                    {healthScore.breakdown && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[
                                { key: 'water', label: 'Water', color: 'var(--blue)', max: 25 },
                                { key: 'exercise', label: 'Exercise', color: 'var(--green)', max: 25 },
                                { key: 'stretch', label: 'Stretch', color: 'var(--purple)', max: 20 },
                                { key: 'sleep', label: 'Sleep', color: 'var(--yellow)', max: 15 },
                                { key: 'goals', label: 'Goals', color: 'var(--accent)', max: 15 },
                            ].map((item) => {
                                const data = healthScore.breakdown[item.key] || { score: 0 };
                                return (
                                    <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ width: '60px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {item.label}
                                        </span>
                                        <div className="progress-bar" style={{ flex: 1 }}>
                                            <div
                                                className="progress-bar-fill"
                                                style={{
                                                    width: `${(data.score / item.max) * 100}%`,
                                                    background: item.color,
                                                }}
                                            />
                                        </div>
                                        <span className="num" style={{ width: '32px', fontSize: '11px', color: 'var(--text-muted)', textAlign: 'right' }}>
                                            {data.score}/{item.max}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Quick Log Card */}
                <div className="card animate-fade-in stagger-2">
                    <div className="card-header">
                        <span className="card-title">Quick Log</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {[
                            { type: 'water', value: 1, label: '+1 Water', icon: Droplets, color: 'var(--blue)', bg: 'var(--blue-dim)' },
                            { type: 'exercise', value: 1, label: '+1 Workout', icon: Dumbbell, color: 'var(--green)', bg: 'var(--green-dim)' },
                            { type: 'stretch', value: 1, label: '+1 Stretch', icon: Expand, color: 'var(--purple)', bg: 'var(--purple-dim)' },
                            { type: 'sleep', value: 7, label: '+7hrs Sleep', icon: Moon, color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
                        ].map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.type}
                                    id={`quick-log-${item.type}`}
                                    onClick={() => handleQuickLog(item.type, item.value, item.label)}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '16px 12px',
                                        background: item.bg,
                                        border: '1px solid transparent',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)',
                                        color: item.color,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = item.color;
                                        e.currentTarget.style.transform = 'scale(1.03)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'transparent';
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <Icon size={24} style={{ filter: `drop-shadow(0 0 8px ${item.color})` }} />
                                    <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.3px' }}>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Current Stats */}
                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
                            Today's Progress
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                            {[
                                { label: 'Water', value: habits.water, target: habitTargets.water || 8, unit: '💧', color: 'var(--blue)' },
                                { label: 'Workout', value: habits.exercise, target: habitTargets.exercise || 1, unit: '⚡', color: 'var(--green)' },
                                { label: 'Stretch', value: habits.stretch, target: habitTargets.stretch || 4, unit: '🧘', color: 'var(--purple)' },
                                { label: 'Sleep', value: habits.sleep, target: habitTargets.sleep || 8, unit: '🌙', color: 'var(--yellow)' },
                            ].map((s) => (
                                <div key={s.label}>
                                    <div className="num" style={{ fontSize: '18px', color: 'var(--text-primary)', textShadow: `0 0 10px ${s.color}40`, marginBottom: '4px' }}>
                                        {s.value}/{s.target}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Goals + Habits Summary + Upcoming Reminders */}
            <div className="grid-3">
                {/* Today's Goals */}
                <div className="card animate-fade-in stagger-3">
                    <div className="card-header">
                        <span className="card-title">
                            <Target size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Today's Goals
                        </span>
                        <span className="num" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {completedGoals}/{totalGoals}
                        </span>
                    </div>
                    {totalGoals > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                            {goals.slice(0, 5).map((goal) => (
                                <div
                                    key={goal.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '6px 0',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => !goal.completed && completeGoal(goal.id)}
                                >
                                    {goal.completed ? (
                                        <CheckCircle2 size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                                    ) : (
                                        <Circle size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    )}
                                    <span
                                        style={{
                                            fontSize: '13px',
                                            color: goal.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                            textDecoration: goal.completed ? 'line-through' : 'none',
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {goal.text}
                                    </span>
                                </div>
                            ))}
                            {totalGoals > 5 && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => navigate('/goals')}
                                    style={{ marginTop: '4px' }}
                                >
                                    View all {totalGoals} goals
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '20px 0' }}>
                            <p className="empty-state-text">No goals set today</p>
                            <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => navigate('/goals')}
                                style={{ marginTop: '8px' }}
                            >
                                <Plus size={14} /> Add Goals
                            </button>
                        </div>
                    )}
                    {totalGoals > 0 && (
                        <div style={{ marginTop: '12px' }}>
                            <div className="progress-bar">
                                <div
                                    className="progress-bar-fill green"
                                    style={{ width: `${totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Habits Summary */}
                <div className="card animate-fade-in stagger-4">
                    <div className="card-header">
                        <span className="card-title">
                            <Dumbbell size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Habits
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { type: 'water', label: 'Water', current: habits.water, target: habitTargets.water || 8, color: 'var(--blue)', icon: '💧' },
                            { type: 'exercise', label: 'Exercise', current: habits.exercise, target: habitTargets.exercise || 1, color: 'var(--green)', icon: '💪' },
                            { type: 'stretch', label: 'Stretch', current: habits.stretch, target: habitTargets.stretch || 4, color: 'var(--purple)', icon: '🧘' },
                            { type: 'sleep', label: 'Sleep', current: habits.sleep, target: habitTargets.sleep || 8, color: 'var(--yellow)', icon: '😴' },
                        ].map((h) => (
                            <div key={h.type}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                        {h.icon} {h.label}
                                    </span>
                                    <span className="num" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {h.current}/{h.target}
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div
                                        className="progress-bar-fill"
                                        style={{
                                            width: `${Math.min(100, (h.current / h.target) * 100)}%`,
                                            background: h.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate('/habits')}
                        style={{ marginTop: '12px', width: '100%' }}
                    >
                        View Details
                    </button>
                </div>

                {/* Upcoming Reminders */}
                <div className="card animate-fade-in stagger-5">
                    <div className="card-header">
                        <span className="card-title">
                            <Bell size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                            Upcoming
                        </span>
                    </div>
                    {reminders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {reminders.slice(0, 5).map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: 'var(--bg-glass)',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: 'var(--radius-md)',
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'all var(--transition-fast)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-glass-hover)';
                                        e.currentTarget.style.borderColor = 'var(--border-glass-strong)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-glass)';
                                        e.currentTarget.style.borderColor = 'var(--border-glass)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                                            {r.title}
                                        </span>
                                    </div>
                                    <span className="num" style={{ fontSize: '11px', color: 'var(--accent)' }}>
                                        {r.minutesAway < 60
                                            ? `${r.minutesAway}m`
                                            : `${Math.floor(r.minutesAway / 60)}h ${r.minutesAway % 60}m`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '20px 0' }}>
                            <p className="empty-state-text">No upcoming reminders</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Habit Log Modal */}
            {showLogModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                    <div className="card animate-fade-in" style={{ width: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Habit Logs</h3>
                            <button className="btn-icon" onClick={() => setShowLogModal(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {habitLogs.length === 0 ? (
                                <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No entries found.</div>
                            ) : (
                                habitLogs.map(log => (
                                    <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize' }}>{log.type}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(log.logged_at).toLocaleString()}</span>
                                        </div>
                                        <span className="num" style={{ fontSize: '14px', color: 'var(--accent)' }}>+{log.value}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
