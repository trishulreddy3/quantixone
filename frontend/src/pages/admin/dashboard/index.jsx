import React, { useEffect } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Users, UserX, Coins, FileText, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const { dashboardData, dashboardLoading, dashboardError, fetchDashboardData } = useAdminStore();

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (dashboardError) {
        return (
            <div className="animate-fade-in">
                <h1 className="page-title" style={{ marginBottom: '20px' }}>Dashboard Overview</h1>
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertCircle size={20} />
                    <span>Failed to load dashboard data: {dashboardError}</span>
                    <button className="premium-btn premium-btn-danger" style={{ marginLeft: 'auto' }} onClick={fetchDashboardData}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const isLoading = dashboardLoading || !dashboardData;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <h1 className="page-title">Dashboard Overview</h1>
                <Link to="/admin/partners/new" className="premium-btn" style={{ textDecoration: 'none' }}>
                    <Users size={16} /> Onboard Partner
                </Link>
            </div>

            <div className="stats-grid">
                <div className="card stat-card">
                    <div className="stat-label">Total Partners</div>
                    {isLoading ? <div className="skeleton skeleton-text" style={{ width: '40px', height: '32px' }}></div> :
                        <div className="stat-value">{dashboardData.totalPartners}</div>}
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Active Partners</div>
                    {isLoading ? <div className="skeleton skeleton-text" style={{ width: '40px', height: '32px' }}></div> :
                        <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{dashboardData.activePartners}</div>}
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Payable Commissions</div>
                    {isLoading ? <div className="skeleton skeleton-text" style={{ width: '100px', height: '32px' }}></div> :
                        <div className="stat-value" style={{ color: 'var(--primary)' }}>₹{dashboardData.payableCommissions?.toLocaleString('en-IN') || 0}</div>}
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Draft Payouts</div>
                    {isLoading ? <div className="skeleton skeleton-text" style={{ width: '40px', height: '32px' }}></div> :
                        <div className="stat-value" style={{ color: 'var(--accent-yellow)' }}>{dashboardData.draftPayouts}</div>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                {/* Recent Partners */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Recent Partners</h3>

                    <div className="table-container">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}>
                                            <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                        </tr>
                                    ))
                                ) : dashboardData.recentPartners?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                            No records yet
                                        </td>
                                    </tr>
                                ) : (
                                    dashboardData.recentPartners?.map(p => (
                                        <tr key={p._id} onClick={() => window.location.href = `/admin/partners/${p._id}`} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{p.kyc?.company_name || 'N/A'}</td>
                                            <td><span className={`status-badge badge-${p.status === 'active' ? 'green' : 'yellow'}`}>{p.status.replace('_', ' ')}</span></td>
                                            <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pending Actions */}
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Contracts Awaiting Signature</h3>

                    <div className="table-container">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Contract ID</th>
                                    <th>Partner</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={i}>
                                            <td><div className="skeleton skeleton-text" style={{ width: '80%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{ width: '70%' }}></div></td>
                                        </tr>
                                    ))
                                ) : dashboardData.pendingContracts?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                            No contracts awaiting signature
                                        </td>
                                    </tr>
                                ) : (
                                    dashboardData.pendingContracts?.map(c => (
                                        <tr key={c._id} onClick={() => window.location.href = `/admin/contracts/${c._id}`} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontFamily: 'monospace' }}>{(c._id || '').toString().slice(-8)}</td>
                                            <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{(c.partner_id?.kyc?.company_name || c.partner_id).toString().substring(0, 15)}</td>
                                            <td><span className="status-badge badge-blue">Partner Signed</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
