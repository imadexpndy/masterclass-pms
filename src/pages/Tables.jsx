import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
    IconTable, IconCircle, IconTreePalm,
    IconPlus, IconTrash
} from '../components/Icons';

const uid = () => crypto.randomUUID();

export default function Tables() {
    const allTables = useLiveQuery(() => db.diningTables.where('zone').equals('terrasse').toArray()) || [];
    const navigate = useNavigate();
    const { t, lang } = useLang();
    const { user } = useAuth();

    // Sort by name
    const tables = [...allTables].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Stats
    const freeCount = tables.filter(t => t.status === 'free').length;
    const occCount = tables.filter(t => t.status === 'occupied').length;

    const handleTableClick = (table) => {
        navigate(`/pos?table=${table.id}`);
    };

    const handleAddTable = async () => {
        const num = tables.length + 1;
        await db.diningTables.add({
            id: uid(),
            name: `T-${num}`,
            status: 'free',
            seats: 4,
            zone: 'terrasse',
            type: 'table',
        });
    };

    const handleDeleteTable = async (e, table) => {
        e.stopPropagation();
        if (table.status === 'occupied') {
            alert(lang === 'fr' ? 'Impossible de supprimer une table occupée.' : 'Cannot delete an occupied table.');
            return;
        }
        if (window.confirm(lang === 'fr' ? `Supprimer ${table.name} ?` : `Delete ${table.name}?`)) {
            await db.diningTables.delete(table.id);
        }
    };

    return (
        <div className="tables-layout">
            <div className="floor-plan-panel">
                {/* Header */}
                <div className="floor-zone-tabs">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <IconTreePalm size={20} />
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                            {lang === 'fr' ? 'Rooftop' : 'Rooftop'}
                        </span>
                        <span className="zone-badge">{tables.length}</span>
                    </div>

                    {user?.role === 'admin' && (
                        <button className="add-table-btn" onClick={handleAddTable} title={lang === 'fr' ? 'Ajouter une table' : 'Add table'}>
                            <IconPlus size={16} />
                            <span>{lang === 'fr' ? 'Ajouter Table' : 'Add Table'}</span>
                        </button>
                    )}
                </div>

                {/* Tables Grid */}
                <div className="floor-grid terrasse-grid">
                    {tables.map(table => (
                        <div
                            key={table.id}
                            className={`terrasse-table ${table.status}`}
                            onClick={() => handleTableClick(table)}
                        >
                            <span className={`grid-item-dot ${table.status}`} />
                            <span className="grid-item-label">{table.name}</span>

                            {/* Delete button (admin only, free tables) */}
                            {user?.role === 'admin' && table.status === 'free' && (
                                <button
                                    className="table-delete-btn"
                                    onClick={(e) => handleDeleteTable(e, table)}
                                    title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                                >
                                    <IconTrash size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="floor-legend">
                    <div className="floor-legend-items">
                        <span className="floor-legend-item">
                            <IconCircle filled size={10} color="var(--green)" /> {lang === 'fr' ? 'Libre' : 'Free'} <strong>{freeCount}</strong>
                        </span>
                        <span className="floor-legend-item">
                            <IconCircle filled size={10} color="var(--orange)" /> {lang === 'fr' ? 'Occupée' : 'Occupied'} <strong>{occCount}</strong>
                        </span>
                    </div>
                    <div className="floor-legend-hint">
                        {lang === 'fr' ? 'Cliquer sur une table → Caisse' : 'Click a table → POS'}
                    </div>
                </div>
            </div>
        </div>
    );
}

