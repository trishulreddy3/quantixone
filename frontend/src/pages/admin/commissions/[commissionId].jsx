import React, { useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { ArrowLeft, Clock } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getHoldCountdown, getBadgeType, STATUS_LABELS } from '../../../utils';
import PageErrorCard from '../../../components/PageErrorCard';

const AdminCommissionDetail = () => {
    const { commissionId } = useParams();
    const { activeCommission, commissionError, fetchCommissionDetail } = useAdminStore();

    useEffect(() => {
        fetchCommissionDetail(commissionId);
    }, [commissionId, fetchCommissionDetail]);

    if (commissionError) {
        return <PageErrorCard message={commissionError} backLink="/admin/commissions" backText="Back to Commissions" />;
    }

    if (!activeCommission) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;

    const hold = getHoldCountdown(activeCommission.hold_until);

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/admin/commissions" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="page-title" style={{ margin: 0, fontFamily: 'monospace' }}>{commissionId}</h1>
                    <span className={`status-badge badge-${getBadgeType(activeCommission.status)}`}>{STATUS_LABELS[activeCommission.status] || activeCommission.status}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Attribution</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Partner</div>
                        <div style={{ fontWeight: 500 }}><Link to={`/admin/partners/${activeCommission.partner_id}`} style={{ color: 'var(--primary)' }}>{activeCommission.partner_id}</Link></div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Referred Org</div>
                        <div style={{ fontWeight: 500 }}>{activeCommission.referred_org_id}</div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subscription ID</div>
                        <div style={{ fontWeight: 500 }}>{activeCommission.subscription_id || 'N/A'}</div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Invoice ID</div>
                        <div style={{ fontWeight: 500 }}>{activeCommission.invoice_id || 'N/A'}</div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Event Type</div>
                        <div style={{ fontWeight: 500 }}>{activeCommission.event_type.replace('_', ' ')}</div>

                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Created At</div>
                        <div style={{ fontWeight: 500 }}>{new Date(activeCommission.created_at).toLocaleString()}</div>
                    </div>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Financial Breakdown</h3>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Plan Amount</span>
                        <span style={{ fontWeight: 500 }}>₹{activeCommission.plan_amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Commission Rate (Tier {activeCommission.tier_at_creation})</span>
                        <span style={{ fontWeight: 500 }}>{activeCommission.commission_rate}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Gross Commission</span>
                        <span style={{ fontWeight: 500 }}>₹{activeCommission.gross_commission.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--accent-red)' }}>
                        <span>Pass-Through Deduction</span>
                        <span style={{ fontWeight: 500 }}>-₹{activeCommission.pass_through_amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed var(--border-color)', fontSize: '1.2rem' }}>
                        <span style={{ fontWeight: 600 }}>Net Commission</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{activeCommission.net_commission.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            {activeCommission.status === 'pending' ? (
                <div className="card" style={{ padding: '24px', marginTop: '24px', border: `1px solid ${hold.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '1.5rem', display: 'flex' }}>
                            {hold.icon && <Clock size={24} color={hold.color} />}
                            {!hold.icon && <span style={{ color: hold.color }}>⏳</span>}
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Hold Period</h3>
                    </div>

                    <div style={{ fontSize: '1rem', marginBottom: '8px' }}>
                        This commission releases on <strong style={{ color: hold.color }}>{new Date(activeCommission.hold_until).toLocaleDateString()} ({hold.text})</strong>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Commissions are held 30 days to protect against cancellations.
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: '24px', marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock size={20} color="var(--accent-green)" />
                        <div>
                            <div style={{ fontWeight: 600 }}>Hold Period Completed</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Funds cleared the 30-day maturation lock period.</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Released On</div>
                        <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--accent-green)' }}>
                            {new Date(activeCommission.hold_until).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            )}

            {activeCommission.payout_statement_id && (
                <div style={{ padding: '16px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', marginTop: '24px' }}>
                    Associated Payout Statement: <Link to={`/admin/payouts/${activeCommission.payout_statement_id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>{activeCommission.payout_statement_id}</Link>
                </div>
            )}
        </div>
    );
};

export default AdminCommissionDetail;
