/**
 * Dashboard.jsx — Main overview page.
 * Shows greeting, health score, quick log buttons, today's goals, habits summary, and upcoming reminders.
 */

import React, { useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import useAppStore from '../store/appStore';
import PageHeader from '../components/PageHeader';

function Dashboard() {
    const navigate = useNavigate();
    const {
        profile,
        healthScore,
        habits,
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
            <PageHeader title={getGreeting()} subtitle={todayStr}>
                <button className="btn btn-primary" onClick={() => navigate('/focus')}>
                    <Zap size={16} /> Start Focus
                </button>
            </PageHeader>

            {/* Row 1: Health Score + Quick Log */}
            <div className="grid-2 mb-lg" style={{ animationDelay: '0.05s' }}>
                {/* Health Score Card */}
                <div className="card animate-fade-in stagger-1">
                    <div className="card-header">
                        <span className="card-title">Health Score</span>
                        <span
                            className="badge"
                            style={{
                                background: `${getScoreColor(healthScore.grade)}20`,
                                color: getScoreColor(healthScore.grade),
                            }}
                        >
                            {healthScore.grade}
                        </span>
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
                                    }}
                                >
                                    <Icon size={22} />
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Current Stats */}
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Today's Progress
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
                            {[
                                { label: 'Water', value: habits.water, target: 8, unit: '🥤' },
                                { label: 'Workout', value: habits.exercise, target: 1, unit: '💪' },
                                { label: 'Stretch', value: habits.stretch, target: 4, unit: '🧘' },
                                { label: 'Sleep', value: habits.sleep, target: 8, unit: '😴' },
                            ].map((s) => (
                                <div key={s.label}>
                                    <div className="num" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                                        {s.value}/{s.target}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.label}</div>
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
                            { type: 'water', label: 'Water', current: habits.water, target: 8, color: 'var(--blue)', icon: '💧' },
                            { type: 'exercise', label: 'Exercise', current: habits.exercise, target: 1, color: 'var(--green)', icon: '💪' },
                            { type: 'stretch', label: 'Stretch', current: habits.stretch, target: 4, color: 'var(--purple)', icon: '🧘' },
                            { type: 'sleep', label: 'Sleep', current: habits.sleep, target: 8, color: 'var(--yellow)', icon: '😴' },
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
                                        padding: '8px 10px',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
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
        </div>
    );
}

export default Dashboard;
