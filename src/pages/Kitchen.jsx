import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { IconChef, IconClock, IconCheck, IconBell, IconFire, IconTable, IconRefresh } from '../components/Icons';

export default function Kitchen() {
    const orders = useLiveQuery(
        () => db.orders.where('status').anyOf('pending', 'preparing').toArray()
    ) || [];
    const allOrderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
    const tables = useLiveQuery(() => db.diningTables.toArray()) || [];
    const [newOrderIds, setNewOrderIds] = useState(new Set());
    const prevCountRef = useRef(orders.length);
    const audioRef = useRef(null);

    // Notify on new orders
    useEffect(() => {
        if (orders.length > prevCountRef.current) {
            const newIds = new Set();
            orders.forEach(o => {
                if (!prevCountRef.current) return;
                newIds.add(o.id);
            });
            setNewOrderIds(newIds);
            // Play notification sound
            try {
                if (audioRef.current) audioRef.current.play().catch(() => { });
            } catch { }
            setTimeout(() => setNewOrderIds(new Set()), 3000);
        }
        prevCountRef.current = orders.length;
    }, [orders.length]);

    const getOrderItems = (orderId) => allOrderItems.filter(i => i.orderId === orderId);
    const getTable = (tableId) => tables.find(t => t.id === tableId);

    const getElapsedMinutes = (createdAt) => {
        const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
        return mins;
    };

    const markItemReady = async (itemId) => {
        await db.orderItems.update(itemId, { status: 'ready' });
    };

    const markOrderReady = async (orderId) => {
        const items = getOrderItems(orderId);
        for (const item of items) {
            await db.orderItems.update(item.id, { status: 'ready' });
        }
        await db.orders.update(orderId, { status: 'ready', updatedAt: new Date().toISOString() });
    };

    const startPreparing = async (orderId) => {
        await db.orders.update(orderId, { status: 'preparing', updatedAt: new Date().toISOString() });
    };

    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <>
            {/* Hidden audio for notifications */}
            <audio ref={audioRef} preload="auto">
                <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczA" type="audio/wav" />
            </audio>

            <div className="section-header">
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconChef size={22} />
                    Commandes en cours
                    <span className="badge badge-orange" style={{ marginLeft: 8 }}>{orders.length}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => window.location.reload()}>
                    <IconRefresh size={14} /> Actualiser
                </button>
            </div>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                    <IconChef size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p style={{ fontSize: '1.1rem' }}>Pas de commandes en attente</p>
                    <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Les nouvelles commandes apparaîtront ici automatiquement</p>
                </div>
            ) : (
                <div className="kitchen-grid">
                    {sortedOrders.map(order => {
                        const items = getOrderItems(order.id);
                        const table = getTable(order.tableId);
                        const elapsed = getElapsedMinutes(order.createdAt);
                        const isUrgent = elapsed > 15;
                        const isNew = newOrderIds.has(order.id);

                        return (
                            <div
                                key={order.id}
                                className={`kitchen-order-card ${isUrgent ? 'urgent' : ''} ${isNew ? 'new-order' : ''}`}
                            >
                                <div className="kitchen-order-header" style={{ padding: '16px' }}>
                                    <div className="table-label" style={{ fontSize: '1.4rem' }}>
                                        <IconTable size={24} />
                                        {table?.name || 'Emporter'}
                                        {order.status === 'preparing' && (
                                            <span className="badge badge-orange" style={{ marginLeft: 6 }}>
                                                <IconFire size={10} /> En préparation
                                            </span>
                                        )}
                                        {order.status === 'pending' && (
                                            <span className="badge badge-red" style={{ marginLeft: 6 }}>Nouveau</span>
                                        )}
                                    </div>
                                    <div className="time-label">
                                        <IconClock size={13} />
                                        {elapsed} min
                                        {isUrgent && <IconFire size={13} color="var(--red)" style={{ marginLeft: 4 }} />}
                                    </div>
                                </div>

                                <div className="kitchen-order-items">
                                    {items.map(item => (
                                        <div key={item.id} className="kitchen-item">
                                            <div className="kitchen-item-left">
                                                <div className="item-qty" style={{ fontSize: '1.2rem', width: 36, height: 36, lineHeight: '36px' }}>{item.quantity}</div>
                                                <span className="item-name" style={{ fontSize: '1.1rem', textDecoration: item.status === 'ready' ? 'line-through' : 'none', opacity: item.status === 'ready' ? 0.4 : 1 }}>
                                                    {item.itemName}
                                                </span>
                                            </div>
                                            <button
                                                className={`btn btn-sm ${item.status === 'ready' ? 'btn-success' : 'btn-ghost'}`}
                                                onClick={() => markItemReady(item.id)}
                                                disabled={item.status === 'ready'}
                                                style={{ padding: '8px 16px', fontSize: '1rem', minWidth: 80 }}
                                            >
                                                <IconCheck size={20} /> {item.status === 'ready' ? 'Prêt' : 'OK'}
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="kitchen-order-footer" style={{ padding: '16px' }}>
                                    {order.status === 'pending' && (
                                        <button className="btn btn-primary btn-sm" onClick={() => startPreparing(order.id)} style={{ flex: 1, padding: '12px', fontSize: '1rem' }}>
                                            <IconFire size={20} /> Commencer
                                        </button>
                                    )}
                                    <button className="btn btn-success btn-sm" onClick={() => markOrderReady(order.id)} style={{ flex: 1, padding: '12px', fontSize: '1rem' }}>
                                        <IconCheck size={20} /> Tout prêt
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
