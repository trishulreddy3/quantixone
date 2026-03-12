import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Search, Plus, Filter, AlertCircle, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const PartnerList = () => {
    const navigate = useNavigate();
    const { partnersData, partnersLoading, partnersError, fetchPartners, deletePartner } = useAdminStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const limit = 20;

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchPartners({ skip: (page - 1) * limit, limit, status: statusFilter, search });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, statusFilter, page, fetchPartners]);

    return (
        <div className="animate-fade-in relative">
            {partnersError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <span>Error loading partners: {partnersError}</span>
                    <button className="premium-btn premium-btn-danger" style={{ marginLeft: 'auto', padding: '6px 16px' }} onClick={() => fetchPartners({ skip: (page - 1) * limit, limit, status: statusFilter, search })}>Retry</button>
                </div>
            )}

            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Partners</h1>
                <Link to="/admin/partners/new" className="premium-btn" style={{ textDecoration: 'none' }}>
                    <Plus size={16} /> Onboard Partner
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
                                placeholder="Search by company or email..."
                                style={{ width: '100%', paddingLeft: '44px' }}
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <select
                            className="premium-input"
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="All">All Statuses</option>
                            <option value="pending_review">Pending Review</option>
                            <option value="approved">Approved</option>
                            <option value="contract_sent">Contract Sent</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="terminated">Terminated</option>
                        </select>
                    </div>
                </div>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Company</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Tier</th>
                                <th>Orgs<br />Referred</th>
                                <th>Total Earned</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partnersLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '90%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '50%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '40%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                        <td><div className="skeleton skeleton-text" style={{ width: '60px', height: '30px' }}></div></td>
                                    </tr>
                                ))
                            ) : partnersData?.partners?.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '1.2rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>No partners found.</div>
                                        Adjust filters or onboard a new partner to get started.
                                    </td>
                                </tr>
                            ) : (
                                partnersData?.partners?.map(p => (
                                    <tr key={p._id} onClick={() => navigate(`/admin/partners/${p._id}`)} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{p.kyc?.company_name}</td>
                                        <td>{p.kyc?.email}</td>
                                        <td>
                                            {/* Determine badge color based on status */}
                                            {(() => {
                                                let badgeType = 'gray';
                                                if (p.status === 'active') badgeType = 'green';
                                                else if (p.status === 'pending_review') badgeType = 'yellow';
                                                else if (p.status === 'approved' || p.status === 'contract_sent') badgeType = 'blue';
                                                else if (p.status === 'suspended' || p.status === 'terminated') badgeType = 'red';
                                                return <span className={`status-badge badge-${badgeType}`}>{p.status.replace('_', ' ')}</span>;
                                            })()}
                                        </td>
                                        <td><div style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'inline-block', fontWeight: 600 }}>Tier {p.current_tier || 1}</div></td>
                                        <td>{p.total_orgs_referred || 0}</td>
                                        <td style={{ fontWeight: 500 }}>₹{(p.total_commissions_earned || 0).toLocaleString('en-IN')}</td>
                                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={(e) => { e.stopPropagation(); navigate(`/admin/partners/${p._id}`) }}>
                                                View
                                            </button>
                                            <button
                                                className="premium-btn premium-btn-secondary"
                                                style={{ padding: '6px', marginLeft: '8px', color: '#ef4444', borderColor: 'transparent', background: 'transparent' }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Are you sure you want to delete ${p.kyc?.company_name}? This will delete all associated data.`)) {
                                                        await deletePartner(p._id);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={16} />
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
                        Showing {partnersData?.partners?.length ? ((page - 1) * limit) + 1 : 0}–{Math.min(page * limit, partnersData?.total || 0)} of {partnersData?.total || 0}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="premium-btn premium-btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                            Previous
                        </button>
                        <button className="premium-btn premium-btn-secondary" disabled={!partnersData?.partners || partnersData.partners.length < limit} onClick={() => setPage(p => p + 1)}>
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default PartnerList;
