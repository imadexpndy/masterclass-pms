import { useState, useEffect } from 'react';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { IconCheck, IconSettings } from '../components/Icons';

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

    useEffect(() => {
        (async () => {
            const all = await db.settings.toArray();
            const map = {};
            all.forEach(s => { map[s.key] = s.value; });
            setValues(map);
        })();
    }, []);

    const handleChange = (key, val) => {
        setValues(prev => ({ ...prev, [key]: val }));
        setSaved(false);
    };

    const handleSave = async () => {
        for (const s of SETTINGS_KEYS) {
            await db.settings.put({ key: s.key, value: values[s.key] || '' });
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
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
