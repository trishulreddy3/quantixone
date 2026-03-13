import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import PartnerLayout from './layouts/PartnerLayout';
import ToastContainer from './components/ToastContainer';
import NetworkBanner from './components/NetworkBanner';
import { useAuthStore } from './store/authStore';

import Login from './pages/Login';

import AdminDashboard from './pages/admin/dashboard';
import PartnerList from './pages/admin/partners';
import SlabConfig from './pages/admin/slab-config';
import OnboardPartner from './pages/admin/partners/new';
import PartnerDetail from './pages/admin/partners/[partnerId]';
import EditPartner from './pages/admin/partners/edit';
import ContractDetail from './pages/admin/contracts/[contractId]';
import ContractList from './pages/admin/contracts';
import AdminCommissionList from './pages/admin/commissions';
import AdminCommissionDetail from './pages/admin/commissions/[commissionId]';
import AdminPayoutList from './pages/admin/payouts';
import AdminPayoutDetail from './pages/admin/payouts/[statementId]';
import GeneratePayout from './pages/admin/payouts/new';


import PartnerDashboard from './pages/partner/dashboard';
import ReferralCodeList from './pages/partner/referral-codes';
import CreateReferralCode from './pages/partner/referral-codes/new';
import EditReferralCode from './pages/partner/referral-codes/[codeId]';
import PartnerCommissionList from './pages/partner/commissions';
import PartnerCommissionDetail from './pages/partner/commissions/[commissionId]';
import PartnerPayoutList from './pages/partner/payouts';
import PartnerPayoutDetail from './pages/partner/payouts/[statementId]';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, role } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  return (
    <>
      <NetworkBanner />
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="partners" element={<PartnerList />} />
            <Route path="partners/new" element={<OnboardPartner />} />
            <Route path="partners/:partnerId" element={<PartnerDetail />} />
            <Route path="partners/:partnerId/edit" element={<EditPartner />} />
            <Route path="partners/:partnerId/contracts/:contractId" element={<ContractDetail />} />
            <Route path="contracts" element={<ContractList />} />
            <Route path="contracts/:contractId" element={<ContractDetail />} />
            <Route path="commissions" element={<AdminCommissionList />} />
            <Route path="commissions/:commissionId" element={<AdminCommissionDetail />} />
            <Route path="payouts" element={<AdminPayoutList />} />
            <Route path="payouts/new" element={<GeneratePayout />} />
            <Route path="payouts/:statementId" element={<AdminPayoutDetail />} />
            <Route path="slab-config" element={<SlabConfig />} />
          </Route>

          {/* Partner Routes */}
          <Route path="/partner" element={<ProtectedRoute requiredRole="partner"><PartnerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<PartnerDashboard />} />
            <Route path="referral-codes" element={<ReferralCodeList />} />
            <Route path="referral-codes/new" element={<CreateReferralCode />} />
            <Route path="referral-codes/:codeId" element={<EditReferralCode />} />
            <Route path="commissions" element={<PartnerCommissionList />} />
            <Route path="commissions/:commissionId" element={<PartnerCommissionDetail />} />
            <Route path="payouts" element={<PartnerPayoutList />} />
            <Route path="payouts/:statementId" element={<PartnerPayoutDetail />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
