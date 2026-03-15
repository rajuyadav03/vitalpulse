/**
 * Sidebar.jsx — Left navigation panel with health score preview.
 * 220px fixed width, accent-highlighted active link, mini health score display.
 */

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Target,
    Activity,
    Clock,
    Calendar,
    Heart,
    Bell,
    Settings,
} from 'lucide-react';
import useAppStore from '../store/appStore';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/habits', label: 'Habits', icon: Activity },
    { path: '/focus', label: 'Focus Mode', icon: Clock },
    { path: '/routine', label: 'My Routine', icon: Calendar },
    { path: '/reminders', label: 'Reminders', icon: Bell },
    { path: '/settings', label: 'Settings', icon: Settings },
];

const sidebarStyle = {
    width: '220px',
    minWidth: '220px',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
};

const navStyle = {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
};

const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    background: isActive ? 'var(--accent-dim)' : 'transparent',
    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
    border: 'none',
    width: '100%',
    textAlign: 'left',
    fontSize: '14px', /* Pro Max: Base 14px */
    fontWeight: isActive ? 600 : 400,
    fontFamily: 'inherit',
});

const scoreBoxStyle = {
    margin: '8px',
    padding: '16px',
    background: 'var(--bg-elevated)',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    textAlign: 'center',
};

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { healthScore, loadHealthScore, reminders, loadReminders } = useAppStore();

    useEffect(() => {
        loadHealthScore();
        loadReminders();
    }, [loadHealthScore, loadReminders]);

    const getScoreColor = (grade) => {
        switch (grade) {
            case 'A+': return 'var(--accent)';
            case 'A': return 'var(--green)';
            case 'B': return 'var(--blue)';
            case 'C': return 'var(--yellow)';
            default: return 'var(--red)';
        }
    };

    return (
        <aside style={sidebarStyle}>
            <nav style={navStyle}>
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.path}
                            id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            className="btn-ghost"
                            style={navItemStyle(isActive)}
                            onClick={() => navigate(item.path)}
                        >
                            <div style={{ position: 'relative', display: 'flex' }} aria-hidden="true">
                                <Icon size={18} />
                                {item.path === '/reminders' && reminders?.length > 0 && (
                                    <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--red)', borderRadius: '50%', border: '2px solid var(--bg-surface)' }} />
                                )}
                            </div>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Health Score Preview */}
            <div style={scoreBoxStyle}>
                <Heart
                    size={20}
                    style={{ color: getScoreColor(healthScore.grade), marginBottom: '8px' }}
                />
                <div
                    className="num-lg"
                    style={{
                        color: getScoreColor(healthScore.grade),
                        marginBottom: '4px',
                    }}
                >
                    {healthScore.total || 0}
                </div>
                <div
                    style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                    }}
                >
                    Health Score
                </div>
                <div
                    className="badge"
                    style={{
                        marginTop: '8px',
                        background: `${getScoreColor(healthScore.grade)}20`,
                        color: getScoreColor(healthScore.grade),
                    }}
                >
                    Grade {healthScore.grade || 'D'}
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
