/**
 * RemindersPage.jsx — Manage custom reminders and check-in history.
 */

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Calendar, MessageSquare, Bell } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import useAppStore from '../store/appStore';

function RemindersPage() {
    const { addToast } = useAppStore();

    const [reminders, setReminders] = useState([]);
    const [checkinLogs, setCheckinLogs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const defaultForm = {
        name: '',
        start_time: '12:00',
        end_time: '',
        repeat: 'daily',
        type: 'popup',
        notes: '',
        active: 1,
    };
    const [formData, setFormData] = useState({ ...defaultForm });
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const loadData = async () => {
        const customReminders = await window.api.reminders.getCustom();
        const logs = await window.api.reminders.getCheckinLogs();
        setReminders(customReminders);
        setCheckinLogs(logs);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAddClick = () => {
        setFormData({ ...defaultForm });
        setEditingId(null);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditClick = (reminder) => {
        setFormData({
            name: reminder.name,
            start_time: reminder.start_time,
            end_time: reminder.end_time || '',
            repeat: reminder.repeat,
            type: reminder.type,
            notes: reminder.notes || '',
            active: reminder.active,
        });
        setEditingId(reminder.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingId(null);
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? (e.target.checked ? 1 : 0) : e.target.value;
        setFormData((prev) => ({ ...prev, [e.target.name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await window.api.reminders.updateCustom(editingId, formData);
                addToast({ title: '✅ Reminder updated', message: 'Your reminder has been saved.', type: 'success' });
            } else {
                await window.api.reminders.addCustom(formData);
                addToast({ title: '✅ Reminder saved', message: 'Your reminder has been saved.', type: 'success' });
            }
            setShowForm(false);
            setEditingId(null);
            loadData();
        } catch (error) {
            addToast({ title: 'Error', message: 'Failed to save reminder.', type: 'error' });
        }
    };

    const handleDelete = async (id) => {
        await window.api.reminders.deleteCustom(id);
        setDeleteConfirmId(null);
        loadData();
        addToast({ title: '🗑 Reminder deleted', message: 'Reminder removed.', type: 'success' });
    };

    const handleToggleActive = async (id, currentActive) => {
        const newActive = currentActive ? 0 : 1;
        await window.api.reminders.toggleCustom(id, newActive);
        loadData();
    };

    const getRepeatLabel = (repeat) => {
        const labels = {
            daily: 'Every day',
            weekdays: 'Weekdays (Mon-Fri)',
            weekends: 'Weekends (Sat-Sun)'
        };
        return labels[repeat] || repeat;
    };

    const getTypeLabel = (type) => {
        const labels = {
            popup: 'Popup Check-in',
            silent: 'Silent Notification',
            both: 'Popup + Silent'
        };
        return labels[type] || type;
    };

    return (
        <div className="page-content">
            <PageHeader title="Reminders" subtitle="Custom scheduled check-ins">
                {!showForm && (
                    <button className="btn btn-primary" onClick={handleAddClick}>
                        <Plus size={16} /> Add Reminder
                    </button>
                )}
            </PageHeader>

            {/* SECTON B — Add/Edit Reminder Form */}
            {showForm && (
                <div className="card animate-slide-in-up mb-lg" style={{ border: '1px solid var(--accent)', boxShadow: '0 0 15px var(--accent-dim)' }}>
                    <div className="card-header">
                        <span className="card-title">{editingId ? 'Edit Reminder' : 'New Reminder'}</span>
                    </div>
                    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="form-group row">
                            <label style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Task Name
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Study DSA"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'var(--bg-input)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        marginTop: '4px'
                                    }}
                                />
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Start Time
                                <input
                                    type="time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    required
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginTop: '4px' }}
                                />
                            </label>
                            <label style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                End Time (optional)
                                <input
                                    type="time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginTop: '4px' }}
                                />
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <label style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Repeat
                                <select
                                    name="repeat"
                                    value={formData.repeat}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginTop: '4px' }}
                                >
                                    <option value="daily">Every day</option>
                                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                                    <option value="weekends">Weekends (Sat-Sun)</option>
                                </select>
                            </label>
                            <label style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Reminder Type
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginTop: '4px' }}
                                >
                                    <option value="popup">Popup Check-in</option>
                                    <option value="silent">Silent Notification</option>
                                    <option value="both">Both</option>
                                </select>
                            </label>
                        </div>
                        <div className="form-group row">
                            <label style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '13px' }}>
                                Notes
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="What should I check?"
                                    rows="2"
                                    style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', marginTop: '4px', resize: 'vertical' }}
                                />
                            </label>
                        </div>
                        <div className="form-group row">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '14px' }}>
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active === 1}
                                    onChange={handleChange}
                                    style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
                                />
                                Active
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Reminder</button>
                            <button type="button" className="btn btn-secondary" onClick={handleCancel} style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* SECTION C — List of existing reminders */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>Your Reminders</h3>
                {reminders.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-state-text">No custom reminders yet. Add one above.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {reminders.map((r) => (
                            <div key={r.id} className="card" style={{ padding: '16px', opacity: r.active ? 1 : 0.6 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            ✅ {r.name}
                                        </h4>
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: r.active ? 'var(--accent)' : 'var(--text-muted)' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.active ? 'var(--accent)' : 'var(--text-muted)' }}></div>
                                        {r.active ? 'Active' : 'Paused'}
                                        <input
                                            type="checkbox"
                                            checked={r.active === 1}
                                            onChange={() => handleToggleActive(r.id, r.active === 1)}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} />
                                        {r.start_time} {r.end_time ? `→ ${r.end_time}` : ''}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} />
                                        {getRepeatLabel(r.repeat)}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Bell size={14} />
                                        {getTypeLabel(r.type)}
                                    </div>
                                </div>
                                {r.notes && (
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', fontStyle: 'italic' }}>
                                        <MessageSquare size={14} style={{ marginTop: '2px' }} />
                                        "{r.notes}"
                                    </div>
                                )}
                                <div className="divider" style={{ margin: '12px 0', borderTop: '1px solid var(--border-mid)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                    {deleteConfirmId === r.id ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--red-dim)', padding: '4px 12px', borderRadius: 'var(--radius-sm)' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--red)' }}>Delete this reminder?</span>
                                            <button onClick={() => handleDelete(r.id)} style={{ background: 'var(--red)', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Yes, Delete</button>
                                            <button onClick={() => setDeleteConfirmId(null)} style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                                        </div>
                                    ) : (
                                        <>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleEditClick(r)}>
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => setDeleteConfirmId(r.id)}>
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SECTION D — Recent Check-in History */}
            <div>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '16px' }}>Recent Check-in History</h3>
                {checkinLogs.length === 0 ? (
                    <div className="empty-state" style={{ padding: '16px' }}>
                        <p className="empty-state-text" style={{ fontSize: '13px' }}>No check-ins recorded yet.</p>
                    </div>
                ) : (
                    <div className="card" style={{ padding: '0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-mid)', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Time</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Reminder</th>
                                    <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Response</th>
                                </tr>
                            </thead>
                            <tbody>
                                {checkinLogs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-mid)' }}>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                                            {new Date(log.logged_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                                            {log.reminder_name || log.reminder_type}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            {log.response === 'yes' ? (
                                                <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>✓ Yes</span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>✗ No</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default RemindersPage;
