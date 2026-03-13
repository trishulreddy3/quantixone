import axios from 'axios';
import { useToastStore } from './store/toastStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        // Clear network error if present (could happen elsewhere, but good to reset state)
        document.dispatchEvent(new Event('network-online'));
        return response;
    },
    (error) => {
        const addToast = useToastStore.getState().addToast;

        if (!error.response) {
            // Network Error
            document.dispatchEvent(new Event('network-offline'));
            addToast('Unable to connect. Check your internet connection and try again.', 'error');
            return Promise.reject(error);
        }

        const status = error.response.status;
        const errData = error.response.data;
        const errMsg = typeof errData === 'string' ? errData : (errData.error || errData.message || JSON.stringify(errData));

        if (status === 401) {
            // Unauthenticated — only redirect once, not for every concurrent failing request
            if (!window.location.pathname.includes('/login')) {
                // Debounce: only clear + redirect if not already redirecting
                if (!window._authLogoutInProgress) {
                    window._authLogoutInProgress = true;
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('user');
                    addToast("Session expired. Please log in again.", 'error');
                    setTimeout(() => {
                        window._authLogoutInProgress = false;
                        window.location.href = '/login';
                    }, 1500);
                }
            }
        } else if (status === 400) {
            if (errMsg.includes('party must be')) {
                addToast("Invalid request. Please refresh and try again.", 'error');
            }
            // Other 400s (field-level) are usually handled by the component submitting it.
        } else if (status === 404) {
            if (errMsg.includes('Partner')) addToast("This partner could not be found. It may have been deleted.", 'error');
            else if (errMsg.includes('Contract')) addToast("This contract could not be found.", 'error');
            else if (errMsg.includes('Commission')) addToast("This commission record could not be found.", 'error');
            else if (errMsg.includes('Payout')) addToast("This payout statement could not be found.", 'error');
            else if (errMsg.includes('Referral')) addToast("This referral code could not be found.", 'error');
            else addToast("Resource not found.", 'error');
        } else if (status === 409) {
            if (errMsg.includes('Partner email already exists')) {
                // Return to component to show on email field
            } else if (errMsg.includes('Invalid status transition')) {
                addToast("This status change is not allowed at this stage.", 'error');
            } else if (errMsg.includes('approved status to create a contract')) {
                addToast("Please approve the partner before creating a contract.", 'warning');
            } else if (errMsg.includes('partner_signed status for admin countersign')) {
                addToast("Waiting for partner signature before you can countersign.", 'warning');
            } else if (errMsg.includes('No payable commissions found')) {
                addToast("No payable commissions exist for this partner in the selected period.", 'warning');
            } else if (errMsg.includes('draft status to finalize')) {
                addToast("This statement has already been finalized.", 'error');
            } else if (errMsg.includes('finalized status to disburse')) {
                addToast("Please finalize the statement before recording disbursement.", 'error');
            } else {
                addToast(errMsg, 'error');
            }
        } else if (status >= 500) {
            addToast("Something went wrong on our end. Please try again. If the issue persists, contact support.", 'error');
        }

        return Promise.reject(error);
    }
);

export default api;
