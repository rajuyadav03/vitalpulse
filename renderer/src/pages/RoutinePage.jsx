/**
 * RoutinePage.jsx — AI-generated routine viewer.
 * Shows daily schedule, meals, workout, and sleep sections.
 */

import React, { useEffect } from 'react';
import { Calendar, Clock, Utensils, Dumbbell, Moon, Droplets, Lightbulb, Sun } from 'lucide-react';
import useAppStore from '../store/appStore';
import PageHeader from '../components/PageHeader';

const typeIcons = { health: Sun, workout: Dumbbell, meal: Utensils, nap: Moon, sleep: Moon };
const typeColors = { health: 'var(--accent)', workout: 'var(--green)', meal: 'var(--orange)', nap: 'var(--purple)', sleep: 'var(--blue)' };

function RoutinePage() {
    const { routine, loadRoutine, routineLoading } = useAppStore();

    useEffect(() => { loadRoutine(); }, [loadRoutine]);

    if (routineLoading) {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border-mid)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
            </div>
        );
    }

    if (!routine) {
        return (
            <div className="page-content">
                <PageHeader title="My Routine" subtitle="Your personalized daily plan" />
                <div className="empty-state" style={{ marginTop: 60 }}>
                    <Calendar size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No routine generated yet.</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Complete the setup wizard to generate your plan.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <PageHeader title="My Routine" subtitle={routine.summary || 'Your personalized daily plan'} />

            {/* Daily Schedule */}
            {routine.dailySchedule && routine.dailySchedule.length > 0 && (
                <div className="card mb-lg animate-fade-in">
                    <div className="card-header">
                        <span className="card-title"><Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Daily Schedule</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        {routine.dailySchedule.map((item, i) => {
                            const Icon = typeIcons[item.type] || Clock;
                            const color = typeColors[item.type] || 'var(--text-secondary)';
                            return (
                                <div key={i} className="animate-fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < routine.dailySchedule.length - 1 ? '1px solid var(--border)' : 'none', animationDelay: `${i * 0.03}s`, opacity: 0 }}>
                                    <div className="num" style={{ width: 50, fontSize: 13, color, flexShrink: 0, paddingTop: 1 }}>{item.time}</div>
                                    <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Icon size={14} style={{ color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.title || item.activity}</div>
                                        {item.detail && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.detail}</div>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid-2" style={{ gap: 20 }}>
                {/* Meals */}
                {routine.mealSchedule && routine.mealSchedule.length > 0 && (
                    <div className="card animate-fade-in stagger-1">
                        <div className="card-header">
                            <span className="card-title"><Utensils size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Meal Plan</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {routine.mealSchedule.map((meal, i) => (
                                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{meal.name}</span>
                                        <span className="num" style={{ fontSize: 12, color: 'var(--orange)' }}>{meal.time}</span>
                                    </div>
                                    {meal.suggestion && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{meal.suggestion}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Workout */}
                <div className="card animate-fade-in stagger-2">
                    <div className="card-header">
                        <span className="card-title"><Dumbbell size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Workout</span>
                        {routine.workoutTime && <span className="badge badge-green">{routine.workoutTime}</span>}
                    </div>
                    {routine.workoutNote && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{routine.workoutNote}</p>}
                    {routine.workoutPlan && routine.workoutPlan.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {routine.workoutPlan.map((step, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="num" style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green-dim)', color: 'var(--green)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                                    <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{step}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Hydration */}
                <div className="card animate-fade-in stagger-3">
                    <div className="card-header">
                        <span className="card-title"><Droplets size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Hydration</span>
                        <span className="badge badge-accent">{routine.waterIntakeGoal || 8} glasses</span>
                    </div>
                    {routine.waterSchedule && routine.waterSchedule.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {routine.waterSchedule.map((time, i) => (
                                <span key={i} className="num" style={{ padding: '4px 10px', background: 'var(--blue-dim)', color: 'var(--blue)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>{time}</span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Diet Tips */}
                {routine.dietTips && routine.dietTips.length > 0 && (
                    <div className="card animate-fade-in stagger-4">
                        <div className="card-header">
                            <span className="card-title"><Lightbulb size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Diet Tips</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {routine.dietTips.map((tip, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--yellow)', flexShrink: 0 }}>•</span> {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sleep Routine */}
            {routine.sleepRoutine && (
                <div className="card mt-lg animate-fade-in stagger-5">
                    <div className="card-header">
                        <span className="card-title"><Moon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Sleep Routine</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                        {[
                            { label: 'Wind Down', time: routine.sleepRoutine.windDownTime, color: 'var(--purple)' },
                            { label: 'Bedtime', time: routine.sleepRoutine.sleepTime, color: 'var(--blue)' },
                            { label: 'Wake Up', time: routine.sleepRoutine.wakeTime, color: 'var(--accent)' },
                        ].map((s) => s.time && (
                            <div key={s.label} style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                                <div className="num" style={{ fontSize: 20, color: s.color }}>{s.time}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoutinePage;
