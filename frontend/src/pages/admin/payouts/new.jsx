import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Info, AlertTriangle, Search, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../../store/adminStore';
import api from '../../../api';

const GeneratePayout = () => {
    const navigate = useNavigate();
    const { generatePayout } = useAdminStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        partner_id: '',
        period_start: '',
        period_end: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const res = await api.get(`/partners?search=${encodeURIComponent(searchQuery)}&limit=10`);
                    setSearchResults(res.data.data || []);
                    setShowDropdown(true);
                } catch (err) {
                    console.error("Partner search failed", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    const handleSelectPartner = (partner) => {
        setFormData(prev => ({ ...prev, partner_id: partner.partner_id }));
        setSearchQuery(partner.kyc?.company_name || partner.partner_id);
        setShowDropdown(false);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Date validations
        const start = new Date(formData.period_start);
        const end = new Date(formData.period_end);
        const today = new Date();

        if (start >= end) {
            setError("Period Start must be before Period End.");
            return;
        }

        if (end > today) {
            setError("Period End cannot be a future date.");
            return;
        }

        setLoading(true);
        try {
            // API expects ISO strings
            const payload = {
                partner_id: formData.partner_id,
                period_start: new Date(formData.period_start).toISOString(),
                period_end: new Date(formData.period_end).toISOString()
            };

            const newPayout = await generatePayout(payload);
            alert("Payout statement generated successfully.");
            navigate(`/admin/payouts/${newPayout.statement_id}`);
        } catch (err) {
            setError(typeof err === 'string' ? err : 'No payable commissions found for this partner in the selected period.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link to="/admin/payouts" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="page-title" style={{ margin: 0 }}>Generate Payout Statement</h1>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/admin/payouts" className="premium-btn premium-btn-secondary" style={{ textDecoration: 'none' }}>
                        Cancel
                    </Link>
                    <button className="premium-btn" onClick={handleSubmit} disabled={loading || !formData.partner_id || !formData.period_start || !formData.period_end}>
                        <Save size={16} /> {loading ? 'Generating...' : 'Generate Statement'}
                    </button>
                </div>
            </div>

            <div style={{ padding: '16px', background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-sm)', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Info size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>How it works:</div>
                    Only PAYABLE commissions within this period will be included. Commissions already included in another statement are excluded.
                </div>
            </div>

            {error && (
                <div className="animate-fade-in" style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '16px', borderRadius: '8px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <AlertTriangle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="card" style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
                <div className="input-group" style={{ position: 'relative' }} ref={dropdownRef}>
                    <label className="input-label">Partner *</label>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            className="premium-input"
                            placeholder="Search by company name..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (formData.partner_id) setFormData(prev => ({ ...prev, partner_id: '' }));
                            }}
                            onFocus={() => searchQuery.trim().length >= 2 && setShowDropdown(true)}
                            style={{ paddingLeft: '40px', paddingRight: formData.partner_id ? '40px' : '16px', borderColor: formData.partner_id ? 'var(--accent-green)' : 'var(--border-color)' }}
                        />
                        {formData.partner_id && (
                            <div style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center' }}>
                                <Check size={18} />
                            </div>
                        )}
                        {isSearching && (
                            <div style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--text-muted)' }}>
                                <div className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            </div>
                        )}
                    </div>

                    {showDropdown && searchResults.length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginTop: '4px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', zIndex: 10, maxHeight: '250px', overflowY: 'auto' }}>
                            {searchResults.map(p => (
                                <div
                                    key={p.partner_id}
                                    style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '4px' }}
                                    onClick={() => handleSelectPartner(p)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{ fontWeight: 600 }}>{p.kyc?.company_name || 'Unknown Company'}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{p.kyc?.email}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {showDropdown && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '16px', textAlign: 'center', color: 'var(--text-muted)', zIndex: 10 }}>
                            No active partners found.
                        </div>
                    )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="input-group">
                        <label className="input-label">Period Start *</label>
                        <input
                            type="date"
                            className="premium-input"
                            value={formData.period_start}
                            onChange={e => handleChange('period_start', e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Period End *</label>
                        <input
                            type="date"
                            className="premium-input"
                            value={formData.period_end}
                            onChange={e => handleChange('period_end', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneratePayout;
