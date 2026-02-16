import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import {
    IconChart, IconCalendar, IconUsers, IconMoney,
    IconCreditCard, IconCash, IconFilter, IconDownload
} from '../components/Icons';

export default function Reports() {
    const { t, lang } = useLang();

    // --- State ---
    const [dateRange, setDateRange] = useState('today'); // today, yesterday, week, month, custom
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedWaiter, setSelectedWaiter] = useState('all');

    // --- Data Fetching ---
    const allOrders = useLiveQuery(() => db.orders.toArray()) || [];
    const users = useLiveQuery(() => db.users.where('role').equals('waiter').or('role').equals('admin').uniqueKeys()) || [];
    // We actually need full user objects
    const allUsers = useLiveQuery(() => db.users.toArray()) || [];

    // --- Filtering Logic ---
    const filteredOrders = useMemo(() => {
        if (!allOrders.length) return [];

        let start = new Date();
        let end = new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        if (dateRange === 'yesterday') {
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
        } else if (dateRange === 'week') {
            start.setDate(start.getDate() - 7);
        } else if (dateRange === 'month') {
            start.setDate(1); // 1st of current month
        } else if (dateRange === 'custom' && customStart && customEnd) {
            start = new Date(customStart);
            start.setHours(0, 0, 0, 0);
            end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
        }

        return allOrders.filter(o => {
            const oDate = new Date(o.createdAt);
            const inDate = oDate >= start && oDate <= end;
            const isPaid = o.status === 'paid'; // Only count paid orders

            let waiterMatch = true;
            if (selectedWaiter !== 'all') {
                waiterMatch = o.waiterId === selectedWaiter;
            }

            return inDate && isPaid && waiterMatch;
        });
    }, [allOrders, dateRange, customStart, customEnd, selectedWaiter]);

    // --- Calculations ---
    const totals = useMemo(() => {
        return filteredOrders.reduce((acc, o) => {
            acc.total += (o.total || 0);
            if (o.paymentMethod === 'cash') {
                acc.cash += (o.total || 0);
            } else {
                acc.card += (o.total || 0);
            }
            return acc;
        }, { total: 0, cash: 0, card: 0 });
    }, [filteredOrders]);

    // --- Grouping for Table ---
    const groupedData = useMemo(() => {
        // Group by Date -> Waiter
        const groups = {};

        filteredOrders.forEach(o => {
            // Key by Date (YYYY-MM-DD)
            const dateKey = new Date(o.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR');

            if (!groups[dateKey]) groups[dateKey] = { date: dateKey, total: 0, cash: 0, card: 0, waiters: {} };

            const g = groups[dateKey];
            g.total += (o.total || 0);
            if (o.paymentMethod === 'cash') g.cash += (o.total || 0);
            else g.card += (o.total || 0);

            // Waiter grouping within date
            const wName = allUsers.find(u => u.id === o.waiterId)?.name || 'Unknown';
            if (!g.waiters[wName]) g.waiters[wName] = { name: wName, total: 0, cash: 0, card: 0, count: 0 };

            g.waiters[wName].total += (o.total || 0);
            if (o.paymentMethod === 'cash') g.waiters[wName].cash += (o.total || 0);
            else g.waiters[wName].card += (o.total || 0);
            g.waiters[wName].count++;
        });

        // Convert to array and sort desc by date (string compare works for ISO, but local format varies. 
        // Best to keep raw timestamp for sorting if needed, but simple reverse often mostly correct for recent)
        return Object.values(groups).reverse();
    }, [filteredOrders, allUsers, lang]);

    return (
        <div className="reports-page">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <IconChart size={32} style={{ color: 'var(--brand)' }} />
                    <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>Rapports & Caisse</span>
                </h1>
                <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                    Suivi du chiffre d'affaires et de la caisse par jour et par serveur.
                </p>
            </div>

            {/* Filters Bar */}
            <div className="filters-card" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 16, marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'end' }}>

                    {/* Period Filter */}
                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>Période</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['today', 'yesterday', 'week', 'month'].map(period => (
                                <button
                                    key={period}
                                    className={`btn ${dateRange === period ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setDateRange(period)}
                                    style={{ padding: '8px 16px', borderRadius: 8 }}
                                >
                                    {period === 'today' ? "Aujourd'hui" :
                                        period === 'yesterday' ? "Hier" :
                                            period === 'week' ? "7 Jours" : "Ce Mois"}
                                </button>
                            ))}
                            <button
                                className={`btn ${dateRange === 'custom' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setDateRange('custom')}
                            >
                                <IconCalendar size={18} /> Personnalisé
                            </button>
                        </div>
                    </div>

                    {/* Custom Date Range Inputs */}
                    {dateRange === 'custom' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input
                                type="date"
                                className="form-input"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                            />
                            <span style={{ color: 'var(--text-muted)' }}>à</span>
                            <input
                                type="date"
                                className="form-input"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                            />
                        </div>
                    )}

                    <div style={{ flex: 1 }}></div>

                    {/* Waiter Filter */}
                    <div className="filter-group">
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-muted)' }}>Serveur</label>
                        <div style={{ position: 'relative' }}>
                            <IconUsers size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                className="form-input"
                                style={{ paddingLeft: 40, paddingRight: 32, appearance: 'none' }}
                                value={selectedWaiter}
                                onChange={e => setSelectedWaiter(e.target.value)}
                            >
                                <option value="all">Tous les serveurs</option>
                                {allUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>
            </div>

            {/* KPI Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '2rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--blue-bg)', color: 'var(--blue)' }}>
                        <IconChart size={28} />
                    </div>
                    <div className="stat-content">
                        <div className="label">Total Ventes (CA)</div>
                        <div className="value" style={{ color: 'var(--blue)' }}>{totals.total.toFixed(2)} DH</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--green-bg)', color: 'var(--green)' }}>
                        <IconCash size={28} />
                    </div>
                    <div className="stat-content">
                        <div className="label">Total Espèces (Caisse)</div>
                        <div className="value" style={{ color: 'var(--green)' }}>{totals.cash.toFixed(2)} DH</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Attendu en caisse</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}>
                        <IconCreditCard size={28} />
                    </div>
                    <div className="stat-content">
                        <div className="label">Total Carte/Système</div>
                        <div className="value" style={{ color: 'var(--orange)' }}>{totals.card.toFixed(2)} DH</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(167, 139, 250, 0.1)', color: 'var(--purple)' }}>
                        <IconMoney size={28} />
                    </div>
                    <div className="stat-content">
                        <div className="label">Commandes Payées</div>
                        <div className="value" style={{ color: 'var(--purple)' }}>{filteredOrders.length}</div>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="section-header">
                <h3><IconCalendar size={18} /> Détail par Jour et Serveur</h3>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr style={{ background: 'var(--bg-main)' }}>
                            <th style={{ padding: '16px' }}>Date</th>
                            <th style={{ padding: '16px' }}>Serveur</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Espèces (Caisse)</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Carte (Système)</th>
                            <th style={{ padding: '16px', textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groupedData.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                    Aucune donnée pour cette période.
                                </td>
                            </tr>
                        ) : (
                            groupedData.map((day, i) => (
                                <>
                                    {/* Daily Header Row */}
                                    <tr key={`day-${i}`} style={{ background: 'var(--bg-highlight)', fontWeight: 600 }}>
                                        <td style={{ padding: '12px 16px', fontSize: '1rem' }}>
                                            {day.date}
                                        </td>
                                        <td>Global (Tous)</td>
                                        <td style={{ textAlign: 'right', color: 'var(--green)' }}>{day.cash.toFixed(2)} DH</td>
                                        <td style={{ textAlign: 'right', color: 'var(--orange)' }}>{day.card.toFixed(2)} DH</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{day.total.toFixed(2)} DH</td>
                                    </tr>

                                    {/* Waiter Rows */}
                                    {Object.values(day.waiters).map((w, j) => (
                                        <tr key={`waiter-${i}-${j}`} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td></td> {/* Indent or empty for date */}
                                            <td style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px' }}>
                                                <IconUsers size={14} style={{ color: 'var(--text-muted)' }} />
                                                {w.name}
                                                <span className="badge badge-gray" style={{ fontSize: '0.7em', padding: '2px 6px' }}>{w.count} cmds</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{w.cash.toFixed(2)} DH</td>
                                            <td style={{ textAlign: 'right' }}>{w.card.toFixed(2)} DH</td>
                                            <td style={{ textAlign: 'right', fontWeight: 500 }}>{w.total.toFixed(2)} DH</td>
                                        </tr>
                                    ))}
                                </>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
