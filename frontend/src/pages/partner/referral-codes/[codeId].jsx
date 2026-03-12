import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Info, AlertTriangle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePartnerStore } from '../../../store/partnerStore';

const EditReferralCode = () => {
    const { codeId } = useParams();
    const navigate = useNavigate();
    const { activeCode, activeCodeLoading, fetchActiveReferralCode, updateReferralCode } = usePartnerStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        pass_through_enabled: false,
        partner_discount_pct: 0,
        expires_at: '',
        status: 'active'
    });

    useEffect(() => {
        fetchActiveReferralCode(codeId);
    }, [codeId, fetchActiveReferralCode]);

    useEffect(() => {
        if (activeCode) {
            setFormData({
                pass_through_enabled: activeCode.pass_through?.enabled || false,
                partner_discount_pct: activeCode.pass_through?.partner_discount_pct || 0,
                expires_at: activeCode.expires_at ? new Date(activeCode.expires_at).toISOString().split('T')[0] : '',
                status: activeCode.status || 'active'
            });
        }
    }, [activeCode]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validation Phase 0 Section 5.4
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
            pass_through: {
                enabled: formData.pass_through_enabled,
                partner_discount_pct: Number(formData.partner_discount_pct) || 0
            },
            expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
            status: formData.status
        };

        const success = await updateReferralCode(codeId, payload);
        setLoading(false);

        if (success) {
            navigate('/partner/referral-codes');
        } else {
            setError('Failed to update config.');
        }
    };

    if (activeCodeLoading || !activeCode) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading code config...</div>;

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/partner/referral-codes" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Configure Referral Code</h1>
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                    <AlertTriangle size={20} /> {error}
                </div>
            )}

            <div className="card" style={{ padding: '32px', maxWidth: '600px' }}>
                <div style={{ padding: '24px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Code String (Read-Only)</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary)' }}>{activeCode.code}</div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '24px', paddingBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Pass-Through Discount Configuration</h3>

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

                    <div className="input-group" style={{ marginBottom: '24px' }}>
                        <label className="input-label">Expiry Date (Optional)</label>
                        <input
                            type="date"
                            className="premium-input"
                            value={formData.expires_at}
                            onChange={e => handleChange('expires_at', e.target.value)}
                        />
                    </div>

                    <div className="input-group" style={{ marginBottom: '32px' }}>
                        <label className="input-label">Code Status</label>
                        <select
                            className="premium-input"
                            value={formData.status}
                            onChange={e => handleChange('status', e.target.value)}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <div style={{ padding: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', display: 'flex', gap: '8px', color: '#1e40af', marginTop: '12px', fontSize: '0.85rem' }}>
                            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            Setting status to 'inactive' will prevent this code from being used at checkout. Existing tracked commissions are unaffected.
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                        <Link to="/partner/referral-codes" className="premium-btn premium-btn-secondary" style={{ textDecoration: 'none' }}>Cancel</Link>
                        <button type="submit" className="premium-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditReferralCode;
