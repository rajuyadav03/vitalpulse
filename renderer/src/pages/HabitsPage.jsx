/**
 * HabitsPage.jsx — Habit logging with progress rings and detailed tracking.
 */

import React, { useEffect, useState } from 'react';
import { Droplets, Dumbbell, Expand, Moon, Plus, Minus, Edit2, Check, X } from 'lucide-react';
import useAppStore from '../store/appStore';
import PageHeader from '../components/PageHeader';

const habitConfigs = [
    {
        type: 'water',
        label: 'Water Intake',
        target: 8,
        unit: 'glasses',
        icon: Droplets,
        color: 'var(--blue)',
        bg: 'var(--blue-dim)',
        emoji: '💧',
        description: 'Stay hydrated — aim for 8 glasses daily',
    },
    {
        type: 'exercise',
        label: 'Exercise',
        target: 1,
        unit: 'sessions',
        icon: Dumbbell,
        color: 'var(--green)',
        bg: 'var(--green-dim)',
        emoji: '💪',
        description: 'At least one workout session per day',
    },
    {
        type: 'stretch',
        label: 'Stretch Breaks',
        target: 4,
        unit: 'breaks',
        icon: Expand,
        color: 'var(--purple)',
        bg: 'var(--purple-dim)',
        emoji: '🧘',
        description: 'Take regular stretch breaks throughout the day',
    },
    {
        type: 'sleep',
        label: 'Sleep',
        target: 8,
        unit: 'hours',
        icon: Moon,
        color: 'var(--yellow)',
        bg: 'var(--yellow-dim)',
        emoji: '😴',
        description: 'Get 7-9 hours of quality sleep',
    },
];

/**
 * SVG Progress Ring component.
 */
function ProgressRing({ progress, color, size = 100, strokeWidth = 6 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Background circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="var(--bg-elevated)"
                strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
        </svg>
    );
}

function HabitsPage() {
    const { habits, habitTargets, loadHabits, logHabit, updateHabitTarget, healthScore, loadHealthScore, addToast } = useAppStore();
    const [editingTarget, setEditingTarget] = useState(null);
    const [tempTarget, setTempTarget] = useState('');
    const [weeklyData, setWeeklyData] = useState([]);

    const loadWeeklyData = async () => {
        const logs = await window.api.habits.getAllLogs();

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = last7Days.map(date => ({ date, water: 0, exercise: 0, stretch: 0, sleep: 0 }));

        logs.forEach(log => {
            const day = data.find(d => d.date === log.date);
            if (day) day[log.type] += log.value;
        });
        setWeeklyData(data);
    };

    useEffect(() => {
        loadHabits();
        loadHealthScore();
        loadWeeklyData();
    }, [loadHabits, loadHealthScore]);

    const handleLog = async (type, value) => {
        await logHabit(type, value);
        addToast({
            title: '✅ Habit Logged',
            message: `${value > 0 ? '+' : ''}${value} ${type} recorded`,
            type: 'success',
        });
        loadWeeklyData();
    };

    const handleSaveTarget = async (type) => {
        const val = parseFloat(tempTarget);
        if (!isNaN(val) && val > 0) {
            await updateHabitTarget(type, val);
            addToast({ title: 'Target Updated', message: `New target for ${type}: ${val}`, type: 'success' });
        }
        setEditingTarget(null);
    };

    return (
        <div className="page-content">
            <PageHeader
                title="Habit Tracker"
                subtitle="Build healthy habits one step at a time"
            />

            {/* Habit Cards Grid */}
            <div className="grid-2" style={{ gap: '20px', marginBottom: '32px' }}>
                {habitConfigs.map((config, index) => {
                    const target = habitTargets[config.type] || config.target;
                    const current = habits[config.type] || 0;
                    const progress = Math.min(100, (current / target) * 100);
                    const isComplete = current >= target;

                    return (
                        <div
                            key={config.type}
                            className="card animate-fade-in"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                borderColor: isComplete ? `${config.color}30` : 'var(--border)',
                            }}
                        >
                            <div style={{ display: 'flex', gap: '20px' }}>
                                {/* Progress Ring */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    <ProgressRing progress={progress} color={config.color} size={90} strokeWidth={5} />
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <div className="num" style={{ fontSize: '22px', color: config.color, lineHeight: 1 }}>
                                            {current}
                                        </div>
                                        {editingTarget === config.type ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <input
                                                    type="number"
                                                    value={tempTarget}
                                                    onChange={e => setTempTarget(e.target.value)}
                                                    style={{ width: '40px', textAlign: 'center', fontSize: '11px', padding: '2px', background: 'var(--bg-body)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
                                                    autoFocus
                                                />
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button onClick={() => handleSaveTarget(config.type)} style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer' }}><Check size={12} /></button>
                                                    <button onClick={() => setEditingTarget(null)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer' }}><X size={12} /></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', marginTop: '2px' }}
                                                onClick={() => { setEditingTarget(config.type); setTempTarget(target.toString()); }}
                                                title="Edit Target"
                                            >
                                                /{target} <Edit2 size={8} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '18px' }}>{config.emoji}</span>
                                        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>{config.label}</h3>
                                        {isComplete && (
                                            <span className="badge badge-green" style={{ fontSize: '10px' }}>Complete</span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                        {config.description}
                                    </p>

                                    {/* Log Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                background: config.bg,
                                                color: config.color,
                                                border: `1px solid ${config.color}30`,
                                            }}
                                            onClick={() => handleLog(config.type, 1)}
                                        >
                                            <Plus size={14} /> 1 {config.unit.slice(0, -1)}
                                        </button>
                                        {config.type === 'sleep' && (
                                            <button
                                                className="btn btn-sm btn-secondary"
                                                onClick={() => handleLog(config.type, 0.5)}
                                            >
                                                +0.5h
                                            </button>
                                        )}
                                    </div>

                                    {/* Score Contribution */}
                                    {healthScore.breakdown && healthScore.breakdown[config.type] && (
                                        <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                            Score contribution:{' '}
                                            <span className="num" style={{ color: config.color }}>
                                                {healthScore.breakdown[config.type].score}
                                            </span>
                                            /{healthScore.breakdown[config.type].max} pts
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Weekly View Chart */}
            <div className="card animate-fade-in stagger-4">
                <div className="card-header">
                    <span className="card-title">Weekly Overview</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', height: '200px', alignItems: 'flex-end', padding: '16px 0', overflowX: 'auto' }}>
                    {weeklyData.map((day, i) => {
                        const dateObj = new Date(day.date);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        // calculate relative heights based on targets
                        const waterH = Math.min(100, (day.water / (habitTargets.water || 8)) * 100);
                        const exerciseH = Math.min(100, (day.exercise / (habitTargets.exercise || 1)) * 100);
                        const stretchH = Math.min(100, (day.stretch / (habitTargets.stretch || 4)) * 100);
                        const sleepH = Math.min(100, (day.sleep / (habitTargets.sleep || 8)) * 100);

                        return (
                            <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '40px' }}>
                                <div style={{ display: 'flex', gap: '2px', height: '150px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                                    <div style={{ width: '8px', height: `${waterH}%`, background: 'var(--blue)', borderRadius: '4px 4px 0 0', opacity: waterH > 0 ? 1 : 0.1 }} title={`Water: ${day.water}`} />
                                    <div style={{ width: '8px', height: `${exerciseH}%`, background: 'var(--green)', borderRadius: '4px 4px 0 0', opacity: exerciseH > 0 ? 1 : 0.1 }} title={`Exercise: ${day.exercise}`} />
                                    <div style={{ width: '8px', height: `${stretchH}%`, background: 'var(--purple)', borderRadius: '4px 4px 0 0', opacity: stretchH > 0 ? 1 : 0.1 }} title={`Stretch: ${day.stretch}`} />
                                    <div style={{ width: '8px', height: `${sleepH}%`, background: 'var(--yellow)', borderRadius: '4px 4px 0 0', opacity: sleepH > 0 ? 1 : 0.1 }} title={`Sleep: ${day.sleep}`} />
                                </div>
                                <span style={{ fontSize: '11px', color: i === 6 ? 'var(--accent)' : 'var(--text-muted)', fontWeight: i === 6 ? 600 : 400 }}>
                                    {i === 6 ? 'Today' : dayName}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
                    {[
                        { label: 'Water', color: 'var(--blue)' },
                        { label: 'Exercise', color: 'var(--green)' },
                        { label: 'Stretch', color: 'var(--purple)' },
                        { label: 'Sleep', color: 'var(--yellow)' },
                    ].map(legend => (
                        <div key={legend.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: legend.color }} />
                            {legend.label}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default HabitsPage;
