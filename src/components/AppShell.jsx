import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';
import { useState, useEffect } from 'react';
import {
    IconDashboard, IconCart, IconTable, IconChef, IconChart,
    IconBox, IconUsers, IconMenuBoard, IconSun, IconMoon,
    IconLogout, IconWifi, IconWifiOff, IconClock, IconGlobe,
    IconMaximize, IconMinimize, IconDownload, IconSettings
} from './Icons';
import logo from '../assets/logo_masterclass.svg';

export default function AppShell() {
    const { user, logout } = useAuth();
    const { theme, toggle: toggleTheme } = useTheme();
    const { lang, toggle: toggleLang, t } = useLang();
    const location = useLocation();
    const [online, setOnline] = useState(navigator.onLine);
    const [clock, setClock] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') setDeferredPrompt(null);
        } else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            alert('Pour installer : appuyez sur le bouton Partager (⎙) puis "Sur l\'écran d\'accueil"');
        } else {
            alert('Pour installer l\'application, utilisez le menu de votre navigateur > "Installer l\'application"');
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const navItems = [
        { path: '/', icon: IconDashboard, label: t('navDashboard'), roles: ['admin', 'waiter', 'cashier', 'kitchen'] },
        { path: '/pos', icon: IconCart, label: t('navPOS'), roles: ['admin', 'waiter', 'cashier'] },
        { path: '/tables', icon: IconTable, label: t('navTables'), roles: ['admin', 'waiter', 'cashier'] },
        { path: '/kitchen', icon: IconChef, label: t('navKitchen'), roles: ['admin', 'kitchen'] },
        { path: '/reports', icon: IconChart, label: t('navReports'), roles: ['admin', 'cashier'] },
        { path: '/inventory', icon: IconBox, label: t('navInventory'), roles: ['admin'] },
        { path: '/users', icon: IconUsers, label: t('navUsers'), roles: ['admin'] },
        { path: '/menu', icon: IconMenuBoard, label: t('navMenu'), roles: ['admin'] },
        { path: '/settings', icon: IconSettings, label: t('navSettings'), roles: ['admin'] },
    ];

    const pageTitles = {
        '/': t('navDashboard'),
        '/pos': t('loginTitle'),
        '/tables': t('tableManagement'),
        '/kitchen': t('kitchenDisplay'),
        '/reports': t('viewReports'),
        '/inventory': t('navInventory'),
        '/users': t('navUsers'),
        '/menu': t('navMenu'),
        '/settings': t('navSettings'),
    };

    useEffect(() => {
        const onOn = () => setOnline(true);
        const onOff = () => setOnline(false);
        window.addEventListener('online', onOn);
        window.addEventListener('offline', onOff);
        return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); };
    }, []);

    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setClock(now.toLocaleTimeString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }));
        };
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, [lang]);

    const visibleNav = navItems.filter(n => n.roles.includes(user?.role));
    const pageTitle = pageTitles[location.pathname] || t('appName');

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src={logo} alt="MasterClass Logo" style={{ width: '100%', maxWidth: 180, height: 'auto', marginBottom: 10 }} />
                </div>

                <nav className="sidebar-nav">
                    {visibleNav.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                style={{ padding: '16px 20px', fontSize: '1.1rem' }}
                            >
                                <span className="icon"><Icon size={24} /></span>
                                <span className="label" style={{ fontWeight: 600 }}>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sidebar-user" onClick={logout} title={t('logout')}>
                        <div className="user-avatar">{user?.name?.charAt(0)}</div>
                        <div className="user-info">
                            <div className="name">{user?.name}</div>
                            <div className="role">{t(`role${user?.role.charAt(0).toUpperCase() + user?.role.slice(1)}`) || user?.role}</div>
                        </div>
                        <IconLogout size={16} style={{ opacity: 0.4, flexShrink: 0 }} />
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="main-content">
                <header className="header-bar">
                    <h2 className="header-title">{pageTitle}</h2>
                    <div className="header-right">
                        <button
                            className="theme-toggle"
                            onClick={toggleLang}
                            title={lang === 'fr' ? 'العربية' : 'Français'}
                            style={{ fontSize: '0.9rem', fontWeight: 600, width: 'auto', padding: '0 12px', gap: 6 }}
                        >
                            <IconGlobe size={16} />
                            {lang === 'fr' ? 'AR' : 'FR'}
                        </button>
                        <button
                            className="theme-toggle"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
                        >
                            {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
                        </button>
                        {!window.matchMedia('(display-mode: standalone)').matches && (
                            <button
                                className="theme-toggle install-btn"
                                onClick={handleInstall}
                                title={t('installApp')}
                                style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                            >
                                <IconDownload size={18} />
                                <span style={{ marginLeft: 6, fontSize: '0.8rem', fontWeight: 600 }}>Installer</span>
                            </button>
                        )}
                        <button
                            className="theme-toggle"
                            onClick={toggleTheme}
                            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                        >
                            {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                        </button>
                        <div className={`online-badge ${online ? 'online' : 'offline'}`}>
                            {online ? <IconWifi size={13} /> : <IconWifiOff size={13} />}
                            {online ? t('online') : t('offline')}
                        </div>
                    </div>
                </header>
                <div className="page-body">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
