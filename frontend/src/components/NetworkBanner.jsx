import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const NetworkBanner = () => {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOffline = () => setIsOffline(true);
        const handleOnline = () => setIsOffline(false);

        document.addEventListener('network-offline', handleOffline);
        document.addEventListener('network-online', handleOnline);

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            document.removeEventListener('network-offline', handleOffline);
            document.removeEventListener('network-online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="animate-fade-in" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
            background: '#b91c1c', color: 'white', padding: '12px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
            <WifiOff size={20} />
            <span style={{ fontWeight: 600 }}>Connection lost. Retrying...</span>
            <button
                onClick={() => window.location.reload()}
                style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
                    padding: '4px 12px', borderRadius: '4px', cursor: 'pointer',
                    marginLeft: '16px', fontWeight: 500
                }}
            >
                Retry Now
            </button>
        </div>
    );
};

export default NetworkBanner;
