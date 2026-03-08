/**
 * SettingsPage.jsx — Profile, Data Management, and App Info.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, HardDrive, Download, AlertTriangle, Info, FolderOpen, Copy } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import useAppStore from '../store/appStore';

function SettingsPage() {
    const { profile, initApp, loadHealthScore, addToast, setProfile } = useAppStore();

    const [formData, setFormData] = useState({});
    const [dataPath, setDataPath] = useState('');

    // Danger Zone States
    const [confirmDeleteLogs, setConfirmDeleteLogs] = useState(false);
    const [confirmDeleteGoals, setConfirmDeleteGoals] = useState(false);
    const [confirmResetRoutine, setConfirmResetRoutine] = useState(false);
    const [deleteDataStep, setDeleteDataStep] = useState(0); // 0=none, 1=proceed?, 2=type DELETE
    const [deleteInput, setDeleteInput] = useState('');

    useEffect(() => {
        initApp();
        window.api.settings.getDataPath().then(p => setDataPath(p));
    }, [initApp]);

    useEffect(() => {
        if (profile) {
            setFormData(profile);
        }
    }, [profile]);

    // Section A: Profile
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            await window.api.profile.save(formData);
            await initApp();
            addToast({ title: '✅ Profile updated', message: 'Your profile has been saved.', type: 'success' });
        } catch (error) {
            addToast({ title: 'Error', message: 'Failed to update profile.', type: 'error' });
        }
    };

    // Section B: Data Storage
    const handleOpenFolder = () => window.api.settings.openDataFolder();
    const handleCopyPath = async () => {
        await window.api.settings.copyToClipboard(dataPath);
        addToast({ title: '✅ Path copied', message: 'Database path copied to clipboard.', type: 'success' });
    };

    // Section C: Exports
    const handleExport = async (type) => {
        try {
            const res = type === 'json'
                ? await window.api.settings.exportJSON()
                : await window.api.settings.exportCSV(type);

            if (res && res.success) {
                addToast({ title: '✅ Export successful', message: `Saved to ${res.path}`, type: 'success' });
            }
        } catch (e) {
            addToast({ title: 'Error', message: 'Export failed.', type: 'error' });
        }
    };

    // Section D: Danger Zone
    const handleClearLogs = async () => {
        await window.api.settings.clearTodayHabits();
        setConfirmDeleteLogs(false);
        loadHealthScore();
        addToast({ title: '🗑 Logs cleared', message: 'Today’s habits reset.', type: 'success' });
    };

    const handleDeleteGoals = async () => {
        await window.api.settings.deleteAllGoals();
        setConfirmDeleteGoals(false);
        loadHealthScore();
        addToast({ title: '🗑 Goals deleted', message: 'All goals removed.', type: 'success' });
    };

    const handleResetRoutine = async () => {
        await window.api.settings.resetRoutine();
        setConfirmResetRoutine(false);
        addToast({ title: '🔄 Routine reset', message: 'Routine cleared.', type: 'success' });
    };

    const handleDeleteAllData = async () => {
        if (deleteInput === 'DELETE') {
            await window.api.settings.deleteAllData();
            setProfile(null);
            navigate('/setup');
        }
    };

    // Helper for inputs
    const renderInput = (label, name, type = "text", placeholder = "") => (
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</label>
            <input
                type={type}
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                placeholder={placeholder}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            />
        </div>
    );

    const renderSelect = (label, name, options) => (
        <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</label>
            <select
                name={name}
                value={formData[name] || ''}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
            >
                <option value="">Select...</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );

    return (
        <div className="page-content" style={{ paddingBottom: '40px' }}>
            <PageHeader title="Settings" subtitle="Manage your preferences and data" />

            {/* SECTION A: Profile Settings */}
            <div className="card mb-lg animate-fade-in stagger-1">
                <div className="card-header">
                    <span className="card-title"><User size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Your Profile</span>
                </div>
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {renderInput('Name', 'name')}
                        {renderInput('Age', 'age', 'number')}
                        {renderInput('Height (cm)', 'height_cm', 'number')}
                        {renderInput('Weight (kg)', 'weight_kg', 'number')}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {renderSelect('Goal', 'goal', [
                            { value: 'maintain', label: 'Maintain Health' },
                            { value: 'lose_weight', label: 'Lose Weight' },
                            { value: 'build_muscle', label: 'Build Muscle' },
                            { value: 'improve_focus', label: 'Improve Focus / Energy' }
                        ])}
                        {renderSelect('Work Type', 'work_type', [
                            { value: 'desk', label: 'Desk Job (Sedentary)' },
                            { value: 'active', label: 'Active Job (Moving)' },
                            { value: 'student', label: 'Student' }
                        ])}
                        {renderSelect('Workout Level', 'workout_level', [
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' }
                        ])}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {renderInput('Wake Time', 'wake_time', 'time')}
                        {renderInput('Sleep Time', 'sleep_time', 'time')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Note: Saving will not change your routine — use Routine page to regenerate.</span>
                        <button type="submit" className="btn btn-primary">Save Profile</button>
                    </div>
                </form>
            </div>

            {/* SECTION B: Data Storage */}
            <div className="card mb-lg animate-fade-in stagger-2">
                <div className="card-header">
                    <span className="card-title"><HardDrive size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Data Storage</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Local Database Path</div>
                    <div className="mono" style={{ fontSize: '12px', color: 'var(--accent)', wordBreak: 'break-all' }}>{dataPath || 'Loading...'}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Info size={14} /> All your data is stored locally on this device. Nothing is uploaded to any server.
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={handleOpenFolder}><FolderOpen size={14} /> Open Folder</button>
                        <button className="btn btn-secondary btn-sm" onClick={handleCopyPath}><Copy size={14} /> Copy Path</button>
                    </div>
                </div>
            </div>

            {/* SECTION C: Export Data */}
            <div className="card mb-lg animate-fade-in stagger-3">
                <div className="card-header">
                    <span className="card-title"><Download size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Export Data</span>
                </div>
                <div className="grid-3" style={{ gap: '16px' }}>
                    <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>📊 Export Health Data</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>Export all your habit logs (water, exercise, etc.) as CSV.</span>
                        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => handleExport('habits')}>Export CSV</button>
                    </div>
                    <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>🎯 Export Goals</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>Export your daily task and goal history as CSV.</span>
                        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => handleExport('goals')}>Export CSV</button>
                    </div>
                    <div style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center', background: 'var(--bg-elevated)' }}>
                        <h4 style={{ fontSize: '14px', color: 'var(--text-primary)' }}>📦 Export All Data</h4>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', flex: 1 }}>Complete backup of everything to a single JSON file.</span>
                        <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => handleExport('json')}>Export JSON</button>
                    </div>
                </div>
            </div>

            {/* SECTION D: Danger Zone */}
            <div className="card mb-lg animate-fade-in stagger-4" style={{ border: '1px solid rgba(248,81,73,0.3)', background: 'linear-gradient(to bottom right, var(--bg-surface), rgba(248,81,73,0.02))' }}>
                <div className="card-header">
                    <span className="card-title" style={{ color: 'var(--red)' }}><AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} /> Danger Zone</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Clear Today Logs */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-mid)' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>Clear Today's Habit Logs</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Resets water, exercise, stretch, and sleep logs for today.</div>
                        </div>
                        {confirmDeleteLogs ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--red)' }}>Are you sure?</span>
                                <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white' }} onClick={handleClearLogs}>Yes, Clear</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteLogs(false)}>Cancel</button>
                            </div>
                        ) : (
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(248,81,73,0.3)' }} onClick={() => setConfirmDeleteLogs(true)}>Clear Logs</button>
                        )}
                    </div>

                    {/* Delete All Goals */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-mid)' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>Delete All Goals</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Permanently deletes all your goals across all dates.</div>
                        </div>
                        {confirmDeleteGoals ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--red)' }}>Are you sure?</span>
                                <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white' }} onClick={handleDeleteGoals}>Yes, Delete</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDeleteGoals(false)}>Cancel</button>
                            </div>
                        ) : (
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(248,81,73,0.3)' }} onClick={() => setConfirmDeleteGoals(true)}>Delete Goals</button>
                        )}
                    </div>

                    {/* Reset Routine */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-mid)' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>Reset Routine</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Deletes saved routine. Base reminders will still work.</div>
                        </div>
                        {confirmResetRoutine ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--red)' }}>Are you sure?</span>
                                <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white' }} onClick={handleResetRoutine}>Yes, Reset</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmResetRoutine(false)}>Cancel</button>
                            </div>
                        ) : (
                            <button className="btn btn-secondary btn-sm" style={{ color: 'var(--red)', borderColor: 'rgba(248,81,73,0.3)' }} onClick={() => setConfirmResetRoutine(true)}>Reset Routine</button>
                        )}
                    </div>

                    {/* Delete All Data */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: '14px', color: 'var(--red)', fontWeight: 'bold', marginBottom: '4px' }}>Delete All My Data</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Wipes everything and resets the app to first-time setup.</div>
                        </div>

                        {deleteDataStep === 0 && (
                            <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white' }} onClick={() => setDeleteDataStep(1)}>💣 Wipe All Data</button>
                        )}

                        {deleteDataStep === 1 && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: 'var(--red)', maxWidth: '200px', textAlign: 'right' }}>This will permanently delete ALL data. Absolutely sure?</span>
                                <button className="btn btn-sm" style={{ background: 'var(--red)', color: 'white' }} onClick={() => setDeleteDataStep(2)}>Proceed</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => setDeleteDataStep(0)}>Cancel</button>
                            </div>
                        )}

                        {deleteDataStep === 2 && (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Type DELETE"
                                    value={deleteInput}
                                    onChange={e => setDeleteInput(e.target.value)}
                                    style={{ padding: '6px', fontSize: '12px', border: '1px solid var(--red)', background: 'var(--bg-input)', color: 'var(--text-primary)', borderRadius: '4px', width: '100px' }}
                                />
                                <button
                                    className="btn btn-sm"
                                    style={{ background: 'var(--red)', color: 'white', opacity: deleteInput === 'DELETE' ? 1 : 0.5, cursor: deleteInput === 'DELETE' ? 'pointer' : 'not-allowed' }}
                                    onClick={handleDeleteAllData}
                                    disabled={deleteInput !== 'DELETE'}
                                >
                                    Confirm Delete
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setDeleteDataStep(0); setDeleteInput(''); }}>Cancel</button>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* SECTION E: App Info */}
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '4px' }}>VitalPulse</p>
                <p style={{ fontSize: '12px' }}>Version 1.0.0</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>Running on Electron + React</p>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>Built for your health and productivity</p>
            </div>
        </div>
    );
}

export default SettingsPage;
