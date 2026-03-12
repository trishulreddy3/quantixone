export const getHoldCountdown = (hold_until) => {
    const msRemaining = new Date(hold_until).getTime() - Date.now();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining > 7) {
        return { text: `Releases in ${daysRemaining} days`, color: 'var(--text-muted)' };
    } else if (daysRemaining >= 2) {
        return { text: `Releases in ${daysRemaining} days`, color: '#ca8a04', icon: true };
    } else if (daysRemaining === 1) {
        return { text: `Releases tomorrow`, color: '#ea580c' };
    } else if (daysRemaining === 0) {
        return { text: `Releases today`, color: '#ea580c', pulse: true };
    } else {
        return { text: `Ready to release`, color: 'var(--primary)' };
    }
};

export const STATUS_LABELS = {
    pending_review: "Pending Review",
    approved: "Approved",
    contract_sent: "Contract Sent",
    active: "Active",
    suspended: "Suspended",
    terminated: "Terminated",
    draft: "Draft",
    partner_signed: "Partner Signed",
    pending: "Pending",
    payable: "Payable",
    paid: "Paid",
    clawed_back: "Clawed Back",
    finalized: "Finalized",
    disbursed: "Disbursed",
    inactive: "Inactive",
    expired: "Expired",
};

export const getBadgeType = (status) => {
    const s = status?.toLowerCase() || '';
    if (['active', 'paid', 'disbursed'].includes(s)) return 'green';
    if (['payable', 'approved', 'contract_sent', 'finalized'].includes(s)) return 'blue';
    if (['pending_review', 'partner_signed', 'pending'].includes(s)) return 'yellow';
    if (['suspended'].includes(s)) return 'orange';
    if (['terminated', 'clawed_back', 'expired'].includes(s)) return 'red';
    return 'gray'; // draft, inactive
};

export const maskAadhar = (aadhar) => {
    if (!aadhar) return '';
    const str = aadhar.toString().replace(/\D/g, ''); // Ensure only digits
    if (str.length < 4) return str;
    const last4 = str.slice(-4);
    return `XXXX XXXX ${last4}`;
};

export const maskAccount = (account) => {
    if (!account) return '';
    const str = account.toString();
    if (str.length <= 4) return str; // Unlikely, but fallback
    const last4 = str.slice(-4);
    // Determine number of Xs based on standard presentation (not actual length, or just use 8 Xs)
    return `XXXX XXXX ${last4}`;
};
