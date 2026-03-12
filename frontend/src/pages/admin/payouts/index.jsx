import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Search, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminPayoutList = () => {
    const navigate = useNavigate();
    const { payoutsData, payoutsLoading, fetchPayouts } = useAdminStore();
    const [partnerFilter, setPartnerFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 20;

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayouts({ skip: (page - 1) * limit, limit, status: statusFilter, partner_id: partnerFilter });
        }, 300);
        return () => clearTimeout(timer);
    }, [partnerFilter, statusFilter, page, fetchPayouts]);

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Payout Statements</h1>
                <Link to="/admin/payouts/new" className="premium-btn" style={{ textDecoration: 'none' }}>
                    <Plus size={16} /> Generate Payout
                </Link>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 200px', gap: '16px', marginBottom: '24px' }}>
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
                            <option value="draft">Draft</option>
                            <option value="finalized">Finalized</option>
                            <option value="disbursed">Disbursed</option>
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Statement ID</th>
                                <th>Partner</th>
                                <th>Period</th>
                                <th>Net Payable</th>
                                <th>Status</th>
                                <th>Disbursed At</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payoutsLoading ? (
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
                            ) : payoutsData?.payouts?.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>No payouts found.</div>
                                        Adjust filters or generate a new payout.
                                    </td>
                                </tr>
                            ) : (
                                payoutsData?.payouts?.map(p => (
                                    <tr key={p.statement_id}>
                                        <td style={{ fontFamily: 'monospace' }}>{p.statement_id.substring(0, 8)}</td>
                                        <td style={{ cursor: 'pointer', color: 'var(--accent-indigo)' }} onClick={() => navigate(`/admin/partners/${p.partner_id}`)}>
                                            {p.partner_id.substring(0, 8)}...
                                        </td>
                                        <td style={{ fontWeight: 500 }}>
                                            {new Date(p.period_start).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – {new Date(p.period_end).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{p.net_payable.toLocaleString('en-IN')}</td>
                                        <td>
                                            {(() => {
                                                let badgeType = 'yellow';
                                                if (p.status === 'finalized') badgeType = 'blue';
                                                else if (p.status === 'disbursed') badgeType = 'green';
                                                return <span className={`status-badge badge-${badgeType}`}>{p.status}</span>;
                                            })()}
                                        </td>
                                        <td>{p.disbursed_at ? new Date(p.disbursed_at).toLocaleDateString() : '—'}</td>
                                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => navigate(`/admin/payouts/${p.statement_id}`)}>
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
                        Showing {payoutsData?.payouts?.length ? ((page - 1) * limit) + 1 : 0}–{Math.min(page * limit, payoutsData?.total || 0)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="premium-btn premium-btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            Previous
                        </button>
                        <button className="premium-btn premium-btn-secondary" disabled={!payoutsData?.payouts || payoutsData.payouts.length < limit} onClick={() => setPage(p => p + 1)}>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPayoutList;
