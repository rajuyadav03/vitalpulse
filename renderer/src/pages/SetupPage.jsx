/**
 * SetupPage.jsx — 4-step onboarding wizard.
 * Step 1: Profile (name, age, height, weight)
 * Step 2: Lifestyle (goal, work_type)
 * Step 3: Schedule (wake_time, sleep_time, workout_level)
 * Step 4: AI Key (optional Gemini API key)
 */

import React, { useState } from 'react';
import { User, Heart, Clock, Sparkles, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import useAppStore from '../store/appStore';

const steps = [
    { label: 'Profile', icon: User, description: 'Tell us about yourself' },
    { label: 'Lifestyle', icon: Heart, description: 'Your health goals' },
    { label: 'Schedule', icon: Clock, description: 'Daily routine' },
    { label: 'AI Setup', icon: Sparkles, description: 'Personalization' },
];

const wizardContainer = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    overflow: 'auto',
};

const wizardCard = {
    width: '100%',
    maxWidth: '560px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '32px',
    animation: 'fadeIn 0.3s ease forwards',
};

const stepIndicator = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '32px',
};

const stepDot = (active, completed) => ({
    width: completed || active ? '32px' : '8px',
    height: '8px',
    borderRadius: '4px',
    background: active
        ? 'var(--accent)'
        : completed
            ? 'var(--accent)'
            : 'var(--bg-elevated)',
    transition: 'all 0.3s ease',
    opacity: completed ? 0.5 : 1,
});

const stepTitle = {
    fontSize: '20px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '4px',
};

const stepDesc = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
};

const actionsRow = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '28px',
    gap: '12px',
};

function SetupPage() {
    const { saveProfile, generateRoutine } = useAppStore();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        height_cm: '',
        weight_kg: '',
        goal: 'stay_healthy',
        work_type: 'desk',
        wake_time: '07:00',
        sleep_time: '23:00',
        workout_level: 'beginner',
        apiKey: '',
    });

    const update = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const canNext = () => {
        switch (step) {
            case 0:
                return formData.name.trim().length > 0;
            case 1:
                return formData.goal && formData.work_type;
            case 2:
                return formData.wake_time && formData.sleep_time && formData.workout_level;
            case 3:
                return true; // API key is optional
            default:
                return true;
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const profileData = {
                name: formData.name.trim(),
                age: parseInt(formData.age) || null,
                height_cm: parseFloat(formData.height_cm) || null,
                weight_kg: parseFloat(formData.weight_kg) || null,
                goal: formData.goal,
                work_type: formData.work_type,
                wake_time: formData.wake_time,
                sleep_time: formData.sleep_time,
                workout_level: formData.workout_level,
                setup_done: 1,
            };

            await saveProfile(profileData);
            await generateRoutine({ ...profileData, apiKey: formData.apiKey });
        } catch (err) {
            console.error('Setup failed:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <div style={wizardContainer}>
            {/* Logo */}
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Vital<span style={{ color: 'var(--accent)' }}>Pulse</span>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Your AI Health & Productivity Assistant
                </div>
            </div>

            {/* Step Indicators */}
            <div style={stepIndicator}>
                {steps.map((_, i) => (
                    <div key={i} style={stepDot(i === step, i < step)} />
                ))}
            </div>

            {/* Wizard Card */}
            <div style={wizardCard} key={step}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    {React.createElement(steps[step].icon, { size: 20, style: { color: 'var(--accent)' } })}
                    <h2 style={stepTitle}>{steps[step].label}</h2>
                </div>
                <p style={stepDesc}>{steps[step].description}</p>

                {/* Step Content */}
                {step === 0 && (
                    <div>
                        <div className="form-group">
                            <label htmlFor="setup-name">Full Name *</label>
                            <input
                                id="setup-name"
                                type="text"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => update('name', e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="setup-age">Age</label>
                                <input
                                    id="setup-age"
                                    type="number"
                                    placeholder="25"
                                    min="10"
                                    max="120"
                                    value={formData.age}
                                    onChange={(e) => update('age', e.target.value)}
                                />
                            </div>
                            <div></div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="setup-height">Height (cm)</label>
                                <input
                                    id="setup-height"
                                    type="number"
                                    placeholder="170"
                                    min="100"
                                    max="250"
                                    value={formData.height_cm}
                                    onChange={(e) => update('height_cm', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="setup-weight">Weight (kg)</label>
                                <input
                                    id="setup-weight"
                                    type="number"
                                    placeholder="70"
                                    min="30"
                                    max="300"
                                    value={formData.weight_kg}
                                    onChange={(e) => update('weight_kg', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <div className="form-group">
                            <label htmlFor="setup-goal">Primary Goal</label>
                            <select
                                id="setup-goal"
                                value={formData.goal}
                                onChange={(e) => update('goal', e.target.value)}
                            >
                                <option value="stay_healthy">Stay Healthy</option>
                                <option value="weight_loss">Lose Weight</option>
                                <option value="gain">Gain Muscle</option>
                                <option value="focus">Improve Focus</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="setup-work-type">Work Type</label>
                            <select
                                id="setup-work-type"
                                value={formData.work_type}
                                onChange={(e) => update('work_type', e.target.value)}
                            >
                                <option value="desk">Desk Job</option>
                                <option value="student">Student</option>
                                <option value="active">Active / Manual</option>
                                <option value="freelancer">Freelancer / Remote</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="setup-wake">Wake Time</label>
                                <input
                                    id="setup-wake"
                                    type="time"
                                    value={formData.wake_time}
                                    onChange={(e) => update('wake_time', e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="setup-sleep">Sleep Time</label>
                                <input
                                    id="setup-sleep"
                                    type="time"
                                    value={formData.sleep_time}
                                    onChange={(e) => update('sleep_time', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="setup-workout">Workout Level</label>
                            <select
                                id="setup-workout"
                                value={formData.workout_level}
                                onChange={(e) => update('workout_level', e.target.value)}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="athlete">Athlete</option>
                            </select>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className="form-group">
                            <label htmlFor="setup-apikey">Gemini API Key (optional)</label>
                            <input
                                id="setup-apikey"
                                type="password"
                                placeholder="Enter your Gemini API key"
                                value={formData.apiKey}
                                onChange={(e) => update('apiKey', e.target.value)}
                            />
                            <p className="form-help">
                                Provide a Google Gemini API key for AI-personalized routines.
                                Without a key, a smart default routine will be generated based on your profile.
                            </p>
                        </div>
                        <div
                            style={{
                                padding: '12px 14px',
                                background: 'var(--accent-dim)',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgba(0,217,184,0.15)',
                                fontSize: '12px',
                                color: 'var(--text-secondary)',
                                lineHeight: 1.5,
                            }}
                        >
                            <strong style={{ color: 'var(--accent)' }}>💡 Tip:</strong> You can skip this step.
                            VitalPulse works 100% offline after setup. The API key is only used once to generate
                            your personalized routine.
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={actionsRow}>
                    {step > 0 ? (
                        <button className="btn btn-secondary" onClick={handleBack}>
                            <ArrowLeft size={16} /> Back
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        className="btn btn-primary"
                        onClick={handleNext}
                        disabled={!canNext() || submitting}
                        style={{ opacity: !canNext() || submitting ? 0.5 : 1 }}
                    >
                        {submitting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" /> Generating...
                            </>
                        ) : step < 3 ? (
                            <>
                                Continue <ArrowRight size={16} />
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} /> Complete Setup
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Step counter */}
            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                Step {step + 1} of 4
            </div>
        </div>
    );
}

export default SetupPage;
