import React, { useState } from 'react';
import { ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePartnerStore } from '../../../store/partnerStore';

const CreateReferralCode = () => {
    const navigate = useNavigate();
    const { createReferralCode } = usePartnerStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        code: '',
        pass_through_enabled: false,
        partner_discount_pct: 0,
        expires_at: ''
    });

    const handleChange = (field, value) => {
        if (field === 'code') {
            // Auto uppercase, strip spaces/specials, allow only A-Z, 0-9, -
            const formattedValue = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            setFormData(prev => ({ ...prev, [field]: formattedValue }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(null);

        // Validation Phase 0 Section 5.3
        if (formData.code.length < 3 || formData.code.length > 50) {
            setError("Code must be between 3 and 50 characters.");
            return;
        }

        if (formData.expires_at && new Date(formData.expires_at) <= new Date()) {
            setError("Expiry date must be in the future.");
            return;
        }

        if (formData.pass_through_enabled && (formData.partner_discount_pct < 0 || formData.partner_discount_pct > 100)) {
            setError("Discount must be between 0 and 100 percent.");
            return;
        }

        setLoading(true);

        const payload = {
            code: formData.code,
            pass_through: {
                enabled: formData.pass_through_enabled,
                partner_discount_pct: Number(formData.partner_discount_pct) || 0
            },
            expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null
        };

        try {
            await createReferralCode(payload);
            navigate('/partner/referral-codes');
            alert(`Referral code ${payload.code} created.`);
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Failed to create code. This code might already be taken.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/partner/referral-codes" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Create Referral Code</h1>
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                    <AlertTriangle size={20} /> {error}
                </div>
            )}

            <div className="card" style={{ padding: '32px', maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Referral Code *</label>
                        <input
                            type="text"
                            className="premium-input"
                            placeholder="e.g. ACME2026"
                            value={formData.code}
                            onChange={e => handleChange('code', e.target.value)}
                            maxLength={50}
                            style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontSize: '1.2rem', padding: '16px' }}
                            required
                        />
                        {formData.code && (
                            <div style={{ padding: '8px 12px', background: 'rgba(37, 99, 235, 0.05)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem', marginTop: '8px', border: '1px solid rgba(37, 99, 235, 0.1)' }}>
                                Your referral code: {formData.code}
                            </div>
                        )}
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>This text string cannot be changed after creation.</div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '32px 0 24px', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Pass-Through Discount Configuration (Optional)</h3>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.pass_through_enabled}
                                onChange={e => handleChange('pass_through_enabled', e.target.checked)}
                                style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                            />
                            <span style={{ fontWeight: 500 }}>Enable pass-through discount</span>
                        </label>

                        {formData.pass_through_enabled && (
                            <div className="input-group animate-fade-in" style={{ padding: '24px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                                <label className="input-label">Discount Percentage (%)</label>
                                <input
                                    type="number"
                                    className="premium-input"
                                    placeholder="e.g. 5.0"
                                    step="0.1"
                                    min="0" max="100"
                                    value={formData.partner_discount_pct}
                                    onChange={e => handleChange('partner_discount_pct', e.target.value)}
                                />
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: 1.5, fontStyle: 'italic' }}>
                                    Referred orgs get this % off their first subscription. This amount is deducted from your commission.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="input-group" style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: '24px'
                    }}>
                        <label className="input-label">Expiry Date (Optional)</label>
                        <input
                            type="date"
                            className="premium-input"
                            value={formData.expires_at}
                            onChange={e => handleChange('expires_at', e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
                        <Link to="/partner/referral-codes" className="premium-btn premium-btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                        <button type="submit" className="premium-btn" disabled={loading || !formData.code} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={16} /> {loading ? 'Creating...' : 'Create Code'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateReferralCode;
