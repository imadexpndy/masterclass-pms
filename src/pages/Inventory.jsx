import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../db/activityLog';
import { IconBox, IconSearch } from '../components/Icons';

export default function Inventory() {
    const { t } = useLang();
    const { user } = useAuth();
    const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray()) || [];
    const items = useLiveQuery(() => db.menuItems.toArray()) || [];
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = items.filter(i => {
        if (filter !== 'all' && i.categoryId !== filter) return false;
        if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const toggleAvailable = async (item) => {
        await db.menuItems.update(item.id, { available: !item.available });
        logActivity(user?.id, user?.name, 'item_toggle', item.name, { available: !item.available });
    };

    const updateStock = async (item, delta) => {
        const newQty = Math.max(0, (item.stockQty || 0) + delta);
        await db.menuItems.update(item.id, { stockQty: newQty });
        logActivity(user?.id, user?.name, 'stock_update', item.name, { from: item.stockQty, to: newQty, delta });
    };

    const lowStock = items.filter(i => i.stockQty <= 10 && i.available);

    return (
        <>
            {lowStock.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <IconBox size={18} color="var(--red)" />
                        <span style={{ fontWeight: 700, color: 'var(--red)' }}>{t('lowStock')} ({lowStock.length} {t('articles')})</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {lowStock.map(i => (
                            <span key={i.id} className="badge badge-red">{i.name}: {i.stockQty}</span>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input className="input" style={{ maxWidth: 400, fontSize: '1.1rem', padding: '16px' }} placeholder={t('searchItem')} value={search} onChange={e => setSearch(e.target.value)} />
                <select className="input" style={{ maxWidth: 300, fontSize: '1.1rem', padding: '16px' }} value={filter} onChange={e => setFilter(e.target.value)}>
                    <option value="all">{t('allCategories')}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('item')}</th>
                            <th>{t('category')}</th>
                            <th>{t('price')}</th>
                            <th>{t('stock')}</th>
                            <th>{t('status')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => {
                            const cat = categories.find(c => c.id === item.categoryId);
                            return (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                                    <td><span className="badge badge-gold">{cat?.name}</span></td>
                                    <td style={{ color: 'var(--gold)' }}>{item.price.toFixed(2)} DH</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <button className="qty-btn" onClick={() => updateStock(item, -10)} style={{ width: 40, height: 40, fontSize: '1.2rem' }}>−</button>
                                            <span style={{ fontWeight: 600, minWidth: 40, textAlign: 'center', fontSize: '1.2rem', color: item.stockQty <= 10 ? 'var(--red)' : 'var(--text)' }}>
                                                {item.stockQty}
                                            </span>
                                            <button className="qty-btn" onClick={() => updateStock(item, 10)} style={{ width: 40, height: 40, fontSize: '1.2rem' }}>+</button>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${item.available ? 'badge-green' : 'badge-red'}`}>
                                            {item.available ? t('available') : t('unavailable')}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={`btn btn-sm ${item.available ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleAvailable(item)}>
                                            {item.available ? t('disable') : t('enable')}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </>
    );
}
