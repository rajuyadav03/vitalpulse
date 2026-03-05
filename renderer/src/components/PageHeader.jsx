/**
 * PageHeader.jsx — Reusable page title component.
 * Renders a title, optional subtitle, and optional action area.
 */

import React from 'react';

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
};

const titleGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
};

const titleStyle = {
    fontSize: '22px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.2,
};

const subtitleStyle = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
};

function PageHeader({ title, subtitle, children }) {
    return (
        <div style={headerStyle}>
            <div style={titleGroupStyle}>
                <h2 style={titleStyle}>{title}</h2>
                {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
            </div>
            {children && <div style={{ display: 'flex', gap: '8px' }}>{children}</div>}
        </div>
    );
}

export default PageHeader;
