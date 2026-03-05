/**
 * FocusPage.jsx — Pomodoro timer with SVG circular progress ring.
 * Modes: Focus (45min), Short Break (5min), Long Break (15min).
 */

import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Coffee, Brain, Armchair } from 'lucide-react';
import useAppStore from '../store/appStore';
import PageHeader from '../components/PageHeader';

const modeConfig = {
    focus: { label: 'Focus', duration: 45 * 60, color: 'var(--accent)', icon: Brain },
    shortBreak: { label: 'Short Break', duration: 5 * 60, color: 'var(--green)', icon: Coffee },
    longBreak: { label: 'Long Break', duration: 15 * 60, color: 'var(--blue)', icon: Armchair },
};

function FocusPage() {
    const {
        focusMode, focusTimeLeft, focusRunning, focusSessions,
        setFocusMode, startFocus, pauseFocus, resetFocus, skipFocus,
    } = useAppStore();

    const config = modeConfig[focusMode];
    const progress = ((config.duration - focusTimeLeft) / config.duration) * 100;
    const minutes = Math.floor(focusTimeLeft / 60);
    const seconds = focusTimeLeft % 60;
    const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const size = 280, strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    const tips = {
        focus: '💡 Close distracting apps. Your brain needs ~15 min to reach deep focus.',
        shortBreak: '☕ Stand up, stretch, hydrate. Short breaks prevent burnout.',
        longBreak: '🌿 Walk around, grab a snack. You\'ve earned it!',
    };

    return (
        <div className="page-content">
            <PageHeader title="Focus Mode" subtitle="Deep work powered by the Pomodoro technique" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>

                {/* Mode selector tabs */}
                <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    {Object.entries(modeConfig).map(([key, cfg]) => {
                        const Icon = cfg.icon;
                        const active = focusMode === key;
                        return (
                            <button key={key} id={`focus-mode-${key}`} onClick={() => setFocusMode(key)}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: active ? 600 : 400, fontFamily: 'inherit', background: active ? cfg.color + '20' : 'transparent', color: active ? cfg.color : 'var(--text-secondary)', transition: 'all var(--transition-fast)' }}>
                                <Icon size={15} /> {cfg.label}
                            </button>
                        );
                    })}
                </div>

                {/* SVG Timer Ring */}
                <div style={{ position: 'relative', width: size, height: size }} className="animate-scale-in">
                    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-elevated)" strokeWidth={strokeWidth} />
                        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={config.color} strokeWidth={strokeWidth}
                            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                            style={{ transition: focusRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease', filter: `drop-shadow(0 0 8px ${config.color}40)` }} />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div className="num-xl" style={{ fontSize: '52px', color: config.color, marginBottom: '4px' }}>{timeDisplay}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>{config.label}</div>
                    </div>
                </div>

                {/* Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="btn btn-secondary btn-icon" onClick={resetFocus} style={{ width: 42, height: 42 }}><RotateCcw size={18} /></button>
                    <button id="focus-start-pause" className="btn btn-primary btn-lg" onClick={focusRunning ? pauseFocus : startFocus}
                        style={{ width: 120, background: focusRunning ? 'var(--bg-elevated)' : config.color, color: focusRunning ? 'var(--text-primary)' : 'var(--bg-base)', border: focusRunning ? '1px solid var(--border-mid)' : 'none' }}>
                        {focusRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Start</>}
                    </button>
                    <button className="btn btn-secondary btn-icon" onClick={skipFocus} style={{ width: 42, height: 42 }}><SkipForward size={18} /></button>
                </div>

                {/* Session dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sessions today</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        {Array.from({ length: Math.max(4, focusSessions) }, (_, i) => (
                            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: i < focusSessions ? config.color : 'var(--bg-elevated)', border: `1px solid ${i < focusSessions ? 'transparent' : 'var(--border-mid)'}`, transition: 'all 0.3s ease' }} />
                        ))}
                    </div>
                    <span className="num" style={{ fontSize: '13px', color: config.color }}>{focusSessions}</span>
                </div>

                {/* Tip */}
                <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '16px 20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>{tips[focusMode]}</div>
                </div>
            </div>
        </div>
    );
}

export default FocusPage;
