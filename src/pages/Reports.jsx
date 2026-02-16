import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLang } from '../context/LangContext';
import { IconChart, IconMoney, IconClipboard, IconCalendar } from '../components/Icons';

const COLORS = ['#c9a96e', '#34d399', '#60a5fa', '#fb923c', '#a78bfa', '#f87171', '#e4c98a', '#38bdf8'];

export default function Reports() {
    const orders = useLiveQuery(() => db.orders.toArray()) || [];
    const orderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
    const categories = useLiveQuery(() => db.categories.toArray()) || [];
    const menuItems = useLiveQuery(() => db.menuItems.toArray()) || [];

    const [period, setPeriod] = useState('today');

    const filteredOrders = useMemo(() => {
        const now = new Date();
        return orders.filter(o => {
            if (o.status !== 'paid') return false;
            const d = new Date(o.createdAt);
            if (period === 'today') return d.toDateString() === now.toDateString();
            if (period === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return d >= weekAgo;
            }
            if (period === 'month') {
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [orders, period]);

    const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
    const avgOrder = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;

    // Revenue by hour
    const hourlyData = useMemo(() => {
        const hours = {};
        filteredOrders.forEach(o => {
            const h = new Date(o.createdAt).getHours();
            hours[h] = (hours[h] || 0) + (o.total || 0);
        });
        return Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, revenue: hours[i] || 0 })).filter(h => h.revenue > 0);
    }, [filteredOrders]);

    // Revenue by category
    const categoryData = useMemo(() => {
        const catRevenue = {};
        const orderIds = new Set(filteredOrders.map(o => o.id));
        orderItems.filter(i => orderIds.has(i.orderId)).forEach(item => {
            const mi = menuItems.find(m => m.id === item.menuItemId);
            if (!mi) return;
            const cat = categories.find(c => c.id === mi.categoryId);
            const catName = cat?.name || 'Autre';
            catRevenue[catName] = (catRevenue[catName] || 0) + (item.unitPrice || 0) * (item.quantity || 0);
        });
        return Object.entries(catRevenue).map(([name, value]) => ({ name, value: Math.round(value) }));
    }, [filteredOrders, orderItems, menuItems, categories]);

    // Top items
    const topItems = useMemo(() => {
        const itemCounts = {};
        const orderIds = new Set(filteredOrders.map(o => o.id));
        orderItems.filter(i => orderIds.has(i.orderId)).forEach(item => {
            const key = item.itemName || item.menuItemId;
            if (!itemCounts[key]) itemCounts[key] = { name: item.itemName || key, qty: 0, revenue: 0 };
            itemCounts[key].qty += item.quantity || 0;
            itemCounts[key].revenue += (item.unitPrice || 0) * (item.quantity || 0);
        });
        return Object.values(itemCounts).sort((a, b) => b.qty - a.qty).slice(0, 10);
    }, [filteredOrders, orderItems]);

    const periodLabels = { today: t('today'), week: t('week'), month: t('month') };

    return (
        <>
            {/* Period Selector */}
            <div style={{ display: 'flex', gap: 16, marginBottom: '2rem' }}>
                {['today', 'week', 'month'].map(p => (
                    <button
                        key={p}
                        className={`zone-tab ${period === p ? 'active' : ''}`}
                        onClick={() => setPeriod(p)}
                        style={{ padding: '16px 24px', fontSize: '1.1rem' }}
                    >
                        <IconCalendar size={20} />
                        {periodLabels[p]}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                        <IconMoney size={22} />
                    </div>
                    <div className="stat-content">
                        <div className="label" style={{ fontSize: '1.1rem' }}>{t('totalRevenue')}</div>
                        <div className="value" style={{ color: 'var(--green)', fontSize: '2rem' }}>{totalRevenue.toFixed(2)} DH</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}>
                        <IconClipboard size={22} />
                    </div>
                    <div className="stat-content">
                        <div className="label" style={{ fontSize: '1.1rem' }}>{t('orders')}</div>
                        <div className="value" style={{ color: 'var(--orange)', fontSize: '2rem' }}>{filteredOrders.length}</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                        <IconChart size={22} />
                    </div>
                    <div className="stat-content">
                        <div className="label" style={{ fontSize: '1.1rem' }}>{t('avgTicket')}</div>
                        <div className="value" style={{ color: 'var(--blue)', fontSize: '2rem' }}>{avgOrder.toFixed(2)} DH</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="reports-grid">
                <div className="report-chart-container">
                    <div className="report-chart-title">{t('revenueByHour')}</div>
                    {hourlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={hourlyData}>
                                <XAxis dataKey="hour" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }}
                                    formatter={(v) => [`${v} DH`, t('revenue')]}
                                />
                                <Bar dataKey="revenue" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('noData')}</div>
                    )}
                </div>

                <div className="report-chart-container">
                    <div className="report-chart-title">{t('revenueByCategory')}</div>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('noData')}</div>
                    )}
                </div>
            </div>

            {/* Top Selling Items */}
            <div className="section-header" style={{ marginTop: '1.5rem' }}>
                <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconChart size={18} />
                    {t('topItems')}
                </h3>
            </div>
            <div className="card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{t('item')}</th>
                            <th>{t('qty')}</th>
                            <th>{t('revenue')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topItems.map((item, i) => (
                            <tr key={i}>
                                <td style={{ fontWeight: 700, color: i < 3 ? 'var(--gold)' : 'var(--text-muted)' }}>{i + 1}</td>
                                <td style={{ fontWeight: 500 }}>{item.name}</td>
                                <td>{item.qty}</td>
                                <td style={{ fontWeight: 600, color: 'var(--gold)' }}>{item.revenue.toFixed(2)} DH</td>
                            </tr>
                        ))}
                        {topItems.length === 0 && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                                    {t('noData')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
