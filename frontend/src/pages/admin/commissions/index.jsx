import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Search, Info, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHoldCountdown, getBadgeType, STATUS_LABELS } from '../../../utils';

const AdminCommissionList = () => {
    const navigate = useNavigate();
    const { commissionsData, commissionsLoading, fetchCommissions, releasePayable } = useAdminStore();
    const [partnerFilter, setPartnerFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [eventFilter, setEventFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const limit = 20;

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCommissions({ skip: (page - 1) * limit, limit, status: statusFilter, event_type: eventFilter, partner_id: partnerFilter });
        }, 300);
        return () => clearTimeout(timer);
    }, [partnerFilter, statusFilter, eventFilter, page, fetchCommissions]);

    const handleRelease = async () => {
        setIsProcessing(true);
        const count = await releasePayable();
        setIsProcessing(false);
        setShowReleaseModal(false);
        if (count !== false) {
            alert(`${count} commissions released to payable.`);
            fetchCommissions({ skip: (page - 1) * limit, limit, status: statusFilter, event_type: eventFilter, partner_id: partnerFilter });
        } else {
            alert("Action failed.");
        }
    };

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Commissions</h1>
                <button className="premium-btn" onClick={() => setShowReleaseModal(true)}>
                    <CheckCircle size={16} /> Release Payable
                </button>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: '16px', marginBottom: '24px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                className="premium-input"
                                placeholder="Filter by Partner ID..."
                                style={{ width: '100%', paddingLeft: '44px' }}
                                value={partnerFilter}
                                onChange={e => { setPartnerFilter(e.target.value); setPage(1); }}
                            />
                        </div>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <select className="premium-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                            <option value="All">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="payable">Payable</option>
                            <option value="paid">Paid</option>
                            <option value="clawed_back">Clawed Back</option>
                        </select>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <select className="premium-input" value={eventFilter} onChange={e => { setEventFilter(e.target.value); setPage(1); }}>
                            <option value="All">All Event Types</option>
                            <option value="new_subscription">New Sub</option>
                            <option value="renewal">Renewal</option>
                            <option value="upgrade">Upgrade</option>
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Commission ID</th>
                                <th>Partner</th>
                                <th>Org</th>
                                <th>Event Type</th>
                                <th>Net Commission</th>
                                <th>Status</th>
                                <th>Hold Until</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '30px' }}></div></td>
                                    </tr>
                                ))
                            ) : commissionsData?.commissions?.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>No commissions found.</div>
                                        No commissions found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                commissionsData?.commissions?.map(c => (
                                    <tr key={c.commission_id}>
                                        <td style={{ fontFamily: 'monospace' }}>{c.commission_id.substring(0, 8)}</td>
                                        <td style={{ cursor: 'pointer', color: 'var(--accent-indigo)' }} onClick={() => navigate(`/admin/partners/${c.partner_id}`)}>
                                            {c.partner_id.substring(0, 8)}...
                                        </td>
                                        <td>{c.referred_org_id.substring(0, 8)}...</td>
                                        <td>{c.event_type.replace('_', ' ')}</td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{c.net_commission.toLocaleString('en-IN')}</td>
                                        <td>
                                            <span className={`status-badge badge-${getBadgeType(c.status)}`}>{STATUS_LABELS[c.status] || c.status}</span>
                                        </td>
                                        <td>
                                            {c.status === 'pending' ? (() => {
                                                const hold = getHoldCountdown(c.hold_until);
                                                return (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: hold.color, fontSize: '0.85rem', fontWeight: 600 }}>
                                                        {hold.icon && <Clock size={14} color={hold.color} />}
                                                        {hold.pulse && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: hold.color, animation: 'pulse 1.5s infinite' }} />}
                                                        {hold.text}
                                                    </div>
                                                );
                                            })() : new Date(c.hold_until).toLocaleDateString()}
                                        </td>
                                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => navigate(`/admin/commissions/${c.commission_id}`)}>
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Showing {commissionsData?.commissions?.length ? ((page - 1) * limit) + 1 : 0}–{Math.min(page * limit, commissionsData?.total || 0)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="premium-btn premium-btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            Previous
                        </button>
                        <button className="premium-btn premium-btn-secondary" disabled={!commissionsData?.commissions || commissionsData.commissions.length < limit} onClick={() => setPage(p => p + 1)}>
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {showReleaseModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Release Payable Commissions?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Release all pending commissions past their 30-day hold date to Payable status? This is safe to run multiple times.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowReleaseModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn" onClick={handleRelease} disabled={isProcessing} style={{ background: 'var(--accent-green)' }}>
                                {isProcessing ? 'Releasing...' : 'Confirm Release'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCommissionList;
