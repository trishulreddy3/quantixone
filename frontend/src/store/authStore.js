import { create } from 'zustand';
import api from '../api';

export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null, // 'admin' or 'partner'
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,

    login: async (companyName, email, password) => {
        set({ loading: true });
        try {
            const res = await api.post('/auth/login', { companyName, email, password });
            const { token, role, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('user', JSON.stringify(user));

            set({ token, role, user, isAuthenticated: true, loading: false });
            return role; // return role for routing
        } catch (err) {
            set({ loading: false });
            throw err.response?.data?.error || 'Login failed';
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('user');
        set({ token: null, role: null, user: null, isAuthenticated: false });
    }
}));
