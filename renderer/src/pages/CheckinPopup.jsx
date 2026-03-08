/**
 * CheckinPopup.jsx — Interactive popup window for reminders.
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

function CheckinPopup() {
    const [data, setData] = useState(null);

    useEffect(() => {
        // Fetch data
        window.api.checkin.getData().then((res) => {
            if (res) setData(res);
        });

        // Listen for timeout from main process (optional, or just do local timeout)
        const unlisten = window.api?.receive?.('checkin:timeout', () => {
            handleRespond('no');
        });

        // Countdown timer bar handles itself with CSS animation
        const timer = setTimeout(() => {
            handleRespond('no');
        }, 30000);

        return () => {
            clearTimeout(timer);
            if (unlisten) unlisten();
        };
    }, []);

    const handleRespond = (response) => {
        window.api.checkin.respond(response);
    };

    if (!data) return null;

    // Map type to emoji and title
    const getDetails = (type, title) => {
        switch (type) {
            case 'water': return { icon: '💧', header: 'Water Check-in', question: 'Did you drink a glass of water recently?' };
            case 'stretch': return { icon: '🧘', header: 'Stretch Break', question: 'Did you take a stretch break?' };
            case 'eyeRest': return { icon: '👁️', header: 'Eye Rest', question: 'Did you rest your eyes for 20 seconds?' };
            case 'meal': return { icon: '🍽️', header: 'Meal Time', question: 'Did you have your meal?' };
            case 'workout': return { icon: '💪', header: 'Workout Check-in', question: 'Did you complete your workout?' };
            case 'nap': return { icon: '😴', header: 'Power Nap', question: 'Did you take your power nap?' };
            case 'sleep': return { icon: '🌙', header: 'Wind Down', question: 'Are you winding down for sleep?' };
            default: return { icon: '✅', header: title || 'Task Check-in', question: `Did you complete: ${title || 'this task'}?` };
        }
    };

    const details = getDetails(data.type, data.title);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '16px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ fontSize: '24px' }}>{details.icon}</div>
                <button
                    onClick={() => handleRespond('no')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                >
                    <X size={18} />
                </button>
            </div>

            <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {details.header}
            </h2>

            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', flex: 1 }}>
                {details.question}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                <button
                    onClick={() => handleRespond('yes')}
                    style={{
                        flex: 1,
                        background: 'var(--accent)',
                        color: 'var(--bg-base)',
                        border: 'none',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    ✓ Yes, I did
                </button>
                <button
                    onClick={() => handleRespond('no')}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: '1px solid var(--border-mid)',
                        color: 'var(--text-secondary)',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    ✗ Not yet
                </button>
            </div>

            {/* Countdown bar (30s) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', width: '100%', background: 'var(--border-mid)' }}>
                <div
                    style={{
                        height: '100%',
                        background: 'var(--accent)',
                        animation: 'shrink 30s linear forwards'
                    }}
                />
            </div>
            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}

export default CheckinPopup;
