/**
 * LoadingScreen.jsx — Full-screen loading indicator.
 * Shown while the app initializes.
 */

import React from 'react';

const containerStyle = {
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-base)',
    gap: '20px',
};

const logoStyle = {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
};

const accentStyle = {
    color: 'var(--accent)',
};

const spinnerStyle = {
    width: '28px',
    height: '28px',
    border: '2.5px solid var(--border-mid)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
};

const subtextStyle = {
    fontSize: '13px',
    color: 'var(--text-muted)',
    marginTop: '-8px',
};

function LoadingScreen() {
    return (
        <div style={containerStyle}>
            <div style={logoStyle}>
                Vital<span style={accentStyle}>Pulse</span>
            </div>
            <div style={spinnerStyle} />
            <div style={subtextStyle}>Loading your health data…</div>
        </div>
    );
}

export default LoadingScreen;
