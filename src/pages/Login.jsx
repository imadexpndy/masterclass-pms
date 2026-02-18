import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { IconX, IconLogout } from '../components/Icons';
import { hashPassword, resetAllOrders } from '../db/db_utils';
import logo from '../assets/logo_masterclass.svg';

export default function Login() {
    const { login } = useAuth();
    const { t } = useLang();
    const users = useLiveQuery(() => db.users.toArray().then(all => all.filter(u => u.active))) || [];
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // Developer modal state
    const [showDevModal, setShowDevModal] = useState(false);
    const [devPhase, setDevPhase] = useState('loading'); // loading | setup | login | panel
    const [devPassword, setDevPassword] = useState('');
    const [devConfirm, setDevConfirm] = useState('');
    const [devError, setDevError] = useState('');
    const [devSuccess, setDevSuccess] = useState('');
    const [orderCount, setOrderCount] = useState(0);
    const [resetting, setResetting] = useState(false);

    const submit = async () => {
        if (!selectedUser || pin.length < 4) return;
        const result = await login(selectedUser, pin);
        if (!result.ok) {
            setError(t('loginPinError'));
            setPin('');
        }
    };

    const numpadPress = (key) => {
        setError('');
        if (key === 'back') { setPin(p => p.slice(0, -1)); return; }
        if (pin.length >= 6) return;
        const newPin = pin + key;
        setPin(newPin);
    };

    // --- Developer Modal Logic ---
    const openDevModal = async () => {
        setShowDevModal(true);
        setDevPassword('');
        setDevConfirm('');
        setDevError('');
        setDevSuccess('');

        // Check if dev password exists
        const stored = await db.settings.get('devPassword');
        if (stored && stored.value) {
            setDevPhase('login');
        } else {
            setDevPhase('setup');
        }

        // Get order count
        const count = await db.orders.count();
        setOrderCount(count);
    };

    const closeDevModal = () => {
        setShowDevModal(false);
        setDevPhase('loading');
        setDevPassword('');
        setDevConfirm('');
        setDevError('');
        setDevSuccess('');
    };

    const isPasswordStrong = (pw) => {
        return pw.length >= 6 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);
    };

    const handleSetPassword = async () => {
        setDevError('');
        if (!isPasswordStrong(devPassword)) {
            setDevError(t('devPasswordWeak'));
            return;
        }
        if (devPassword !== devConfirm) {
            setDevError(t('devPasswordMismatch'));
            return;
        }
        const hashed = await hashPassword(devPassword);
        await db.settings.put({ key: 'devPassword', value: hashed });
        setDevSuccess(t('devPasswordSet'));
        setTimeout(() => {
            setDevPhase('panel');
            setDevSuccess('');
            setDevPassword('');
            setDevConfirm('');
        }, 1000);
    };

    const handleDevLogin = async () => {
        setDevError('');
        const stored = await db.settings.get('devPassword');
        if (!stored) return;
        const hashed = await hashPassword(devPassword);
        if (hashed === stored.value) {
            setDevPhase('panel');
            setDevPassword('');
            // Refresh order count
            const count = await db.orders.count();
            setOrderCount(count);
        } else {
            setDevError(t('devWrongPassword'));
            setDevPassword('');
        }
    };

    const handleResetOrders = async () => {
        if (!window.confirm(t('devResetConfirm'))) return;
        setResetting(true);
        setDevError('');
        setDevSuccess('');
        const result = await resetAllOrders();
        if (result.success) {
            setDevSuccess(t('devResetSuccess'));
            const count = await db.orders.count();
            setOrderCount(count);
        } else {
            setDevError(t('devResetError'));
        }
        setResetting(false);
    };

    return (
        <div className="login-page">
            <div className="login-card-horizontal">
                {/* Left Brand Panel */}
                <div className="login-brand-panel">
                    <div className="login-brand-inner">
                        <img src={logo} alt="MasterClass" className="login-brand-logo" />
                        <div className="login-brand-subtitle">{t('appSubtitle')}</div>
                        <div className="login-brand-decoration">
                            <div className="login-brand-line" />
                            <div className="login-brand-diamond">◆</div>
                            <div className="login-brand-line" />
                        </div>
                    </div>
                </div>

                {/* Right Auth Panel */}
                <div className="login-auth-panel">
                    {!selectedUser ? (
                        <>
                            <h3 className="login-auth-title">{t('loginSelectUser')}</h3>
                            <div className="user-select-grid">
                                {users.map(u => (
                                    <button
                                        key={u.id}
                                        className="user-select-btn"
                                        onClick={() => { setSelectedUser(u.id); setPin(''); setError(''); }}
                                    >
                                        <div className="user-avatar" style={{ width: 52, height: 52, margin: '0 auto 8px', fontSize: '1.2rem', lineHeight: '52px' }}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div className="user-btn-name">{u.name}</div>
                                        <div className="user-btn-role">{t(`role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}`) || u.role}</div>
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="selected-user-header" onClick={() => setSelectedUser(null)}>
                                <div className="user-avatar" style={{ width: 40, height: 40, fontSize: '1rem', lineHeight: '40px' }}>
                                    {users.find(u => u.id === selectedUser)?.name.charAt(0)}
                                </div>
                                <div style={{ textAlign: 'left', flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{users.find(u => u.id === selectedUser)?.name}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('clickToChange')}</div>
                                </div>
                                <IconX size={18} style={{ color: 'var(--text-muted)' }} />
                            </div>

                            {/* PIN Display */}
                            <div className="pin-display">
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
                                ))}
                            </div>

                            {/* PIN Pad */}
                            <div className="pin-pad">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'back'].map((k, i) => (
                                    k === '' ? <div key={i} /> : (
                                        <button key={i} className={`pin-key ${k === 'back' ? 'backspace' : ''}`}
                                            onClick={() => numpadPress(String(k))} style={{ height: 64, fontSize: '1.3rem' }}>
                                            {k === 'back' ? <IconX size={22} /> : k}
                                        </button>
                                    )
                                ))}
                            </div>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '12px' }}
                                onClick={submit}
                                disabled={pin.length < 4}
                            >
                                <IconLogout size={16} style={{ transform: 'scaleX(-1)' }} />
                                {t('loginConnect')}
                            </button>

                            {error && <div className="login-error">{error}</div>}
                        </>
                    )}
                </div>
            </div>

            {/* Developer Access Button — Bottom Right */}
            <button
                onClick={openDevModal}
                style={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.15)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s',
                    zIndex: 10,
                }}
                onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
                title={t('devLogin')}
            >
                🔧
            </button>

            {/* Developer Modal */}
            {showDevModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={closeDevModal}>
                    <div style={{
                        background: 'var(--bg-card, #1a1a2e)',
                        borderRadius: 20,
                        padding: '2rem',
                        width: '100%',
                        maxWidth: 420,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text, #fff)',
                    }} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <span style={{ fontSize: '1.5rem' }}>🔧</span>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                                        {devPhase === 'panel' ? t('devPanel') : t('devLogin')}
                                    </div>
                                    {devPhase === 'panel' && (
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                            {t('devWelcome')}, Imad
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={closeDevModal} style={{
                                background: 'none', border: 'none', color: 'var(--text-muted)',
                                cursor: 'pointer', fontSize: '1.2rem', padding: 4,
                            }}>
                                <IconX size={20} />
                            </button>
                        </div>

                        {/* ===== SETUP PHASE ===== */}
                        {devPhase === 'setup' && (
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                                    {t('devSetPassword')}
                                </p>
                                <input
                                    type="password"
                                    placeholder={t('devPasswordPlaceholder')}
                                    value={devPassword}
                                    onChange={e => setDevPassword(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text, #fff)', fontSize: '0.95rem',
                                        marginBottom: 12, outline: 'none', boxSizing: 'border-box',
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && document.getElementById('dev-confirm-input')?.focus()}
                                />
                                <input
                                    id="dev-confirm-input"
                                    type="password"
                                    placeholder={t('devConfirmPassword')}
                                    value={devConfirm}
                                    onChange={e => setDevConfirm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text, #fff)', fontSize: '0.95rem',
                                        marginBottom: 16, outline: 'none', boxSizing: 'border-box',
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                                />
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                    onClick={handleSetPassword}
                                    disabled={!devPassword || !devConfirm}
                                >
                                    {t('devSetPassword')}
                                </button>
                            </div>
                        )}

                        {/* ===== LOGIN PHASE ===== */}
                        {devPhase === 'login' && (
                            <div>
                                <input
                                    type="password"
                                    placeholder={t('devEnterPassword')}
                                    value={devPassword}
                                    onChange={e => setDevPassword(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: '100%', padding: '12px 16px', borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'var(--text, #fff)', fontSize: '0.95rem',
                                        marginBottom: 16, outline: 'none', boxSizing: 'border-box',
                                    }}
                                    onKeyDown={e => e.key === 'Enter' && handleDevLogin()}
                                />
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                    onClick={handleDevLogin}
                                    disabled={!devPassword}
                                >
                                    <IconLogout size={16} style={{ transform: 'scaleX(-1)' }} />
                                    {t('loginConnect')}
                                </button>
                            </div>
                        )}

                        {/* ===== PANEL PHASE ===== */}
                        {devPhase === 'panel' && (
                            <div>
                                {/* Order count info */}
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: 14,
                                    padding: '1rem 1.25rem',
                                    marginBottom: '1rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📦 {t('devOrderCount')}</span>
                                        <span style={{ fontWeight: 700, fontSize: '1.3rem', color: orderCount > 0 ? 'var(--orange, #f97316)' : 'var(--green, #22c55e)' }}>
                                            {orderCount}
                                        </span>
                                    </div>
                                </div>

                                {/* Reset Orders Button */}
                                <button
                                    onClick={handleResetOrders}
                                    disabled={resetting || orderCount === 0}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: 14,
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        background: resetting ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.15)',
                                        color: orderCount === 0 ? 'rgba(255,255,255,0.3)' : '#ef4444',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        cursor: orderCount === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 10,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {resetting ? '⏳' : '🗑️'} {t('devResetOrders')}
                                </button>
                            </div>
                        )}

                        {/* Error / Success Messages */}
                        {devError && (
                            <div style={{
                                marginTop: 12, padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                                fontSize: '0.85rem', textAlign: 'center', fontWeight: 500,
                            }}>
                                {devError}
                            </div>
                        )}
                        {devSuccess && (
                            <div style={{
                                marginTop: 12, padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e',
                                fontSize: '0.85rem', textAlign: 'center', fontWeight: 500,
                            }}>
                                ✓ {devSuccess}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
