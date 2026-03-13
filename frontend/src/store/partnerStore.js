import { create } from 'zustand';
import api from '../api';

export const usePartnerStore = create((set, get) => ({
    getAuthPartnerId: async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) return user.id;

        // If not found, kick to login via interceptor or throw
        return null;
    },

    // --- Global Badges ---
    sidebarBadges: {
        payableCommissions: 0
    },
    fetchSidebarBadges: async () => {
        try {
            const pid = await get().getAuthPartnerId();
            // Usually auth token limits this, so no partner_id needed in strict APIs, but for our mock we supply it
            const res = await api.get(`/commissions?status=payable&limit=100&partner_id=${pid}`);
            set({ sidebarBadges: { payableCommissions: res.data.commissions ? res.data.commissions.length : 0 } });
        } catch (err) {
            console.error(err);
        }
    },

    // --- Dashboard Data ---
    dashboardData: null,
    dashboardLoading: false,

    fetchDashboardData: async () => {
        set({ dashboardLoading: true });
        const pid = await get().getAuthPartnerId();
        try {
            const [payableRes, selfPartnerRes, recentCommissionsRes] = await Promise.all([
                api.get(`/commissions?status=payable&limit=100&partner_id=${pid}`),
                api.get(`/partners/${pid}`).catch(() => ({ data: {} })),
                api.get(`/commissions?limit=5&partner_id=${pid}`)
            ]);

            const payableTotal = (payableRes.data.commissions || []).reduce((sum, c) => sum + c.net_commission, 0);
            // Partner API returns the partner object directly (not nested under .partner)
            const selfPartner = selfPartnerRes.data._id ? selfPartnerRes.data : {};

            set({
                dashboardData: {
                    payableCommissions: payableTotal,
                    selfPartner,
                    recentCommissions: recentCommissionsRes.data.commissions || []
                },
                dashboardLoading: false
            });
        } catch (err) {
            set({ dashboardLoading: false });
        }
    },

    // --- Referral Codes ---
    referralCodes: [],
    codesLoading: false,

    fetchReferralCodes: async () => {
        set({ codesLoading: true });
        const pid = await get().getAuthPartnerId();
        try {
            const res = await api.get(`/referral-codes/partners/${pid}`);
            set({ referralCodes: res.data.referral_codes || [], codesLoading: false });
        } catch (err) {
            set({ codesLoading: false });
        }
    },

    createReferralCode: async (payload) => {
        const pid = await get().getAuthPartnerId();
        try {
            const res = await api.post(`/referral-codes/partners/${pid}`, payload);
            await get().fetchReferralCodes();
            return res.data.code;
        } catch (err) {
            throw err.response?.data?.error || new Error('Failed to create code');
        }
    },

    activeCode: null,
    activeCodeLoading: false,

    fetchActiveReferralCode: async (codeId) => {
        set({ activeCodeLoading: true });
        try {
            const res = await api.get(`/referral-codes/${codeId}`);
            set({ activeCode: res.data.referral_code || res.data, activeCodeLoading: false });
        } catch (err) {
            set({ activeCodeLoading: false });
        }
    },

    updateReferralCode: async (codeId, payload) => {
        // Optimistic Update (Section 6)
        const previousActiveCode = get().activeCode;
        if (previousActiveCode && previousActiveCode.code === codeId) {
            set({ activeCode: { ...previousActiveCode, ...payload } });
        }

        try {
            await api.put(`/referral-codes/${codeId}`, payload);
            // Cache Invalidation (Section 6)
            await get().fetchActiveReferralCode(codeId);
            get().fetchReferralCodes();
            return true;
        } catch (err) {
            // Revert Optimistic Update
            if (previousActiveCode && previousActiveCode.code === codeId) {
                set({ activeCode: previousActiveCode });
            }
            return false;
        }
    },

    // --- Commissions ---
    commissionsData: { commissions: [], total: 0 },
    commissionsLoading: false,

    fetchCommissions: async ({ skip = 0, limit = 20, status = '' }) => {
        set({ commissionsLoading: true });
        const pid = await get().getAuthPartnerId();
        try {
            let url = `/commissions?skip=${skip}&limit=${limit}&partner_id=${pid}`;
            if (status && status !== 'All') url += `&status=${status}`;

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
            set({ commissionError: err.response?.data?.error || "This commission record could not be found." });
            console.error(err);
        }
    },

    // --- Payouts ---
    payoutsData: { payouts: [], total: 0 },
    payoutsLoading: false,

    fetchPayouts: async ({ skip = 0, limit = 20, status = '' }) => {
        set({ payoutsLoading: true });
        const pid = await get().getAuthPartnerId();
        try {
            let url = `/payouts?skip=${skip}&limit=${limit}&partner_id=${pid}`;
            if (status && status !== 'All') url += `&status=${status}`; // Added this line based on common pattern and instruction's intent
            const res = await api.get(url); // Added this line to fix syntax and complete the call
            set({ payoutsData: res.data, payoutsLoading: false });
        } catch (err) {
            set({ payoutsLoading: false });
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
            set({ payoutDetailLoading: false, payoutError: err.response?.data?.error || "This payout statement could not be found." });
        }
    }
}));
