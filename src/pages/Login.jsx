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
            <div className="login-card">
                <div className="login-logo">
                    <img src={logo} alt="MasterClass" style={{ width: 180, height: 'auto', marginBottom: 10 }} />
                </div>
                <div className="login-subtitle">{t('appSubtitle')}</div>

                {/* User Selection */}
                {!selectedUser ? (
                    <div className="user-select-grid">
                        {users.map(u => (
                            <button
                                key={u.id}
                                className={`user-select-btn ${selectedUser === u.id ? 'selected' : ''}`}
                                onClick={() => { setSelectedUser(u.id); setPin(''); setError(''); }}
                                style={{ padding: '20px' }}
                            >
                                <div className="user-avatar" style={{ width: 64, height: 64, margin: '0 auto 12px', fontSize: '1.5rem', lineHeight: '64px' }}>
                                    {u.name.charAt(0)}
                                </div>
                                <div className="user-btn-name" style={{ fontSize: '1.1rem', fontWeight: 600 }}>{u.name}</div>
                                <div className="user-btn-role" style={{ fontSize: '0.9rem' }}>{t(`role${u.role.charAt(0).toUpperCase() + u.role.slice(1)}`) || u.role}</div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="selected-user-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: '2rem', padding: '10px', background: 'var(--bg-elevated)', borderRadius: '12px', cursor: 'pointer' }} onClick={() => setSelectedUser(null)}>
                        <div className="user-avatar" style={{ width: 40, height: 40, fontSize: '1rem', lineHeight: '40px' }}>
                            {users.find(u => u.id === selectedUser)?.name.charAt(0)}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{users.find(u => u.id === selectedUser)?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('clickToChange')}</div>
                        </div>
                        <IconX size={20} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                    </div>
                )}

                {selectedUser && (
                    <>
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
                                        onClick={() => numpadPress(String(k))} style={{ height: 80, fontSize: '1.5rem' }}>
                                        {k === 'back' ? <IconX size={28} /> : k}
                                    </button>
                                )
                            ))}
                        </div>

                        {/* Login Button */}
                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', padding: '14px' }}
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
    );
}
