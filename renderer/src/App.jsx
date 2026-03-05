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
