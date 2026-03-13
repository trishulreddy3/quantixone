import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, XCircle, FileUp, Download, AlertTriangle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import api from '../../../api';
import S3Uploader from '../../../components/S3Uploader';
import PageErrorCard from '../../../components/PageErrorCard';

const ContractDetail = () => {
    const { contractId } = useParams();
    const navigate = useNavigate();
    const { activeContract, contractLoading, contractError, fetchContractDetail, adminCountersign, terminateContract } = useAdminStore();

    const [showPartnerModal, setShowPartnerModal] = useState(false);
    const [showTerminateModal, setShowTerminateModal] = useState(false);
    const [partnerS3Key, setPartnerS3Key] = useState('');
    const [adminS3Key, setAdminS3Key] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchContractDetail(contractId);
    }, [contractId, fetchContractDetail]);

    const handlePartnerSign = async () => {
        setIsProcessing(true);
        try {
            await api.post(`/contracts/${contractId}/partner-sign`, { s3_key: partnerS3Key });
            setShowPartnerModal(false);
            await fetchContractDetail(contractId);
            alert("Partner signature recorded!");
        } catch (err) {
            alert("Failed to record signature.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAdminS3Success = (s3Key) => {
        setAdminS3Key(s3Key);
    };

    const submitAdminCountersign = async () => {
        setIsProcessing(true);
        const success = await adminCountersign(contractId, adminS3Key);
        setIsProcessing(false);
        if (success) {
            alert("Contract activated — partner is now ACTIVE");
        } else {
            alert("Action not allowed: Partner must sign first before admin countersign.");
        }
    };

    const terminate = async () => {
        setIsProcessing(true);
        const success = await terminateContract(contractId);
        setIsProcessing(false);
        if (success) {
            setShowTerminateModal(false);
            alert("Contract Terminated. Partner has been suspended.");
        } else {
            alert("Action not allowed.");
        }
    };

    const handleDownload = (s3Key, filename) => {
        if (!s3Key) {
            alert("No document uploaded yet.");
            return;
        }
        // In production, generate a signed download URL. For now, show key.
        alert(`Download key: ${s3Key}\n\nIn production, this would trigger a signed S3 download URL.`);
    };

    if (contractLoading || !activeContract) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading contract...</div>;

    if (contractError) {
        return <PageErrorCard message={contractError} backLink="/admin/contracts" backText="Back to Contracts" />;
    }

    const { status, partner_id, partner_signed_at, admin_signed_at, partner_signed_s3_key, admin_signed_s3_key, createdAt } = activeContract;
    const partnerIdStr = typeof partner_id === 'object' ? partner_id?._id : partner_id;
    const partnerName = typeof partner_id === 'object' ? partner_id?.kyc?.company_name : null;

    // Progress steps: draft(1) → partner_signed(2) → active(3) → [terminated(4)]
    const STEPS = [
        { key: 'draft', label: 'Draft Created' },
        { key: 'partner_signed', label: 'Partner Signed' },
        { key: 'active', label: 'Active' },
        { key: 'terminated', label: 'Terminated' },
    ];
    const stepOrder = { draft: 0, partner_signed: 1, active: 2, terminated: 3 };
    const currentStep = stepOrder[status] ?? 0;

    const stepBg = (i) => {
        if (status === 'terminated' && i === 3) return '#ef4444';
        if (i <= currentStep && status !== 'terminated') return 'var(--accent-green)';
        if (i === currentStep) return 'var(--primary)';
        return 'var(--bg-surface-hover)';
    };

    const progressWidth = status === 'terminated' ? '100%' : `${(currentStep / 2) * 100}%`;

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to={`/admin/partners/${partnerIdStr}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="page-title" style={{ margin: 0 }}>Contract Details</h1>
                        {partnerName && <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{partnerName}</div>}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span className={`status-badge badge-${status === 'active' ? 'green' : status === 'terminated' ? 'red' : status === 'partner_signed' ? 'blue' : 'gray'}`}>
                        {status.replace(/_/g, ' ')}
                    </span>
                    <button
                        className="premium-btn premium-btn-danger"
                        onClick={() => setShowTerminateModal(true)}
                        disabled={status === 'terminated' || isProcessing}
                    >
                        Terminate Contract
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Track */}
                    <div style={{ position: 'absolute', top: '24px', left: '40px', right: '40px', height: '2px', background: 'var(--border-color)', zIndex: 0 }} />
                    {/* Progress fill */}
                    <div style={{
                        position: 'absolute', top: '24px', left: '40px',
                        width: progressWidth,
                        height: '2px',
                        background: status === 'terminated' ? '#ef4444' : 'var(--accent-green)',
                        zIndex: 1, transition: 'width 0.5s'
                    }} />

                    {STEPS.map((step, i) => {
                        const isDone = i < currentStep && status !== 'terminated';
                        const isCurrent = i === currentStep;
                        const isTerminatedStep = step.key === 'terminated';
                        const isActive = status === 'terminated' && isTerminatedStep;

                        const bg = isActive ? '#ef4444'
                            : isDone ? 'var(--accent-green)'
                                : isCurrent && !isTerminatedStep ? 'var(--primary)'
                                    : 'var(--bg-surface-hover)';

                        const textColor = isActive ? '#ef4444'
                            : isCurrent && !isTerminatedStep ? 'var(--primary)'
                                : isDone ? 'var(--accent-green)'
                                    : 'var(--text-muted)';

                        return (
                            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, minWidth: '80px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    background: bg,
                                    color: (isDone || isCurrent || isActive) ? 'white' : 'var(--text-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: isCurrent && !isTerminatedStep ? '3px solid var(--primary)' : '1px solid var(--border-color)',
                                    boxShadow: isCurrent && !isTerminatedStep ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
                                    transition: 'all 0.3s'
                                }}>
                                    {isDone ? <CheckCircle size={22} /> : isActive ? <XCircle size={22} /> : <span style={{ fontWeight: 700, fontSize: '1rem' }}>{i + 1}</span>}
                                </div>
                                <span style={{ fontSize: '0.85rem', color: textColor, fontWeight: (isCurrent || isActive || isDone) ? 600 : 400, textAlign: 'center' }}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Contract Info */}
            <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Contract ID</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{(activeContract._id || '').toString().slice(-12)}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Created</div>
                        <div style={{ fontWeight: 500 }}>{createdAt ? new Date(createdAt).toLocaleDateString() : '—'}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Partner</div>
                        <Link to={`/admin/partners/${partnerIdStr}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                            {partnerName || (partnerIdStr || '—')}
                        </Link>
                    </div>
                </div>
            </div>

            {status !== 'terminated' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>

                    {/* Partner Signature Panel */}
                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Partner Signature</h3>

                        {partner_signed_at ? (
                            <>
                                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <CheckCircle size={20} color="var(--accent-green)" />
                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Signed on {new Date(partner_signed_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <button className="premium-btn premium-btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => handleDownload(partner_signed_s3_key, 'partner_signed.pdf')}>
                                    <Download size={18} /> Download Signed Contract
                                </button>
                            </>
                        ) : (
                            <>
                                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: '#92400e' }}>
                                    <AlertTriangle size={20} />
                                    <span style={{ fontWeight: 500 }}>Awaiting partner signature</span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>If the partner is unable to log in, you can upload their signed PDF on their behalf:</p>
                                <S3Uploader
                                    contractId={contractId}
                                    mode="partner"
                                    documentType="contract.pdf"
                                    onUploadSuccess={(key) => {
                                        setPartnerS3Key(key);
                                        setShowPartnerModal(true);
                                    }}
                                />
                            </>
                        )}
                    </div>

                    {/* Admin Countersignature Panel */}
                    <div className="card" style={{ padding: '32px', position: 'relative', overflow: 'hidden', opacity: !partner_signed_at ? 0.6 : 1 }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Admin Countersignature</h3>

                        {!partner_signed_at && (
                            <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                Waiting for partner signature before countersigning.
                            </div>
                        )}

                        {admin_signed_at ? (
                            <>
                                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <CheckCircle size={20} color="var(--accent-green)" />
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Countersigned on {new Date(admin_signed_at).toLocaleDateString()}</span>
                                </div>
                                <button className="premium-btn premium-btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }} onClick={() => handleDownload(admin_signed_s3_key, 'final_contract.pdf')}>
                                    <Download size={18} /> Download Final Contract
                                </button>
                            </>
                        ) : (
                            <>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>Countersign the document and upload the finalized PDF to make this contract Active.</p>
                                <div style={{ marginBottom: '24px' }}>
                                    <S3Uploader
                                        contractId={contractId}
                                        mode="admin"
                                        documentType="countersigned.pdf"
                                        onUploadSuccess={handleAdminS3Success}
                                    />
                                </div>
                                <button
                                    className="premium-btn"
                                    onClick={submitAdminCountersign}
                                    style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                                    disabled={!adminS3Key || !partner_signed_at || isProcessing}
                                >
                                    {isProcessing ? 'Submitting...' : 'Submit Countersignature (Activates Partner)'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {status === 'terminated' && (
                <div style={{ padding: '32px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <XCircle size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: '#b91c1c', fontWeight: 700, marginBottom: '8px' }}>Contract Terminated</h3>
                    <p style={{ color: '#6b7280' }}>This contract has been terminated and the partner account has been suspended.</p>
                    <Link to={`/admin/partners/${partnerIdStr}`} className="premium-btn" style={{ display: 'inline-flex', textDecoration: 'none', marginTop: '16px' }}>
                        View Partner
                    </Link>
                </div>
            )}

            {/* Partner Sign Confirmation Modal */}
            {showPartnerModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Record Partner Signature</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>S3 Key: <code>{partnerS3Key}</code></p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowPartnerModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn" onClick={handlePartnerSign} disabled={isProcessing}>
                                {isProcessing ? 'Saving...' : 'Confirm Signature'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Terminate Modal */}
            {showTerminateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Terminate Contract?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            This will terminate the contract and <strong>suspend the partner's account</strong>. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowTerminateModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn premium-btn-danger" onClick={terminate} disabled={isProcessing}>
                                {isProcessing ? 'Terminating...' : 'Terminate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractDetail;
