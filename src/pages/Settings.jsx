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
        // Save selected printer
        if (selectedPrinter) {
            await db.settings.put({ key: 'printerName', value: selectedPrinter });
        }
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

            {/* Printer Selection — Only visible in Electron */}
            {isElectron && (
                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <IconPrint size={16} />
                        {lang === 'ar' ? 'الطابعة' : 'Imprimante'}
                    </h3>
                    <div className="form-group">
                        <label className="form-label">
                            {lang === 'ar' ? 'اختر الطابعة (طباعة تلقائية بدون نافذة)' : 'Sélectionner l\'imprimante (impression automatique sans popup)'}
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                            {lang === 'ar'
                                ? 'عند اختيار طابعة، ستتم الطباعة تلقائيًا بدون نافذة ويندوز'
                                : 'En sélectionnant une imprimante, le ticket s\'imprimera automatiquement sans popup Windows.'
                            }
                        </div>
                    </div>
                </div>
            )}

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
