import React from 'react';
import { useToastStore } from '../store/toastStore';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContainer = () => {
    const { toasts, removeToast } = useToastStore();

    if (toasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        }}>
            {toasts.map((toast) => {
                let bgColor = '#fff';
                let icon = null;

                if (toast.type === 'success') {
                    bgColor = '#16a34a'; // green background
                    icon = <CheckCircle size={20} color="white" />;
                } else if (toast.type === 'error') {
                    bgColor = '#dc2626'; // red background
                    icon = <XCircle size={20} color="white" />;
                } else if (toast.type === 'warning') {
                    bgColor = '#ca8a04'; // yellow background
                    icon = <AlertTriangle size={20} color="white" />;
                } else if (toast.type === 'info') {
                    bgColor = '#2563eb'; // blue background
                    icon = <Info size={20} color="white" />;
                }

                return (
                    <div
                        key={toast.id}
                        className="animate-fade-in"
                        style={{
                            background: bgColor,
                            color: 'white',
                            padding: '16px 20px',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            minWidth: '300px',
                            maxWidth: '450px'
                        }}
                    >
                        <div style={{ flexShrink: 0 }}>{icon}</div>
                        <div style={{ flexGrow: 1, fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4 }}>
                            {toast.message}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255,255,255,0.8)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;
