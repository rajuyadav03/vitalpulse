/**
 * RoutinePage.jsx — AI-generated routine viewer and editor.
 */

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Utensils, Dumbbell, Moon, Droplets, Lightbulb, Sun, Edit2, Zap, Check, X, Plus, Trash2 } from 'lucide-react';
import useAppStore from '../store/appStore';
import PageHeader from '../components/PageHeader';

const typeIcons = { health: Sun, workout: Dumbbell, meal: Utensils, nap: Moon, sleep: Moon, water: Droplets };
const typeColors = { health: 'var(--accent)', workout: 'var(--green)', meal: 'var(--orange)', nap: 'var(--purple)', sleep: 'var(--blue)', water: 'var(--blue)' };

function RoutinePage() {
    const { profile, routine, loadRoutine, routineLoading, addToast } = useAppStore();

    const [isEditing, setIsEditing] = useState(false);
    const [editedRoutine, setEditedRoutine] = useState(null);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    const [isRegenerating, setIsRegenerating] = useState(false);
    const [regenConfirm, setRegenConfirm] = useState(false);

    useEffect(() => { loadRoutine(); }, [loadRoutine]);

    const handleEditClick = () => {
        setEditedRoutine(JSON.parse(JSON.stringify(routine)));
        setIsEditing(true);
        setCancelConfirm(false);
        setRegenConfirm(false);
    };

    const handleSave = async () => {
        try {
            await window.api.routine.update(editedRoutine);
            addToast({ title: '✅ Routine saved', message: 'Your routine has been updated.', type: 'success' });
            loadRoutine();
            setIsEditing(false);
        } catch (e) {
            addToast({ title: 'Error', message: 'Failed to save routine.', type: 'error' });
        }
    };

    const handleCancel = () => {
        setCancelConfirm(true);
    };

    const confirmCancel = () => {
        setIsEditing(false);
        setCancelConfirm(false);
        setEditedRoutine(null);
    };

    const handleRegenerate = async () => {
        if (!regenConfirm) {
            setRegenConfirm(true);
            return;
        }
        setIsRegenerating(true);
        try {
            await window.api.routine.generate(profile);
            addToast({ title: '✅ Routine generated', message: 'New routine created by AI.', type: 'success' });
            loadRoutine();
            setRegenConfirm(false);
        } catch (e) {
            addToast({ title: 'Error', message: 'Failed to generate routine.', type: 'error' });
        } finally {
            setIsRegenerating(false);
        }
    };

    const mutate = (updater) => {
        setEditedRoutine(prev => {
            const next = { ...prev };
            updater(next);
            return next;
        });
    };

    const renderInput = (value, onChange, placeholder = "", type = "text", width = "100%") => (
        <input
            type={type}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            style={{ width, padding: '6px 8px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '13px' }}
        />
    );

    if (routineLoading || isRegenerating) {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin" style={{ width: 24, height: 24, border: '2px solid var(--border-mid)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
            </div>
        );
    }

    if (!routine && !isEditing) {
        return (
            <div className="page-content">
                <PageHeader title="My Routine" subtitle="Your personalized daily plan">
                    {regenConfirm ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--red-dim)', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--red)' }}>⚠ Replace with new AI routine?</span>
                            <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white' }} onClick={handleRegenerate}>Yes, Regenerate</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRegenConfirm(false)}>Cancel</button>
                        </div>
                    ) : (
                        <button className="btn btn-primary" onClick={handleRegenerate}>
                            <Zap size={16} /> Generate with AI
                        </button>
                    )}
                </PageHeader>
                <div className="empty-state" style={{ marginTop: 60 }}>
                    <Calendar size={48} style={{ color: 'var(--text-muted)', opacity: 0.3, marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)' }}>No routine generated yet.</p>
                </div>
            </div>
        );
    }

    const data = isEditing ? editedRoutine : routine;

    return (
        <div className="page-content">
            <PageHeader title="My Routine" subtitle={data.summary || 'Your personalized daily plan'}>
                {isEditing ? (
                    cancelConfirm ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--yellow-dim)', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--yellow)' }}>Discard all changes?</span>
                            <button className="btn btn-sm" style={{ background: 'var(--yellow)', color: 'var(--bg-base)' }} onClick={confirmCancel}>Yes</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setCancelConfirm(false)}>No</button>
                        </div>
                    ) : (
                        <>
                            <button className="btn btn-primary" onClick={handleSave}><Check size={16} /> Save Changes</button>
                            <button className="btn btn-secondary" onClick={handleCancel}><X size={16} /> Cancel</button>
                        </>
                    )
                ) : (
                    regenConfirm ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--red-dim)', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                            <span style={{ fontSize: '12px', color: 'var(--red)' }}>⚠ This will replace your current routine with a new AI-generated one. Your edits will be lost. Continue?</span>
                            <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white' }} onClick={handleRegenerate}>Yes, Regenerate</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setRegenConfirm(false)}>Cancel</button>
                        </div>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={handleEditClick}><Edit2 size={16} /> Edit Routine</button>
                            <button className="btn btn-primary" onClick={handleRegenerate}><Zap size={16} /> Regenerate with AI</button>
                        </>
                    )
                )}
            </PageHeader>

            {/* Daily Schedule */}
            <div className="card mb-lg animate-fade-in">
                <div className="card-header">
                    <span className="card-title"><Calendar size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Daily Schedule</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: isEditing ? '8px' : '1px' }}>
                    {(data.dailySchedule || []).map((item, i) => {
                        const Icon = typeIcons[item.type] || Clock;
                        const color = typeColors[item.type] || 'var(--text-secondary)';

                        if (isEditing) {
                            return (
                                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {renderInput(item.time, val => mutate(d => d.dailySchedule[i].time = val), "Time", "time", "120px")}
                                    {renderInput(item.activity || item.title, val => mutate(d => { d.dailySchedule[i].activity = val; d.dailySchedule[i].title = val; }), "Activity", "text", "30%")}
                                    {renderInput(item.detail, val => mutate(d => d.dailySchedule[i].detail = val), "Detail")}
                                    <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => mutate(d => d.dailySchedule.splice(i, 1))}><Trash2 size={16} /></button>
                                </div>
                            );
                        }

                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < data.dailySchedule.length - 1 ? '1px solid var(--border)' : 'none' }}>
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
                    {isEditing && (
                        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginTop: '8px' }} onClick={() => mutate(d => { if (!d.dailySchedule) d.dailySchedule = []; d.dailySchedule.push({ time: '12:00', activity: '', detail: '', type: 'health' }); })}>
                            <Plus size={14} /> Add Schedule Item
                        </button>
                    )}
                </div>
            </div>

            <div className="grid-2" style={{ gap: 20 }}>
                {/* Meals */}
                <div className="card animate-fade-in stagger-1">
                    <div className="card-header">
                        <span className="card-title"><Utensils size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Meal Plan</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {(data.mealSchedule || []).map((meal, i) => {
                            if (isEditing) {
                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-elevated)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {renderInput(meal.time, val => mutate(d => d.mealSchedule[i].time = val), "Time", "time", "120px")}
                                            {renderInput(meal.name, val => mutate(d => d.mealSchedule[i].name = val), "Meal Name")}
                                            <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => mutate(d => d.mealSchedule.splice(i, 1))}><Trash2 size={16} /></button>
                                        </div>
                                        {renderInput(meal.suggestion, val => mutate(d => d.mealSchedule[i].suggestion = val), "Suggestion")}
                                    </div>
                                );
                            }
                            return (
                                <div key={i} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{meal.name}</span>
                                        <span className="num" style={{ fontSize: 12, color: 'var(--orange)' }}>{meal.time}</span>
                                    </div>
                                    {meal.suggestion && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{meal.suggestion}</div>}
                                </div>
                            );
                        })}
                        {isEditing && (
                            <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => mutate(d => { if (!d.mealSchedule) d.mealSchedule = []; d.mealSchedule.push({ time: '12:00', name: '', suggestion: '' }); })}>
                                <Plus size={14} /> Add Meal
                            </button>
                        )}
                    </div>
                </div>

                {/* Workout */}
                <div className="card animate-fade-in stagger-2">
                    <div className="card-header">
                        <span className="card-title"><Dumbbell size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Workout</span>
                        {!isEditing && data.workoutTime && <span className="badge badge-green">{data.workoutTime}</span>}
                    </div>
                    {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Workout Time:</span>
                                {renderInput(data.workoutTime, val => mutate(d => d.workoutTime = val), "Time", "time", "120px")}
                            </div>
                            {renderInput(data.workoutNote, val => mutate(d => d.workoutNote = val), "Workout Note")}

                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {(data.workoutPlan || []).map((step, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className="num" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{i + 1}.</span>
                                        {renderInput(step, val => mutate(d => d.workoutPlan[i] = val), "Step")}
                                        <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => mutate(d => d.workoutPlan.splice(i, 1))}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => mutate(d => { if (!d.workoutPlan) d.workoutPlan = []; d.workoutPlan.push(''); })}>
                                    <Plus size={14} /> Add Step
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {data.workoutNote && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{data.workoutNote}</p>}
                            {data.workoutPlan && data.workoutPlan.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {data.workoutPlan.map((step, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="num" style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green-dim)', color: 'var(--green)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{step}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Hydration */}
                <div className="card animate-fade-in stagger-3">
                    <div className="card-header">
                        <span className="card-title"><Droplets size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Hydration</span>
                        {!isEditing && <span className="badge badge-accent">{data.waterIntakeGoal || 8} glasses</span>}
                    </div>
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Water Goal (glasses/day):</span>
                            {renderInput(data.waterIntakeGoal || 8, val => mutate(d => d.waterIntakeGoal = parseInt(val, 10) || 0), "Goal", "number", "80px")}
                        </div>
                    ) : (
                        data.waterSchedule && data.waterSchedule.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {data.waterSchedule.map((time, i) => (
                                    <span key={i} className="num" style={{ padding: '4px 10px', background: 'var(--blue-dim)', color: 'var(--blue)', borderRadius: 'var(--radius-md)', fontSize: 12 }}>{time}</span>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Diet Tips */}
                <div className="card animate-fade-in stagger-4">
                    <div className="card-header">
                        <span className="card-title"><Lightbulb size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Diet Tips</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {isEditing ? (
                            <>
                                {(data.dietTips || []).map((tip, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {renderInput(tip, val => mutate(d => d.dietTips[i] = val), "Diet Tip")}
                                        <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => mutate(d => d.dietTips.splice(i, 1))}><Trash2 size={16} /></button>
                                    </div>
                                ))}
                                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => mutate(d => { if (!d.dietTips) d.dietTips = []; d.dietTips.push(''); })}>
                                    <Plus size={14} /> Add Tip
                                </button>
                            </>
                        ) : (
                            (data.dietTips || []).map((tip, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span style={{ color: 'var(--yellow)', flexShrink: 0 }}>•</span> {tip}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Sleep Routine */}
            <div className="card mt-lg animate-fade-in stagger-5">
                <div className="card-header">
                    <span className="card-title"><Moon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Nap & Sleep</span>
                </div>
                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Nap Time {renderInput(data.napTime || '', val => mutate(d => d.napTime = val), "Time", "time", "120px")}
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Nap Duration (min) {renderInput(data.napDuration || '', val => mutate(d => d.napDuration = parseInt(val, 10)), "Minutes", "number", "120px")}
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Wind Down Time {renderInput(data.sleepRoutine?.windDownTime || '', val => mutate(d => { if (!d.sleepRoutine) d.sleepRoutine = {}; d.sleepRoutine.windDownTime = val; }), "Time", "time", "120px")}
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Sleep Time {renderInput(data.sleepRoutine?.sleepTime || '', val => mutate(d => { if (!d.sleepRoutine) d.sleepRoutine = {}; d.sleepRoutine.sleepTime = val; }), "Time", "time", "120px")}
                            </label>
                            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Wake Time {renderInput(data.sleepRoutine?.wakeTime || '', val => mutate(d => { if (!d.sleepRoutine) d.sleepRoutine = {}; d.sleepRoutine.wakeTime = val; }), "Time", "time", "120px")}
                            </label>
                        </div>
                    </div>
                ) : (
                    data.sleepRoutine && (
                        <div style={{ display: 'flex', gap: 20 }}>
                            {[
                                { label: 'Wind Down', time: data.sleepRoutine.windDownTime, color: 'var(--purple)' },
                                { label: 'Bedtime', time: data.sleepRoutine.sleepTime, color: 'var(--blue)' },
                                { label: 'Wake Up', time: data.sleepRoutine.wakeTime, color: 'var(--accent)' },
                            ].map((s) => s.time && (
                                <div key={s.label} style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                                    <div className="num" style={{ fontSize: 20, color: s.color }}>{s.time}</div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default RoutinePage;
