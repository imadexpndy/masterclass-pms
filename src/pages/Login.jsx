import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { IconX, IconLogout } from '../components/Icons';
import { hashPassword, resetAllOrders, resetTodayOrders } from '../db/db_utils';
import { logActivity, getRecentLogs, clearActivityLogs } from '../db/activityLog';
import logo from '../assets/logo_masterclass.svg';

// Action colors for log badges
const ACTION_COLORS = {
    login: '#22c55e',
    logout: '#64748b',
    order_create: '#3b82f6',
    order_pay: '#22c55e',
    menu_add: '#8b5cf6',
    menu_edit: '#f59e0b',
    menu_delete: '#ef4444',
    category_add: '#8b5cf6',
    category_delete: '#ef4444',
    user_add: '#06b6d4',
    user_edit: '#f59e0b',
    user_delete: '#ef4444',
    user_toggle: '#f97316',
    stock_update: '#14b8a6',
    item_toggle: '#f97316',
    settings_save: '#64748b',
    dev_reset: '#ef4444',
};

const ACTION_LABELS = {
    login: 'actLogin',
    logout: 'actLogout',
    order_create: 'actOrderCreate',
    order_pay: 'actOrderPay',
    menu_add: 'actMenuAdd',
    menu_edit: 'actMenuEdit',
    menu_delete: 'actMenuDelete',
    category_add: 'actCatAdd',
    category_delete: 'actCatDelete',
    user_add: 'actUserAdd',
    user_edit: 'actUserEdit',
    user_delete: 'actUserDelete',
    user_toggle: 'actUserToggle',
    stock_update: 'actStockUpdate',
    item_toggle: 'actItemToggle',
    settings_save: 'actSettingsSave',
    dev_reset: 'actDevReset',
};

export default function Login() {
    const { login } = useAuth();
    const { t } = useLang();
    const users = useLiveQuery(() => db.users.toArray().then(all => all.filter(u => u.active))) || [];
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // Developer modal state
    const [showDevModal, setShowDevModal] = useState(false);
    const [devPhase, setDevPhase] = useState('loading');
    const [devPassword, setDevPassword] = useState('');
    const [devConfirm, setDevConfirm] = useState('');
    const [devError, setDevError] = useState('');
    const [devSuccess, setDevSuccess] = useState('');
    const [orderCount, setOrderCount] = useState(0);
    const [todayOrderCount, setTodayOrderCount] = useState(0);
    const [resetting, setResetting] = useState(false);
    const [devTab, setDevTab] = useState('actions'); // actions | logs

    // Activity log state
    const [logs, setLogs] = useState([]);
    const [logFilter, setLogFilter] = useState('all');
    const [logUserFilter, setLogUserFilter] = useState('all');

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
    const refreshCounts = async () => {
        const all = await db.orders.count();
        setOrderCount(all);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayOrders = await db.orders.filter(o => new Date(o.createdAt) >= todayStart).count();
        setTodayOrderCount(todayOrders);
    };

    const refreshLogs = async () => {
        const recent = await getRecentLogs(200);
        setLogs(recent);
    };

    const openDevModal = async () => {
        setShowDevModal(true);
        setDevPassword('');
        setDevConfirm('');
        setDevError('');
        setDevSuccess('');
        setDevTab('actions');

        const stored = await db.settings.get('devPassword');
        if (stored && stored.value) {
            setDevPhase('login');
        } else {
            setDevPhase('setup');
        }

        await refreshCounts();
    };

    const closeDevModal = () => {
        setShowDevModal(false);
        setDevPhase('loading');
        setDevPassword('');
        setDevConfirm('');
        setDevError('');
        setDevSuccess('');
    };

    const isPasswordStrong = (pw) => pw.length >= 6 && /[a-zA-Z]/.test(pw) && /[0-9]/.test(pw);

    const handleSetPassword = async () => {
        setDevError('');
        if (!isPasswordStrong(devPassword)) { setDevError(t('devPasswordWeak')); return; }
        if (devPassword !== devConfirm) { setDevError(t('devPasswordMismatch')); return; }
        const hashed = await hashPassword(devPassword);
        await db.settings.put({ key: 'devPassword', value: hashed });
        setDevSuccess(t('devPasswordSet'));
        setTimeout(() => {
            setDevPhase('panel');
            setDevSuccess('');
            setDevPassword('');
            setDevConfirm('');
            refreshLogs();
        }, 800);
    };

    const handleDevLogin = async () => {
        setDevError('');
        const stored = await db.settings.get('devPassword');
        if (!stored) return;
        const hashed = await hashPassword(devPassword);
        if (hashed === stored.value) {
            setDevPhase('panel');
            setDevPassword('');
            await refreshCounts();
            await refreshLogs();
        } else {
            setDevError(t('devWrongPassword'));
            setDevPassword('');
        }
    };

    const handleResetToday = async () => {
        if (!window.confirm(t('devResetTodayConfirm'))) return;
        setResetting(true);
        setDevError('');
        setDevSuccess('');
        const result = await resetTodayOrders();
        if (result.success) {
            setDevSuccess(t('devResetTodaySuccess'));
            logActivity('dev', 'Imad', 'dev_reset', 'today_orders', { count: result.count });
            await refreshCounts();
            await refreshLogs();
        } else {
            setDevError(t('devResetError'));
        }
        setResetting(false);
    };

    const handleResetAll = async () => {
        if (!window.confirm(t('devResetConfirm'))) return;
        setResetting(true);
        setDevError('');
        setDevSuccess('');
        const result = await resetAllOrders();
        if (result.success) {
            setDevSuccess(t('devResetSuccess'));
            logActivity('dev', 'Imad', 'dev_reset', 'all_orders');
            await refreshCounts();
            await refreshLogs();
        } else {
            setDevError(t('devResetError'));
        }
        setResetting(false);
    };

    const handleClearLogs = async () => {
        if (!window.confirm(t('devClearLogsConfirm'))) return;
        await clearActivityLogs();
        await refreshLogs();
    };

    // Filtered logs
    const filteredLogs = logs.filter(log => {
        if (logFilter !== 'all' && log.action !== logFilter) return false;
        if (logUserFilter !== 'all' && log.userName !== logUserFilter) return false;
        return true;
    });

    // Unique users from logs
    const logUsers = [...new Set(logs.map(l => l.userName).filter(Boolean))];
    // Unique actions from logs
    const logActions = [...new Set(logs.map(l => l.action).filter(Boolean))];

    const formatTime = (ts) => {
        const d = new Date(ts);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const time = d.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
        if (isToday) return time;
        return d.toLocaleDateString('fr', { day: '2-digit', month: '2-digit' }) + ' ' + time;
    };

    // Shared input style
    const inputStyle = {
        width: '100%', padding: '12px 16px', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.05)',
        color: 'var(--text, #fff)', fontSize: '0.95rem',
        outline: 'none', boxSizing: 'border-box',
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
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''}`} />
                                ))}
                            </div>

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

                            <button className="btn btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '12px' }}
                                onClick={submit} disabled={pin.length < 4}>
                                <IconLogout size={16} style={{ transform: 'scaleX(-1)' }} />
                                {t('loginConnect')}
                            </button>

                            {error && <div className="login-error">{error}</div>}
                        </>
                    )}
                </div>
            </div>

            {/* Developer Access Button */}
            <button onClick={openDevModal} title={t('devLogin')}
                style={{
                    position: 'fixed', bottom: 16, right: 16,
                    width: 36, height: 36, borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'rgba(255,255,255,0.15)',
                    fontSize: '0.9rem', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s', zIndex: 10,
                }}
                onMouseEnter={e => { e.target.style.color = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}
            >🔧</button>

            {/* ============ DEVELOPER MODAL ============ */}
            {showDevModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} onClick={closeDevModal}>
                    <div style={{
                        background: 'var(--bg-card, #1a1a2e)',
                        borderRadius: 20, padding: '1.5rem',
                        width: '100%', maxWidth: devPhase === 'panel' ? 560 : 420,
                        maxHeight: '90vh', overflow: 'hidden',
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text, #fff)',
                        transition: 'max-width 0.3s',
                    }} onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
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
                            }}><IconX size={20} /></button>
                        </div>

                        {/* ===== SETUP PHASE ===== */}
                        {devPhase === 'setup' && (
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                                    {t('devSetPassword')}
                                </p>
                                <input type="password" placeholder={t('devPasswordPlaceholder')} value={devPassword}
                                    onChange={e => setDevPassword(e.target.value)}
                                    style={{ ...inputStyle, marginBottom: 12 }}
                                    onKeyDown={e => e.key === 'Enter' && document.getElementById('dev-confirm-input')?.focus()}
                                />
                                <input id="dev-confirm-input" type="password" placeholder={t('devConfirmPassword')} value={devConfirm}
                                    onChange={e => setDevConfirm(e.target.value)}
                                    style={{ ...inputStyle, marginBottom: 16 }}
                                    onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                                />
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                    onClick={handleSetPassword} disabled={!devPassword || !devConfirm}>
                                    {t('devSetPassword')}
                                </button>
                            </div>
                        )}

                        {/* ===== LOGIN PHASE ===== */}
                        {devPhase === 'login' && (
                            <div>
                                <input type="password" placeholder={t('devEnterPassword')} value={devPassword}
                                    onChange={e => setDevPassword(e.target.value)} autoFocus
                                    style={{ ...inputStyle, marginBottom: 16 }}
                                    onKeyDown={e => e.key === 'Enter' && handleDevLogin()}
                                />
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                    onClick={handleDevLogin} disabled={!devPassword}>
                                    <IconLogout size={16} style={{ transform: 'scaleX(-1)' }} />
                                    {t('loginConnect')}
                                </button>
                            </div>
                        )}

                        {/* ===== PANEL PHASE ===== */}
                        {devPhase === 'panel' && (
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                                {/* Tabs */}
                                <div style={{ display: 'flex', gap: 4, marginBottom: '1rem', flexShrink: 0 }}>
                                    {['actions', 'logs'].map(tab => (
                                        <button key={tab} onClick={() => setDevTab(tab)}
                                            style={{
                                                flex: 1, padding: '10px', borderRadius: 10,
                                                border: 'none', cursor: 'pointer',
                                                fontWeight: 600, fontSize: '0.85rem',
                                                background: devTab === tab ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                                                color: devTab === tab ? '#fff' : 'var(--text-muted)',
                                                transition: 'all 0.2s',
                                            }}>
                                            {tab === 'actions' ? `⚡ ${t('devResetOrders')}` : `📋 ${t('devActivityLog')}`}
                                        </button>
                                    ))}
                                </div>

                                {/* ==== ACTIONS TAB ==== */}
                                {devTab === 'actions' && (
                                    <div>
                                        {/* Stats Row */}
                                        <div style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
                                            <div style={{
                                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 14, padding: '1rem',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: todayOrderCount > 0 ? 'var(--orange, #f97316)' : 'var(--green, #22c55e)' }}>
                                                    {todayOrderCount}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    📦 {t('devTodayOrders')}
                                                </div>
                                            </div>
                                            <div style={{
                                                flex: 1, background: 'rgba(255,255,255,0.05)',
                                                borderRadius: 14, padding: '1rem',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                textAlign: 'center',
                                            }}>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: orderCount > 0 ? 'var(--orange, #f97316)' : 'var(--green, #22c55e)' }}>
                                                    {orderCount}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    📦 {t('devOrderCount')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Reset buttons */}
                                        <button onClick={handleResetToday} disabled={resetting || todayOrderCount === 0}
                                            style={{
                                                width: '100%', padding: '14px', borderRadius: 14, marginBottom: 10,
                                                border: '1px solid rgba(249, 115, 22, 0.3)',
                                                background: 'rgba(249, 115, 22, 0.12)',
                                                color: todayOrderCount === 0 ? 'rgba(255,255,255,0.3)' : '#f97316',
                                                fontSize: '0.9rem', fontWeight: 600,
                                                cursor: todayOrderCount === 0 ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                transition: 'all 0.2s',
                                            }}>
                                            {resetting ? '⏳' : '🧹'} {t('devResetToday')}
                                        </button>

                                        <button onClick={handleResetAll} disabled={resetting || orderCount === 0}
                                            style={{
                                                width: '100%', padding: '14px', borderRadius: 14,
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                background: 'rgba(239, 68, 68, 0.12)',
                                                color: orderCount === 0 ? 'rgba(255,255,255,0.3)' : '#ef4444',
                                                fontSize: '0.9rem', fontWeight: 600,
                                                cursor: orderCount === 0 ? 'not-allowed' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                                transition: 'all 0.2s',
                                            }}>
                                            {resetting ? '⏳' : '🗑️'} {t('devResetOrders')}
                                        </button>
                                    </div>
                                )}

                                {/* ==== ACTIVITY LOG TAB ==== */}
                                {devTab === 'logs' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1, minHeight: 0 }}>
                                        {/* Filters */}
                                        <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem', flexShrink: 0 }}>
                                            <select value={logUserFilter} onChange={e => setLogUserFilter(e.target.value)}
                                                style={{
                                                    ...inputStyle, padding: '8px 12px', fontSize: '0.8rem',
                                                    borderRadius: 10, flex: 1,
                                                }}>
                                                <option value="all">{t('devAllUsers')}</option>
                                                {logUsers.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                            <select value={logFilter} onChange={e => setLogFilter(e.target.value)}
                                                style={{
                                                    ...inputStyle, padding: '8px 12px', fontSize: '0.8rem',
                                                    borderRadius: 10, flex: 1,
                                                }}>
                                                <option value="all">{t('devAllActions')}</option>
                                                {logActions.map(a => <option key={a} value={a}>{t(ACTION_LABELS[a]) || a}</option>)}
                                            </select>
                                        </div>

                                        {/* Log List */}
                                        <div style={{
                                            overflowY: 'auto', flex: 1, minHeight: 0,
                                            borderRadius: 12,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            background: 'rgba(0,0,0,0.2)',
                                        }}>
                                            {filteredLogs.length === 0 ? (
                                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                    {t('devNoLogs')}
                                                </div>
                                            ) : (
                                                filteredLogs.map(log => (
                                                    <div key={log.id} style={{
                                                        padding: '10px 14px',
                                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                                        display: 'flex', alignItems: 'center', gap: 10,
                                                        fontSize: '0.82rem',
                                                    }}>
                                                        {/* Action badge */}
                                                        <span style={{
                                                            background: (ACTION_COLORS[log.action] || '#64748b') + '22',
                                                            color: ACTION_COLORS[log.action] || '#64748b',
                                                            padding: '3px 8px', borderRadius: 6,
                                                            fontSize: '0.72rem', fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            border: `1px solid ${(ACTION_COLORS[log.action] || '#64748b')}33`,
                                                        }}>
                                                            {t(ACTION_LABELS[log.action]) || log.action}
                                                        </span>
                                                        {/* User */}
                                                        <span style={{ fontWeight: 600, whiteSpace: 'nowrap', minWidth: 50 }}>
                                                            {log.userName}
                                                        </span>
                                                        {/* Target */}
                                                        <span style={{ color: 'var(--text-muted)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {log.target}
                                                        </span>
                                                        {/* Time */}
                                                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                                                            {formatTime(log.timestamp)}
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Clear logs button */}
                                        {logs.length > 0 && (
                                            <button onClick={handleClearLogs}
                                                style={{
                                                    marginTop: 10, padding: '8px', borderRadius: 10,
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    background: 'rgba(255,255,255,0.04)',
                                                    color: 'var(--text-muted)', fontSize: '0.78rem',
                                                    cursor: 'pointer', fontWeight: 500,
                                                    flexShrink: 0,
                                                }}>
                                                🗑️ {t('devClearLogs')} ({logs.length})
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Error / Success Messages */}
                        {devError && (
                            <div style={{
                                marginTop: 12, padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                                fontSize: '0.85rem', textAlign: 'center', fontWeight: 500, flexShrink: 0,
                            }}>{devError}</div>
                        )}
                        {devSuccess && (
                            <div style={{
                                marginTop: 12, padding: '10px 14px', borderRadius: 10,
                                background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e',
                                fontSize: '0.85rem', textAlign: 'center', fontWeight: 500, flexShrink: 0,
                            }}>✓ {devSuccess}</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
