import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Tag, Coins, Wallet, LogOut } from 'lucide-react';
import { usePartnerStore } from '../store/partnerStore';
import { useAuthStore } from '../store/authStore';

const PartnerLayout = () => {
    const navigate = useNavigate();
    const { logout, user } = useAuthStore();
    const { sidebarBadges, fetchSidebarBadges } = usePartnerStore();

    React.useEffect(() => {
        fetchSidebarBadges();
    }, [fetchSidebarBadges]);

    const sidebarLinks = [
        { label: 'Dashboard', path: '/partner/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Referral Codes', path: '/partner/referral-codes', icon: <Tag size={20} /> },
        { label: 'Commissions', path: '/partner/commissions', icon: <Coins size={20} />, badge: sidebarBadges.payableCommissions > 0 ? sidebarBadges.payableCommissions : null },
        { label: 'Payouts', path: '/partner/payouts', icon: <Wallet size={20} /> },
    ];

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div style={{ width: 28, height: 28, background: 'var(--primary)', borderRadius: '6px' }}></div>
                    Quantixone Partner
                </div>
                <div style={{ padding: '0 24px', marginBottom: '24px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Partner Account'}</div>
                        <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.85rem', marginTop: '4px' }}>{user?.email || ''}</div>
                    </div>
                </div>
                <nav className="sidebar-nav">
                    {sidebarLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="nav-icon">
                                {link.icon}
                                {link.label}
                            </div>
                            {link.badge && (
                                <span className="status-badge badge-blue">
                                    {link.badge}
                                </span>
                            )}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', padding: '24px' }}>
                    <button onClick={() => { logout(); navigate('/login'); }} className="nav-item" style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <div className="nav-icon">
                            <LogOut size={20} />
                            Log Out
                        </div>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default PartnerLayout;
