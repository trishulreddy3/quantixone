import { create } from 'zustand';

export const useToastStore = create((set) => ({
    toasts: [],
    addToast: (message, type = 'info', duration) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const defaultDuration = { success: 3000, error: 5000, warning: 4000, info: 3000 };
        const autoDismiss = type !== 'warning'; // warning is persistent until close, wait no, spec says warning = 4s. "persistent with close button for critical" - maybe critical is error? "warning = 4s (persistent with close button for critical)". I'll read it as "warning is 4s, but if we pass 'critical' we don't auto dismiss, or error is persistent". Actually let's assume if duration=0 it's persistent.

        const finalDuration = duration !== undefined ? duration : defaultDuration[type] || 3000;

        set((state) => ({
            toasts: [...state.toasts, { id, message, type, duration: finalDuration }]
        }));

        if (finalDuration > 0) {
            setTimeout(() => {
                set((state) => ({
                    toasts: state.toasts.filter((t) => t.id !== id)
                }));
            }, finalDuration);
        }
    },
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        })),
}));
