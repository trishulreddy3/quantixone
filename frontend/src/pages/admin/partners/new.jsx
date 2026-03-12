import React, { useState } from 'react';
import { ArrowLeft, Save, AlertCircle, Wand2, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';

const OnboardPartner = () => {
    const navigate = useNavigate();
    const { onboardPartner } = useAdminStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        kyc: {
            company_name: '',
            contact_person_name: '',
            email: '',
            phone: '',
            aadhar_number: '',
            pan_number: '',
            gst_number: '',
            dpiit_number: ''
        },
        bank: {
            beneficiary_name: '',
            account_number: '',
            ifsc_code: '',
            bank_name: '',
            branch: ''
        },
        notes: '',
        password: '' // Auth
    });

    const handleChange = (section, field, value) => {
        if (section === 'notes' || section === 'password') {
            setFormData({ ...formData, [section]: value });
        } else {
            // Auto uppercase validation fields
            let finalValue = value;
            if (['pan_number', 'gst_number', 'dpiit_number', 'ifsc_code'].includes(field)) {
                finalValue = value.toUpperCase();
            }

            setFormData({
                ...formData,
                [section]: { ...formData[section], [field]: finalValue }
            });
        }
    };

    const generatePassword = (e) => {
        e.preventDefault();
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let newPassword = '';
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData({ ...formData, password: newPassword });
    };

    const handleCopyPassword = (e) => {
        e.preventDefault();
        if (formData.password) {
            navigator.clipboard.writeText(formData.password);
            alert("Password copied to clipboard!");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Client-Side Validation rules Phase 0 Section 5.1 & 5.2
        const { kyc, bank } = formData;
        if (!/^\d{12}$/.test(kyc.aadhar_number)) { setError("Aadhar Number must be exactly 12 digits."); setLoading(false); return; }
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(kyc.pan_number)) { setError("Invalid PAN format (e.g. ABCDE1234F)"); setLoading(false); return; }
        if (kyc.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(kyc.gst_number)) { setError("Invalid GST format"); setLoading(false); return; }
        if (!/^\d{10,15}$/.test(kyc.phone)) { setError("Phone must be 10-15 digits"); setLoading(false); return; }
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifsc_code)) { setError("Invalid IFSC structure"); setLoading(false); return; }
        if (!/^\d{9,18}$/.test(bank.account_number)) { setError("Account number must be 9-18 digits"); setLoading(false); return; }

        try {
            const resp = await onboardPartner(formData);
            // Toast logic can be injected here
            alert("Partner onboarded successfully");
            navigate(`/admin/partners/${resp._id}`);
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Validation failed. Check if email exists.');
            setLoading(false);
            return;
        }
    };

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/admin/partners" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Onboard New Partner</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/admin/partners" className="premium-btn premium-btn-secondary" style={{ textDecoration: 'none' }}>
                        Cancel
                    </Link>
                    <button className="premium-btn" onClick={handleSubmit} disabled={loading}>
                        <Save size={16} /> {loading ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="animate-fade-in" style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
                {/* KYC Section */}
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                        KYC Details
                    </h3>

                    <div className="input-group">
                        <label className="input-label">Company Name *</label>
                        <input type="text" className="premium-input" placeholder="e.g. Acme Corp" onChange={e => handleChange('kyc', 'company_name', e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Contact Person Name *</label>
                        <input type="text" className="premium-input" placeholder="e.g. Rajan Garg" onChange={e => handleChange('kyc', 'contact_person_name', e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label">Email Address *</label>
                            <input type="email" className="premium-input" placeholder="rajan@acmecorp.com" onChange={e => handleChange('kyc', 'email', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Phone Number *</label>
                            <input type="tel" className="premium-input" placeholder="9876543210" onChange={e => handleChange('kyc', 'phone', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label">Aadhar Number *</label>
                            <input type="text" className="premium-input" placeholder="12-digit number" onChange={e => handleChange('kyc', 'aadhar_number', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">PAN Number *</label>
                            <input type="text" className="premium-input" placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} onChange={e => handleChange('kyc', 'pan_number', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label">GST Number</label>
                            <input type="text" className="premium-input" placeholder="Optional" style={{ textTransform: 'uppercase' }} onChange={e => handleChange('kyc', 'gst_number', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">DPIIT Number</label>
                            <input type="text" className="premium-input" placeholder="Optional" style={{ textTransform: 'uppercase' }} onChange={e => handleChange('kyc', 'dpiit_number', e.target.value)} />
                        </div>
                    </div>

                    <div className="input-group" style={{ marginTop: '16px' }}>
                        <label className="input-label">Partner Portal Password *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" required value={formData.password} className="premium-input" placeholder="Set initial password for Partner" style={{ flex: 1 }} onChange={e => handleChange('password', '', e.target.value)} />
                            <button className="premium-btn premium-btn-secondary" onClick={generatePassword} title="Generate Random Password" style={{ padding: '0 12px', flexShrink: 0 }}>
                                <Wand2 size={20} />
                            </button>
                            <button className="premium-btn premium-btn-secondary" onClick={handleCopyPassword} title="Copy Password" style={{ padding: '0 12px', flexShrink: 0 }}>
                                <Copy size={20} />
                            </button>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            The partner will use this password and their email to log into the partner portal.
                        </p>
                    </div>
                </div>

                {/* Bank & Notes Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            Bank Details
                        </h3>

                        <div className="input-group">
                            <label className="input-label">Beneficiary Name *</label>
                            <input type="text" className="premium-input" placeholder="Same as company name usually" onChange={e => handleChange('bank', 'beneficiary_name', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Account Number *</label>
                            <input type="text" className="premium-input" placeholder="Account Number" onChange={e => handleChange('bank', 'account_number', e.target.value)} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '16px' }}>
                            <div className="input-group">
                                <label className="input-label">IFSC Code *</label>
                                <input type="text" className="premium-input" placeholder="HDFC0001234" style={{ textTransform: 'uppercase' }} onChange={e => handleChange('bank', 'ifsc_code', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Bank Name *</label>
                                <input type="text" className="premium-input" placeholder="HDFC Bank" onChange={e => handleChange('bank', 'bank_name', e.target.value)} />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Branch</label>
                            <input type="text" className="premium-input" placeholder="Connaught Place, New Delhi" onChange={e => handleChange('bank', 'branch', e.target.value)} />
                        </div>
                    </div>

                    <div className="card" style={{ padding: '32px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                            Admin Notes
                        </h3>
                        <div className="input-group" style={{ margin: 0 }}>
                            <textarea className="premium-input" placeholder="E.g., Referred by existing partner. KYC docs verified." rows="4" style={{ resize: 'vertical' }} onChange={e => handleChange('notes', '', e.target.value)}></textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardPartner;
