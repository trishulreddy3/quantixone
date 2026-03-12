import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, SlidersHorizontal, Users, FileText, Coins, Wallet, MonitorOff, LogOut } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useAuthStore } from '../store/authStore';

const AdminLayout = () => {
    const navigate = useNavigate();
    const { logout } = useAuthStore();
    const { sidebarBadges, fetchSidebarBadges } = useAdminStore();

    const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 1024);

    React.useEffect(() => {
        fetchSidebarBadges();
    }, [fetchSidebarBadges]);

    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isDesktop) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-main)', textAlign: 'center', padding: '24px' }}>
                <MonitorOff size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Admin Portal Requires Desktop</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Please use a desktop browser (minimum width 1024px) to access this dashboard.</p>
            </div>
        );
    }

    const sidebarLinks = [
        { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
        { label: 'Slab Config', path: '/admin/slab-config', icon: <SlidersHorizontal size={20} /> },
        { label: 'Partners', path: '/admin/partners', icon: <Users size={20} />, badge: sidebarBadges.pendingPartners > 0 ? sidebarBadges.pendingPartners : null },
        { label: 'Contracts', path: '/admin/contracts', icon: <FileText size={20} />, badge: sidebarBadges.awaitingContracts > 0 ? sidebarBadges.awaitingContracts : null },
        { label: 'Commissions', path: '/admin/commissions', icon: <Coins size={20} /> },
        { label: 'Payouts', path: '/admin/payouts', icon: <Wallet size={20} />, badge: sidebarBadges.draftPayouts > 0 ? sidebarBadges.draftPayouts : null },
    ];

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div style={{ width: 28, height: 28, background: 'var(--primary)', borderRadius: '6px' }}></div>
                    Quantixone
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

export default AdminLayout;
