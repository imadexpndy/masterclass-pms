import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSearchParams } from 'react-router-dom';
import db from '../db/db';
import { useAuth } from '../context/AuthContext';
import { addToSyncQueue } from '../db/sync';
import { useLang } from '../context/LangContext';
import {
    IconReceipt, IconCart, IconCash, IconCreditCard, IconPrint,
    IconX, IconSend, IconTrash, IconCheck,
    IconBreakfast, IconSalad, IconTagine, IconPizza, IconPasta,
    IconSteak, IconWrap, IconSandwich, IconJuice, IconCoffee, IconDessert
} from '../components/Icons';
import logo from '../assets/menu images/logo master classe ticket.svg';

const CATEGORY_ICONS = {
    breakfast: IconBreakfast, salad: IconSalad, tagine: IconTagine,
    pizza: IconPizza, pasta: IconPasta, steak: IconSteak, wrap: IconWrap,
    sandwich: IconSandwich, juice: IconJuice, coffee: IconCoffee, dessert: IconDessert,
};

export default function POS() {
    const { user } = useAuth();
    const { t, lang } = useLang();
    const [searchParams] = useSearchParams();
    const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray()) || [];
    const allItems = useLiveQuery(() => db.menuItems.toArray()) || [];
    const tables = useLiveQuery(() => db.diningTables.toArray()) || [];
    const activeOrders = useLiveQuery(() => db.orders.where('status').anyOf('pending', 'preparing', 'ready', 'served').toArray()) || [];
    const allOrderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
    const users = useLiveQuery(() => db.users.toArray()) || [];
    const settingsArr = useLiveQuery(() => db.settings.toArray()) || [];
    const settings = Object.fromEntries(settingsArr.map(s => [s.key, s.value]));

    const [activeCat, setActiveCat] = useState(null);
    const [cart, setCart] = useState([]);
    const [tableId, setTableId] = useState('');
    const [showBill, setShowBill] = useState(false);
    const [paidOrder, setPaidOrder] = useState(null);
    const [showCashModal, setShowCashModal] = useState(false);
    const [amountReceived, setAmountReceived] = useState('');
    const [paymentInfo, setPaymentInfo] = useState(null);

    // Smart print: uses Electron silent print if a printer is configured, otherwise falls back to window.print()
    const smartPrint = async () => {
        const printerName = settings.printerName;
        if (printerName && window.electron?.silentPrint) {
            try {
                const result = await window.electron.silentPrint(printerName);
                if (!result.success) {
                    console.warn('Silent print failed, falling back:', result.error);
                    window.print();
                }
            } catch (e) {
                console.warn('Silent print error, falling back:', e);
                window.print();
            }
        } else {
            window.print();
        }
    };

    // URL params: pre-select table and optionally trigger payment
    useEffect(() => {
        const tbl = searchParams.get('table');
        const pay = searchParams.get('pay');
        if (tbl) {
            setTableId(tbl);
            if (pay === 'cash') {
                // Will trigger cash modal once we have order loaded
                setTimeout(() => setShowCashModal(true), 300);
            } else if (pay === 'card') {
                setTimeout(() => handlePayExistingOrder('card'), 300);
            }
        }
    }, [searchParams]);

    // Load existing order when table changes
    useEffect(() => {
        if (!tableId) { setCart([]); return; }
        const existingOrder = activeOrders.find(o => o.tableId === tableId);
        if (existingOrder) {
            const items = allOrderItems.filter(i => i.orderId === existingOrder.id);
            setCart(items.map(i => ({
                itemId: i.menuItemId,
                name: i.itemName,
                price: i.unitPrice,
                qty: i.quantity,
                notes: i.notes || '',
                existingItemId: i.id, // track if it's from an existing order
            })));
        } else {
            setCart([]);
        }
    }, [tableId, activeOrders.length]);

    const catId = activeCat || categories[0]?.id;
    const filteredItems = allItems.filter(i => i.categoryId === catId);

    const addToCart = (item) => {
        setCart(prev => {
            const exists = prev.find(c => c.itemId === item.id);
            if (exists) return prev.map(c => c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c);
            return [...prev, { itemId: item.id, name: item.name, price: item.price, qty: 1, notes: '' }];
        });
    };

    const updateQty = (itemId, delta) => {
        setCart(prev => prev.map(c => c.itemId === itemId ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
    };

    const total = cart.reduce((s, c) => s + c.price * c.qty, 0);

    const existingOrder = useMemo(() => {
        if (!tableId) return null;
        return activeOrders.find(o => o.tableId === tableId) || null;
    }, [tableId, activeOrders]);

    const handlePayExistingOrder = async (method) => {
        if (!existingOrder) return;
        const order = existingOrder;
        const items = allOrderItems.filter(i => i.orderId === order.id);

        await db.orders.update(order.id, {
            status: 'paid',
            paymentMethod: method,
            updatedAt: new Date().toISOString(),
            total: total,
        });

        if (tableId) {
            await db.diningTables.update(tableId, { status: 'free' });
        }

        if (method === 'cash' && paymentInfo) {
            await db.payments.add({
                id: crypto.randomUUID(),
                orderId: order.id,
                method: 'cash',
                amountReceived: paymentInfo.received,
                changeGiven: paymentInfo.change,
                createdAt: new Date().toISOString(),
            });
        }

        const waiter = users.find(u => u.id === order.waiterId);
        const table = tables.find(t => t.id === order.tableId);
        setPaidOrder({
            ...order,
            total: total,
            paymentMethod: method,
            items,
            waiterName: waiter?.name || user?.name || '—',
            tableName: table?.name || '',
            changeGiven: paymentInfo?.change || 0,
            amountReceived: paymentInfo?.received || 0,
        });
        setShowBill(true);
        setShowCashModal(false);
        setCart([]);
        setPaymentInfo(null);
    };

    const sendOrder = async (paymentMethod = 'pending') => {
        if (cart.length === 0) return;

        if (paymentMethod === 'cash') {
            setShowCashModal(true);
            return;
        }

        // Check if there is an existing order for this table
        if (existingOrder) {
            // Update existing order: remove old items, add current cart
            const oldItems = allOrderItems.filter(i => i.orderId === existingOrder.id);
            for (const item of oldItems) {
                await db.orderItems.delete(item.id);
            }

            const newOrderItems = cart.map(c => ({
                id: crypto.randomUUID(),
                orderId: existingOrder.id,
                menuItemId: c.itemId,
                itemName: c.name,
                unitPrice: c.price,
                quantity: c.qty,
                notes: c.notes,
                status: 'pending',
            }));
            await db.orderItems.bulkAdd(newOrderItems);
            await db.orders.update(existingOrder.id, {
                total,
                updatedAt: new Date().toISOString(),
                status: paymentMethod === 'pending' ? existingOrder.status : 'paid',
                paymentMethod: paymentMethod === 'pending' ? existingOrder.paymentMethod : paymentMethod,
            });

            if (paymentMethod !== 'pending') {
                if (tableId) await db.diningTables.update(tableId, { status: 'free' });
                const waiter = users.find(u => u.id === existingOrder.waiterId);
                const table = tables.find(t => t.id === existingOrder.tableId);
                setPaidOrder({
                    ...existingOrder,
                    total,
                    paymentMethod,
                    items: newOrderItems,
                    waiterName: waiter?.name || user?.name || '—',
                    tableName: table?.name || '',
                    changeGiven: 0,
                    amountReceived: 0,
                });
                setShowBill(true);
                setCart([]);
            }
            return;
        }

        // Create new order
        const orderId = crypto.randomUUID();
        const now = new Date().toISOString();

        const order = {
            id: orderId,
            tableId: tableId || null,
            waiterId: user.id,
            status: paymentMethod === 'pending' ? 'pending' : 'paid',
            createdAt: now,
            updatedAt: now,
            total,
            paymentMethod,
            synced: false,
        };

        const orderItems = cart.map(c => ({
            id: crypto.randomUUID(),
            orderId,
            menuItemId: c.itemId,
            itemName: c.name,
            unitPrice: c.price,
            quantity: c.qty,
            notes: c.notes,
            status: 'pending',
        }));

        await db.orders.add(order);
        await db.orderItems.bulkAdd(orderItems);

        if (tableId) {
            await db.diningTables.update(tableId, { status: 'occupied' });
        }

        await addToSyncQueue('orders', 'create', { order, orderItems });

        if (paymentMethod !== 'pending') {
            const waiter = users.find(u => u.id === user.id);
            const table = tables.find(t => t.id === tableId);
            setPaidOrder({
                ...order,
                items: orderItems,
                waiterName: waiter?.name || user?.name || '—',
                tableName: table?.name || '',
                changeGiven: 0,
                amountReceived: 0,
            });
            setShowBill(true);
        }

        setCart([]);
    };

    const handleCashConfirm = () => {
        const received = parseFloat(amountReceived) || 0;
        if (received < total) return;
        const change = received - total;
        setPaymentInfo({ received, change });

        if (existingOrder) {
            // Paying an existing order
            setTimeout(() => handlePayExistingOrder('cash'), 0);
        } else {
            // Create new order and pay
            finalizeNewCashOrder(received, change);
        }
    };

    const finalizeNewCashOrder = async (received, change) => {
        if (cart.length === 0) return;

        const orderId = crypto.randomUUID();
        const now = new Date().toISOString();

        const order = {
            id: orderId,
            tableId: tableId || null,
            waiterId: user.id,
            status: 'paid',
            createdAt: now,
            updatedAt: now,
            total,
            paymentMethod: 'cash',
            synced: false,
        };

        const orderItems = cart.map(c => ({
            id: crypto.randomUUID(),
            orderId,
            menuItemId: c.itemId,
            itemName: c.name,
            unitPrice: c.price,
            quantity: c.qty,
            notes: c.notes,
            status: 'pending',
        }));

        await db.orders.add(order);
        await db.orderItems.bulkAdd(orderItems);

        await db.payments.add({
            id: crypto.randomUUID(),
            orderId,
            method: 'cash',
            amountReceived: received,
            changeGiven: change,
            createdAt: now,
        });

        if (tableId) {
            await db.diningTables.update(tableId, { status: 'free' });
        }

        await addToSyncQueue('orders', 'create', { order, orderItems });

        const waiter = users.find(u => u.id === user.id);
        const table = tables.find(t => t.id === tableId);
        setPaidOrder({
            ...order,
            items: orderItems,
            waiterName: waiter?.name || user?.name || '—',
            tableName: table?.name || '',
            amountReceived: received,
            changeGiven: change,
        });
        setShowBill(true);
        setShowCashModal(false);
        setCart([]);
        setAmountReceived('');
        setPaymentInfo(null);

        // Auto-print receipt
        setTimeout(() => {
            smartPrint();
        }, 500);
    };

    const numpadPress = (key) => {
        if (key === 'C') { setAmountReceived(''); return; }
        if (key === 'back') { setAmountReceived(p => p.slice(0, -1)); return; }
        if (key === '.' && amountReceived.includes('.')) return;
        setAmountReceived(p => p + key);
    };

    // ===== RECEIPT VIEW =====
    if (showBill && paidOrder) {
        return (
            <div className="receipt-card">
                <div className="print-receipt receipt-inner" style={{ color: '#000' }}>
                    <div className="receipt-header" style={{ marginBottom: '10px', textAlign: 'center' }}>
                        <img src={logo} alt="Logo" style={{ width: 120, height: 'auto', marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
                        <div className="receipt-brand" style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '2px', color: '#000' }}>{settings.storeName || 'MASTER CLASS'}</div>
                        <div className="receipt-sub" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#000' }}>{settings.storeSubtitle || 'RESTAURANT & CAFÉ'}</div>
                        <div className="receipt-address" style={{ fontSize: '0.7rem', marginTop: '5px' }}>
                            {settings.storeAddress || '123 Avenue Mohammed VI, Marrakech'}<br />
                            Tel: {settings.storePhone || '05 24 00 00 00'}
                        </div>

                        <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                            <span>{new Date(paidOrder.createdAt).toLocaleDateString(lang === 'ar' ? 'fr-MA' : 'fr-FR')}</span>
                            <span>{new Date(paidOrder.createdAt).toLocaleTimeString(lang === 'ar' ? 'fr-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                            <span>{t('orderNum')}: <strong>#{paidOrder.id.slice(-6).toUpperCase()}</strong></span>
                            <span>{paidOrder.tableName || 'Takeaway'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '2px' }}>
                            <span>{t('waiter')}: {paidOrder.waiterName}</span>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />
                    <div style={{ display: 'flex', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px' }}>
                        <span style={{ width: '10%', textAlign: lang === 'ar' ? 'right' : 'left' }}>{t('qty') || 'Qt'}</span>
                        <span style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left' }}>{t('item') || 'Item'}</span>
                        <span style={{ width: '25%', textAlign: lang === 'ar' ? 'left' : 'right' }}>{t('total') || 'Total'}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #000', marginBottom: '5px' }} />

                    {paidOrder.items.map(item => (
                        <div key={item.id} className="receipt-item" style={{ fontSize: '0.8rem', marginBottom: '4px', display: 'flex', alignItems: 'flex-start' }}>
                            <span style={{ width: '10%', textAlign: lang === 'ar' ? 'right' : 'left' }}>{item.quantity}</span>
                            <span style={{ flex: 1, textAlign: lang === 'ar' ? 'right' : 'left', padding: '0 4px', overflow: 'hidden', wordBreak: 'break-word' }}>
                                {lang === 'ar' && item.nameAr ? item.nameAr : item.itemName}
                            </span>
                            <span className="receipt-item-right" style={{ width: '25%', textAlign: lang === 'ar' ? 'left' : 'right', fontWeight: 600 }}>
                                {(item.unitPrice * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}

                    <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />

                    <div className="receipt-total" style={{ fontSize: '1.4rem', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '1rem', fontWeight: 700 }}>TOTAL</span>
                        <span>{paidOrder.total.toFixed(2)} <small style={{ fontSize: '0.8rem' }}>DH</small></span>
                    </div>

                    <div style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                        <span>{t('paymentMethod')}:</span>
                        <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{paidOrder.paymentMethod === 'cash' ? t('cash') : t('card')}</span>
                    </div>

                    {paidOrder.paymentMethod === 'cash' && paidOrder.amountReceived > 0 && (
                        <div style={{ marginTop: '5px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t('amountReceived')}:</span>
                                <span>{paidOrder.amountReceived.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                <span>{t('change')}:</span>
                                <span>{paidOrder.changeGiven.toFixed(2)} DH</span>
                            </div>
                        </div>
                    )}

                    <div style={{ borderTop: '1px dashed #000', margin: '15px 0' }} />

                    <div className="receipt-footer" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem' }}>WiFi: {settings.wifiName || 'MasterClass_Guest'} / {settings.wifiPassword || 'Password123'}</div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', margin: '10px 0' }}>*** {settings.receiptFooter || t('thankYou')} ***</div>
                        <div style={{ fontSize: '0.6rem' }}>{settings.receiptPoweredBy || 'Powered by MasterPOS'}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setShowBill(false); setPaidOrder(null); }}>
                        <IconX size={16} /> {t('close')}
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => smartPrint()}>
                        <IconPrint size={16} /> {t('printReceipt')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pos-layout">
            {/* Menu Side */}
            <div className="pos-menu">
                <div className="pos-categories">
                    {categories.map(cat => {
                        const CatIcon = CATEGORY_ICONS[cat.iconKey || cat.icon] || IconReceipt;
                        return (
                            <button
                                key={cat.id}
                                className={`cat-pill ${catId === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCat(cat.id)}
                                style={{ padding: '12px 24px', fontSize: '1.1rem' }}
                            >
                                <CatIcon size={24} />
                                <span>{lang === 'ar' && cat.nameAr ? cat.nameAr : cat.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="pos-items-grid">
                    {filteredItems.map(item => (
                        <button
                            key={item.id}
                            className={`pos-item-card ${!item.available ? 'unavailable' : ''}`}
                            onClick={() => item.available && addToCart(item)}
                        >
                            {/* Image Section */}
                            <div
                                className={`pos-item-image ${!item.image ? 'no-image' : ''}`}
                                style={item.image ? { backgroundImage: `url(${item.image})` } : {}}
                            >
                                {!item.image && <span>{(lang === 'ar' && item.nameAr ? item.nameAr : item.name).charAt(0)}</span>}
                            </div>

                            {/* Content Section */}
                            <div className="pos-item-content">
                                <div className="pos-item-name">{lang === 'ar' && item.nameAr ? item.nameAr : item.name}</div>
                                <div className="pos-item-price">{item.price.toFixed(2)} {lang === 'ar' ? 'د.م.' : 'DH'}</div>
                            </div>

                            {!item.available && <span className="badge badge-red" style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>Indisponible</span>}
                        </button>
                    ))}
                    {filteredItems.length === 0 && (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            {t('noData')}
                        </div>
                    )}
                </div>
            </div>

            {/* Order Panel */}
            <div className="order-panel">
                <div className="order-header">
                    <div className="order-title">
                        <IconReceipt size={18} />
                        {t('currentOrder')}
                        {existingOrder && <span className="badge badge-orange" style={{ marginLeft: 6 }}>Existante</span>}
                    </div>
                    <select className="order-table-select" value={tableId} onChange={e => setTableId(e.target.value)}>
                        <option value="">{t('takeaway')}</option>
                        {tables.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name} ({t.zone === 'terrasse' ? 'T' : 'S'}) {t.status === 'occupied' ? '• occupée' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="order-items-list">
                    {cart.length === 0 ? (
                        <div className="order-empty">
                            <div className="empty-icon"><IconCart size={32} /></div>
                            <p>{t('addItemsToStart')}</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.itemId} className="order-line">
                                <div className="order-line-info">
                                    <div className="order-line-name">{item.name}</div>
                                    <div className="order-line-price">{item.price.toFixed(2)} DH</div>
                                </div>
                                <div className="qty-controls">
                                    <button className="qty-btn" onClick={() => updateQty(item.itemId, -1)} style={{ width: 40, height: 40, fontSize: '1.5rem' }}>−</button>
                                    <span className="qty-value" style={{ fontSize: '1.2rem', minWidth: 40, textAlign: 'center' }}>{item.qty}</span>
                                    <button className="qty-btn" onClick={() => updateQty(item.itemId, 1)} style={{ width: 40, height: 40, fontSize: '1.5rem' }}>+</button>
                                </div>
                                <div className="order-line-total">{(item.price * item.qty).toFixed(2)}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="order-footer">
                    <div className="order-totals">
                        <div className="order-total-row">
                            <span>{t('items')}</span>
                            <span>{cart.reduce((s, c) => s + c.qty, 0)}</span>
                        </div>
                        <div className="order-total-row grand">
                            <span>{t('total')}</span>
                            <span>{total.toFixed(2)} DH</span>
                        </div>
                    </div>
                    <div className="order-actions">
                        <button className="btn btn-ghost" onClick={() => setCart([])} disabled={cart.length === 0}>
                            <IconTrash size={14} /> {t('cancel')}
                        </button>
                        <button className="btn btn-primary" onClick={() => sendOrder('pending')} disabled={cart.length === 0}>
                            <IconSend size={14} /> {t('sendOrder')}
                        </button>
                    </div>
                    <div className="order-actions" style={{ marginTop: 8 }}>
                        <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => sendOrder('cash')} disabled={cart.length === 0}>
                            <IconCash size={14} /> {t('cash')}
                        </button>
                        <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => sendOrder('card')} disabled={cart.length === 0}>
                            <IconCreditCard size={14} /> {t('card')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Cash Change Calculator Modal */}
            {showCashModal && (
                <div className="modal-overlay" onClick={() => { setShowCashModal(false); setAmountReceived(''); }}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: 680 }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <IconCash size={18} style={{ marginRight: 6, verticalAlign: '-3px' }} />
                                {t('cashPayment')}
                            </h3>
                            <button className="modal-close" onClick={() => { setShowCashModal(false); setAmountReceived(''); }}>
                                <IconX size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            {/* Left: Payment Info */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div className="change-display">
                                    <div className="total-label">{t('totalToPay')}</div>
                                    <div className="total-value">{total.toFixed(2)} DH</div>
                                </div>

                                <div className="change-received">
                                    <input
                                        className="change-received-input"
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        value={amountReceived}
                                        onChange={e => setAmountReceived(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                {amountReceived && (
                                    <div className={`change-result ${(parseFloat(amountReceived) || 0) >= total ? 'positive' : 'negative'}`}>
                                        <div className="change-label">{t('changeDue')}</div>
                                        <div className="change-value">
                                            {((parseFloat(amountReceived) || 0) - total).toFixed(2)} DH
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: Numpad */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div className="numpad">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'C'].map(k => (
                                        <button key={k} className="numpad-key" onClick={() => numpadPress(String(k))}>{k}</button>
                                    ))}
                                </div>
                                {/* Quick amounts */}
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {[50, 100, 200, 500].map(amt => (
                                        <button key={amt} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center', minWidth: 50 }}
                                            onClick={() => setAmountReceived(String(amt))}>
                                            {amt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => { setShowCashModal(false); setAmountReceived(''); }}>
                                {t('cancel')}
                            </button>
                            <button
                                className="btn btn-primary"
                                disabled={(parseFloat(amountReceived) || 0) < total}
                                onClick={handleCashConfirm}
                            >
                                <IconCheck size={16} /> {t('confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
