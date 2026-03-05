/**
 * Toast.jsx — In-app notification toast system.
 * Renders a stack of dismissable toasts in the top-right corner.
 */

import React from 'react';
import { X, Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const toastContainerStyle = {
    position: 'fixed',
    top: '52px',
    right: '16px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    pointerEvents: 'none',
    maxWidth: '360px',
};

const toastStyle = (type) => {
    const colors = {
        success: { bg: 'var(--green-dim)', border: 'var(--green)', icon: 'var(--green)' },
        error: { bg: 'var(--red-dim)', border: 'var(--red)', icon: 'var(--red)' },
        warning: { bg: 'var(--yellow-dim)', border: 'var(--yellow)', icon: 'var(--yellow)' },
        info: { bg: 'var(--blue-dim)', border: 'var(--blue)', icon: 'var(--blue)' },
        reminder: { bg: 'var(--accent-dim)', border: 'var(--accent)', icon: 'var(--accent)' },
    };
    const c = colors[type] || colors.info;

    return {
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        background: 'var(--bg-surface)',
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'slideInRight 0.3s ease forwards',
        iconColor: c.icon,
    };
};

function getIcon(type) {
    switch (type) {
        case 'success': return <CheckCircle size={18} />;
        case 'error': return <AlertTriangle size={18} />;
        case 'warning': return <AlertTriangle size={18} />;
        case 'reminder': return <Bell size={18} />;
        default: return <Info size={18} />;
    }
}

function Toast({ toasts = [], onRemove }) {
    if (toasts.length === 0) return null;

    return (
        <div style={toastContainerStyle}>
            {toasts.map((toast) => {
                const style = toastStyle(toast.type);
                const iconColor = style.iconColor;
                delete style.iconColor;

                return (
                    <div key={toast.id} style={style}>
                        <div style={{ color: iconColor, flexShrink: 0, marginTop: '1px' }}>
                            {getIcon(toast.type)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                marginBottom: '2px',
                            }}>
                                {toast.title}
                            </div>
                            {toast.message && (
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.4,
                                }}>
                                    {toast.message}
                                </div>
                            )}
                        </div>
                        <button
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '2px',
                                flexShrink: 0,
                            }}
                            onClick={() => onRemove(toast.id)}
                            aria-label="Dismiss"
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

export default Toast;
