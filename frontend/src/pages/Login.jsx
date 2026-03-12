import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AlertTriangle, Building2, User, Mail, Lock, Sparkles, X } from 'lucide-react';

const Login = () => {
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const role = await login(companyName, email, password);
            if (role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/partner');
            }
        } catch (err) {
            setError(err);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#ffffff' }}>
            <div style={{ width: '100%', maxWidth: '440px', background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                {/* Header section mimicking the screenshot */}
                <div style={{ padding: '24px 32px', borderBottom: '1px solid #27272a', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: '#1c1c21' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 4px 0', color: '#ffffff' }}>Welcome Back</h2>
                            <p style={{ color: '#60a5fa', fontSize: '0.9rem', margin: 0 }}>Sign in to Quantixone Portal</p>
                        </div>
                    </div>
                    <button style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ padding: '32px' }}>
                    {error && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '8px', color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '24px', fontSize: '0.85rem' }}>
                            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#e4e4e7', fontWeight: 500 }}>Company Name <span style={{ color: '#60a5fa' }}>*</span></label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Building2 size={18} style={{ position: 'absolute', left: '16px', color: '#a1a1aa' }} />
                                <input
                                    type="text"
                                    required
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Your Company"
                                    style={{ width: '100%', padding: '14px 16px 14px 44px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#ffffff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#3f3f46'}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#e4e4e7', fontWeight: 500 }}>Email Address <span style={{ color: '#60a5fa' }}>*</span></label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '16px', color: '#a1a1aa' }} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@gmail.com"
                                    style={{ width: '100%', padding: '14px 16px 14px 44px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#ffffff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#3f3f46'}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.9rem', color: '#e4e4e7', fontWeight: 500 }}>Password <span style={{ color: '#60a5fa' }}>*</span></label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '16px', color: '#a1a1aa' }} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '14px 16px 14px 44px', background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', color: '#ffffff', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#3f3f46'}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                marginTop: '8px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.2s',
                                opacity: loading ? 0.7 : 1
                            }}
                            onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#2563eb')}
                            onMouseOut={(e) => !loading && (e.currentTarget.style.background = '#3b82f6')}
                        >
                            <Sparkles size={18} />
                            {loading ? 'Please wait...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
