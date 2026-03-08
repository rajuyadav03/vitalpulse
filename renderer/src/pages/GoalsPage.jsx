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
    const [newGoalPriority, setNewGoalPriority] = useState('med');
    const [sortMode, setSortMode] = useState('date'); // 'date' or 'priority'

    useEffect(() => {
        loadGoals();
    }, [loadGoals]);

    const handleAddGoal = async (e) => {
        e.preventDefault();
        if (!newGoalText.trim()) return;
        await addGoal(newGoalText.trim(), newGoalPriority);
        setNewGoalText('');
        setNewGoalPriority('med');
    };

    const completedCount = goals.filter((g) => g.completed).length;
    const totalCount = goals.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const todayStr = new Date().toISOString().split('T')[0];

    // Priority weights for sorting
    const prioWeight = { high: 3, med: 2, low: 1 };

    // Sort goals
    const sortedGoals = [...goals].sort((a, b) => {
        if (sortMode === 'priority') {
            return (prioWeight[b.priority || 'med'] || 0) - (prioWeight[a.priority || 'med'] || 0) || a.id - b.id;
        }
        return a.id - b.id; // date/id order default
    });

    return (
        <div className="page-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <PageHeader title="Today's Goals" subtitle="Set your daily targets and track progress" />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Sort by:</span>
                    <select
                        className="input"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                    >
                        <option value="date">Date Added</option>
                        <option value="priority">Priority</option>
                    </select>
                </div>
            </div>

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
                    <select
                        className="input"
                        value={newGoalPriority}
                        onChange={(e) => setNewGoalPriority(e.target.value)}
                        style={{ width: '100px' }}
                    >
                        <option value="high">🔥 High</option>
                        <option value="med">⚡ Med</option>
                        <option value="low">🌱 Low</option>
                    </select>
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
                    {sortedGoals.map((goal, index) => (
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

                            {/* Goal Text & Properties */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                    {!goal.completed && (
                                        <span style={{
                                            fontSize: '11px',
                                            padding: '2px 6px',
                                            borderRadius: 'var(--radius-sm)',
                                            background: goal.priority === 'high' ? 'var(--red-dim)' : goal.priority === 'low' ? 'var(--green-dim)' : 'var(--blue-dim)',
                                            color: goal.priority === 'high' ? 'var(--red)' : goal.priority === 'low' ? 'var(--green)' : 'var(--blue)'
                                        }}>
                                            {goal.priority === 'high' ? 'High' : goal.priority === 'low' ? 'Low' : 'Med'}
                                        </span>
                                    )}
                                </div>
                                {/* Carry-forward indicator */}
                                {goal.date < todayStr && (
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
