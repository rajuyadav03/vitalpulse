/**
 * App.jsx — Root application component.
 * Handles routing, layout shell (TitleBar + Sidebar), and initialization.
 * All pages are lazy-loaded for optimal performance.
 */

import React, { Suspense, lazy, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './store/appStore';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import LoadingScreen from './components/LoadingScreen';

// Lazy-loaded pages
const SetupPage = lazy(() => import('./pages/SetupPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const HabitsPage = lazy(() => import('./pages/HabitsPage'));
const FocusPage = lazy(() => import('./pages/FocusPage'));
const RoutinePage = lazy(() => import('./pages/RoutinePage'));
const RemindersPage = lazy(() => import('./pages/RemindersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CheckinPopup = lazy(() => import('./pages/CheckinPopup'));

/**
 * PageFallback — Shown while lazy-loaded pages are loading.
 */
function PageFallback() {
    return (
        <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div className="animate-spin" style={{
                width: 24,
                height: 24,
                border: '2px solid var(--border-mid)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
            }} />
        </div>
    );
}

function App() {
    const { loading, isSetup, initApp, toasts, removeToast, addToast } = useAppStore();

    // Initialize app on mount
    useEffect(() => {
        initApp();
    }, [initApp]);

    // Subscribe to IPC events from main process
    useEffect(() => {
        if (!window.api || !window.api.on) return;

        // Listen for reminders
        const cleanupReminder = window.api.on('reminder:fired', (data) => {
            addToast({
                title: data.title,
                message: data.message,
                type: 'reminder',
            });
        });

        // Listen for health score updates
        const cleanupScore = window.api.on('healthScore:update', (score) => {
            useAppStore.setState({ healthScore: score });
        });

        return () => {
            if (cleanupReminder) cleanupReminder();
            if (cleanupScore) cleanupScore();
        };
    }, [addToast]);

    // Show loading screen while initializing
    if (loading) {
        return <LoadingScreen />;
    }

    // Special standalone route for popup windows (no layout needed)
    const currentHash = window.location.hash || '';
    if (currentHash.includes('checkin') || window.location.href.includes('checkin')) {
        return (
            <HashRouter>
                <Suspense fallback={<PageFallback />}>
                    <Routes>
                        <Route path="/checkin" element={<CheckinPopup />} />
                    </Routes>
                </Suspense>
            </HashRouter>
        );
    }

    if (!window.api) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-body)' }}>
                <h1 style={{ color: 'var(--accent)' }}>Please Use The Desktop App</h1>
                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
                    VitalPulse requires the native Electron backend to function.<br />
                    It appears you have opened <code>localhost:5173</code> in a web browser like Chrome or Edge.
                </p>
                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-elevated)', borderRadius: '8px', textAlign: 'left', display: 'inline-block', lineHeight: 1.6 }}>
                    <strong>How to start correctly:</strong><br />
                    1. Close this browser tab.<br />
                    2. Go back to your terminal and press <code>Ctrl + C</code> to stop the current process.<br />
                    3. Run <code>npm start</code> again.<br />
                    4. <b>Wait</b> for the actual VitalPulse <strong>Application Window</strong> to pop up automatically. Do not manually open the <code>localhost</code> link.
                </div>
            </div>
        );
    }

    // Show setup wizard if not configured
    if (!isSetup) {
        return (
            <HashRouter>
                <div className="app-layout" style={{ flexDirection: 'column' }}>
                    <TitleBar />
                    <Suspense fallback={<PageFallback />}>
                        <SetupPage />
                    </Suspense>
                    <Toast toasts={toasts} onRemove={removeToast} />
                </div>
            </HashRouter>
        );
    }

    // Main app with sidebar layout
    return (
        <HashRouter>
            <div className="app-layout" style={{ flexDirection: 'column' }}>
                <TitleBar />
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    <Sidebar />
                    <main className="app-content">
                        <Suspense fallback={<PageFallback />}>
                            <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/goals" element={<GoalsPage />} />
                                <Route path="/habits" element={<HabitsPage />} />
                                <Route path="/focus" element={<FocusPage />} />
                                <Route path="/routine" element={<RoutinePage />} />
                                <Route path="/reminders" element={<RemindersPage />} />
                                <Route path="/settings" element={<SettingsPage />} />
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </main>
                </div>
                <Toast toasts={toasts} onRemove={removeToast} />
            </div>
        </HashRouter>
    );
}

export default App;
