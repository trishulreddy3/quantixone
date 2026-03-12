import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { ArrowLeft, CheckCircle, Wallet, Info, AlertTriangle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PageErrorCard from '../../../components/PageErrorCard';

const AdminPayoutDetail = () => {
    const { statementId } = useParams();
    const { activePayout, activePayoutCommissions, payoutDetailLoading, payoutError, fetchPayoutDetail, finalizePayout, disbursePayout } = useAdminStore();

    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [showDisburseForm, setShowDisburseForm] = useState(false);
    const [disburseNotes, setDisburseNotes] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchPayoutDetail(statementId);
    }, [statementId, fetchPayoutDetail]);

    const handleFinalize = async () => {
        setIsProcessing(true);
        const success = await finalizePayout(statementId);
        setIsProcessing(false);
        setShowFinalizeModal(false);
        if (success) alert("Payout statement finalized.");
        else alert("Failed to finalize payout.");
    };

    const submitDisburse = async () => {
        setIsProcessing(true);
        const success = await disbursePayout(statementId, { notes: disburseNotes });
        setIsProcessing(false);
        setShowDisburseForm(false);
        if (success) {
            alert("Disbursement recorded. All included commissions marked as Paid.");
        } else {
            alert("Failed to record disbursement.");
        }
    };

    if (payoutDetailLoading || !activePayout) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading...</div>;

    if (payoutError) {
        return <PageErrorCard message="This payout statement could not be found." backLink="/admin/payouts" backText="Back to Payouts" />;
    }

    const { status, partner_id, period_start, period_end, total_commissions, total_clawbacks, net_payable, disbursed_at, disbursed_by, disbursement_notes, created_at } = activePayout;

    let badgeType = 'yellow';
    if (status === 'finalized') badgeType = 'blue';
    else if (status === 'disbursed') badgeType = 'green';

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/admin/payouts" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h1 className="page-title" style={{ margin: 0, fontFamily: 'monospace' }}>{statementId.substring(0, 8)}...</h1>
                        <span className={`status-badge badge-${badgeType}`}>{status.toUpperCase()}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {status === 'draft' && (
                        <button className="premium-btn" onClick={() => setShowFinalizeModal(true)} disabled={isProcessing}>
                            Finalize Statement
                        </button>
                    )}
                    {status === 'finalized' && (
                        <button className="premium-btn" onClick={() => setShowDisburseForm(true)} disabled={isProcessing} style={{ background: 'var(--accent-green)' }}>
                            <Wallet size={16} /> Record Disbursement
                        </button>
                    )}
                </div>
            </div>

            {status === 'disbursed' && (
                <div style={{ padding: '16px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <CheckCircle size={24} />
                    <div>
                        <div style={{ fontWeight: 600 }}>Disbursement Complete</div>
                        <div style={{ fontSize: '0.9rem' }}>Funds transferred and {activePayoutCommissions.length} commissions marked as paid.</div>
                    </div>
                </div>
            )}

            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Summary</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Partner ID</span>
                    <span><Link to={`/admin/partners/${partner_id}`} style={{ fontWeight: 500, color: 'var(--primary)' }}>{partner_id}</Link></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Period</span>
                    <span style={{ fontWeight: 500 }}>{new Date(period_start).toLocaleDateString()} – {new Date(period_end).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Created At</span>
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
                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Disbursed At</span><div style={{ fontWeight: 500 }}>{new Date(disbursed_at).toLocaleString()}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Disbursed By</span><div style={{ fontWeight: 500 }}>{disbursed_by}</div></div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Bank Transfer Notes</span>
                            <div style={{ fontWeight: 500, background: 'var(--bg-surface-hover)', padding: '12px', borderRadius: '8px', marginTop: '4px' }}>
                                {disbursement_notes || 'No notes left.'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Included Commissions</h3>

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
                                        No commissions loaded or included.
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
                                            <Link to={`/admin/commissions/${c.commission_id}`} className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}>
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

            {showFinalizeModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Finalize Payout Statement?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            This will lock the statement. No further changes can be made or commissions added.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowFinalizeModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn" onClick={handleFinalize} disabled={isProcessing}>
                                {isProcessing ? 'Finalizing...' : 'Finalize'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDisburseForm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '500px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Record Disbursement</h3>

                        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px' }}>
                            <AlertTriangle size={24} color="#b91c1c" style={{ flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>Confirm bank transfer made</div>
                                <div style={{ fontSize: '0.9rem', color: '#991b1b', lineHeight: 1.5 }}>
                                    Make sure you have completed the bank transfer (NEFT/IMPS/RTGS) for <strong>₹{net_payable.toLocaleString('en-IN')}</strong> to the partner's beneficiary account. This action will mark all included commissions as PAID and cannot be undone.
                                </div>
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Disbursed By</label>
                            <input
                                type="text"
                                className="premium-input"
                                value="Admin User (Self)"
                                disabled
                                style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)' }}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Transfer Reference / Notes (Optional)</label>
                            <textarea
                                className="premium-input"
                                rows="3"
                                maxLength={500}
                                placeholder="e.g. NEFT ref: TXN123456, HDFC → ICICI"
                                value={disburseNotes}
                                onChange={e => setDisburseNotes(e.target.value)}
                            ></textarea>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                                {disburseNotes.length}/500
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowDisburseForm(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn premium-btn-danger" onClick={submitDisburse} disabled={isProcessing}>
                                {isProcessing ? 'Recording...' : 'Confirm Disbursement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayoutDetail;
