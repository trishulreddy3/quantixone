import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, FileUp, Download, AlertTriangle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import api from '../../../api';
import S3Uploader from '../../../components/S3Uploader';
import PageErrorCard from '../../../components/PageErrorCard';

const ContractDetail = () => {
    const { contractId } = useParams();
    const navigate = useNavigate();
    const { activeContract, contractLoading, contractError, fetchContractDetail, getUploadUrl, adminCountersign, terminateContract } = useAdminStore();

    const [partnerUrl, setPartnerUrl] = useState('');
    const [adminUrl, setAdminUrl] = useState('');
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
            alert("Action not allowed: Conflict or failed to process.");
        }
    };

    const terminate = async () => {
        setIsProcessing(true);
        const success = await terminateContract(contractId);
        setIsProcessing(false);
        if (success) {
            setShowTerminateModal(false);
            alert("Contract Terminated.");
        } else {
            alert("Action not allowed.");
        }
    };

    if (contractLoading || !activeContract) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading contract...</div>;

    if (contractError) {
        return <PageErrorCard message={contractError} backLink="/admin/contracts" backText="Back to Contracts" />;
    }

    const { status, partner_id, partner_signed_at, admin_signed_at } = activeContract;
    const partnerIdStr = typeof partner_id === 'object' ? partner_id?._id : partner_id;

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to={`/admin/partners/${partnerIdStr}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Contract Details</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="premium-btn premium-btn-danger" onClick={() => setShowTerminateModal(true)} disabled={status === 'terminated' || isProcessing}>
                        Terminate Contract
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '24px', left: '40px', right: '40px', height: '2px', background: 'var(--border-color)', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', top: '24px', left: '40px', width: status === 'active' ? '100%' : (status === 'partner_signed' ? '50%' : '10%'), height: '2px', background: 'var(--accent-green)', zIndex: 1, transition: 'width 0.5s' }}></div>

                    {/* Draft */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle size={24} />
                        </div>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>Draft</span>
                    </div>

                    {/* Partner Signed */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: status === 'partner_signed' || status === 'active' ? 'var(--accent-green)' : (status === 'draft' ? 'var(--primary)' : 'var(--bg-surface-hover)'), color: status === 'draft' ? 'white' : (status === 'partner_signed' || status === 'active' ? 'white' : 'var(--text-muted)'), border: status === 'draft' ? 'none' : '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: status === 'draft' ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : 'none' }}>
                            {status === 'active' || status === 'partner_signed' ? <CheckCircle size={24} /> : '2'}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: status === 'draft' ? 'var(--primary)' : 'var(--text-primary)', fontWeight: status === 'draft' ? 600 : 500 }}>Partner Signed</span>
                    </div>

                    {/* Active */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: status === 'active' ? 'var(--accent-green)' : (status === 'partner_signed' ? 'var(--primary)' : 'var(--bg-surface-hover)'), color: status === 'active' || status === 'partner_signed' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: status === 'partner_signed' ? '0 0 0 3px rgba(37, 99, 235, 0.2)' : 'none' }}>
                            {status === 'active' ? <CheckCircle size={24} /> : '3'}
                        </div>
                        <span style={{ fontSize: '0.9rem', color: status === 'partner_signed' ? 'var(--primary)' : 'var(--text-primary)', fontWeight: status === 'partner_signed' ? 600 : 500 }}>Active</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>

                {/* Partner Signature Panel */}
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Partner Signature</h3>

                    {partner_signed_at ? (
                        <>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem' }}>Partner has successfully signed and uploaded the contract document. Please review it before countersigning.</p>
                            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <CheckCircle size={20} color="var(--accent-green)" />
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Signed on {new Date(partner_signed_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <button className="premium-btn premium-btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <Download size={18} /> Download Signed Contract
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: '#fef3c7', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: '#92400e' }}>
                                <AlertTriangle size={20} />
                                <span style={{ fontWeight: 500 }}>Awaiting partner signature</span>
                            </div>

                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>If the partner is unable to log in, you can upload their signed PDF on their behalf below to forcefully activate step 1:</p>

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
                {status !== 'draft' && (
                    <div className="card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '20px', color: 'var(--text-primary)' }}>Admin Countersignature</h3>

                        {admin_signed_at ? (
                            <>
                                <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: '#dcfce7', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <CheckCircle size={20} color="var(--accent-green)" />
                                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Countersigned on {new Date(admin_signed_at).toLocaleDateString()}</span>
                                </div>
                                <button className="premium-btn premium-btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
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

                                <button className="premium-btn" onClick={submitAdminCountersign} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} disabled={!adminS3Key || isProcessing}>
                                    {isProcessing ? 'Submitting...' : 'Submit Countersignature (Final Step)'}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {showPartnerModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Record Partner Signature</h3>
                        <div className="input-group">
                            <label className="input-label">S3 Key from Upload</label>
                            <input type="text" className="premium-input" placeholder="e.g. contracts/123/signed.pdf" onChange={e => setPartnerS3Key(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowPartnerModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn" onClick={handlePartnerSign} disabled={isProcessing}>
                                {isProcessing ? 'Saving...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTerminateModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '400px', width: '100%' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Terminate Contract?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            This action cannot be undone.
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
