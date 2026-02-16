import { createContext, useContext, useState, useEffect } from 'react';
import translations from '../i18n/translations';

const LangContext = createContext(null);

export function LangProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem('mc_pos_lang') || 'fr');

    useEffect(() => {
        localStorage.setItem('mc_pos_lang', lang);
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        document.documentElement.setAttribute('lang', lang);
    }, [lang]);

    const toggle = () => setLang(l => l === 'fr' ? 'ar' : 'fr');

    const t = (key) => translations[lang]?.[key] || translations.fr?.[key] || key;

    return (
        <LangContext.Provider value={{ lang, setLang, toggle, t }}>
            {children}
        </LangContext.Provider>
    );
}

export function useLang() {
    const ctx = useContext(LangContext);
    if (!ctx) throw new Error('useLang must be used within LangProvider');
    return ctx;
}
