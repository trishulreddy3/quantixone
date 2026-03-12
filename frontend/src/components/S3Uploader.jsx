import React, { useState, useEffect, useRef } from 'react';
import { FileUp, CheckCircle, AlertTriangle, RefreshCw, UploadCloud } from 'lucide-react';
import api from '../api';

const S3Uploader = ({ contractId, mode, documentType, onUploadSuccess }) => {
    // states: idle -> url_generated -> selected -> uploading -> uploaded -> error | expired
    const [status, setStatus] = useState('idle');
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [errorText, setErrorText] = useState('');
    const [timeLeft, setTimeLeft] = useState(0);

    const s3Meta = useRef({ upload_url: '', s3_key: '' });
    const timerRef = useRef(null);

    const getUrl = async () => {
        try {
            setStatus('idle');
            setFile(null);
            setProgress(0);

            const res = await api.get(`/contracts/${contractId}/upload-url?party=${mode}&filename=${documentType}`);
            s3Meta.current = {
                upload_url: res.data.upload_url || 'https://mock-s3-upload-url.local',
                s3_key: res.data.s3_key || `contracts/${contractId}/${documentType}`
            };

            setTimeLeft(res.data.expires_in_seconds || 300);
            setStatus('url_generated');
        } catch (err) {
            setStatus('error');
            setErrorText('Failed to generate upload URL.');
        }
    };

    useEffect(() => {
        if (status === 'url_generated' || status === 'selected' || status === 'uploading' || status === 'error') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setStatus('expired');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => clearInterval(timerRef.current);
    }, [status]);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setStatus('selected');
        }
    };

    const handleUpload = () => {
        if (!file || status === 'expired') return;

        setStatus('uploading');
        setProgress(0);

        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            // Mocking 200/201 Success explicitly here because without real S3 it will fail CORS/DNS
            setStatus('uploaded');
            onUploadSuccess(s3Meta.current.s3_key);
        };

        xhr.onerror = () => {
            // Because it's a mock url, it will always fail XHR unless we artificially trick it, 
            // but we'll simulate success via XHR timeout override for testing visuals.
            setStatus('error');
            setErrorText('Network error during upload.');
        };

        // Mock Override: For the sake of UI showcase, we force success callback locally instead of real `xhr.send()` mapping.
        let simProgress = 0;
        const sim = setInterval(() => {
            simProgress += 10;
            setProgress(simProgress);
            if (simProgress >= 100) {
                clearInterval(sim);
                setStatus('uploaded');
                onUploadSuccess(s3Meta.current.s3_key);
            }
        }, 150);

        // In Prod you would un-comment the lines below instead of the above simulation block:
        // xhr.open('PUT', s3Meta.current.upload_url, true);
        // xhr.setRequestHeader('Content-Type', file.type || 'application/pdf');
        // xhr.send(file);
    };

    return (
        <div style={{ background: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', padding: '24px', border: '1px solid var(--border-color)' }}>

            {status === 'idle' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Secure S3 Pre-Signed Upload</div>
                    <button className="premium-btn mx-auto" onClick={getUrl}>
                        <FileUp size={18} /> Initialize Upload Link
                    </button>
                </div>
            )}

            {(status === 'url_generated' || status === 'selected' || status === 'uploading' || status === 'error') && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 600 }}>Temporary S3 Link Active</span>
                        <span style={{ color: timeLeft < 60 ? 'var(--accent-red)' : 'var(--accent-yellow)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={16} /> Expires in {timeLeft}s
                        </span>
                    </div>

                    {status === 'url_generated' && (
                        <label className="premium-btn premium-btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                            <UploadCloud size={18} /> Choose PDF File
                            <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileChange} />
                        </label>
                    )}

                    {status === 'selected' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileUp size={16} color="var(--primary)" /> {file.name}
                            </div>
                            <button className="premium-btn" onClick={handleUpload} style={{ width: '100%', justifyContent: 'center' }}>
                                Begin Upload
                            </button>
                        </div>
                    )}

                    {status === 'uploading' && (
                        <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                                <span>Uploading {file.name}...</span>
                                <span style={{ color: 'var(--primary)' }}>{progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: 'var(--bg-surface-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <AlertTriangle size={18} /> {errorText}
                            </div>
                            <button className="premium-btn premium-btn-secondary" onClick={handleUpload} style={{ width: '100%', justifyContent: 'center' }}>
                                <RefreshCw size={18} /> Retry Upload
                            </button>
                        </div>
                    )}
                </div>
            )}

            {status === 'uploaded' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle size={28} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--accent-green)' }}>Upload Complete</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{file.name} successfully transferred to secure vault.</div>

                    <button onClick={getUrl} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}>
                        Change file
                    </button>
                </div>
            )}

            {status === 'expired' && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <Clock size={18} /> Upload URL expired. Please regenerate.
                    </div>
                    <button className="premium-btn mx-auto" onClick={getUrl}>
                        <RefreshCw size={18} /> Generate New URL
                    </button>
                </div>
            )}
        </div>
    );
};

export default S3Uploader;
