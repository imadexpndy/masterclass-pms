import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../db/activityLog';
import { IconPlus, IconTrash, IconSettings, IconX, IconMenuBoard, IconBox, IconSearch } from '../components/Icons';
import { generateImageFromText } from '../services/aiImage';

export default function MenuMgmt() {
    const { t, lang } = useLang();
    const { user } = useAuth();
    const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray()) || [];
    const items = useLiveQuery(() => db.menuItems.toArray()) || [];
    const settingsArr = useLiveQuery(() => db.settings.toArray()) || [];
    const settings = Object.fromEntries(settingsArr.map(s => [s.key, s.value]));

    const [activeTab, setActiveTab] = useState('items');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', nameAr: '', price: '', categoryId: '', description: '', image: '' });
    const [catForm, setCatForm] = useState({ name: '', nameAr: '', icon: '' });
    const [showCatModal, setShowCatModal] = useState(false);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Inventory functions
    const toggleAvailable = async (item) => {
        await db.menuItems.update(item.id, { available: !item.available });
        logActivity(user?.id, user?.name, 'item_toggle', item.name, { available: !item.available });
    };

    const updateStock = async (item, delta) => {
        const newQty = Math.max(0, (item.stockQty || 0) + delta);
        await db.menuItems.update(item.id, { stockQty: newQty });
        logActivity(user?.id, user?.name, 'stock_update', item.name, { from: item.stockQty, to: newQty, delta });
    };

    const inventoryFiltered = items.filter(i => {
        if (filter !== 'all' && i.categoryId !== filter) return false;
        if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });
    const lowStock = items.filter(i => i.stockQty <= 10 && i.available);

    // Items
    const openAddItem = () => {
        setEditing(null);
        setForm({ name: '', nameAr: '', price: '', categoryId: categories[0]?.id || '', description: '', image: '' });
        setShowModal(true);
    };
    const openEditItem = (item) => {
        setEditing(item);
        setForm({ name: item.name, nameAr: item.nameAr || '', price: String(item.price), categoryId: item.categoryId, description: item.description || '', image: item.image || '' });
        setShowModal(true);
    };

    const saveItem = async () => {
        if (!form.name || !form.price || !form.categoryId) {
            alert(t('errorFields'));
            return;
        }
        if (editing) {
            await db.menuItems.update(editing.id, {
                name: form.name.trim(),
                nameAr: form.nameAr.trim(),
                price: parseFloat(form.price),
                categoryId: form.categoryId,
                description: form.description.trim(),
                image: form.image
            });
            logActivity(user?.id, user?.name, 'item_edit', form.name);
        } else {
            await db.menuItems.add({
                id: crypto.randomUUID(),
                name: form.name.trim(),
                nameAr: form.nameAr.trim(),
                price: parseFloat(form.price),
                categoryId: form.categoryId,
                description: form.description.trim(),
                image: form.image,
                available: true,
                stockQty: 0
            });
            logActivity(user?.id, user?.name, 'item_add', form.name);
        }
        setShowModal(false);
        setEditing(null);
    };

    const handleGenerateImage = async () => {
        if (!form.name) {
            alert(lang === 'fr' ? 'Veuillez d\'abord entrer un nom pour générer l\'image.' : 'Please enter a name first to generate an image.');
            return;
        }

        const apiKey = settings.huggingFaceApiKey;
        if (!apiKey) {
            alert(lang === 'fr' ? 'Clé API HuggingFace manquante. Veuillez l\'ajouter dans les Paramètres.' : 'HuggingFace API Key missing. Please add it in Settings.');
            return;
        }

        const catName = categories.find(c => c.id === form.categoryId)?.name || '';

        try {
            setIsGenerating(true);
            const base64Image = await generateImageFromText(form.name, catName, apiKey);
            setForm(f => ({ ...f, image: base64Image }));
        } catch (err) {
            alert((lang === 'fr' ? 'Erreur de génération IA: ' : 'AI Generation Error: ') + err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const deleteItem = async (item) => {
        await db.menuItems.delete(item.id);
        logActivity(user?.id, user?.name, 'menu_delete', item.name);
    };

    // Categories
    const openAddCat = () => { setCatForm({ name: '', nameAr: '', iconKey: '' }); setShowCatModal(true); };
    const saveCat = async () => {
        if (!catForm.name) return;
        await db.categories.add({ id: crypto.randomUUID(), name: catForm.name, nameAr: catForm.nameAr, iconKey: catForm.iconKey || 'pizza', sortOrder: categories.length });
        logActivity(user?.id, user?.name, 'category_add', catForm.name);
        setShowCatModal(false);
    };

    const deleteCat = async (cat) => {
        const hasItems = items.some(i => i.categoryId === cat.id);
        if (hasItems) {
            alert(t('categoryHasItems'));
            return;
        }
        await db.categories.delete(cat.id);
        logActivity(user?.id, user?.name, 'category_delete', cat.name);
    };

    const filteredItems = filter === 'all' ? items : items.filter(i => i.categoryId === filter);

    return (
        <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 16, marginBottom: '2rem' }}>
                <button className={`btn ${activeTab === 'items' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveTab('items')} style={{ fontSize: '1.2rem', padding: '16px 32px' }}>{t('items')} ({items.length})</button>
                <button className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveTab('categories')} style={{ fontSize: '1.2rem', padding: '16px 32px' }}>{t('categories')} ({categories.length})</button>
                <button className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setActiveTab('inventory')} style={{ fontSize: '1.2rem', padding: '16px 32px' }}>{t('inventory')} / {t('stock')}</button>
            </div>

            {activeTab === 'items' && (
                <>
                    <div className="section-header">
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select className="input" style={{ maxWidth: 300, fontSize: '1.1rem', padding: '16px' }} value={filter} onChange={e => setFilter(e.target.value)}>
                                <option value="all">{t('allCategories')}</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <button className="btn btn-primary" onClick={openAddItem} style={{ fontSize: '1.1rem', padding: '16px 24px' }}>+ {t('item')}</button>
                    </div>

                    <div className="card" style={{ overflow: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>{t('name')}</th><th>{t('category')}</th><th>{t('price')}</th><th>{t('description')}</th><th>{t('actions')}</th></tr></thead>
                            <tbody>
                                {filteredItems.map(item => {
                                    const cat = categories.find(c => c.id === item.categoryId);
                                    return (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 600 }}>{item.name}</td>
                                            <td><span className="badge badge-gold">{cat?.name}</span></td>
                                            <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{item.price.toFixed(2)} DH</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
                                            <td style={{ display: 'flex', gap: 12 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEditItem(item)} style={{ padding: '10px' }}><IconSettings size={20} /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteItem(item)} style={{ padding: '10px' }}><IconTrash size={20} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {activeTab === 'categories' && (
                <>
                    <div className="section-header">
                        <h3 className="section-title" style={{ fontSize: '1.5rem' }}>{categories.length} {t('categories')}</h3>
                        <button className="btn btn-primary" onClick={openAddCat} style={{ fontSize: '1.1rem', padding: '16px 24px' }}>+ {t('category')}</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {categories.map(cat => {
                            const count = items.filter(i => i.categoryId === cat.id).length;
                            return (
                                <div key={cat.id} className="card" style={{ textAlign: 'center' }}>
                                    <div style={{ marginBottom: 12, color: 'var(--gold)' }}><IconMenuBoard size={48} /></div>
                                    <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '1.2rem' }}>{cat.name}</div>
                                    <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 16 }}>{count} {t('items')}</div>
                                    <button className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }} onClick={() => deleteCat(cat)}>{t('delete')}</button>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {activeTab === 'inventory' && (
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
                                {inventoryFiltered.map(item => {
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
            )}

            {/* Item Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? t('editItem') : t('newItem')}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('name')} (FR)</label>
                            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('name')} (AR)</label>
                            <input className="input" value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} dir="rtl" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('price')} (DH)</label>
                            <input className="input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{lang === 'fr' ? 'Image URL ou Image IA' : 'Image URL or AI Image'}</label>
                            <div style={{ display: 'flex', gap: 10, width: '100%', alignItems: 'center' }}>
                                <input className="input" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://... ou base64" style={{ flex: 1 }} />
                                <button className="btn btn-primary" style={{ padding: '0 15px', height: '42px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, opacity: isGenerating ? 0.7 : 1 }} onClick={handleGenerateImage} disabled={isGenerating}>
                                    ✨ {isGenerating ? (lang === 'fr' ? 'Génération...' : 'Generating...') : 'IA'}
                                </button>
                            </div>
                            {form.image && form.image.startsWith('data:') && (
                                <img src={form.image} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: 10, border: '2px solid var(--border)' }} />
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('category')}</label>
                            <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('description')}</label>
                            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={saveItem}>{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCatModal && (
                <div className="modal-overlay" onClick={() => setShowCatModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{t('newCategory')}</h3>
                            <button className="modal-close" onClick={() => setShowCatModal(false)}>×</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('icon')}</label>
                            <select className="input" value={catForm.iconKey} onChange={e => setCatForm(f => ({ ...f, iconKey: e.target.value }))}>
                                {['breakfast', 'salad', 'tagine', 'pizza', 'pasta', 'steak', 'wrap', 'sandwich', 'juice', 'coffee', 'dessert'].map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('name')} (FR)</label>
                            <input className="input" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('name')} (AR)</label>
                            <input className="input" value={catForm.nameAr} onChange={e => setCatForm(f => ({ ...f, nameAr: e.target.value }))} dir="rtl" />
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowCatModal(false)}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={saveCat}>{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
