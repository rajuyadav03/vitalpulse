/**
 * TitleBar.jsx — Custom frameless window title bar.
 * 42px height, draggable area, window controls (minimize, maximize, close).
 */

import React from 'react';
import { Minus, Square, X, Bell, BellOff } from 'lucide-react';
import useAppStore from '../store/appStore';

const titleBarStyle = {
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(16px)',
    borderBottom: '1px solid var(--border-glass)',
    padding: '0 8px 0 16px',
    userSelect: 'none',
    flexShrink: 0,
};

const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '0.5px',
};

const logoAccent = {
    color: 'var(--accent)',
    fontWeight: 800,
    textShadow: '0 0 10px var(--accent-glow)',
};

const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
};

const controlBtnBase = {
    minWidth: '44px', /* Pro Max: Touch Target Size */
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-sm)',
    transition: 'all var(--transition-fast)',
};

function TitleBar() {
    const handleMinimize = () => window.api?.window?.minimize();
    const handleMaximize = () => window.api?.window?.maximize();
    const handleClose = () => window.api?.window?.close();

    const { remindersPaused, pauseReminders, resumeReminders } = useAppStore();

    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    const toggleReminders = () => {
        if (remindersPaused) {
            resumeReminders();
        } else {
            pauseReminders();
        }
    };

    return (
        <div className="drag-region" style={titleBarStyle}>
            <div style={titleStyle}>
                <span style={logoAccent}>●</span>
                <span>Vital<span style={logoAccent}>Pulse</span></span>
            </div>

            <div className="no-drag" style={{ display: 'flex', alignItems: 'center', marginLeft: 'auto', marginRight: '16px', gap: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{dateString}</span>
                <button
                    onClick={toggleReminders}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title={remindersPaused ? "Reminders Paused" : "Reminders Active"}
                >
                    {remindersPaused ?
                        <BellOff size={14} style={{ color: 'var(--text-muted)' }} /> :
                        <Bell size={14} style={{ color: 'var(--green)' }} />
                    }
                </button>
            </div>

            <div className="no-drag" style={controlsStyle}>
                <button
                    id="btn-minimize"
                    style={controlBtnBase}
                    onClick={handleMinimize}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    aria-label="Minimize"
                >
                    <Minus size={14} />
                </button>

                <button
                    id="btn-maximize"
                    style={controlBtnBase}
                    onClick={handleMaximize}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    aria-label="Maximize"
                >
                    <Square size={12} />
                </button>

                <button
                    id="btn-close"
                    style={{
                        ...controlBtnBase,
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    }}
                    onClick={handleClose}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--red)';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    aria-label="Close"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default TitleBar;
