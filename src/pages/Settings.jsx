import { useState, useEffect } from 'react';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { IconCheck, IconSettings, IconDownload, IconUpload, IconPrint } from '../components/Icons';
import { downloadBackup, importData } from '../db/db_utils';

const SETTINGS_KEYS = [
    { key: 'storeName', labelFr: 'Nom du restaurant', labelAr: 'اسم المطعم', type: 'text' },
    { key: 'storeSubtitle', labelFr: 'Sous-titre', labelAr: 'العنوان الفرعي', type: 'text' },
    { key: 'storeAddress', labelFr: 'Adresse', labelAr: 'العنوان', type: 'text' },
    { key: 'storePhone', labelFr: 'Téléphone', labelAr: 'الهاتف', type: 'text' },
    { key: 'wifiName', labelFr: 'Nom WiFi', labelAr: 'اسم الواي فاي', type: 'text' },
    { key: 'wifiPassword', labelFr: 'Mot de passe WiFi', labelAr: 'كلمة سر الواي فاي', type: 'text' },
    { key: 'receiptFooter', labelFr: 'Message de bas de ticket', labelAr: 'رسالة أسفل الفاتورة', type: 'text' },
    { key: 'receiptPoweredBy', labelFr: 'Powered by', labelAr: 'مدعوم من', type: 'text' },
];

export default function Settings() {
    const { lang, t } = useLang();
    const [values, setValues] = useState({});
    const [saved, setSaved] = useState(false);
    const [importing, setImporting] = useState(false);

    // Printer state
    const [printers, setPrinters] = useState([]);
    const [selectedPrinter, setSelectedPrinter] = useState('');
    const [loadingPrinters, setLoadingPrinters] = useState(false);
    const isElectron = !!window.electron?.getPrinters;

    useEffect(() => {
        (async () => {
            const all = await db.settings.toArray();
            const map = {};
            all.forEach(s => { map[s.key] = s.value; });
            setValues(map);
            // Load saved printer
            if (map.printerName) {
                setSelectedPrinter(map.printerName);
            }
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
        await db.settings.put({ key: 'autoPrint', value: values.autoPrint || 'on' });
        await db.settings.put({ key: 'ramadanMode', value: values.ramadanMode || 'off' });
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
                    {lang === 'ar' ? 'إعدادات الفاتورة' : 'Paramètres du Ticket'}
                </h2>
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'ar' ? 'معلومات المطعم' : 'Informations Restaurant'}
                </h3>
                {SETTINGS_KEYS.slice(0, 4).map(s => (
                    <div className="form-group" key={s.key}>
                        <label className="form-label">{lang === 'ar' ? s.labelAr : s.labelFr}</label>
                        <input
                            className="input"
                            type={s.type}
                            value={values[s.key] || ''}
                            onChange={e => handleChange(s.key, e.target.value)}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        />
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'ar' ? 'واي فاي' : 'WiFi'}
                </h3>
                {SETTINGS_KEYS.slice(4, 6).map(s => (
                    <div className="form-group" key={s.key}>
                        <label className="form-label">{lang === 'ar' ? s.labelAr : s.labelFr}</label>
                        <input
                            className="input"
                            type={s.type}
                            value={values[s.key] || ''}
                            onChange={e => handleChange(s.key, e.target.value)}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        />
                    </div>
                ))}
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'ar' ? 'أسفل الفاتورة' : 'Bas du Ticket'}
                </h3>
                {SETTINGS_KEYS.slice(6).map(s => (
                    <div className="form-group" key={s.key}>
                        <label className="form-label">{lang === 'ar' ? s.labelAr : s.labelFr}</label>
                        <input
                            className="input"
                            type={s.type}
                            value={values[s.key] || ''}
                            onChange={e => handleChange(s.key, e.target.value)}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        />
                    </div>
                ))}
            </div>

            {/* Ramadan Mode */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: values.ramadanMode === 'on' ? '2px solid #d4a843' : undefined, background: values.ramadanMode === 'on' ? 'linear-gradient(135deg, rgba(212,168,67,0.05), rgba(212,168,67,0.12))' : undefined }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    ☪ {lang === 'ar' ? 'وضع رمضان' : 'Mode Ramadan'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            {lang === 'ar' ? 'رمضان كريم على التذكرة' : 'Ramadan Karim sur le ticket'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            {lang === 'ar' ? 'يظهر "رمضان كريم" على كل تذكرة' : 'Affiche "رمضان كريم" sur chaque ticket'}
                        </div>
                    </div>
                    <button
                        className={`btn ${values.ramadanMode === 'on' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => handleChange('ramadanMode', values.ramadanMode === 'on' ? 'off' : 'on')}
                        style={{ minWidth: 80, justifyContent: 'center', background: values.ramadanMode === 'on' ? '#d4a843' : undefined, borderColor: values.ramadanMode === 'on' ? '#d4a843' : undefined }}
                    >
                        {values.ramadanMode === 'on' ? (lang === 'ar' ? 'مفعّل ☪' : 'Activé ☪') : (lang === 'ar' ? 'معطّل' : 'Désactivé')}
                    </button>
                </div>
            </div>

            {/* Printer Settings — Always visible */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconPrint size={16} />
                    {lang === 'ar' ? 'الطابعة والطباعة' : 'Imprimante & Impression'}
                </h3>

                {/* Auto-print toggle */}
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>{lang === 'ar' ? 'طباعة تلقائية بعد الدفع' : 'Impression automatique après paiement'}</span>
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
                        {lang === 'ar'
                            ? 'عند التفعيل، يتم طباعة الفاتورة تلقائياً بعد كل عملية دفع'
                            : 'Le ticket s\'imprime automatiquement après chaque paiement'}
                    </div>
                </div>

                {/* Electron: Printer selector */}
                {isElectron ? (
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">
                            {lang === 'ar' ? 'اختر الطابعة (طباعة بدون نافذة)' : 'Sélectionner l\'imprimante (impression sans popup)'}
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
                                        ? (lang === 'ar' ? 'جاري البحث...' : 'Recherche...')
                                        : (lang === 'ar' ? '-- اختر طابعة --' : '-- Choisir une imprimante --')
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
                                disabled={loadingPrinters}
                                style={{ border: '1px solid var(--border)', padding: '8px 12px' }}
                                title={lang === 'ar' ? 'تحديث' : 'Rafraîchir'}
                            >
                                ↻
                            </button>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                            {lang === 'ar'
                                ? 'عند اختيار طابعة، ستتم الطباعة تلقائيًا بدون نافذة'
                                : 'L\'impression se fera en silence, sans popup.'}
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: '1rem', padding: '12px 14px', borderRadius: 10, background: 'var(--blue-bg)', border: '1px solid rgba(96,165,250,0.2)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--blue)', marginBottom: 6 }}>
                            {lang === 'ar' ? 'ℹ️ وضع المتصفح' : 'ℹ️ Mode navigateur'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {lang === 'ar'
                                ? 'في المتصفح، ستظهر نافذة الطباعة دائماً (قيود المتصفح). للطباعة الصامتة: استخدم تطبيق الإلكترون.'
                                : 'Dans le navigateur, la fenêtre d\'impression s\'affiche toujours (limitation Chrome). Pour l\'impression silencieuse, utilisez l\'application Electron.'
                            }
                            <br />
                            <strong style={{ color: 'var(--text)' }}>
                                {lang === 'ar'
                                    ? '💡 نصيحة: حدد الطابعة كطابعة افتراضية في Chrome حتى يكفي نقرة واحدة.'
                                    : '💡 Astuce : Définissez votre imprimante ticket comme imprimante par défaut dans Chrome pour n\'avoir qu\'à cliquer "Imprimer".'}
                            </strong>
                        </div>
                    </div>
                )}
            </div>

            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    {lang === 'ar' ? 'إدارة البيانات' : 'Gestion des Données'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button className="btn btn-ghost" style={{ justifyContent: 'center', border: '1px solid var(--border)' }} onClick={handleExport}>
                        <IconDownload size={18} />
                        {lang === 'ar' ? 'تصدير البيانات' : 'Exporter'}
                    </button>
                    <button className="btn btn-ghost" style={{ justifyContent: 'center', border: '1px solid var(--border)' }} onClick={handleImportClick} disabled={importing}>
                        <IconUpload size={18} />
                        {importing ? '...' : (lang === 'ar' ? 'استيراد البيانات' : 'Importer')}
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
                    ? (lang === 'ar' ? '✓ تم الحفظ' : '✓ Enregistré')
                    : (lang === 'ar' ? 'حفظ الإعدادات' : 'Enregistrer')
                }
            </button>
        </div>
    );
}
