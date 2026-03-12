import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageErrorCard = ({ message, onRetry, backLink, backText = "Go Back" }) => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="card animate-fade-in" style={{ padding: '48px', maxWidth: '500px', width: '100%', textAlign: 'center', borderTop: '4px solid #ef4444' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '50%', color: '#ef4444' }}>
                        <AlertTriangle size={48} />
                    </div>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    Oops! Something went wrong
                </h2>

                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '32px' }}>
                    {message || "We couldn't load the information you requested. Please try again or navigate back."}
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    <button
                        className="premium-btn premium-btn-secondary"
                        onClick={() => backLink ? navigate(backLink) : navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <ArrowLeft size={18} /> {backText}
                    </button>

                    {onRetry && (
                        <button
                            className="premium-btn"
                            onClick={onRetry}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <RefreshCw size={18} /> Retry
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageErrorCard;
