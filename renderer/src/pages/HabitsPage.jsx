/**
 * HabitsPage.jsx — Habit logging with progress rings and detailed tracking.
 */

import React, { useEffect } from 'react';
import { Droplets, Dumbbell, Expand, Moon, Plus, Minus } from 'lucide-react';
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
    const { habits, loadHabits, logHabit, healthScore, loadHealthScore, addToast } = useAppStore();

    useEffect(() => {
        loadHabits();
        loadHealthScore();
    }, [loadHabits, loadHealthScore]);

    const handleLog = async (type, value) => {
        await logHabit(type, value);
        addToast({
            title: '✅ Habit Logged',
            message: `${value > 0 ? '+' : ''}${value} ${type} recorded`,
            type: 'success',
        });
    };

    return (
        <div className="page-content">
            <PageHeader
                title="Habit Tracker"
                subtitle="Build healthy habits one step at a time"
            />

            {/* Habit Cards Grid */}
            <div className="grid-2" style={{ gap: '20px' }}>
                {habitConfigs.map((config, index) => {
                    const current = habits[config.type] || 0;
                    const progress = Math.min(100, (current / config.target) * 100);
                    const isComplete = current >= config.target;

                    return (
                        <div
                            key={config.type}
                            className="card animate-fade-in"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                opacity: 0,
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
                                        <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                            /{config.target}
                                        </div>
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
        </div>
    );
}

export default HabitsPage;
