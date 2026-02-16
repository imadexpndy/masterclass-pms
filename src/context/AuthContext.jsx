import { createContext, useContext, useState, useEffect } from 'react';
import db from '../db/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user was previously logged in
        const saved = localStorage.getItem('mc_pos_user');
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch { }
        }
        setLoading(false);
    }, []);

    const login = async (userId, pin) => {
        const u = await db.users.get(userId);
        if (!u) return { ok: false, error: 'Utilisateur introuvable' };
        if (!u.active) return { ok: false, error: 'Compte désactivé' };
        if (u.pin !== pin) return { ok: false, error: 'PIN incorrect' };

        const userData = { id: u.id, name: u.name, role: u.role };
        setUser(userData);
        localStorage.setItem('mc_pos_user', JSON.stringify(userData));
        return { ok: true };
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('mc_pos_user');
    };

    const hasRole = (...roles) => user && roles.includes(user.role);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
