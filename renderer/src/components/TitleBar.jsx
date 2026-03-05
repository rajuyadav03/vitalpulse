/**
 * TitleBar.jsx — Custom frameless window title bar.
 * 42px height, draggable area, window controls (minimize, maximize, close).
 */

import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const titleBarStyle = {
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    padding: '0 8px 0 16px',
    userSelect: 'none',
    flexShrink: 0,
};

const titleStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    letterSpacing: '0.5px',
};

const logoAccent = {
    color: 'var(--accent)',
    fontWeight: 700,
};

const controlsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
};

const controlBtnBase = {
    width: '36px',
    height: '30px',
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

    return (
        <div className="drag-region" style={titleBarStyle}>
            <div style={titleStyle}>
                <span style={logoAccent}>●</span>
                <span>Vital<span style={logoAccent}>Pulse</span></span>
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
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
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
