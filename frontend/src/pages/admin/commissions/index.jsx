import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../../store/adminStore';
import { Search, CheckCircle, Clock, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHoldCountdown, getBadgeType, STATUS_LABELS } from '../../../utils';
import api from '../../../api';

const AdminCommissionList = () => {
    const navigate = useNavigate();
    const { commissionsData, commissionsLoading, fetchCommissions, releasePayable } = useAdminStore();
    const [partnerFilter, setPartnerFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [eventFilter, setEventFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [showReleaseModal, setShowReleaseModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const limit = 20;

    // Add Commission form state
    const [addForm, setAddForm] = useState({
        partner_id: '',
        referred_org_id: '',
        event_type: 'new_subscription',
        plan_amount: '',
        commission_rate: '',
        hold_days: 30
    });
    const [addError, setAddError] = useState('');
    const [partnerSearch, setPartnerSearch] = useState('');
    const [partnerResults, setPartnerResults] = useState([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCommissions({ skip: (page - 1) * limit, limit, status: statusFilter, event_type: eventFilter, partner_id: partnerFilter });
        }, 300);
        return () => clearTimeout(timer);
    }, [partnerFilter, statusFilter, eventFilter, page, fetchCommissions]);

    // Partner search for add modal
    useEffect(() => {
        if (partnerSearch.trim().length < 2) { setPartnerResults([]); return; }
        const t = setTimeout(async () => {
            try {
                const res = await api.get(`/partners?search=${encodeURIComponent(partnerSearch)}&limit=8`);
                setPartnerResults(res.data.partners || []);
            } catch { setPartnerResults([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [partnerSearch]);

    const handleRelease = async () => {
        setIsProcessing(true);
        const count = await releasePayable();
        setIsProcessing(false);
        setShowReleaseModal(false);
        if (count !== false) {
            alert(`${count} commissions released to payable.`);
            fetchCommissions({ skip: (page - 1) * limit, limit, status: statusFilter, event_type: eventFilter, partner_id: partnerFilter });
        }
    };

    const handleAddCommission = async () => {
        setAddError('');
        const { partner_id, referred_org_id, event_type, plan_amount, commission_rate } = addForm;
        if (!partner_id || !referred_org_id || !plan_amount || !commission_rate) {
            setAddError('All fields are required.');
            return;
        }
        const grossComm = (Number(plan_amount) * Number(commission_rate)) / 100;
        const holdUntil = new Date();
        holdUntil.setDate(holdUntil.getDate() + Number(addForm.hold_days));

        setIsProcessing(true);
        try {
            await api.post('/commissions', {
                partner_id,
                referred_org_id: referred_org_id.toUpperCase(),
                event_type,
                plan_amount: Number(plan_amount),
                commission_rate: Number(commission_rate),
                gross_commission: grossComm,
                pass_through_amount: 0,
                net_commission: grossComm,
                tier_at_creation: 1,
                hold_until: holdUntil.toISOString()
            });
            setShowAddModal(false);
            setAddForm({ partner_id: '', referred_org_id: '', event_type: 'new_subscription', plan_amount: '', commission_rate: '', hold_days: 30 });
            setPartnerSearch('');
            alert('Commission added successfully! It will appear in the list.');
            fetchCommissions({ skip: 0, limit, status: 'All', event_type: 'All', partner_id: '' });
        } catch (err) {
            setAddError(err.response?.data?.error || 'Failed to add commission.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animate-fade-in relative">
            <div className="page-header" style={{ marginBottom: '20px' }}>
                <h1 className="page-title">Commissions</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="premium-btn premium-btn-secondary" onClick={() => setShowReleaseModal(true)}>
                        <CheckCircle size={16} /> Release Payable
                    </button>
                    <button className="premium-btn" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Add Commission
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '24px' }}>
                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <input
                            type="text"
                            className="premium-input"
                            placeholder="Filter by Partner ID..."
                            style={{ paddingLeft: '44px' }}
                            value={partnerFilter}
                            onChange={e => { setPartnerFilter(e.target.value); setPage(1); }}
                        />
                    </div>
                    <select className="premium-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                        <option value="All">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="payable">Payable</option>
                        <option value="paid">Paid</option>
                        <option value="clawed_back">Clawed Back</option>
                    </select>
                    <select className="premium-input" value={eventFilter} onChange={e => { setEventFilter(e.target.value); setPage(1); }}>
                        <option value="All">All Event Types</option>
                        <option value="new_subscription">New Sub</option>
                        <option value="renewal">Renewal</option>
                        <option value="upgrade">Upgrade</option>
                    </select>
                </div>

                {/* Responsive Table */}
                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto', minWidth: '900px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Commission ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Partner</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Org ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Event</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Net Commission</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Hold Until</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Created</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionsLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        {Array.from({ length: 9 }).map((__, j) => (
                                            <td key={j} style={{ padding: '14px 16px' }}><div className="skeleton skeleton-text" style={{ width: '80%' }} /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : commissionsData?.commissions?.length === 0 ? (
                                <tr>
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>No commissions found</div>
                                        Try adjusting your filters or add a commission manually.
                                    </td>
                                </tr>
                            ) : (
                                commissionsData?.commissions?.map(c => (
                                    <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                            {(c.commission_id || c._id || '').toString().slice(-10)}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-indigo)', fontWeight: 600, padding: 0, fontSize: '0.85rem' }}
                                                onClick={() => navigate(`/admin/partners/${c.partner_id}`)}
                                            >
                                                {(c.partner_id || '').toString().slice(-8)}...
                                            </button>
                                        </td>
                                        <td style={{ padding: '14px 16px', maxWidth: '160px' }}>
                                            <div style={{ fontSize: '0.85rem', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                                                {c.referred_org_id || '—'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                            {(c.event_type || '').replace(/_/g, ' ')}
                                        </td>
                                        <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                                            ₹{(c.net_commission || 0).toLocaleString('en-IN')}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span className={`status-badge badge-${getBadgeType(c.status)}`}>
                                                {STATUS_LABELS[c.status] || c.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                            {c.status === 'pending' ? (() => {
                                                const hold = getHoldCountdown(c.hold_until);
                                                return (
                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: hold.color, fontWeight: 600 }}>
                                                        {hold.icon && <Clock size={14} color={hold.color} />}
                                                        {hold.text}
                                                    </div>
                                                );
                                            })() : (c.hold_until ? new Date(c.hold_until).toLocaleDateString() : '—')}
                                        </td>
                                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <button
                                                className="premium-btn premium-btn-secondary"
                                                style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                                                onClick={() => navigate(`/admin/commissions/${c._id}`)}
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Showing {commissionsData?.commissions?.length ? ((page - 1) * limit) + 1 : 0}–{Math.min(page * limit, commissionsData?.total || 0)} of {commissionsData?.total || 0}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="premium-btn premium-btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                        <button className="premium-btn premium-btn-secondary" disabled={!commissionsData?.commissions || commissionsData.commissions.length < limit} onClick={() => setPage(p => p + 1)}>Next</button>
                    </div>
                </div>
            </div>

            {/* Release Payable Modal */}
            {showReleaseModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '420px', width: '100%' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '12px' }}>Release Payable Commissions?</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>All pending commissions past their hold date will be moved to Payable.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowReleaseModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn" onClick={handleRelease} disabled={isProcessing} style={{ background: 'var(--accent-green)' }}>
                                {isProcessing ? 'Releasing...' : 'Confirm Release'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Commission Modal */}
            {showAddModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div className="card animate-fade-in" style={{ padding: '32px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>Add Commission Manually</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        {addError && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.9rem' }}>
                                {addError}
                            </div>
                        )}

                        {/* Partner selector */}
                        <div className="input-group">
                            <label className="input-label">Partner *</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    className="premium-input"
                                    placeholder="Search by company name..."
                                    value={partnerSearch}
                                    onChange={e => { setPartnerSearch(e.target.value); setAddForm(f => ({ ...f, partner_id: '' })); }}
                                    style={{ borderColor: addForm.partner_id ? 'var(--accent-green)' : 'var(--border-color)' }}
                                />
                                {partnerResults.length > 0 && !addForm.partner_id && (
                                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', zIndex: 20, maxHeight: '180px', overflowY: 'auto', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                                        {partnerResults.map(p => (
                                            <div key={p._id}
                                                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                onClick={() => {
                                                    setAddForm(f => ({ ...f, partner_id: p._id }));
                                                    setPartnerSearch(p.kyc?.company_name || p._id);
                                                    setPartnerResults([]);
                                                }}
                                            >
                                                <div style={{ fontWeight: 600 }}>{p.kyc?.company_name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.kyc?.email}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {addForm.partner_id && <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', marginTop: '4px' }}>✓ Partner selected: {addForm.partner_id}</div>}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Referred Org ID * <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(e.g. ORG-12345 or org_abc)</span></label>
                            <input type="text" className="premium-input" value={addForm.referred_org_id} onChange={e => setAddForm(f => ({ ...f, referred_org_id: e.target.value }))} placeholder="ORG-XYZ or org_customer_abc" />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Event Type *</label>
                            <select className="premium-input" value={addForm.event_type} onChange={e => setAddForm(f => ({ ...f, event_type: e.target.value }))}>
                                <option value="new_subscription">New Subscription</option>
                                <option value="renewal">Renewal</option>
                                <option value="upgrade">Upgrade</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="input-group">
                                <label className="input-label">Plan Amount (₹) *</label>
                                <input type="number" className="premium-input" value={addForm.plan_amount} onChange={e => setAddForm(f => ({ ...f, plan_amount: e.target.value }))} placeholder="e.g. 10000" min="0" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Commission Rate (%) *</label>
                                <input type="number" className="premium-input" value={addForm.commission_rate} onChange={e => setAddForm(f => ({ ...f, commission_rate: e.target.value }))} placeholder="e.g. 15" min="0" max="100" step="0.01" />
                            </div>
                        </div>

                        {addForm.plan_amount && addForm.commission_rate && (
                            <div style={{ padding: '12px 16px', background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Calculated Commission</span>
                                <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>
                                    ₹{((Number(addForm.plan_amount) * Number(addForm.commission_rate)) / 100).toLocaleString('en-IN')}
                                </span>
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Hold Period (days)</label>
                            <input type="number" className="premium-input" value={addForm.hold_days} onChange={e => setAddForm(f => ({ ...f, hold_days: e.target.value }))} min="0" max="365" />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button className="premium-btn premium-btn-secondary" onClick={() => setShowAddModal(false)} disabled={isProcessing}>Cancel</button>
                            <button className="premium-btn" onClick={handleAddCommission} disabled={isProcessing}>
                                {isProcessing ? 'Adding...' : 'Add Commission'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCommissionList;
