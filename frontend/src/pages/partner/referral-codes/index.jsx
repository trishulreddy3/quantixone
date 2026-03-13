import React, { useEffect } from 'react';
import { usePartnerStore } from '../../../store/partnerStore';
import { Tag, Copy, Code, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const ReferralCodesList = () => {
    const navigate = useNavigate();
    const { referralCodes, codesLoading, fetchReferralCodes } = usePartnerStore();

    useEffect(() => {
        fetchReferralCodes();
    }, [fetchReferralCodes]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert(`Copied ${text} to clipboard`);
    };

    const activeCodes = referralCodes.filter(c => c.status === 'active');
    const totalUses = referralCodes.reduce((sum, c) => sum + (c.total_uses || 0), 0);
    const totalEarned = referralCodes.reduce((sum, c) => sum + (c.total_commissions_earned || 0), 0);

    if (codesLoading) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading codes...</div>;

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
                <h1 className="page-title">Referral Codes</h1>
                <button className="premium-btn" onClick={() => navigate('/partner/referral-codes/new')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={16} /> Create New Code
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div className="card stat-card" style={{ padding: '24px' }}>
                    <div className="stat-card-title">Active Codes</div>
                    <div className="stat-card-value" style={{ color: 'var(--primary)' }}>{activeCodes.length}</div>
                </div>
                <div className="card stat-card" style={{ padding: '24px' }}>
                    <div className="stat-card-title">Total Uses</div>
                    <div className="stat-card-value">{totalUses}</div>
                </div>
                <div className="card stat-card" style={{ padding: '24px' }}>
                    <div className="stat-card-title">Earned From Codes</div>
                    <div className="stat-card-value" style={{ color: 'var(--accent-green)' }}>₹{totalEarned.toLocaleString('en-IN')}</div>
                </div>
            </div>

            {referralCodes.length === 0 ? (
                <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Tag size={48} color="var(--border-color)" style={{ margin: '0 auto 16px' }} />
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>You haven't created any referral codes yet.</div>
                    <p style={{ marginBottom: '24px' }}>Create codes to map attribution and optionally pass discounts down to organizations you invite.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                    {referralCodes.map(code => (
                        <div key={code._id} className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                            {!code.status || code.status === 'active' ? (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-green)' }}></div>
                            ) : (
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--text-muted)' }}></div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', letterSpacing: '1px' }}>
                                            {code.code}
                                        </span>
                                        <button onClick={() => copyToClipboard(code.code)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                                            <Copy size={16} color="var(--text-secondary)" />
                                        </button>
                                    </div>
                                    <span className={`status-badge badge-${code.status === 'active' ? 'green' : 'gray'}`}>
                                        {code.status ? code.status.toUpperCase() : 'ACTIVE'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '16px', fontSize: '0.9rem' }}>
                                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Pass-Through Config</span>
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                        {code.pass_through?.enabled ? `${code.pass_through.partner_discount_pct}% discount` : 'No pass-through'}
                                    </strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Expiry</span>
                                    <strong style={{ color: 'var(--text-primary)' }}>
                                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'No expiry'}
                                    </strong>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }}>
                                    <div><strong style={{ color: 'var(--text-primary)' }}>{code.total_uses || 0}</strong> <span style={{ color: 'var(--text-secondary)' }}>uses</span></div>
                                    <div><strong style={{ color: 'var(--primary)' }}>₹{(code.total_commissions_earned || 0).toLocaleString('en-IN')}</strong> <span style={{ color: 'var(--text-secondary)' }}>earned</span></div>
                                </div>
                                <Link to={`/partner/referral-codes/${code._id}`} className="premium-btn premium-btn-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem', textDecoration: 'none' }}>
                                    Edit config
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReferralCodesList;
