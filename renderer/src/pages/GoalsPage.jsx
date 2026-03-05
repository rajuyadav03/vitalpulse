/**
 * GoalsPage.jsx — Goal CRUD with carry-forward display.
 * Allows adding, completing, and deleting daily goals.
 */

import React, { useEffect, useState } from 'react';
import {
    Target,
    Plus,
    CheckCircle2,
    Circle,
    Trash2,
    ArrowUpFromLine,
} from 'lucide-react';
import useAppStore from '../store/appStore';
import PageHeader from '../components/PageHeader';

function GoalsPage() {
    const { goals, loadGoals, addGoal, completeGoal, deleteGoal } = useAppStore();
    const [newGoalText, setNewGoalText] = useState('');

    useEffect(() => {
        loadGoals();
    }, [loadGoals]);

    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoalText.trim()) return;
        await addGoal(newGoalText.trim());
        setNewGoalText('');
    };

    const completedCount = goals.filter((g) => g.completed).length;
    const totalCount = goals.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    // Determine if a goal was carried forward (created today but from yesterday's pattern)
    const todayStr = new Date().toISOString().split('T')[0];

    return (
        <div className="page-content">
            <PageHeader
                title="Today's Goals"
                subtitle="Set your daily targets and track progress"
            />

            {/* Progress Summary */}
            <div className="card mb-lg animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                        <span className="num" style={{ fontSize: '24px', color: 'var(--text-primary)' }}>
                            {completedCount}
                        </span>
                        <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}> / {totalCount} completed</span>
                    </div>
                    <span
                        className="badge"
                        style={{
                            background: progress === 100 ? 'var(--green-dim)' : 'var(--accent-dim)',
                            color: progress === 100 ? 'var(--green)' : 'var(--accent)',
                        }}
                    >
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="progress-bar" style={{ height: '6px' }}>
                    <div
                        className="progress-bar-fill"
                        style={{
                            width: `${progress}%`,
                            background: progress === 100 ? 'var(--green)' : 'var(--accent)',
                        }}
                    />
                </div>
            </div>

            {/* Add Goal Form */}
            <form onSubmit={handleAddGoal} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        id="goal-input"
                        type="text"
                        placeholder="What do you want to achieve today?"
                        value={newGoalText}
                        onChange={(e) => setNewGoalText(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={!newGoalText.trim()}
                        style={{ opacity: !newGoalText.trim() ? 0.5 : 1 }}
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>
            </form>

            {/* Goals List */}
            {goals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {goals.map((goal, index) => (
                        <div
                            key={goal.id}
                            className="card animate-fade-in"
                            style={{
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                animationDelay: `${index * 0.03}s`,
                                opacity: 0,
                                borderColor: goal.completed ? 'rgba(63,185,80,0.15)' : 'var(--border)',
                            }}
                        >
                            {/* Complete Toggle */}
                            <button
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: goal.completed ? 'var(--green)' : 'var(--text-muted)',
                                    padding: '2px',
                                    flexShrink: 0,
                                    transition: 'color var(--transition-fast)',
                                }}
                                onClick={() => !goal.completed && completeGoal(goal.id)}
                                aria-label={goal.completed ? 'Completed' : 'Mark complete'}
                            >
                                {goal.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                            </button>

                            {/* Goal Text */}
                            <div style={{ flex: 1 }}>
                                <span
                                    style={{
                                        fontSize: '14px',
                                        color: goal.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                                        textDecoration: goal.completed ? 'line-through' : 'none',
                                        transition: 'all var(--transition-fast)',
                                    }}
                                >
                                    {goal.text}
                                </span>
                                {/* Carry-forward indicator */}
                                {goal.date === todayStr && goal.created_at && !goal.created_at.includes(todayStr) && (
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            marginLeft: '8px',
                                            fontSize: '10px',
                                            color: 'var(--orange)',
                                            background: 'var(--orange-dim)',
                                            padding: '1px 6px',
                                            borderRadius: '8px',
                                        }}
                                    >
                                        <ArrowUpFromLine size={10} /> Carried forward
                                    </span>
                                )}
                            </div>

                            {/* Delete Button */}
                            <button
                                className="btn-icon"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                                onClick={() => deleteGoal(goal.id)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = 'var(--red)';
                                    e.currentTarget.style.background = 'var(--red-dim)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                    e.currentTarget.style.background = 'transparent';
                                }}
                                aria-label="Delete goal"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state" style={{ marginTop: '40px' }}>
                    <Target size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ fontSize: '15px', color: 'var(--text-muted)' }}>No goals yet</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Add your first goal for today above
                    </p>
                </div>
            )}
        </div>
    );
}

export default GoalsPage;
