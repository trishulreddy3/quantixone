import React, { useEffect } from 'react';
import { usePartnerStore } from '../../../store/partnerStore';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PageErrorCard from '../../../components/PageErrorCard';

const PartnerPayoutDetail = () => {
    const { statementId } = useParams();
    const { activePayout, activePayoutCommissions, payoutDetailLoading, payoutError, fetchPayoutDetail } = usePartnerStore();

    useEffect(() => {
        fetchPayoutDetail(statementId);
    }, [statementId, fetchPayoutDetail]);

    if (payoutError) return <PageErrorCard message={payoutError} backLink="/partner/payouts" backText="Back to Payouts" />;
    if (payoutDetailLoading || !activePayout) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;

    const { status, period_start, period_end, total_commissions, total_clawbacks, net_payable, disbursed_at, disbursement_notes, created_at } = activePayout;

    let badgeType = 'yellow';
    if (status === 'finalized') badgeType = 'blue';
    else if (status === 'disbursed') badgeType = 'green';

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/partner/payouts" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 className="page-title" style={{ margin: 0, fontFamily: 'monospace' }}>{statementId.substring(0, 8)}...</h1>
                        <span className={`status-badge badge-${badgeType}`}>{status.toUpperCase()}</span>
                    </div>
                </div>
            </div>

            {(status === 'draft' || status === 'finalized') && (
                <div style={{ padding: '16px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <Info size={24} />
                    <div>
                        <div style={{ fontWeight: 600 }}>Statement in review</div>
                        <div style={{ fontSize: '0.9rem' }}>This statement is being reviewed. Disbursement is pending admin action.</div>
                    </div>
                </div>
            )}

            {status === 'disbursed' && (
                <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <CheckCircle size={24} />
                    <div>
                        <div style={{ fontWeight: 600 }}>Disbursement Complete</div>
                        <div style={{ fontSize: '0.9rem' }}>Funds have been sent to your registered bank account.</div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Statement Summary</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Period</span>
                    <span style={{ fontWeight: 500 }}>{new Date(period_start).toLocaleDateString()} – {new Date(period_end).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Generated At</span>
                    <span style={{ fontWeight: 500 }}>{new Date(created_at).toLocaleString()}</span>
                </div>

                <div style={{ background: 'var(--bg-surface-hover)', padding: '24px', borderRadius: 'var(--radius-md)', marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Commissions</span>
                        <span style={{ fontWeight: 500 }}>₹{total_commissions.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Total Clawbacks</span>
                        <span style={{ fontWeight: 500, color: 'var(--accent-red)' }}>-₹{total_clawbacks.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '2px dashed var(--border-color)' }}>
                        <span style={{ fontWeight: 600, fontSize: '1.2rem' }}>Net Payable</span>
                        <span style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--accent-green)' }}>₹{net_payable.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                {disbursed_at && (
                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '16px' }}>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Disbursed At</span><div style={{ fontWeight: 500 }}>{new Date(disbursed_at).toLocaleString()}</div></div>
                        <div>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Transfer Notes from Administrator</span>
                            <div style={{ fontWeight: 500, background: 'var(--bg-surface-hover)', padding: '12px', borderRadius: '8px', marginTop: '4px' }}>
                                {disbursement_notes || 'No extra notes provided.'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Commissions within this Statement</h3>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Commission ID</th>
                                <th>Referred Org</th>
                                <th>Event Type</th>
                                <th>Status</th>
                                <th>Net Commission</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activePayoutCommissions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                        No commissions loaded inside this statement.
                                    </td>
                                </tr>
                            ) : (
                                activePayoutCommissions.map(c => (
                                    <tr key={c.commission_id}>
                                        <td style={{ fontFamily: 'monospace' }}>{c.commission_id.substring(0, 8)}</td>
                                        <td>{c.referred_org_id.substring(0, 8)}...</td>
                                        <td>{c.event_type.replace('_', ' ')}</td>
                                        <td><span className={`status-badge badge-${c.status === 'paid' ? 'green' : 'blue'}`}>{c.status.toUpperCase()}</span></td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{c.net_commission.toLocaleString('en-IN')}</td>
                                        <td>
                                            <Link to={`/partner/commissions/${c.commission_id}`} className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}>
                                                View
                                            </Link>
                                        </td>
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

export default PartnerPayoutDetail;
