import React, { useEffect, useState } from 'react';
import { usePartnerStore } from '../../../store/partnerStore';
import { Filter, Eye, Clock } from 'lucide-react';
import { getHoldCountdown, getBadgeType, STATUS_LABELS } from '../../../utils';

const PartnerCommissionsList = () => {
    const { commissionsData, commissionsLoading, fetchCommissions } = usePartnerStore();
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 20;

    useEffect(() => {
        fetchCommissions({ skip: (page - 1) * limit, limit, status: statusFilter });
    }, [statusFilter, page, fetchCommissions]);

    const STALE_STATUSES = ['All', 'pending', 'payable', 'paid', 'clawed_back'];

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Commissions</h1>
            </div>

            <div className="card" style={{ padding: '24px' }}>

                {/* Filter Pills */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                    {STALE_STATUSES.map(s => (
                        <button
                            key={s}
                            className={`premium-btn ${statusFilter === s ? '' : 'premium-btn-secondary'}`}
                            style={{ padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem' }}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                        >
                            {s === 'All' ? 'All' : s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
                        </button>
                    ))}
                </div>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Commission ID</th>
                                <th>Org</th>
                                <th>Event</th>
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
                                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '30px' }}></div></td>
                                    </tr>
                                ))
                            ) : commissionsData?.commissions?.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>No commissions found.</div>
                                        No commissions matching your current filters.
                                    </td>
                                </tr>
                            ) : (
                                commissionsData?.commissions?.map(c => (
                                    <tr key={c.commission_id}>
                                        <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{c.commission_id.substring(0, 8)}</td>
                                        <td style={{ fontWeight: 500 }}>{c.referred_org_id.substring(0, 8)}...</td>
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
                                            <button className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Eye size={14} /> View
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
        </div>
    );
};

export default PartnerCommissionsList;
