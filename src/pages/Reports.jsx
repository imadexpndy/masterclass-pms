import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import {
    IconChart, IconCalendar, IconUsers, IconMoney,
    IconCreditCard, IconCash, IconFilter, IconDownload, IconPrint
} from '../components/Icons';

export default function Reports() {
    const { t, lang } = useLang();

    // --- State ---
    const [dateRange, setDateRange] = useState('today');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedWaiter, setSelectedWaiter] = useState('all');
    const [showPrintReport, setShowPrintReport] = useState(false);

    // --- Data Fetching ---
    const allOrders = useLiveQuery(() => db.orders.toArray()) || [];
    const allUsers = useLiveQuery(() => db.users.toArray()) || [];
    const settingsArr = useLiveQuery(() => db.settings.toArray()) || [];
    const settings = Object.fromEntries(settingsArr.map(s => [s.key, s.value]));

    // --- Smart Print ---
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
            start.setDate(1);
        } else if (dateRange === 'custom' && customStart && customEnd) {
            start = new Date(customStart);
            start.setHours(0, 0, 0, 0);
            end = new Date(customEnd);
            end.setHours(23, 59, 59, 999);
        }

        return allOrders.filter(o => {
            const oDate = new Date(o.createdAt);
            const inDate = oDate >= start && oDate <= end;

            let waiterMatch = true;
            if (selectedWaiter !== 'all') {
                waiterMatch = o.waiterId === selectedWaiter;
            }

            return inDate && waiterMatch;
        });
    }, [allOrders, dateRange, customStart, customEnd, selectedWaiter]);

    // --- Calculations ---
    const totals = useMemo(() => {
        return filteredOrders.reduce((acc, o) => {
            acc.total += (o.total || 0);
            if (o.status === 'paid') {
                acc.paid += (o.total || 0);
                if (o.paymentMethod === 'cash') {
                    acc.cash += (o.total || 0);
                } else {
                    acc.card += (o.total || 0);
                }
            } else {
                acc.unpaid += (o.total || 0);
            }
            return acc;
        }, { total: 0, paid: 0, unpaid: 0, cash: 0, card: 0 });
    }, [filteredOrders]);

    const paidCount = filteredOrders.filter(o => o.status === 'paid').length;
    const unpaidCount = filteredOrders.filter(o => o.status !== 'paid').length;

    // --- Grouping for Table ---
    const groupedData = useMemo(() => {
        const groups = {};

        filteredOrders.forEach(o => {
            const dateKey = new Date(o.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR');

            if (!groups[dateKey]) groups[dateKey] = { date: dateKey, total: 0, cash: 0, card: 0, waiters: {} };

            const g = groups[dateKey];
            g.total += (o.total || 0);
            if (o.paymentMethod === 'cash') g.cash += (o.total || 0);
            else g.card += (o.total || 0);

            const wName = allUsers.find(u => u.id === o.waiterId)?.name || 'Unknown';
            if (!g.waiters[wName]) g.waiters[wName] = { name: wName, total: 0, cash: 0, card: 0, count: 0 };

            g.waiters[wName].total += (o.total || 0);
            if (o.paymentMethod === 'cash') g.waiters[wName].cash += (o.total || 0);
            else g.waiters[wName].card += (o.total || 0);
            g.waiters[wName].count++;
        });

        return Object.values(groups).reverse();
    }, [filteredOrders, allUsers, lang]);

    // --- Period Label ---
    const periodLabel = dateRange === 'today' ? "Aujourd'hui" :
        dateRange === 'yesterday' ? "Hier" :
            dateRange === 'week' ? "7 Derniers Jours" :
                dateRange === 'month' ? "Ce Mois" :
                    `${customStart} → ${customEnd}`;

    // ==========================================
    // PRINT REPORT VIEW (receipt-style ticket)
    // ==========================================
    if (showPrintReport) {
        return (
            <div className="receipt-card">
                <div className="print-receipt" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#000', background: '#fff', padding: '4mm' }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 8 }}>
                        <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{settings.storeName || 'MasterClass'}</div>
                        <div style={{ fontSize: '0.65rem', color: '#666' }}>{settings.storeAddress || ''}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 6, borderBottom: '2px solid #000', paddingBottom: 4 }}>
                            RAPPORT DE CAISSE
                        </div>
                        <div style={{ fontSize: '0.7rem', marginTop: 4 }}>
                            Période: <strong>{periodLabel}</strong>
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#666' }}>
                            Imprimé le {new Date().toLocaleString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                        </div>
                    </div>

                    {/* Summary Totals */}
                    <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>RÉSUMÉ</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span>Commandes total:</span>
                        <span style={{ fontWeight: 700 }}>{filteredOrders.length} ({paidCount} payées, {unpaidCount} en cours)</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span>Total Espèces:</span>
                        <span style={{ fontWeight: 700 }}>{totals.cash.toFixed(2)} DH</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span>Total Carte:</span>
                        <span style={{ fontWeight: 700 }}>{totals.card.toFixed(2)} DH</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <span>Non encaissé:</span>
                        <span style={{ fontWeight: 700, color: '#c00' }}>{totals.unpaid.toFixed(2)} DH</span>
                    </div>
                    <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900 }}>
                        <span>TOTAL PAYÉ:</span>
                        <span>{totals.paid.toFixed(2)} DH</span>
                    </div>

                    {/* Breakdown by Day */}
                    <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>DÉTAIL PAR JOUR</div>

                    {groupedData.map((day, i) => (
                        <div key={i} style={{ marginBottom: 8 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.75rem', borderBottom: '1px dotted #999', paddingBottom: 2, marginBottom: 3 }}>
                                {day.date}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                <span>Espèces: {day.cash.toFixed(2)}</span>
                                <span>Carte: {day.card.toFixed(2)}</span>
                                <span style={{ fontWeight: 700 }}>{day.total.toFixed(2)} DH</span>
                            </div>

                            {/* Waiters */}
                            {Object.values(day.waiters).map((w, j) => (
                                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', paddingLeft: 8, color: '#444' }}>
                                    <span>- {w.name} ({w.count})</span>
                                    <span>{w.total.toFixed(2)} DH</span>
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Individual Orders */}
                    <div style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 4 }}>LISTE DES COMMANDES</div>

                    <div style={{ fontSize: '0.65rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', fontWeight: 700, borderBottom: '1px solid #000', paddingBottom: 2, marginBottom: 3 }}>
                            <span style={{ width: '20%' }}>Heure</span>
                            <span style={{ width: '15%' }}>N°</span>
                            <span style={{ flex: 1 }}>Serveur</span>
                            <span style={{ width: '18%', textAlign: 'center' }}>Mode</span>
                            <span style={{ width: '12%', textAlign: 'center' }}>Payé</span>
                            <span style={{ width: '18%', textAlign: 'right' }}>Total</span>
                        </div>

                        {/* Orders sorted by time */}
                        {[...filteredOrders]
                            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                            .map((o, i) => {
                                const time = new Date(o.createdAt).toLocaleTimeString(lang === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
                                const waiterName = allUsers.find(u => u.id === o.waiterId)?.name || '—';
                                return (
                                    <div key={i} style={{ display: 'flex', marginBottom: 1, borderBottom: '1px dotted #ddd', paddingBottom: 1 }}>
                                        <span style={{ width: '20%' }}>{time}</span>
                                        <span style={{ width: '15%' }}>#{o.id.slice(-4).toUpperCase()}</span>
                                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{waiterName}</span>
                                        <span style={{ width: '18%', textAlign: 'center' }}>{o.status === 'paid' ? (o.paymentMethod === 'cash' ? 'ESP' : 'CB') : '---'}</span>
                                        <span style={{ width: '12%', textAlign: 'center', fontWeight: 600 }}>{o.status === 'paid' ? '✓' : '✗'}</span>
                                        <span style={{ width: '18%', textAlign: 'right', fontWeight: 600 }}>{(o.total || 0).toFixed(2)}</span>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Footer */}
                    <div style={{ borderTop: '1px dashed #000', margin: '10px 0' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>*** FIN DU RAPPORT ***</div>
                        <div style={{ fontSize: '0.6rem', marginTop: 4 }}>Powered by Expndy</div>
                    </div>
                </div>

                {/* Screen-only buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowPrintReport(false)}>
                        ✕ Fermer
                    </button>
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={async () => {
                        await smartPrint();
                        setShowPrintReport(false);
                    }}>
                        <IconPrint size={16} /> Imprimer
                    </button>
                </div>
            </div>
        );
    }

    // ==========================================
    // NORMAL REPORTS VIEW
    // ==========================================
    return (
        <div className="reports-page">
            {/* Header */}
            <div className="page-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <IconChart size={32} style={{ color: 'var(--brand)' }} />
                            <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>Rapports & Caisse</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                            Suivi du chiffre d'affaires et de la caisse par jour et par serveur.
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            setShowPrintReport(true);
                            setTimeout(async () => {
                                await smartPrint();
                                setShowPrintReport(false);
                            }, 800);
                        }}
                        style={{ gap: 8 }}
                    >
                        <IconPrint size={18} /> Imprimer Rapport
                    </button>
                </div>
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
                        <div className="label">Encaissé (Payé)</div>
                        <div className="value" style={{ color: 'var(--green)' }}>{totals.paid.toFixed(2)} DH</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{paidCount} commandes ({totals.cash.toFixed(0)} ESP / {totals.card.toFixed(0)} CB)</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--orange-bg)', color: 'var(--orange)' }}>
                        <IconCreditCard size={28} />
                    </div>
                    <div className="stat-content">
                        <div className="label">Non Encaissé</div>
                        <div className="value" style={{ color: 'var(--orange)' }}>{totals.unpaid.toFixed(2)} DH</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{unpaidCount} commandes en cours</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(167, 139, 250, 0.1)', color: 'var(--purple)' }}>
                        <IconMoney size={28} />
                    </div>
                    <div className="stat-content">
                        <div className="label">Total Commandes</div>
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
                                <tbody key={`group-${i}`}>
                                    <tr style={{ background: 'var(--bg-highlight)', fontWeight: 600 }}>
                                        <td style={{ padding: '12px 16px', fontSize: '1rem' }}>
                                            {day.date}
                                        </td>
                                        <td>Global (Tous)</td>
                                        <td style={{ textAlign: 'right', color: 'var(--green)' }}>{day.cash.toFixed(2)} DH</td>
                                        <td style={{ textAlign: 'right', color: 'var(--orange)' }}>{day.card.toFixed(2)} DH</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{day.total.toFixed(2)} DH</td>
                                    </tr>

                                    {Object.values(day.waiters).map((w, j) => (
                                        <tr key={`waiter-${i}-${j}`} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td></td>
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
                                </tbody>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
