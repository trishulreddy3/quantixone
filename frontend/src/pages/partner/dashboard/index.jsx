import React, { useEffect } from 'react';
import { usePartnerStore } from '../../../store/partnerStore';
import { ArrowRight, Coins, Wallet, Building, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TierProgressIndicator from '../../../components/TierProgressIndicator';

const PartnerDashboard = () => {
    const navigate = useNavigate();
    const { dashboardData, dashboardLoading, fetchDashboardData } = usePartnerStore();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (dashboardLoading || !dashboardData) {
        return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading dashboard...</div>;
    }

    const { payableCommissions, selfPartner, recentCommissions } = dashboardData;
    const currentTier = selfPartner.tier || 1;
    const totalOrgs = selfPartner.stats?.total_orgs_referred || 0;

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <h1 className="page-title">Dashboard</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div className="card stat-card">
                    <div className="stat-card-title">Payable Commissions</div>
                    <div className="stat-card-value" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        ₹{payableCommissions.toLocaleString('en-IN')}
                        <Coins size={24} style={{ color: 'var(--accent-indigo)' }} />
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-title">Total Earned (Paid)</div>
                    <div className="stat-card-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        ₹{(selfPartner.stats?.total_commissions_paid || 0).toLocaleString('en-IN')}
                        <Wallet size={24} style={{ color: 'var(--accent-green)' }} />
                    </div>
                </div>
                <div className="card stat-card">
                    <div className="stat-card-title">Active Organizations</div>
                    <div className="stat-card-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {totalOrgs}
                        <Building size={24} style={{ color: 'var(--accent-red)' }} />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>Tier Progress</h3>
                <TierProgressIndicator
                    currentTier={currentTier}
                    totalOrgs={totalOrgs}
                />
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={20} color="var(--primary)" /> Recent Commissions
                    </h3>
                    <Link to="/partner/commissions" className="premium-btn premium-btn-secondary" style={{ padding: '6px 16px', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        View All <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Referred Org</th>
                                <th>Event</th>
                                <th>Net Commission</th>
                                <th>Status</th>
                                <th>Hold Until</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentCommissions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No commissions generated yet.</td>
                                </tr>
                            ) : (
                                recentCommissions.map(c => (
                                    <tr key={c.commission_id}>
                                        <td>{c.referred_org_id.substring(0, 8)}...</td>
                                        <td>{c.event_type.replace('_', ' ')}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{c.net_commission.toLocaleString('en-IN')}</td>
                                        <td>
                                            {(() => {
                                                let badgeType = 'gray';
                                                if (c.status === 'payable') badgeType = 'blue';
                                                else if (c.status === 'paid') badgeType = 'green';
                                                else if (c.status === 'pending') badgeType = 'yellow';
                                                else if (c.status === 'clawed_back') badgeType = 'red';
                                                return <span className={`status-badge badge-${badgeType}`}>{c.status.replace('_', ' ')}</span>;
                                            })()}
                                        </td>
                                        <td>{new Date(c.hold_until).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PartnerDashboard;
