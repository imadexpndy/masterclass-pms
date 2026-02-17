import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { IconMoney, IconClipboard, IconTable, IconReceipt, IconCart, IconChef, IconChart, IconTarget, IconX, IconUsers, IconCreditCard } from '../components/Icons';

export default function Dashboard() {
    const { t, lang } = useLang();
    const orders = useLiveQuery(() => db.orders.toArray()) || [];
    const tables = useLiveQuery(() => db.diningTables.toArray()) || [];
    const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];
    const orderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
    const users = useLiveQuery(() => db.users.toArray()) || [];
    const settingsArr = useLiveQuery(() => db.settings.toArray()) || [];
    const settings = Object.fromEntries(settingsArr.map(s => [s.key, s.value]));
    const navigate = useNavigate();

    const [selectedOrder, setSelectedOrder] = useState(null);

    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
    const revenue = todayOrders.filter(o => o.status === 'paid').reduce((s, o) => s + (o.total || 0), 0);
    const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length;
    const occupiedTables = tables.filter(t => t.status === 'occupied').length;
    const totalTables = tables.length;
    const totalItems = menuItems.length;

    const stats = [
        {
            icon: <IconMoney size={32} />,
            bg: 'var(--green-bg)',
            color: 'var(--green)',
            label: t('revenueToday'),
            value: `${revenue.toFixed(2)} DH`,
        },
        {
            icon: <IconClipboard size={32} />,
            bg: 'var(--orange-bg)',
            color: 'var(--orange)',
            label: t('activeOrders'),
            value: activeOrders,
        },
        {
            icon: <IconTable size={32} />,
            bg: 'var(--blue-bg)',
            color: 'var(--blue)',
            label: t('occupiedTables'),
            value: `${occupiedTables}/${totalTables}`,
        },
        {
            icon: <IconReceipt size={32} />,
            bg: 'rgba(167, 139, 250, 0.1)',
            color: 'var(--purple)',
            label: t('menuItems'),
            value: totalItems,
        },
    ];

    const quickActions = [
        { icon: <IconCart size={32} />, bg: 'var(--green-bg)', label: t('newOrder'), path: '/pos' },
        { icon: <IconTable size={32} />, bg: 'var(--blue-bg)', label: t('manageTables'), path: '/tables' },
        { icon: <IconChef size={32} />, bg: 'var(--orange-bg)', label: t('kitchenDisplay'), path: '/kitchen' },
        { icon: <IconChart size={32} />, bg: 'rgba(167, 139, 250, 0.1)', label: t('viewReports'), path: '/reports' },
    ];

    return (
        <>
            {/* Stats Grid */}
            <div className="stats-grid">
                {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                            {s.icon}
                        </div>
                        <div className="stat-content">
                            <div className="label" style={{ fontSize: '1rem' }}>{s.label}</div>
                            <div className="value" style={{ color: s.color, fontSize: '2rem' }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="section-header">
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconTarget size={18} />
                    {t('quickActions')}
                </h3>
            </div>
            <div className="quick-actions-grid">
                {quickActions.map((a, i) => (
                    <div key={i} className="quick-action-card" onClick={() => navigate(a.path)} style={{ padding: '2rem' }}>
                        <div className="quick-action-icon" style={{ background: a.bg, width: 64, height: 64, margin: '0 auto 16px' }}>
                            {a.icon}
                        </div>
                        <div className="quick-action-label" style={{ fontSize: '1.2rem', fontWeight: 600 }}>{a.label}</div>
                    </div>
                ))}
            </div>

            {/* Recent Orders */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconClipboard size={18} />
                    {t('recentOrders')}
                </h3>
            </div>
            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>{t('orderNum')}</th>
                            <th>{t('table')}</th>
                            <th>{t('status')}</th>
                            <th>{t('total')}</th>
                            <th>{t('time')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {todayOrders.slice(-10).reverse().map(order => {
                            const table = tables.find(t => t.id === order.tableId);
                            const statusBadge = {
                                pending: 'badge-orange',
                                preparing: 'badge-orange',
                                ready: 'badge-blue',
                                paid: 'badge-green',
                                served: 'badge-green',
                            };
                            const statusLabel = {
                                pending: t('statusPending'),
                                preparing: t('statusPreparing'),
                                ready: t('statusReady'),
                                paid: t('statusPaid'),
                                served: t('statusServed'),
                            };
                            return (
                                <tr key={order.id} onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>#{order.id.slice(-5).toUpperCase()}</td>
                                    <td>{table?.name || t('takeaway')}</td>
                                    <td>
                                        <span className={`badge ${statusBadge[order.status] || ''}`}>
                                            {statusLabel[order.status] || order.status}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{(order.total || 0).toFixed(2)} DH</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        {new Date(order.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                </tr>
                            );
                        })}
                        {todayOrders.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                    {t('noOrdersToday')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>


            {/* Order Details Modal */}
            {
                selectedOrder && (
                    <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                        <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: 500 }}>
                            <div className="modal-header">
                                <h3 className="modal-title">
                                    <IconClipboard size={20} style={{ marginRight: 8, verticalAlign: '-4px' }} />
                                    {t('orderNum')} #{selectedOrder.id.slice(-5).toUpperCase()}
                                </h3>
                                <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                                    <IconX size={20} />
                                </button>
                            </div>

                            <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                <div className="detail-item">
                                    <div className="detail-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('status')}</div>
                                    <div className="detail-value">
                                        <span className={`badge badge-${selectedOrder.status === 'paid' ? 'green' : 'orange'}`}>
                                            {selectedOrder.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('date')}</div>
                                    <div className="detail-value" style={{ fontWeight: 500 }}>
                                        {new Date(selectedOrder.createdAt).toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('table')}</div>
                                    <div className="detail-value" style={{ fontWeight: 500 }}>
                                        {tables.find(t => t.id === selectedOrder.tableId)?.name || t('takeaway')}
                                    </div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{t('waiter')}</div>
                                    <div className="detail-value" style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <IconUsers size={14} />
                                        {users.find(u => u.id === selectedOrder.waiterId)?.name || '—'}
                                    </div>
                                </div>
                            </div>

                            <div className="receipt-divider" style={{ borderTop: '1px solid var(--border)', margin: '16px 0' }} />

                            <div className="order-items-table" style={{ marginBottom: 24 }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty</th>
                                            <th style={{ textAlign: 'left', padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Item</th>
                                            <th style={{ textAlign: 'right', padding: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orderItems.filter(i => i.orderId === selectedOrder.id).map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px 8px', fontWeight: 600 }}>{item.quantity}x</td>
                                                <td style={{ padding: '12px 8px' }}>
                                                    <div>{item.itemName}</div>
                                                    {item.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.notes}</div>}
                                                </td>
                                                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 600 }}>
                                                    {(item.unitPrice * item.quantity).toFixed(2)} DH
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="order-summary" style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 12 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <span>{t('total')}</span>
                                    <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--gold)' }}>{selectedOrder.total.toFixed(2)} DH</span>
                                </div>
                                {selectedOrder.status === 'paid' && (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <IconCreditCard size={14} /> {t('paymentMethod')}
                                            </span>
                                            <span style={{ textTransform: 'capitalize' }}>{selectedOrder.paymentMethod === 'cash' ? t('cash') : t('card')}</span>
                                        </div>
                                        {selectedOrder.amountReceived > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--green)' }}>
                                                <span>{t('change')}</span>
                                                <span>{(selectedOrder.changeGiven || 0).toFixed(2)} DH</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button className="btn btn-ghost" onClick={() => setSelectedOrder(null)}>
                                    {t('close')}
                                </button>
                                <button className="btn btn-primary" onClick={async () => {
                                    const printerName = settings?.printerName;
                                    if (printerName && window.electron?.silentPrint) {
                                        try {
                                            const result = await window.electron.silentPrint(printerName);
                                            if (!result.success) window.print();
                                        } catch { window.print(); }
                                    } else { window.print(); }
                                }}>
                                    <IconReceipt size={16} /> {t('printReceipt')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
