import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Plus, Trash2, Info, AlertCircle } from 'lucide-react';
import PageErrorCard from '../../../components/PageErrorCard';

const SlabConfig = () => {
    const { slabConfig, slabLoading, slabError, slabSaving, fetchSlabConfig, updateSlabConfig } = useAdminStore();

    const [localTiers, setLocalTiers] = useState([]);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSlabConfig();
    }, [fetchSlabConfig]);

    useEffect(() => {
        if (slabConfig?.tiers) {
            setLocalTiers(JSON.parse(JSON.stringify(slabConfig.tiers))); // Deep copy for editability
        } else if (slabConfig && slabConfig.length > 0) {
            // In case api returns array directly
            setLocalTiers(JSON.parse(JSON.stringify(slabConfig)));
        }
    }, [slabConfig]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const addTier = () => {
        const nextTierNum = localTiers.length + 1;
        const lastTier = localTiers[localTiers.length - 1];
        setLocalTiers([...localTiers, {
            tier: nextTierNum,
            min_orgs: lastTier ? lastTier.max_orgs + 1 : 0,
            max_orgs: null,
            new_rate: '',
            renewal_rate: ''
        }]);
    };

    const removeTier = (index) => {
        if (localTiers.length <= 1) return;
        const updated = localTiers.filter((_, i) => i !== index).map((t, i) => ({ ...t, tier: i + 1 }));
        setLocalTiers(updated);
        setError(null);
    };

    const handleChange = (index, field, value) => {
        const updated = [...localTiers];
        updated[index][field] = value === '' ? null : Number(value);
        setLocalTiers(updated);
    };

    const handleSave = async () => {
        setError(null);

        // Client-side cross-row validation (Section 5.5)
        for (let i = 0; i < localTiers.length; i++) {
            const tier = localTiers[i];

            if (tier.min_orgs < 0) return setError(`Tier ${tier.tier}: Min Orgs must be ≥ 0`);
            if (tier.new_rate < 0 || tier.new_rate > 100) return setError(`Tier ${tier.tier}: New Rate must be between 0 and 100%`);
            if (tier.renewal_rate < 0 || tier.renewal_rate > 100) return setError(`Tier ${tier.tier}: Renewal Rate must be between 0 and 100%`);

            const isLastTier = i === localTiers.length - 1;

            if (isLastTier) {
                if (tier.max_orgs !== null && tier.max_orgs <= tier.min_orgs) {
                    return setError(`Tier ${tier.tier}: Max Orgs must be greater than Min Orgs`);
                }
            } else {
                if (tier.max_orgs === null) {
                    return setError(`Tier ${tier.tier}: Only the final tier can have unlimited Max Orgs`);
                }
                if (tier.max_orgs <= tier.min_orgs) {
                    return setError(`Tier ${tier.tier}: Max Orgs must be greater than Min Orgs`);
                }

                const nextTier = localTiers[i + 1];
                if (tier.max_orgs + 1 !== nextTier.min_orgs) {
                    return setError(`Gap Error between Tier ${tier.tier} and Tier ${nextTier.tier}. Tier ${tier.tier} Max Orgs (${tier.max_orgs}) + 1 must equal Tier ${nextTier.tier} Min Orgs (${nextTier.min_orgs}).`);
                }
            }
        }

        const success = await updateSlabConfig(localTiers);
        if (success) {
            showToast('Slab configuration updated successfully!');
        } else {
            setError('Failed to update server config.');
        }
    };

    const handleReset = () => {
        setError(null);
        fetchSlabConfig();
    };

    if (slabError && localTiers.length === 0) {
        return <PageErrorCard message={slabError} onRetry={fetchSlabConfig} backLink="/admin/dashboard" backText="Back to Dashboard" />;
    }

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Slab Configuration</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="premium-btn premium-btn-secondary" onClick={handleReset} disabled={slabLoading || slabSaving}>
                        Reset to Defaults
                    </button>
                    <button className="premium-btn" onClick={handleSave} disabled={slabLoading || slabSaving}>
                        {slabSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {slabError && !error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <span>Failed to load Slab Config: {slabError}. Form remains editable.</span>
                </div>
            )}

            <div style={{ padding: '16px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Info size={18} style={{ flexShrink: 0 }} />
                <div>Rate changes apply to <strong>future commissions only</strong>. Existing pending/payable commissions retain their recorded rate.</div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Tier #</th>
                                <th>Min Orgs</th>
                                <th>Max Orgs</th>
                                <th>New Rate (%)</th>
                                <th>Renewal Rate (%)</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {slabLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton skeleton-text" style={{ width: '40px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80px' }}></div></td>
                                        <td></td>
                                    </tr>
                                ))
                            ) : (
                                localTiers.map((tier, index) => (
                                    <tr key={index}>
                                        <td style={{ fontWeight: 600 }}>Tier {tier.tier}</td>
                                        <td>
                                            <input type="number" className="premium-input" style={{ width: '100px' }}
                                                value={tier.min_orgs !== null ? tier.min_orgs : ''}
                                                onChange={(e) => handleChange(index, 'min_orgs', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" className="premium-input" style={{ width: '100px' }}
                                                placeholder="Unlimited" value={tier.max_orgs !== null ? tier.max_orgs : ''}
                                                onChange={(e) => handleChange(index, 'max_orgs', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" step="0.01" className="premium-input" style={{ width: '120px' }}
                                                value={tier.new_rate || ''}
                                                onChange={(e) => handleChange(index, 'new_rate', e.target.value)} />
                                        </td>
                                        <td>
                                            <input type="number" step="0.01" className="premium-input" style={{ width: '120px' }}
                                                value={tier.renewal_rate || ''}
                                                onChange={(e) => handleChange(index, 'renewal_rate', e.target.value)} />
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="premium-btn premium-btn-danger" style={{ padding: '8px' }}
                                                onClick={() => removeTier(index)} disabled={localTiers.length <= 1}>
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <button className="premium-btn premium-btn-secondary" style={{ marginTop: '20px', display: 'flex', gap: '8px' }} onClick={addTier}>
                    <Plus size={16} /> Add Tier
                </button>
            </div>

            {toast && (
                <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: toast.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', animation: 'fadeIn 0.3s ease-out' }}>
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default SlabConfig;
