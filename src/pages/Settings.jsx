import { useState, useEffect } from 'react';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../db/activityLog';
import { IconCheck, IconSettings, IconDownload, IconUpload, IconPrint } from '../components/Icons';
import { downloadBackup, importData } from '../db/db_utils';

const SETTINGS_KEYS = [
    { key: 'storeName', labelEn: 'Restaurant Name', labelFr: 'Nom du restaurant', type: 'text' },
    { key: 'storeSubtitle', labelEn: 'Subtitle', labelFr: 'Sous-titre', type: 'text' },
    { key: 'storeAddress', labelEn: 'Address', labelFr: 'Adresse', type: 'text' },
    { key: 'storePhone', labelEn: 'Phone', labelFr: 'Téléphone', type: 'text' },
    { key: 'wifiName', labelEn: 'WiFi Name', labelFr: 'Nom WiFi', type: 'text' },
    { key: 'wifiPassword', labelEn: 'WiFi Password', labelFr: 'Mot de passe WiFi', type: 'text' },
    { key: 'receiptFooter', labelEn: 'Receipt Footer Message', labelFr: 'Message de bas de ticket', type: 'text' },
    { key: 'receiptPoweredBy', labelEn: 'Powered by', labelFr: 'Powered by', type: 'text' },
];

export default function Settings() {
    const { lang, t } = useLang();
    const { user } = useAuth();
    const [values, setValues] = useState({});
    const [saved, setSaved] = useState(false);
    const [importing, setImporting] = useState(false);

    // Printer state
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [kitchenPrinter, setKitchenPrinter] = useState('');
    const [paperWidth, setPaperWidth] = useState('80mm');
    const [customerTicketScale, setCustomerTicketScale] = useState(100);
    const [kitchenTicketScale, setKitchenTicketScale] = useState(100);
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const isElectron = !!window.electron?.getPrinters;

    useEffect(() => {
        (async () => {
            const all = await db.settings.toArray();
            const map = {};
            all.forEach(s => { map[s.key] = s.value; });
            setValues(map);
            // Load saved printers
            if (map.printerName) {
                setSelectedPrinter(map.printerName);
            }
            if (map.kitchenPrinterName) {
                setKitchenPrinter(map.kitchenPrinterName);
            }
            if (map.paperWidth) setPaperWidth(map.paperWidth);
            if (map.customerTicketScale) setCustomerTicketScale(Number(map.customerTicketScale));
            if (map.kitchenTicketScale) setKitchenTicketScale(Number(map.kitchenTicketScale));
        })();
    }, []);

    // Detect printers when in Electron
    useEffect(() => {
        if (isElectron) {
            refreshPrinters();
        }
    }, [isElectron]);

    const refreshPrinters = async () => {
        if (!isElectron) return;
        setLoadingPrinters(true);
        try {
            const list = await window.electron.getPrinters();
            setPrinters(list || []);
        } catch (e) {
            console.error('Failed to get printers:', e);
        }
        setLoadingPrinters(false);
    };

    const handleChange = (key, val) => {
        setValues(prev => ({ ...prev, [key]: val }));
        setSaved(false);
    };

    const handleSave = async () => {
        for (const s of SETTINGS_KEYS) {
            await db.settings.put({ key: s.key, value: values[s.key] || '' });
        }
        // Save printer settings
        await db.settings.put({ key: 'printerName', value: selectedPrinter || '' });
        await db.settings.put({ key: 'kitchenPrinterName', value: kitchenPrinter || '' });
        await db.settings.put({ key: 'autoPrint', value: values.autoPrint || 'on' });
        await db.settings.put({ key: 'paperWidth', value: paperWidth });
        await db.settings.put({ key: 'customerTicketScale', value: customerTicketScale });
        await db.settings.put({ key: 'kitchenTicketScale', value: kitchenTicketScale });

        logActivity(user?.id, user?.name, 'settings_save', '', { printer: selectedPrinter, kitchen: kitchenPrinter });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleExport = async () => {
        try {
            await downloadBackup();
        } catch (e) {
            console.error(e);
            alert('Export failed');
        }
    };

    const handleImportClick = () => {
        document.getElementById('file-upload').click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (window.confirm(t('confirmImport'))) {
            setImporting(true);
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const json = JSON.parse(event.target.result);
                    await importData(json, true);
                    alert(t('importSuccess'));
                    window.location.reload();
                } catch (err) {
                    console.error(err);
                    alert(t('importError') + err.message);
                    setImporting(false);
                }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };

    return (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconSettings size={22} />
                    {lang === 'fr' ? 'Paramètres du Ticket' : 'Receipt Settings'}
                </h2>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'fr' ? 'Informations Restaurant' : 'Restaurant Info'}
                </h3>
                {SETTINGS_KEYS.slice(0, 4).map(s => (
                    <div className="form-group" key={s.key}>
                        <label className="form-label">{lang === 'fr' ? s.labelFr : s.labelEn}</label>
                        <input
                            className="input"
                            type={s.type}
                            value={values[s.key] || ''}
                            onChange={e => handleChange(s.key, e.target.value)}
                            dir="ltr"
                        />
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'fr' ? 'WiFi' : 'WiFi'}
                </h3>
                {SETTINGS_KEYS.slice(4, 6).map(s => (
                    <div className="form-group" key={s.key}>
                        <label className="form-label">{lang === 'fr' ? s.labelFr : s.labelEn}</label>
                        <input
                            className="input"
                            type={s.type}
                            value={values[s.key] || ''}
                            onChange={e => handleChange(s.key, e.target.value)}
                            dir="ltr"
                        />
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'fr' ? 'Bas du Ticket' : 'Receipt Footer'}
                </h3>
                {SETTINGS_KEYS.slice(6).map(s => (
                    <div className="form-group" key={s.key}>
                        <label className="form-label">{lang === 'fr' ? s.labelFr : s.labelEn}</label>
                        <input
                            className="input"
                            type={s.type}
                            value={values[s.key] || ''}
                            onChange={e => handleChange(s.key, e.target.value)}
                            dir="ltr"
                        />
                    </div>
                ))}
            </div>



            {/* Printer Settings — Always visible */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconPrint size={16} />
                    {lang === 'fr' ? 'Imprimante & Impression' : 'Printer & Printing'}
                </h3>

                {/* Auto-print toggle */}
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{lang === 'fr' ? 'Impression automatique après paiement' : 'Auto-print after payment'}</span>
                        <button
                            type="button"
                            onClick={() => { handleChange('autoPrint', values.autoPrint === 'off' ? 'on' : 'off'); }}
                            style={{
                                width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                                background: values.autoPrint !== 'off' ? 'var(--green)' : 'var(--border)',
                                position: 'relative', transition: '0.2s',
                            }}
                        >
                            <span style={{
                                position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: '#fff',
                                left: values.autoPrint !== 'off' ? 25 : 3, transition: '0.2s',
                            }} />
                        </button>
                    </label>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {lang === 'fr'
                            ? 'Le ticket s\'imprime automatiquement après chaque paiement'
                            : 'Receipt prints automatically after each payment'}
                    </div>
                </div>

                {/* Printer selectors: Visible to all, but silentPrint note shown for browser */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">
                        {lang === 'fr' ? 'Imprimante principale (Caisse)' : 'Main Printer (Front Desk)'}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select
                            className="input"
                            value={selectedPrinter}
                            onChange={(e) => { setSelectedPrinter(e.target.value); setSaved(false); }}
                            style={{ flex: 1 }}
                        >
                            <option value="">
                                {loadingPrinters
                                    ? (lang === 'fr' ? 'Recherche...' : 'Searching...')
                                    : (lang === 'fr' ? '-- Choisir une imprimante --' : '-- Select a printer --')
                                }
                            </option>
                            {printers.map(p => (
                                <option key={p.name} value={p.name}>
                                    {p.displayName} {p.isDefault ? '⭐' : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            className="btn btn-ghost"
                            onClick={refreshPrinters}
                            disabled={loadingPrinters || !isElectron}
                            style={{ border: '1px solid var(--border)', padding: '8px 12px' }}
                            title={lang === 'fr' ? 'Rafraîchir' : 'Refresh'}
                        >
                            ↻
                        </button>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">
                        {lang === 'fr' ? 'Imprimante Cuisine (Bons de commande)' : 'Kitchen Printer (Order Tickets)'}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <select
                            className="input"
                            value={kitchenPrinter}
                            onChange={(e) => { setKitchenPrinter(e.target.value); setSaved(false); }}
                            style={{ flex: 1 }}
                        >
                            <option value="">
                                {loadingPrinters
                                    ? (lang === 'fr' ? 'Recherche...' : 'Searching...')
                                    : (lang === 'fr' ? '-- Choisir une imprimante --' : '-- Select a printer --')
                                }
                            </option>
                            {printers.map(p => (
                                <option key={p.name} value={p.name}>
                                    {p.displayName} {p.isDefault ? '⭐' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                        {lang === 'fr'
                            ? 'Les commandes envoyées (Send) seront imprimées uniquement ici. Les paiements déclencheront une impression double (Caisse + Cuisine).'
                            : 'Sent orders will print only here. Payments will trigger dual printing (Front Desk + Kitchen).'}
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '1rem' }}>
                    {lang === 'fr' ? 'Configuration Papier & Zoom' : 'Paper & Scale Configuration'}
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">{lang === 'fr' ? 'Format Papier' : 'Paper Width'}</label>
                        <select className="input" value={paperWidth} onChange={e => { setPaperWidth(e.target.value); setSaved(false); }}>
                            <option value="80mm">80mm (Standard)</option>
                            <option value="58mm">58mm (Small)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{lang === 'fr' ? 'Zoom Ticket Caisse (%)' : 'Front Desk Scale (%)'}</label>
                        <input type="number" className="input" value={customerTicketScale} onChange={e => { setCustomerTicketScale(e.target.value); setSaved(false); }} min="50" max="200" step="5" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{lang === 'fr' ? 'Zoom Ticket Cuisine (%)' : 'Kitchen Scale (%)'}</label>
                        <input type="number" className="input" value={kitchenTicketScale} onChange={e => { setKitchenTicketScale(e.target.value); setSaved(false); }} min="50" max="200" step="5" />
                    </div>
                </div>

                {!isElectron && (
                    <div style={{ marginTop: '1rem', padding: '12px 14px', borderRadius: 10, background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,0.2)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--blue)', marginBottom: 6 }}>
                            {lang === 'fr' ? 'ℹ️ Mode navigateur' : 'ℹ️ Browser Mode'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {lang === 'fr'
                                ? 'Dans le navigateur, la fenêtre d\'impression s\'affiche toujours (limitation Chrome). Pour configurer le nom exact de l\'imprimante, utilisez l\'application Electron.'
                                : 'In the browser, the print dialog always shows (Chrome limitation). To configure exact printer names, use the Electron app.'
                            }
                            <br />
                            <strong style={{ color: 'var(--text)' }}>
                                {lang === 'fr'
                                    ? '💡 Astuce : Vous pouvez saisir le nom exact de l\'imprimante manuellement ci-dessous si vous ne voyez pas la liste.'
                                    : '💡 Tip: You can manually type the exact printer name below if the list is empty.'}
                            </strong>
                        </div>

                        {/* Fallback inputs for browser mode if `printers` list is empty because `getPrinters` isn't available */}
                        {printers.length === 0 && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <input
                                    type="text"
                                    placeholder={lang === 'fr' ? "Nom imprimante caisse" : "Main printer name"}
                                    value={selectedPrinter}
                                    onChange={e => { setSelectedPrinter(e.target.value); setSaved(false); }}
                                    className="input"
                                    style={{ flex: 1, padding: '4px 8px' }}
                                />
                                <input
                                    type="text"
                                    placeholder={lang === 'fr' ? "Nom imprimante cuisine" : "Kitchen printer name"}
                                    value={kitchenPrinter}
                                    onChange={e => { setKitchenPrinter(e.target.value); setSaved(false); }}
                                    className="input"
                                    style={{ flex: 1, padding: '4px 8px' }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'fr' ? 'Gestion des Données' : 'Data Management'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button className="btn btn-ghost" style={{ justifyContent: 'center', border: '1px solid var(--border)' }} onClick={handleExport}>
                        <IconDownload size={18} />
                        {lang === 'fr' ? 'Exporter' : 'Export'}
                    </button>
                    <button className="btn btn-ghost" style={{ justifyContent: 'center', border: '1px solid var(--border)' }} onClick={handleImportClick} disabled={importing}>
                        <IconUpload size={18} />
                        {importing ? '...' : (lang === 'fr' ? 'Importer' : 'Import')}
                    </button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    {t('exportInfo')} <br />
                    {t('importInfo')}
                </div>
                <input
                    type="file"
                    id="file-upload"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={handleSave}>
                <IconCheck size={18} />
                {saved
                    ? (lang === 'fr' ? '✓ Enregistré' : '✓ Saved')
                    : (lang === 'fr' ? 'Enregistrer' : 'Save Settings')
                }
            </button>
        </div>
    );
}
