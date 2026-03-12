import React from 'react';

const TierProgressIndicator = ({ currentTier = 1, totalOrgs = 0, slabConfigFallback }) => {
    // Default config per spec Section 4.5
    const defaultSlab = {
        tiers: [
            { tier: 1, min_orgs: 0, new_rate: 10, renewal_rate: 5 },
            { tier: 2, min_orgs: 11, new_rate: 15, renewal_rate: 7 },
            { tier: 3, min_orgs: 31, new_rate: 20, renewal_rate: 10 },
        ]
    };

    const slabConfig = slabConfigFallback || defaultSlab;

    // Ensure tier object exists
    const currentTierObj = slabConfig.tiers.find(t => t.tier === currentTier) || slabConfig.tiers[0];
    const nextTierObj = slabConfig.tiers.find(t => t.tier === currentTier + 1);

    const progressInTier = Math.max(0, totalOrgs - currentTierObj.min_orgs);
    const tierBandSize = nextTierObj ? (nextTierObj.min_orgs - currentTierObj.min_orgs) : Infinity;
    const progressPct = nextTierObj ? Math.min((progressInTier / tierBandSize) * 100, 100) : 100;

    return (
        <div style={{ width: '100%' }}>
            {/* Visual segmented bar */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                {slabConfig.tiers.map((t) => {
                    const isPast = currentTier > t.tier;
                    const isCurrent = currentTier === t.tier;

                    let activePct = 0;
                    if (isPast) activePct = 100;
                    else if (isCurrent) activePct = progressPct;

                    return (
                        <div key={t.tier} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: (isPast || isCurrent) ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                Tier {t.tier}
                            </div>
                            <div style={{ position: 'relative', width: '100%', height: '12px', background: 'var(--bg-surface-hover)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <div style={{ height: '100%', width: `${activePct}%`, background: isPast ? 'var(--accent-green)' : 'var(--primary)', transition: 'width 1s ease-in-out' }}></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend and Stats */}
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {nextTierObj ? (
                    <>
                        <div style={{ marginBottom: '6px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Current:</strong> Tier {currentTier} ({currentTierObj.new_rate}% new / {currentTierObj.renewal_rate}% renewal)
                        </div>
                        <div>
                            <strong style={{ color: 'var(--text-primary)' }}>Next:</strong> Tier {nextTierObj.tier} at {nextTierObj.min_orgs} orgs — <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{nextTierObj.min_orgs - totalOrgs} more orgs needed</span>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ marginBottom: '6px' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Current:</strong> Tier {currentTier} ({currentTierObj.new_rate}% new / {currentTierObj.renewal_rate}% renewal)
                        </div>
                        <div style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                            Maximum tier reached — earning {currentTierObj.new_rate}% on new subscriptions.
                        </div>
                    </>
                )}
            </div>

            {(totalOrgs > 0 && nextTierObj) && (
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Tracking {totalOrgs} total referred orgs
                </div>
            )}
        </div>
    );
};

export default TierProgressIndicator;
