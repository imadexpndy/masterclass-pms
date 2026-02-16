import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { IconPlus, IconSettings, IconTrash, IconCheck, IconX, IconUsers } from '../components/Icons';

export default function UserMgmt() {
    const { t } = useLang();
    const users = useLiveQuery(() => db.users.toArray()) || [];
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', pin: '', role: 'waiter' });

    const openAdd = () => { setEditing(null); setForm({ name: '', pin: '', role: 'waiter' }); setShowModal(true); };
    const openEdit = (u) => { setEditing(u); setForm({ name: u.name, pin: u.pin, role: u.role }); setShowModal(true); };

    const save = async () => {
        if (!form.name || !form.pin || form.pin.length !== 4) return;
        if (editing) {
            await db.users.update(editing.id, { name: form.name, pin: form.pin, role: form.role });
        } else {
            await db.users.add({ id: crypto.randomUUID(), name: form.name, pin: form.pin, role: form.role, active: true });
        }
        setShowModal(false);
    };

    const toggleActive = async (u) => {
        await db.users.update(u.id, { active: !u.active });
    };

    const deleteUser = async (u) => {
        if (confirm(`${t('confirmDelete')} ${u.name} ?`)) {
            await db.users.delete(u.id);
        }
    };

    const roleLabels = { admin: t('roleAdmin'), waiter: t('roleWaiter'), cashier: t('roleCashier'), kitchen: t('roleKitchen') };

    return (
        <>
            <div className="section-header">
                <h3 className="section-title" style={{ fontSize: '1.5rem' }}>{users.length} {t('users')}</h3>
                <button className="btn btn-primary" onClick={openAdd} style={{ fontSize: '1.1rem', padding: '16px 24px' }}><IconPlus size={20} /> {t('add')}</button>
            </div>

            <div className="card" style={{ overflow: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr><th>{t('name')}</th><th>{t('role')}</th><th>{t('pin')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={{ fontWeight: 600 }}>{u.name}</td>
                                <td><span className="badge badge-gold">{roleLabels[u.role] || u.role}</span></td>
                                <td style={{ fontFamily: 'monospace', letterSpacing: 2 }}>****</td>
                                <td><span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>{u.active ? t('active') : t('inactive')}</span></td>
                                <td style={{ display: 'flex', gap: 12 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(u)} style={{ padding: '12px' }}><IconSettings size={20} /></button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)} style={{ padding: '12px' }}>{u.active ? <IconX size={20} /> : <IconCheck size={20} />}</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)} style={{ padding: '12px' }}><IconTrash size={20} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editing ? t('editUser') : t('newUser')}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('name')}</label>
                            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('name')} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('pin')} (4 {t('digits')})</label>
                            <input className="input" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="1234" maxLength={4} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('role')}</label>
                            <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                                <option value="admin">{t('roleAdmin')}</option>
                                <option value="waiter">{t('roleWaiter')}</option>
                                <option value="cashier">{t('roleCashier')}</option>
                                <option value="kitchen">{t('roleKitchen')}</option>
                            </select>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('cancel')}</button>
                            <button className="btn btn-primary" onClick={save}>{t('save')}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
