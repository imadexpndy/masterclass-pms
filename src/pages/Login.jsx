import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { IconX, IconLogout } from '../components/Icons';
import { hashPassword, resetAllOrders, resetTodayOrders } from '../db/db_utils';
import { logActivity, getRecentLogs, clearActivityLogs } from '../db/activityLog';
import logo from '../assets/logo_masterclass.svg';

const ACTION_COLORS = {
    login: '#22c55e', logout: '#94a3b8',
    order_create: '#3b82f6', order_pay: '#22c55e',
    menu_add: '#a78bfa', menu_edit: '#fbbf24', menu_delete: '#ef4444',
    category_add: '#a78bfa', category_delete: '#ef4444',
    user_add: '#22d3ee', user_edit: '#fbbf24', user_delete: '#ef4444', user_toggle: '#fb923c',
    stock_update: '#2dd4bf', item_toggle: '#fb923c',
    settings_save: '#94a3b8', dev_reset: '#ef4444',
};

const ACTION_ICONS = {
    login: '🔑', logout: '🚪',
    order_create: '🛒', order_pay: '💰',
    menu_add: '➕', menu_edit: '✏️', menu_delete: '🗑️',
    category_add: '📁', category_delete: '🗑️',
    user_add: '👤', user_edit: '✏️', user_delete: '🗑️', user_toggle: '🔄',
    stock_update: '📦', item_toggle: '🔄',
    settings_save: '⚙️', dev_reset: '🔴',
};

const ACTION_LABELS = {
    login: 'actLogin', logout: 'actLogout',
    order_create: 'actOrderCreate', order_pay: 'actOrderPay',
    menu_add: 'actMenuAdd', menu_edit: 'actMenuEdit', menu_delete: 'actMenuDelete',
    category_add: 'actCatAdd', category_delete: 'actCatDelete',
    user_add: 'actUserAdd', user_edit: 'actUserEdit', user_delete: 'actUserDelete', user_toggle: 'actUserToggle',
    stock_update: 'actStockUpdate', item_toggle: 'actItemToggle',
    settings_save: 'actSettingsSave', dev_reset: 'actDevReset',
};

export default function Login() {
    const { login } = useAuth();
    const { t } = useLang();
    const users = useLiveQuery(() => db.users.toArray().then(all => all.filter(u => u.active))) || [];
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // Dev modal
    const [showDevModal, setShowDevModal] = useState(false);
    const [devPhase, setDevPhase] = useState('loading');
    const [devPassword, setDevPassword] = useState('');
    const [devConfirm, setDevConfirm] = useState('');
    const [devError, setDevError] = useState('');
    const [devSuccess, setDevSuccess] = useState('');
    const [orderCount, setOrderCount] = useState(0);
    const [todayOrderCount, setTodayOrderCount] = useState(0);
    const [resetting, setResetting] = useState(false);
    const [devTab, setDevTab] = useState('actions');
    const [logs, setLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('all');
    const [logUserFilter, setLogUserFilter] = useState('all');

    const submit = async () => {
        if (!selectedUser || pin.length < 4) return;
        const result = await login(selectedUser, pin);
        if (!result.ok) { setError(t('loginPinError')); setPin(''); }
    };

    const numpadPress = (key) => {
        setError('');
        if (key === 'back') { setPin(p => p.slice(0, -1)); return; }
        if (pin.length >= 6) return;
        setPin(pin + key);
    };

    const refreshCounts = async () => {
        setOrderCount(await db.orders.count());
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        setTodayOrderCount(await db.orders.filter(o => new Date(o.createdAt) >= todayStart).count());
    };

    const refreshLogs = async () => setLogs(await getRecentLogs(200));

    const openDevModal = async () => {
        setShowDevModal(true);
        setDevPassword(''); setDevConfirm(''); setDevError(''); setDevSuccess(''); setDevTab('actions');
        const stored = await db.settings.get('devPassword');
        setDevPhase(stored?.value ? 'login' : 'setup');
        await refreshCounts();
    };

    const closeDevModal = () => {
        setShowDevModal(false);
        setDevPhase('loading'); setDevPassword(''); setDevConfirm(''); setDevError(''); setDevSuccess('');
    };

    const handleSetPassword = async () => {
        setDevError('');
        if (devPassword.length < 6 || !/[a-zA-Z]/.test(devPassword) || !/[0-9]/.test(devPassword)) { setDevError(t('devPasswordWeak')); return; }
        if (devPassword !== devConfirm) { setDevError(t('devPasswordMismatch')); return; }
        await db.settings.put({ key: 'devPassword', value: await hashPassword(devPassword) });
        setDevSuccess(t('devPasswordSet'));
        setTimeout(() => { setDevPhase('panel'); setDevSuccess(''); setDevPassword(''); setDevConfirm(''); refreshLogs(); }, 800);
    };

    const handleDevLogin = async () => {
        setDevError('');
        const stored = await db.settings.get('devPassword');
        if (!stored) return;
        if (await hashPassword(devPassword) === stored.value) {
            setDevPhase('panel'); setDevPassword(''); await refreshCounts(); await refreshLogs();
        } else { setDevError(t('devWrongPassword')); setDevPassword(''); }
    };

    const handleResetToday = async () => {
        if (!window.confirm(t('devResetTodayConfirm'))) return;
        setResetting(true); setDevError(''); setDevSuccess('');
        const r = await resetTodayOrders();
        if (r.success) { setDevSuccess(t('devResetTodaySuccess')); logActivity('dev', 'Imad', 'dev_reset', 'today_orders', { count: r.count }); }
        else setDevError(t('devResetError'));
        await refreshCounts(); await refreshLogs(); setResetting(false);
    };

    const handleResetAll = async () => {
        if (!window.confirm(t('devResetConfirm'))) return;
        setResetting(true); setDevError(''); setDevSuccess('');
        const r = await resetAllOrders();
        if (r.success) { setDevSuccess(t('devResetSuccess')); logActivity('dev', 'Imad', 'dev_reset', 'all_orders'); }
        else setDevError(t('devResetError'));
        await refreshCounts(); await refreshLogs(); setResetting(false);
    };

    const handleClearLogs = async () => {
        if (!window.confirm(t('devClearLogsConfirm'))) return;
        await clearActivityLogs(); await refreshLogs();
    };

    const filteredLogs = logs.filter(l =>
        (logFilter === 'all' || l.action === logFilter) &&
        (logUserFilter === 'all' || l.userName === logUserFilter)
    );
    const logUsers = [...new Set(logs.map(l => l.userName).filter(Boolean))];
    const logActions = [...new Set(logs.map(l => l.action).filter(Boolean))];

    const formatTime = (ts) => {
        const d = new Date(ts); const now = new Date();
        const time = d.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
        return d.toDateString() === now.toDateString() ? time : d.toLocaleDateString('fr', { day: '2-digit', month: '2-digit' }) + ' ' + time;
    };

    const inp = {
        width: '100%', padding: '14px 18px', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
        color: 'var(--text, #fff)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.2s',
    };

    return (
        <div className="login-page">
            <div className="login-card-horizontal">
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

                <div className="login-auth-panel">
                    {!selectedUser ? (
                        <>
                            <h3 className="login-auth-title">{t('loginSelectUser')}</h3>
                            <div className="user-select-grid">
                                {users.map(u => (
                                    <button key={u.id} className="user-select-btn"
                                        onClick={() => { setSelectedUser(u.id); setPin(''); setError(''); }}>
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
                            <div className="pin-display">
                                {[0, 1, 2, 3].map(i => <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />)}
                            </div>
                            <div className="pin-pad">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'back'].map((k, i) => (
                                    k === '' ? <div key={i} /> : (
                                        <button key={i} className={`pin-key ${k === 'back' ? 'backspace' : ''}`}
                                            onClick={() => numpadPress(String(k))} style={{ height: 64, fontSize: '1.3rem' }}>
                                            {k === 'back' ? <IconX size={22} /> : k}
                                        </button>)
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '12px' }}
                                onClick={submit} disabled={pin.length < 4}>
                                <IconLogout size={16} style={{ transform: 'scaleX(-1)' }} />{t('loginConnect')}
                            </button>
                            {error && <div className="login-error">{error}</div>}
                        </>
                    )}
                </div>
            </div>

            {/* Dev button */}
            <button onClick={openDevModal} title={t('devLogin')}
                style={{
                    position: 'fixed', bottom: 16, right: 16, width: 36, height: 36, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.12)', fontSize: '0.85rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', zIndex: 10,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
            >🔧</button>

            {/* ========== DEV MODAL ========== */}
            {showDevModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease',
                }} onClick={closeDevModal}>
                    <div style={{
                        background: 'linear-gradient(145deg, #1e1e32 0%, #161625 100%)',
                        borderRadius: 24, padding: 0, width: '100%',
                        maxWidth: devPhase === 'panel' ? 520 : 400,
                        maxHeight: '88vh', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
                        color: '#e2e8f0', transition: 'max-width 0.3s ease',
                    }} onClick={e => e.stopPropagation()}>

                        {/* ---- Header ---- */}
                        <div style={{
                            padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            background: 'rgba(255,255,255,0.02)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                <div style={{
                                    width: 42, height: 42, borderRadius: 12,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                                }}>🔧</div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                                        {devPhase === 'panel' ? t('devPanel') : t('devLogin')}
                                    </div>
                                    {devPhase === 'panel' && (
                                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 1 }}>
                                            {t('devWelcome')}, <span style={{ color: '#a78bfa', fontWeight: 600 }}>Imad</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={closeDevModal} style={{
                                background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8',
                                cursor: 'pointer', padding: 8, borderRadius: 10, transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
                            ><IconX size={18} /></button>
                        </div>

                        {/* ---- Content ---- */}
                        <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1, minHeight: 0 }}>

                            {/* SETUP */}
                            {devPhase === 'setup' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔐</div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                                            {t('devSetPassword')}
                                        </p>
                                    </div>
                                    <input type="password" placeholder={t('devPasswordPlaceholder')} value={devPassword}
                                        onChange={e => setDevPassword(e.target.value)} autoFocus
                                        style={inp}
                                        onKeyDown={e => e.key === 'Enter' && document.getElementById('dev-confirm-input')?.focus()}
                                    />
                                    <input id="dev-confirm-input" type="password" placeholder={t('devConfirmPassword')} value={devConfirm}
                                        onChange={e => setDevConfirm(e.target.value)}
                                        style={inp}
                                        onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                                    />
                                    <button className="btn btn-primary" style={{
                                        width: '100%', justifyContent: 'center', padding: '14px',
                                        borderRadius: 14, fontSize: '0.95rem', fontWeight: 600,
                                    }} onClick={handleSetPassword} disabled={!devPassword || !devConfirm}>
                                        🔐 {t('devSetPassword')}
                                    </button>
                                </div>
                            )}

                            {/* LOGIN */}
                            {devPhase === 'login' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔒</div>
                                    </div>
                                    <input type="password" placeholder={t('devEnterPassword')} value={devPassword}
                                        onChange={e => setDevPassword(e.target.value)} autoFocus
                                        style={inp}
                                        onKeyDown={e => e.key === 'Enter' && handleDevLogin()}
                                    />
                                    <button className="btn btn-primary" style={{
                                        width: '100%', justifyContent: 'center', padding: '14px',
                                        borderRadius: 14, fontSize: '0.95rem', fontWeight: 600,
                                    }} onClick={handleDevLogin} disabled={!devPassword}>
                                        <IconLogout size={16} style={{ transform: 'scaleX(-1)' }} />
                                        {t('loginConnect')}
                                    </button>
                                </div>
                            )}

                            {/* PANEL */}
                            {devPhase === 'panel' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                    {/* Tab bar */}
                                    <div style={{
                                        display: 'flex', gap: 2, marginBottom: 20,
                                        background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 3,
                                    }}>
                                        {[
                                            { id: 'actions', icon: '⚡', label: t('devResetOrders') },
                                            { id: 'logs', icon: '📋', label: t('devActivityLog') },
                                        ].map(tab => (
                                            <button key={tab.id} onClick={() => setDevTab(tab.id)} style={{
                                                flex: 1, padding: '11px 8px', borderRadius: 12, border: 'none',
                                                cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
                                                background: devTab === tab.id ? 'rgba(99,102,241,0.2)' : 'transparent',
                                                color: devTab === tab.id ? '#a78bfa' : '#64748b',
                                                transition: 'all 0.25s ease',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            }}>
                                                <span>{tab.icon}</span> {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* ---- ACTIONS TAB ---- */}
                                    {devTab === 'actions' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            {/* Stats cards */}
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                {[
                                                    { count: todayOrderCount, label: t('devTodayOrders'), gradient: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.04))', borderColor: 'rgba(251,146,60,0.2)', color: '#fb923c', icon: '📅' },
                                                    { count: orderCount, label: t('devOrderCount'), gradient: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.04))', borderColor: 'rgba(99,102,241,0.2)', color: '#818cf8', icon: '📦' },
                                                ].map((s, i) => (
                                                    <div key={i} style={{
                                                        flex: 1, borderRadius: 16, padding: '18px 16px',
                                                        background: s.gradient, border: `1px solid ${s.borderColor}`,
                                                        textAlign: 'center',
                                                    }}>
                                                        <div style={{ fontSize: '0.75rem', marginBottom: 6 }}>{s.icon}</div>
                                                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.count > 0 ? s.color : '#22c55e', lineHeight: 1, letterSpacing: '-0.02em' }}>
                                                            {s.count}
                                                        </div>
                                                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>
                                                            {s.label}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Reset buttons */}
                                            <button onClick={handleResetToday} disabled={resetting || todayOrderCount === 0}
                                                style={{
                                                    width: '100%', padding: '15px 18px', borderRadius: 14,
                                                    border: '1px solid rgba(251,146,60,0.25)',
                                                    background: 'linear-gradient(135deg, rgba(251,146,60,0.1), rgba(251,146,60,0.04))',
                                                    color: todayOrderCount === 0 ? '#475569' : '#fb923c',
                                                    fontSize: '0.9rem', fontWeight: 600,
                                                    cursor: todayOrderCount === 0 ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                    transition: 'all 0.2s', opacity: todayOrderCount === 0 ? 0.5 : 1,
                                                }}>
                                                {resetting ? '⏳' : '🧹'} {t('devResetToday')}
                                            </button>

                                            <button onClick={handleResetAll} disabled={resetting || orderCount === 0}
                                                style={{
                                                    width: '100%', padding: '15px 18px', borderRadius: 14,
                                                    border: '1px solid rgba(239,68,68,0.25)',
                                                    background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))',
                                                    color: orderCount === 0 ? '#475569' : '#ef4444',
                                                    fontSize: '0.9rem', fontWeight: 600,
                                                    cursor: orderCount === 0 ? 'not-allowed' : 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                    transition: 'all 0.2s', opacity: orderCount === 0 ? 0.5 : 1,
                                                }}>
                                                {resetting ? '⏳' : '🗑️'} {t('devResetOrders')}
                                            </button>
                                        </div>
                                    )}

                                    {/* ---- LOGS TAB ---- */}
                                    {devTab === 'logs' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            {/* Filters */}
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <select value={logUserFilter} onChange={e => setLogUserFilter(e.target.value)}
                                                    style={{ ...inp, padding: '10px 14px', fontSize: '0.82rem', borderRadius: 12, flex: 1 }}>
                                                    <option value="all">👤 {t('devAllUsers')}</option>
                                                    {logUsers.map(u => <option key={u} value={u}>{u}</option>)}
                                                </select>
                                                <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                                                    style={{ ...inp, padding: '10px 14px', fontSize: '0.82rem', borderRadius: 12, flex: 1 }}>
                                                    <option value="all">🔍 {t('devAllActions')}</option>
                                                    {logActions.map(a => <option key={a} value={a}>{ACTION_ICONS[a] || '•'} {t(ACTION_LABELS[a]) || a}</option>)}
                                                </select>
                                            </div>

                                            {/* Log list */}
                                            <div style={{
                                                maxHeight: 340, overflowY: 'auto', borderRadius: 14,
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                background: 'rgba(0,0,0,0.25)',
                                            }}>
                                                {filteredLogs.length === 0 ? (
                                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569' }}>
                                                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                                                        <div style={{ fontSize: '0.85rem' }}>{t('devNoLogs')}</div>
                                                    </div>
                                                ) : (
                                                    filteredLogs.map((log, idx) => (
                                                        <div key={log.id} style={{
                                                            padding: '12px 16px',
                                                            borderBottom: idx < filteredLogs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                            display: 'flex', alignItems: 'center', gap: 10,
                                                            transition: 'background 0.15s',
                                                        }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                                        >
                                                            {/* Icon */}
                                                            <span style={{
                                                                fontSize: '0.85rem', width: 28, height: 28,
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                borderRadius: 8, flexShrink: 0,
                                                                background: (ACTION_COLORS[log.action] || '#64748b') + '18',
                                                            }}>
                                                                {ACTION_ICONS[log.action] || '•'}
                                                            </span>
                                                            {/* Info */}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                                    <span style={{
                                                                        fontSize: '0.7rem', fontWeight: 700,
                                                                        color: ACTION_COLORS[log.action] || '#94a3b8',
                                                                        textTransform: 'uppercase', letterSpacing: '0.03em',
                                                                    }}>
                                                                        {t(ACTION_LABELS[log.action]) || log.action}
                                                                    </span>
                                                                    {log.target && (
                                                                        <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 500 }}>
                                                                            {log.target}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                                                    {log.userName} · {formatTime(log.timestamp)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            {/* Clear logs */}
                                            {logs.length > 0 && (
                                                <button onClick={handleClearLogs} style={{
                                                    padding: '10px', borderRadius: 12,
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    color: '#64748b', fontSize: '0.78rem',
                                                    cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s',
                                                }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#64748b'; }}
                                                >
                                                    🗑️ {t('devClearLogs')} ({logs.length})
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Messages */}
                            {devError && (
                                <div style={{
                                    marginTop: 16, padding: '12px 16px', borderRadius: 12,
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                    color: '#f87171', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500,
                                }}>⚠️ {devError}</div>
                            )}
                            {devSuccess && (
                                <div style={{
                                    marginTop: 16, padding: '12px 16px', borderRadius: 12,
                                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                                    color: '#4ade80', fontSize: '0.85rem', textAlign: 'center', fontWeight: 500,
                                }}>✓ {devSuccess}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
