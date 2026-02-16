import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { IconX, IconLogout } from '../components/Icons';
import logo from '../assets/logo_masterclass.svg';

export default function Login() {
    const { login } = useAuth();
    const { t } = useLang();
    const users = useLiveQuery(() => db.users.toArray().then(all => all.filter(u => u.active))) || [];
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

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
        </div>
    );
}
