import { create } from 'zustand';
import api from '../api';

export const useAdminStore = create((set, get) => ({
    // --- Dashboard Data ---
    dashboardData: null,
    dashboardLoading: false,
    dashboardError: null,

    fetchDashboardData: async () => {
        set({ dashboardLoading: true, dashboardError: null });
        try {
            const [totalRes, activeRes, commissionsRes, payoutsRes, recentPartnersRes, contractsRes] = await Promise.all([
                api.get('/partners?limit=1'),
                api.get('/partners?status=active&limit=1'),
                api.get('/commissions?status=payable&limit=100'),
                api.get('/payouts?limit=1'), // In real API, we need a way to filter or just count drafts
                api.get('/partners?limit=5'),
                api.get('/contracts?limit=20')
            ]);

            const payableTotal = commissionsRes.data.commissions.reduce((sum, c) => sum + c.net_commission, 0);
            const pendingContracts = contractsRes.data.contracts.filter(c => c.status === 'partner_signed');

            set({
                dashboardData: {
                    totalPartners: totalRes.data.total || 0,
                    activePartners: activeRes.data.total || 0,
                    payableCommissions: payableTotal,
                    draftPayouts: payoutsRes.data.total || 0, // Mocked draft count fallback
                    recentPartners: recentPartnersRes.data.partners || [],
                    pendingContracts: pendingContracts
                },
                dashboardLoading: false
            });
        } catch (err) {
            set({ dashboardError: err.message, dashboardLoading: false });
        }
    },

    // --- Sidebar Badges ---
    sidebarBadges: {
        pendingPartners: 0,
        awaitingContracts: 0,
        draftPayouts: 0
    },
    fetchSidebarBadges: async () => {
        try {
            const [partners, contracts, payouts] = await Promise.all([
                api.get('/partners?status=pending_review&limit=1'),
                api.get('/contracts?limit=100'), // Filtering client side due to hypothetical API limits
                api.get('/payouts?limit=100')
            ]);

            const awaitingContracts = contracts.data.contracts.filter(c => c.status === 'partner_signed').length;
            const draftPayouts = payouts.data.payouts.filter(p => p.status === 'draft').length;

            set({
                sidebarBadges: {
                    pendingPartners: partners.data.total || 0,
                    awaitingContracts: awaitingContracts,
                    draftPayouts: draftPayouts
                }
            });
        } catch (err) {
            console.error("Failed to fetch sidebar badges", err);
        }
    },

    // --- Slab Config ---
    slabConfig: null,
    slabLoading: false,
    slabSaving: false,
    slabError: null,

    fetchSlabConfig: async () => {
        set({ slabLoading: true, slabError: null });
        try {
            const res = await api.get('/slab-config');
            // Backend returns { config } wrapper
            const data = res.data.config || res.data;
            set({ slabConfig: data, slabLoading: false });
        } catch (err) {
            set({ slabError: err.response?.data?.error || err.message, slabLoading: false });
        }
    },

    updateSlabConfig: async (tiersData) => {
        set({ slabSaving: true });
        try {
            await api.put('/slab-config', { tiers: tiersData, updated_by: 'admin' });
            await get().fetchSlabConfig();
            set({ slabSaving: false });
            return true;
        } catch (err) {
            set({ slabSaving: false, slabError: err.response?.data?.error || err.message });
            return false;
        }
    },

    resetSlabConfig: async () => {
        set({ slabSaving: true });
        try {
            const res = await api.post('/slab-config/reset');
            const data = res.data.config || res.data;
            set({ slabConfig: data, slabSaving: false });
            return true;
        } catch (err) {
            set({ slabSaving: false, slabError: err.response?.data?.error || err.message });
            return false;
        }
    },

    // --- Partner List ---
    partnersData: { partners: [], total: 0 },
    partnersLoading: false,
    partnersError: null,

    fetchPartners: async ({ skip = 0, limit = 20, status = '', search = '' }) => {
        set({ partnersLoading: true, partnersError: null });
        try {
            let url = `/partners?skip=${skip}&limit=${limit}`;
            if (status && status !== 'All') url += `&status=${status}`;
            if (search) url += `&search=${search}`;

            const res = await api.get(url);
            set({ partnersData: res.data, partnersLoading: false });
        } catch (err) {
            set({ partnersError: err.message, partnersLoading: false });
        }
    },

    // --- Partner Detail & Manage ---
    activePartner: null,
    partnerLoading: false,
    partnerError: null,
    partnerContracts: [],

    fetchPartnerDetail: async (partnerId) => {
        set({ partnerLoading: true, partnerError: null });
        try {
            const [partnerRes, contractsRes] = await Promise.all([
                api.get(`/partners/${partnerId}`),
                api.get(`/contracts?partner_id=${partnerId}`)
            ]);
            set({
                activePartner: partnerRes.data,
                partnerContracts: contractsRes.data.contracts || [],
                partnerLoading: false
            });
        } catch (err) {
            set({ partnerError: err.message || 'Partner not found', partnerLoading: false });
        }
    },

    updatePartnerStatus: async (partnerId, newStatus) => {
        // Optimistic Update (Section 6)
        const previousPartner = get().activePartner;
        if (previousPartner && previousPartner._id === partnerId) {
            set({ activePartner: { ...previousPartner, status: newStatus } });
        }

        try {
            await api.patch(`/partners/${partnerId}/status`, { status: newStatus });
            // Cache Invalidation (Section 6)
            await get().fetchPartnerDetail(partnerId);
            get().fetchPartners({ skip: 0, limit: 20 });
            return true;
        } catch (err) {
            console.error("Failed to update status", err);
            // Revert Optimistic Update
            if (previousPartner && previousPartner._id === partnerId) {
                set({ activePartner: previousPartner });
            }
            return false;
        }
    },

    onboardPartner: async (partnerData) => {
        try {
            const res = await api.post('/partners', partnerData);
            // Cache Invalidation
            get().fetchPartners({ skip: 0, limit: 20 });
            return res.data;
        } catch (err) {
            throw err.response?.data?.errors || new Error("Failed to onboard partner");
        }
    },

    updatePartner: async (partnerId, updateData) => {
        try {
            await api.put(`/partners/${partnerId}`, updateData);
            // Cache Invalidation
            await get().fetchPartnerDetail(partnerId);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },

    updatePartnerPassword: async (partnerId, newPassword) => {
        try {
            await api.patch(`/partners/${partnerId}/password`, { password: newPassword });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    },

    deletePartner: async (partnerId) => {
        try {
            await api.delete(`/partners/${partnerId}`);
            // Cache Invalidation
            get().fetchPartners({ skip: 0, limit: 20 });
            return true;
        } catch (err) {
            console.error("Failed to delete partner", err);
            return false;
        }
    },

    createContract: async (partnerId) => {
        try {
            await api.post('/contracts', { partner_id: partnerId });
            await get().fetchPartnerDetail(partnerId); // Refresh
            return true;
        } catch (err) {
            return false;
        }
    },

    // --- Contract Detail ---
    activeContract: null,
    contractLoading: false,
    contractError: null,

    fetchContractDetail: async (contractId) => {
        set({ contractLoading: true, contractError: null });
        try {
            const res = await api.get(`/contracts/${contractId}`);
            set({ activeContract: res.data.contract, contractLoading: false });
        } catch (err) {
            set({ contractLoading: false, contractError: err.response?.data?.error || "Contract not found" });
        }
    },

    getUploadUrl: async (contractId, party, filename) => {
        const res = await api.get(`/contracts/${contractId}/upload-url?party=${party}&filename=${filename}`);
        return res.data.upload_url;
    },

    adminCountersign: async (contractId, s3_key) => {
        try {
            await api.post(`/contracts/${contractId}/admin-countersign`, { s3_key, signed_by: 'admin123' });
            await get().fetchContractDetail(contractId);
            // Cache Invalidation
            const activeContract = get().activeContract;
            if (activeContract) {
                const pid = typeof activeContract.partner_id === 'object'
                    ? activeContract.partner_id?._id
                    : activeContract.partner_id;
                if (pid) get().fetchPartnerDetail(pid);
            }
            return true;
        } catch (err) {
            return false;
        }
    },

    terminateContract: async (contractId) => {
        try {
            await api.post(`/contracts/${contractId}/terminate`);
            await get().fetchContractDetail(contractId);
            return true;
        } catch (err) {
            return false;
        }
    },

    // --- Global Contracts ---
    contractsData: { contracts: [], total: 0 },
    contractsLoading: false,
    fetchContracts: async ({ skip = 0, limit = 20 }) => {
        set({ contractsLoading: true });
        try {
            const res = await api.get(`/contracts?skip=${skip}&limit=${limit}`);
            set({ contractsData: res.data, contractsLoading: false });
        } catch (err) {
            set({ contractsLoading: false });
        }
    },

    // --- Commissions ---
    commissionsData: { commissions: [], total: 0 },
    commissionsLoading: false,
    fetchCommissions: async ({ skip = 0, limit = 20, status = '', partner_id = '', event_type = '' }) => {
        set({ commissionsLoading: true });
        try {
            let url = `/commissions?skip=${skip}&limit=${limit}`;
            if (status && status !== 'All') url += `&status=${status}`;
            if (partner_id) url += `&partner_id=${partner_id}`;
            if (event_type && event_type !== 'All') url += `&event_type=${event_type}`;
            const res = await api.get(url);
            set({ commissionsData: res.data, commissionsLoading: false });
        } catch (err) {
            set({ commissionsLoading: false });
        }
    },

    activeCommission: null,
    commissionError: null,
    fetchCommissionDetail: async (commissionId) => {
        set({ commissionError: null });
        try {
            const res = await api.get(`/commissions/${commissionId}`);
            set({ activeCommission: res.data.commission || res.data });
        } catch (err) {
            set({ commissionError: err.response?.data?.error || "Commission not found" });
            console.error(err);
        }
    },

    releasePayable: async () => {
        try {
            const res = await api.post('/commissions/release-payable');
            get().fetchCommissions({ skip: 0, limit: 20 });
            return res.data.released_count;
        } catch (err) {
            return false;
        }
    },

    // --- Payouts ---
    payoutsData: { payouts: [], total: 0 },
    payoutsLoading: false,

    fetchPayouts: async ({ skip = 0, limit = 20, partner_id = '', status = '' }) => {
        set({ payoutsLoading: true });
        try {
            let url = `/payouts?skip=${skip}&limit=${limit}`;
            if (partner_id) url += `&partner_id=${partner_id}`;
            if (status && status !== 'All') url += `&status=${status}`;
            const res = await api.get(url);
            set({ payoutsData: res.data, payoutsLoading: false });
        } catch (err) {
            set({ payoutsLoading: false });
        }
    },

    generatePayout: async (data) => {
        try {
            const res = await api.post('/payouts', data);
            // Cache Invalidation
            get().fetchPayouts({ skip: 0, limit: 20 });
            return res.data.payout;
        } catch (err) {
            throw err.response?.data?.error || new Error('Failed to generate payout');
        }
    },

    activePayout: null,
    activePayoutCommissions: [],
    payoutDetailLoading: false,
    payoutError: null,

    fetchPayoutDetail: async (statementId) => {
        set({ payoutDetailLoading: true, payoutError: null });
        try {
            const res = await api.get(`/payouts/${statementId}`);
            const payout = res.data.payout || res.data;
            let includedCommissions = [];
            if (payout.commission_ids && payout.commission_ids.length > 0) {
                const bulkPromises = payout.commission_ids.map(id => api.get(`/commissions/${id}`));
                const resolved = await Promise.allSettled(bulkPromises);
                includedCommissions = resolved
                    .filter(r => r.status === 'fulfilled')
                    .map(r => r.value.data.commission || r.value.data);
            }
            set({ activePayout: payout, activePayoutCommissions: includedCommissions, payoutDetailLoading: false });
        } catch (err) {
            set({ payoutDetailLoading: false, payoutError: err.response?.data?.error || "Payout statement not found" });
        }
    },

    finalizePayout: async (statementId) => {
        const previousPayout = get().activePayout;
        if (previousPayout) {
            set({ activePayout: { ...previousPayout, status: 'finalized' } });
        }

        try {
            const payoutId = previousPayout?._id || statementId;
            await api.post(`/payouts/${payoutId}/finalize`);
            await get().fetchPayoutDetail(statementId);
            get().fetchPayouts({ skip: 0, limit: 20 });
            return true;
        } catch (err) {
            if (previousPayout) set({ activePayout: previousPayout });
            return false;
        }
    },

    disbursePayout: async (statementId, disburseData) => {
        try {
            const activePayout = get().activePayout;
            const payoutId = activePayout?._id || statementId;
            await api.post(`/payouts/${payoutId}/disburse`, disburseData);
            await get().fetchPayoutDetail(statementId);
            get().fetchPayouts({ skip: 0, limit: 20 });
            if (activePayout) {
                const partnerId = typeof activePayout.partner_id === 'object' ? activePayout.partner_id._id : activePayout.partner_id;
                if (partnerId) get().fetchPartnerDetail(partnerId);
            }
            return true;
        } catch (err) {
            return false;
        }
    }
}));
