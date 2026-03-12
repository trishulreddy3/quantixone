import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Briefcase, FileText, AlertCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';

const EditPartner = () => {
    const { partnerId } = useParams();
    const navigate = useNavigate();
    const { activePartner, partnerLoading, fetchPartnerDetail, updatePartner } = useAdminStore();

    const [formData, setFormData] = useState({
        bank: { beneficiary_name: '', account_number: '', ifsc_code: '', bank_name: '', branch: '' },
        notes: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!activePartner || activePartner.partner_id !== partnerId) {
            fetchPartnerDetail(partnerId);
        } else {
            setFormData({
                bank: { ...activePartner.bank, account_number: '' }, // Appendix B masking rule
                notes: activePartner.notes || ''
            });
        }
    }, [partnerId, activePartner, fetchPartnerDetail]);

    const handleChange = (section, field, value) => {
        if (section === 'notes') {
            setFormData(prev => ({ ...prev, notes: value }));
        } else {
            let finalValue = value;
            if (field === 'ifsc_code') finalValue = value.toUpperCase();

            setFormData(prev => ({ ...prev, bank: { ...prev.bank, [field]: finalValue } }));
        }
    };

    const handleSave = async () => {
        setError(null);

        const { bank } = formData;

        let finalBankPayload = { ...bank };
        if (!bank.account_number) {
            // Unchanged by user, use original
            finalBankPayload.account_number = activePartner.bank.account_number;
        } else {
            if (!/^\d{9,18}$/.test(bank.account_number)) { setError("Account number must be 9-18 digits"); return; }
        }

        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc_code)) { setError("Invalid IFSC structure"); return; }

        setSaving(true);
        const success = await updatePartner(partnerId, { ...formData, bank: finalBankPayload });
        setSaving(false);
        if (success) {
            alert("Partner updated successfully");
            navigate(`/admin/partners/${partnerId}`);
        } else {
            setError("Failed to update partner. Check console.");
        }
    };

    if (partnerLoading || !activePartner) return <div className="card" style={{ padding: '48px', textAlign: 'center' }}>Loading logic...</div>;

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to={`/admin/partners/${partnerId}`} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Edit Partner Details</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to={`/admin/partners/${partnerId}`} className="premium-btn premium-btn-secondary" style={{ textDecoration: 'none' }}>
                        Cancel
                    </Link>
                    <button className="premium-btn" onClick={handleSave} disabled={saving}>
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="animate-fade-in" style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', maxWidth: '800px', margin: '0 auto 24px' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px', maxWidth: '800px', margin: '0 auto' }}>
                <div className="card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--accent-green)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <Briefcase size={20} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Bank Details</h3>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Beneficiary Name *</label>
                        <input type="text" className="premium-input" value={formData.bank.beneficiary_name} onChange={e => handleChange('bank', 'beneficiary_name', e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Account Number *</label>
                        <input
                            type="text"
                            className="premium-input"
                            value={formData.bank.account_number}
                            placeholder={activePartner.bank.account_number ? `XXXX XXXX ${activePartner.bank.account_number.slice(-4)}` : 'Enter account number'}
                            onChange={e => handleChange('bank', 'account_number', e.target.value)}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            For security, account numbers are masked. Enter new number to update.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label">IFSC Code *</label>
                            <input type="text" className="premium-input" value={formData.bank.ifsc_code} style={{ textTransform: 'uppercase' }} onChange={e => handleChange('bank', 'ifsc_code', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Bank Name *</label>
                            <input type="text" className="premium-input" value={formData.bank.bank_name} onChange={e => handleChange('bank', 'bank_name', e.target.value)} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Branch</label>
                        <input type="text" className="premium-input" value={formData.bank.branch} onChange={e => handleChange('bank', 'branch', e.target.value)} />
                    </div>
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--accent-yellow)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        <FileText size={20} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Admin Notes</h3>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                        <textarea className="premium-input" value={formData.notes} onChange={e => handleChange('notes', '', e.target.value)} rows="4" style={{ resize: 'vertical' }}></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPartner;
