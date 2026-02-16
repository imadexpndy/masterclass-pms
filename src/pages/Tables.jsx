import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import {
    IconTable, IconCircle, IconBuilding, IconTreePalm,
    IconEye, IconPlus, IconPrint, IconCash, IconCreditCard, IconX
} from '../components/Icons';

export default function Tables() {
    const tables = useLiveQuery(() => db.diningTables.toArray()) || [];
    const orders = useLiveQuery(() => db.orders.where('status').anyOf('pending', 'preparing', 'ready', 'served').toArray()) || [];
    const allOrderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
    const navigate = useNavigate();
    const { t } = useLang();
    const [activeZone, setActiveZone] = useState('all');
    const [detailTable, setDetailTable] = useState(null);

    const getTableOrder = (tableId) => orders.find(o => o.tableId === tableId);
    const getOrderItems = (orderId) => allOrderItems.filter(i => i.orderId === orderId);

    const filteredTables = activeZone === 'all' ? tables : tables.filter(t => t.zone === activeZone);

    const freeCount = filteredTables.filter(t => t.status === 'free').length;
    const occCount = filteredTables.filter(t => t.status === 'occupied').length;
    const resCount = filteredTables.filter(t => t.status === 'reserved').length;

    const handleTableClick = (table) => {
        if (table.status === 'free') {
            navigate(`/pos?table=${table.id}`);
        } else if (table.status === 'occupied') {
            setDetailTable(table);
        }
    };

    const toggleStatus = async (e, table) => {
        e.stopPropagation();
        const nextStatus = { free: 'reserved', reserved: 'free', occupied: 'free' };
        const newStatus = nextStatus[table.status] || 'free';
        await db.diningTables.update(table.id, { status: newStatus });

        if (newStatus === 'free' && table.status === 'occupied') {
            const order = getTableOrder(table.id);
            if (order) await db.orders.update(order.id, { status: 'served', updatedAt: new Date().toISOString() });
        }
    };

    const salleCount = tables.filter(t => t.zone === 'salle').length;
    const terrasseCount = tables.filter(t => t.zone === 'terrasse').length;

    return (
        <>
            {/* Zone Tabs */}
            <div className="tables-zone-tabs" style={{ gap: 16 }}>
                <button className={`zone-tab ${activeZone === 'all' ? 'active' : ''}`} onClick={() => setActiveZone('all')} style={{ padding: '16px 24px', fontSize: '1.1rem' }}>
                    <IconTable size={24} />
                    {t('allZones')}
                    <span className="zone-count" style={{ fontSize: '1rem', padding: '4px 10px' }}>{tables.length}</span>
                </button>
                <button className={`zone-tab ${activeZone === 'salle' ? 'active' : ''}`} onClick={() => setActiveZone('salle')} style={{ padding: '16px 24px', fontSize: '1.1rem' }}>
                    <IconBuilding size={24} />
                    {t('zoneSalle')}
                    <span className="zone-count" style={{ fontSize: '1rem', padding: '4px 10px' }}>{salleCount}</span>
                </button>
                <button className={`zone-tab ${activeZone === 'terrasse' ? 'active' : ''}`} onClick={() => setActiveZone('terrasse')} style={{ padding: '16px 24px', fontSize: '1.1rem' }}>
                    <IconTreePalm size={24} />
                    {t('zoneTerrasse')}
                    <span className="zone-count" style={{ fontSize: '1rem', padding: '4px 10px' }}>{terrasseCount}</span>
                </button>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--green-bg)' }}>
                        <IconCircle filled size={14} color="var(--green)" />
                    </div>
                    <div className="stat-content">
                        <div className="label">{t('free')}</div>
                        <div className="value" style={{ color: 'var(--green)' }}>{freeCount}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--orange-bg)' }}>
                        <IconCircle filled size={14} color="var(--orange)" />
                    </div>
                    <div className="stat-content">
                        <div className="label">{t('occupied')}</div>
                        <div className="value" style={{ color: 'var(--orange)' }}>{occCount}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--blue-bg)' }}>
                        <IconCircle filled size={14} color="var(--blue)" />
                    </div>
                    <div className="stat-content">
                        <div className="label">{t('reserved')}</div>
                        <div className="value" style={{ color: 'var(--blue)' }}>{resCount}</div>
                    </div>
                </div>
            </div>

            <div className="tables-grid">
                {filteredTables.map(table => {
                    const order = getTableOrder(table.id);
                    const statusLabels = { free: t('free'), occupied: t('occupied'), reserved: t('reserved') };
                    const badgeClass = { free: 'badge-green', occupied: 'badge-orange', reserved: 'badge-blue' };
                    return (
                        <div
                            key={table.id}
                            className={`table-card ${table.status}`}
                            onClick={() => handleTableClick(table)}
                            style={{ padding: '24px', minHeight: 180 }}
                        >
                            <div className="table-icon" style={{ marginBottom: 16 }}>
                                <IconTable size={48} />
                            </div>
                            <div className="table-name" style={{ fontSize: '1.5rem', marginBottom: 8 }}>{table.name}</div>
                            <div className="table-seats" style={{ fontSize: '1rem' }}>{table.seats} {t('seats')} • {table.zone === 'terrasse' ? t('zoneTerrasse') : t('zoneSalle')}</div>
                            <span className={`badge ${badgeClass[table.status] || ''}`} style={{ padding: '6px 12px', fontSize: '0.9rem', marginTop: 12 }}>
                                <IconCircle filled size={8} />
                                {statusLabels[table.status]}
                            </span>
                            {order && (
                                <div className="table-order-total" style={{ fontSize: '1.2rem', marginTop: 12 }}>
                                    {(order.total || 0).toFixed(2)} DH
                                </div>
                            )}
                            <button
                                className="btn btn-ghost btn-sm"
                                style={{ marginTop: 16, width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '12px' }}
                                onClick={(e) => toggleStatus(e, table)}
                            >
                                {table.status === 'free' ? t('reserve') : t('freeTable')}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Table Detail Modal */}
            {detailTable && (
                <div className="modal-overlay" onClick={() => setDetailTable(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: 420 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <IconTable size={18} style={{ marginRight: 6, verticalAlign: '-3px' }} />
                                {detailTable.name}
                            </h3>
                            <button className="modal-close" onClick={() => setDetailTable(null)}>
                                <IconX size={18} />
                            </button>
                        </div>

                        {(() => {
                            const order = getTableOrder(detailTable.id);
                            if (!order) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>{t('noActiveOrders')}</p>;
                            const items = getOrderItems(order.id);
                            return (
                                <>
                                    <div className="table-detail-items">
                                        {items.map(item => (
                                            <div key={item.id} className="table-detail-line">
                                                <span>{item.quantity}x {item.itemName}</span>
                                                <span style={{ fontWeight: 600, color: 'var(--gold)' }}>
                                                    {(item.unitPrice * item.quantity).toFixed(2)} DH
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="table-detail-total">
                                        <span>{t('total')}</span>
                                        <span>{(order.total || 0).toFixed(2)} DH</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
                                        <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => { setDetailTable(null); navigate(`/pos?table=${detailTable.id}`); }}>
                                            <IconPlus size={14} /> {t('addItems')}
                                        </button>
                                        <button className="btn btn-success btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => { setDetailTable(null); navigate(`/pos?table=${detailTable.id}&pay=cash`); }}>
                                            <IconCash size={14} /> {t('cash')}
                                        </button>
                                        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => { setDetailTable(null); navigate(`/pos?table=${detailTable.id}&pay=card`); }}>
                                            <IconCreditCard size={14} /> {t('card')}
                                        </button>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </>
    );
}
