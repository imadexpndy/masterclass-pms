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
import logo from '../assets/logo_almisk.jpg';

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

    // Tables first, then POS, Dashboard (admin only), rest
    const navItems = [
        { path: '/', icon: IconTable, label: t('navTables'), roles: ['admin', 'waiter', 'cashier'] },
        { path: '/pos', icon: IconCart, label: t('navPOS'), roles: ['admin', 'waiter', 'cashier'] },
        { path: '/kitchen', icon: IconChef, label: t('navKitchen'), roles: ['admin', 'kitchen'] },
        { path: '/reports', icon: IconChart, label: t('navReports'), roles: ['admin', 'cashier'] },
        { path: '/users', icon: IconUsers, label: t('navUsers'), roles: ['admin'] },
        { path: '/menu', icon: IconMenuBoard, label: t('navMenu'), roles: ['admin'] },
        { path: '/settings', icon: IconSettings, label: t('navSettings'), roles: ['admin'] },
    ];

    const pageTitles = {
        '/': t('tableManagement'),
        '/pos': t('loginTitle'),
        '/tables': t('tableManagement'),
        '/kitchen': t('kitchenDisplay'),
        '/reports': t('viewReports'),
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
            setClock(now.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
        };
        tick();
        const id = setInterval(tick, 30000);
        return () => clearInterval(id);
    }, [lang]);

    const visibleNav = navItems.filter(n => n.roles.includes(user?.role));
    const pageTitle = pageTitles[location.pathname] || t('appName');

    return (
        <div className="app-layout">
            {/* Top Navigation Bar */}
            <header className="topbar">
                <div className="topbar-brand">
                    <img src={logo} alt="Riad Al Misk" style={{ height: 40, width: 'auto', borderRadius: '4px' }} />
                </div>

                <nav className="topbar-nav">
                    {visibleNav.map(item => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                style={{ padding: '8px 12px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Icon size={18} />
                                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="topbar-right">
                    <span className="header-clock" style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                        <IconClock size={13} style={{ marginRight: 4 }} />
                        {clock}
                    </span>
                    <div className={`online-badge ${online ? 'online' : 'offline'}`} style={{ padding: '4px 8px' }}>
                        {online ? <IconWifi size={12} /> : <IconWifiOff size={12} />}
                    </div>

                    <button className="theme-toggle" onClick={toggleLang} title={lang === 'fr' ? 'English' : 'Français'} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 8px', width: 'auto' }}>
                        {lang === 'fr' ? 'EN' : 'FR'}
                    </button>
                    <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
                        {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
                    </button>
                    <button className="theme-toggle" onClick={toggleFullscreen} title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}>
                        {isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
                    </button>
                    {!window.matchMedia('(display-mode: standalone)').matches && (
                        <button className="theme-toggle" onClick={handleInstall} title={t('installApp')}>
                            <IconDownload size={14} />
                        </button>
                    )}

                    <div className="topbar-user" onClick={logout} title={t('logout')}>
                        <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>{user?.name?.charAt(0)}</div>
                        <IconLogout size={16} style={{ opacity: 0.6 }} />
                    </div>
                </div>
            </header>

            {/* Main */}
            <div className="main-content">
                <div className="page-body">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
