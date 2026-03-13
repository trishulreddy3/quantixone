import React, { useEffect, useState } from 'react';
import { ArrowLeft, User, Briefcase, FileText, CheckCircle, XCircle, AlertTriangle, Lock, Trash2 } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import TierProgressIndicator from '../../../components/TierProgressIndicator';
import PageErrorCard from '../../../components/PageErrorCard';

const PartnerDetail = () => {
    const { partnerId } = useParams();
    const { activePartner, partnerContracts, partnerLoading, partnerError, fetchPartnerDetail, updatePartnerStatus, createContract, updatePartnerPassword, deletePartner } = useAdminStore();

    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPartnerDetail(partnerId);
    }, [partnerId, fetchPartnerDetail]);

    const handleStatusChange = async (newStatus) => {
        setIsProcessing(true);
        await updatePartnerStatus(partnerId, newStatus);
        setIsProcessing(false);
        setShowTerminateModal(false);
    };

    const handleCreateContract = async () => {
        setIsProcessing(true);
        await createContract(partnerId);
        setIsProcessing(false);
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
        }
        setIsProcessing(true);
        const success = await updatePartnerPassword(partnerId, newPassword);
        setIsProcessing(false);
        if (success) {
            alert("Password changed successfully!");
            setShowPasswordModal(false);
            setNewPassword('');
        } else {
            alert("Failed to change password. Please try again.");
        }
    };

    const handleDeletePartner = async () => {
        setIsProcessing(true);
        const success = await deletePartner(partnerId);
        setIsProcessing(false);
        if (success) {
            alert("Partner deleted successfully.");
            navigate('/admin/partners');
        } else {
            alert("Failed to delete partner.");
        }
    };

    if (partnerLoading) {
        return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading partner details...</div>;
    }

    if (partnerError) {
        return <PageErrorCard message={partnerError} onRetry={() => fetchPartnerDetail(partnerId)} backLink="/admin/partners" backText="Back to Partners" />;
    }

    if (!activePartner) {
        return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Partner data not available</div>;
    }

    const { kyc, bank, current_tier, total_orgs_referred, total_commissions_earned, total_commissions_paid, status, notes } = activePartner;

    // Determine badge color
    let badgeType = 'gray';
    if (status === 'active') badgeType = 'green';
    else if (status === 'pending_review') badgeType = 'yellow';
    else if (status === 'approved' || status === 'contract_sent') badgeType = 'blue';
    else if (status === 'suspended' || status === 'terminated') badgeType = 'red';

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/admin/partners" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 className="page-title" style={{ margin: 0 }}>{kyc.company_name}</h1>
                            <span className={`status-badge badge-${badgeType}`}>{status.replace('_', ' ')}</span>
                            <div style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600 }}>
                                Tier {current_tier || 1}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="premium-btn premium-btn-secondary" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => setShowPasswordModal(true)} disabled={isProcessing}>
                        <Lock size={16} style={{ marginRight: '6px' }} />
                        Reset Password
                    </button>
                    {status === 'pending_review' && (
                        <>
                            <button className="premium-btn" onClick={() => handleStatusChange('approved')} disabled={isProcessing}>Approve KYC</button>
                            <button className="premium-btn premium-btn-danger" onClick={() => setShowTerminateModal(true)} disabled={isProcessing}>Reject & Terminate</button>
                        </>
                    )}
                    {status === 'approved' && (
                        <>
                            <button className="premium-btn" onClick={handleCreateContract} disabled={isProcessing}>Send Contract</button>
                            <button className="premium-btn premium-btn-danger" onClick={() => setShowTerminateModal(true)} disabled={isProcessing}>Terminate</button>
                        </>
                    )}
                    {status === 'contract_sent' && (
                        <>
                            {partnerContracts.length > 0 && (
                                <button className="premium-btn premium-btn-secondary" onClick={() => navigate(`/admin/contracts/${partnerContracts[0]._id}`)} disabled={isProcessing}>View Contract</button>
                            )}
                            <button className="premium-btn premium-btn-danger" onClick={() => setShowTerminateModal(true)} disabled={isProcessing}>Terminate</button>
                        </>
                    )}
                    {status === 'active' && (
                        <>
                            <button className="premium-btn premium-btn-secondary" style={{ color: 'var(--accent-yellow)', borderColor: 'var(--accent-yellow)' }} onClick={() => handleStatusChange('suspended')} disabled={isProcessing}>Suspend</button>
                            <button className="premium-btn premium-btn-danger" onClick={() => setShowTerminateModal(true)} disabled={isProcessing}>Terminate</button>
                        </>
                    )}
                    {status === 'suspended' && (
                        <>
                            <button className="premium-btn" onClick={() => handleStatusChange('active')} disabled={isProcessing}>Reactivate</button>
                            <button className="premium-btn premium-btn-danger" onClick={() => setShowTerminateModal(true)} disabled={isProcessing}>Terminate</button>
                        </>
                    )}
                    <button className="premium-btn premium-btn-danger" style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444' }} onClick={() => setShowDeleteModal(true)} disabled={isProcessing}>
                        <Trash2 size={16} style={{ marginRight: '6px' }} />
                        Delete Partner
                    </button>
                </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: '24px' }}>
                <div className="card stat-card">
                    <div className="stat-label">Total Orgs Referred</div>
                    <div className="stat-value">{total_orgs_referred || 0}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Active Orgs</div>
                    <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{total_orgs_referred || 0}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Total Earned</div>
                    <div className="stat-value" style={{ color: 'var(--accent-green)' }}>₹{(total_commissions_earned || 0).toLocaleString('en-IN')}</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Total Paid</div>
                    <div className="stat-value">₹{(total_commissions_paid || 0).toLocaleString('en-IN')}</div>
                </div>
            </div>

            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '24px' }}>Tier Progress & Config</h3>
                <TierProgressIndicator
                    currentTier={current_tier || 1}
                    totalOrgs={total_orgs_referred || 0}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', marginBottom: '24px' }}>

                {/* KYC Details */}
                <div className="card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <User size={20} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>KYC Profiles</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Company</span><div style={{ fontWeight: 500 }}>{kyc.company_name}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Contact Person</span><div style={{ fontWeight: 500 }}>{kyc.contact_person_name}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Email</span><div style={{ fontWeight: 500 }}>{kyc.email}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Phone</span><div style={{ fontWeight: 500 }}>{kyc.phone}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Aadhar Number</span><div style={{ fontWeight: 500 }}>XXXX XXXX {kyc.aadhar_number?.slice(-4) || 'N/A'}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>PAN Number</span><div style={{ fontWeight: 500, textTransform: 'uppercase' }}>{kyc.pan_number || 'N/A'}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>GST Number</span><div style={{ fontWeight: 500, textTransform: 'uppercase' }}>{kyc.gst_number || 'N/A'}</div></div>
                        <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>DPIIT Number</span><div style={{ fontWeight: 500, textTransform: 'uppercase' }}>{kyc.dpiit_number || 'N/A'}</div></div>
                    </div>

                    <div style={{ padding: '12px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                        <AlertTriangle size={16} /> KYC fields cannot be edited after onboarding.
                    </div>
                </div>

                {/* Bank & Notes Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-green)' }}>
                                <Briefcase size={20} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Bank Details</h3>
                            </div>
                            <Link to={`/admin/partners/${partnerId}/edit`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Edit Details</Link>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Beneficiary</span><div style={{ fontWeight: 500 }}>{bank.beneficiary_name}</div></div>
                            <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Account Number</span><div style={{ fontWeight: 500 }}>XXXX XXXX {bank.account_number?.slice(-4) || 'N/A'}</div></div>
                            <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>IFSC</span><div style={{ fontWeight: 500 }}>{bank.ifsc_code}</div></div>
                            <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Bank</span><div style={{ fontWeight: 500 }}>{bank.bank_name}</div></div>
                            <div><span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Branch</span><div style={{ fontWeight: 500 }}>{bank.branch}</div></div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-yellow)' }}>
                                <FileText size={20} />
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin Notes</h3>
                            </div>
                            <Link to={`/admin/partners/${partnerId}/edit`} style={{ color: 'var(--primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Edit Notes</Link>
                        </div>
                        <p style={{ color: 'var(--text-primary)' }}>{notes || "No notes available."}</p>
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px' }}>Contracts</h3>

                <div className="table-container">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th>Contract ID</th>
                                <th>Status</th>
                                <th>Partner Signed</th>
                                <th>Admin Signed</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partnerContracts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                        No contracts generated yet.
                                    </td>
                                </tr>
                            ) : (
                                partnerContracts.map(c => (
                                    <tr key={c._id}>
                                        <td style={{ fontFamily: 'monospace' }}>{(c._id || '').toString().slice(-8)}</td>
                                        <td><span className={`status-badge badge-${c.status.includes('signed') ? 'blue' : (c.status === 'active' ? 'green' : 'gray')}`}>{c.status.replace('_', ' ')}</span></td>
                                        <td>{c.partner_signed_at ? new Date(c.partner_signed_at).toLocaleDateString() : '—'}</td>
                                        <td>{c.admin_signed_at ? new Date(c.admin_signed_at).toLocaleDateString() : '—'}</td>
                                        <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <Link to={`/admin/contracts/${c._id}`} className="premium-btn premium-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', textDecoration: 'none' }}>
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

            {showTerminateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Terminate Partnership?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            This will permanently terminate {kyc.company_name}'s partnership. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowTerminateModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn premium-btn-danger" onClick={() => handleStatusChange('terminated')} disabled={isProcessing}>
                                {isProcessing ? 'Terminating...' : 'Terminate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Change Partner Password</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
                            Set a new password for {kyc.company_name}. They will be able to log in immediately with these new credentials.
                        </p>

                        <div className="input-group">
                            <label className="input-label">New Password</label>
                            <input
                                type="text"
                                className="premium-input"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter strong password"
                                disabled={isProcessing}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowPasswordModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn" onClick={handleChangePassword} disabled={isProcessing || !newPassword}>{isProcessing ? 'Saving...' : 'Save Password'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: '#ef4444' }}>
                            <AlertTriangle size={24} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Permanently Delete?</h3>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
                            This will <strong>permanently delete</strong> {kyc.company_name} and ALL their historical data (contracts, commissions, payouts). This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowDeleteModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn premium-btn-danger" onClick={handleDeletePartner} disabled={isProcessing}>
                                {isProcessing ? 'Deleting...' : 'Yes, Delete Everything'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerDetail;
