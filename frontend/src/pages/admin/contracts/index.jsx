import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ContractList = () => {
    const navigate = useNavigate();
    const { contractsData, contractsLoading, fetchContracts } = useAdminStore();
    const [page, setPage] = useState(1);
    const [filterPending, setFilterPending] = useState(false);
    const limit = 20;

    useEffect(() => {
        fetchContracts({ skip: (page - 1) * limit, limit });
    }, [page, fetchContracts]);

    // Client-side filtering as per spec 3.A.8: "pre-filters to `partner_signed`" via "Pending Countersign" chip
    const displayedContracts = filterPending
        ? (contractsData?.contracts || []).filter(c => c.status === 'partner_signed')
        : (contractsData?.contracts || []);

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Contracts</h1>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                    <button
                        className={`premium-btn ${filterPending ? '' : 'premium-btn-secondary'}`}
                        style={{ padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem' }}
                        onClick={() => setFilterPending(!filterPending)}
                    >
                        <Filter size={14} /> {filterPending ? 'Showing: Pending Countersign' : 'Filter: Pending Countersign'}
                    </button>
                </div>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Contract ID</th>
                                <th>Partner</th>
                                <th>Status</th>
                                <th>Partner Signed</th>
                                <th>Admin Signed</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contractsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '90%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '30px' }}></div></td>
                                    </tr>
                                ))
                            ) : displayedContracts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>No contracts found.</div>
                                        {filterPending ? "No contracts are currently awaiting countersignature." : "No contracts exist yet."}
                                    </td>
                                </tr>
                            ) : (
                                displayedContracts.map(c => {
                                    const partnerIdStr = typeof c.partner_id === 'object' ? c.partner_id._id : c.partner_id;
                                    const partnerName = typeof c.partner_id === 'object' ? c.partner_id.kyc?.company_name : c.partner_id;
                                    return (
                                        <tr key={c._id}>
                                            <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>{(c._id || '').toString().slice(-8)}</td>
                                            <td style={{ cursor: 'pointer', color: 'var(--accent-indigo)' }} onClick={() => navigate(`/admin/partners/${partnerIdStr}`)}>
                                                {(partnerName || '').toString().substring(0, 20)}
                                            </td>
                                            <td>
                                                {(() => {
                                                    let badgeType = 'gray';
                                                    if (c.status === 'active') badgeType = 'green';
                                                    else if (c.status.includes('signed')) badgeType = 'blue';
                                                    else if (c.status === 'draft') badgeType = 'yellow';
                                                    return <span className={`status-badge badge-${badgeType}`}>{c.status.replace('_', ' ')}</span>;
                                                })()}
                                            </td>
                                            <td>{c.partner_signed_at ? new Date(c.partner_signed_at).toLocaleDateString() : '—'}</td>
                                            <td>{c.admin_signed_at ? new Date(c.admin_signed_at).toLocaleDateString() : '—'}</td>
                                            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => navigate(`/admin/contracts/${c._id}`)}>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Showing {displayedContracts.length ? ((page - 1) * limit) + 1 : 0}–{Math.min(page * limit, contractsData?.total || 0)}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="premium-btn premium-btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            Previous
                        </button>
                        <button className="premium-btn premium-btn-secondary" disabled={!contractsData?.contracts || contractsData.contracts.length < limit} onClick={() => setPage(p => p + 1)}>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractList;
