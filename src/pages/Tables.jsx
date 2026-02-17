import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import db from '../db/db';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import {
    IconTable, IconCircle, IconBuilding, IconTreePalm,
    IconCheck, IconX, IconDoor, IconMoney,
    IconPlus, IconTrash
} from '../components/Icons';

const ROWS = 6;
const COLS = 8;
const uid = () => crypto.randomUUID();

/* ── Grid Cell Component ── */
const GridCell = ({ row, col, children, onDrop, onDragOver }) => (
    <div
        className={`grid-cell ${children ? 'occupied' : 'empty'}`}
        data-row={row}
        data-col={col}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, row, col)}
    >
        {children}
    </div>
);

/* ── Table Item on the Grid ── */
const GridTable = ({ item, onClick, onDragStart, onEditName }) => {
    const [editing, setEditing] = useState(false);
    const [editValue, setEditValue] = useState(item.name);
    const inputRef = useRef(null);

    const statusClass = item.type === 'base' ? 'base' : item.type === 'tv' ? 'tv' : item.type === 'door' ? 'door' : item.type === 'caisse' ? 'caisse' : item.status;

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setEditValue(item.name);
        setEditing(true);
        setTimeout(() => inputRef.current?.select(), 50);
    };

    const handleSave = () => {
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== item.name) {
            onEditName(item.id, trimmed);
        }
        setEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setEditing(false);
    };

    // Bases, TVs, Doors, Caisse are not clickable for POS
    const handleClick = () => {
        if (item.type === 'table' || !item.type) {
            onClick(item);
        }
    };

    return (
        <div
            className={`grid-item ${statusClass}`}
            draggable
            onDragStart={(e) => onDragStart(e, item)}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            title={item.type === 'table' || !item.type ? 'Cliquer → Caisse' : item.name}
        >
            {/* Status indicator dot (Only for tables) */}
            {(item.type === 'table' || !item.type) && (
                <span className={`grid-item-dot ${item.status}`} />
            )}

            {item.type === 'door' ? (
                <div className="door-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff' }}>
                    <IconDoor size={22} />
                    <span className="grid-item-label" style={{ fontSize: '0.75rem' }}>{item.name}</span>
                </div>
            ) : item.type === 'caisse' ? (
                <div className="caisse-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#fff' }}>
                    <IconMoney size={24} />
                    <span className="grid-item-label" style={{ fontSize: '0.75rem', color: '#fff' }}>{item.name}</span>
                </div>
            ) : editing ? (
                <input
                    ref={inputRef}
                    className="grid-item-edit"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                />
            ) : (
                <span className="grid-item-label">
                    {item.type === 'tv' ? '📺 ' : ''}
                    {item.name}
                </span>
            )}
        </div>
    );
};

export default function Tables() {
    const allItems = useLiveQuery(() => db.diningTables.toArray()) || [];
    const navigate = useNavigate();
    const { t, lang } = useLang();
    const { user } = useAuth();
    const [activeZone, setActiveZone] = useState('salle');
    const [dragItem, setDragItem] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [trashHover, setTrashHover] = useState(false);

    // Filter by zone
    const zoneItems = allItems.filter(i => i.zone === activeZone);
    const salleCount = allItems.filter(i => i.zone === 'salle' && (i.type === 'table' || (!i.type && i.seats > 0))).length;
    const terrasseCount = allItems.filter(i => i.zone === 'terrasse' && (i.type === 'table' || (!i.type && i.seats > 0))).length;

    // Stats (tables only)
    const tables = zoneItems.filter(i => i.type === 'table' || (!i.type && i.seats > 0));
    const freeCount = tables.filter(t => t.status === 'free').length;
    const occCount = tables.filter(t => t.status === 'occupied').length;

    // Build grid map: key = "row-col" → item
    const gridMap = {};
    zoneItems.forEach(item => {
        if (item.row !== undefined && item.col !== undefined) {
            gridMap[`${item.row}-${item.col}`] = item;
        }
    });

    // ── Handlers ──

    const handleTableClick = (table) => {
        // Direct navigation to POS/Caisse
        navigate(`/pos?table=${table.id}`);
    };

    const handleDragStart = (e, item) => {
        setDragItem(item);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDragItem(null);
        setTrashHover(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, row, col) => {
        e.preventDefault();
        if (!dragItem) return;

        const key = `${row}-${col}`;
        const existingItem = gridMap[key];

        // If dropping on an occupied cell (that isn't itself), swap positions
        if (existingItem && existingItem.id !== dragItem.id) {
            await db.diningTables.update(existingItem.id, {
                row: dragItem.row,
                col: dragItem.col
            });
        }

        await db.diningTables.update(dragItem.id, { row, col });
        handleDragEnd(); // Reset state
    };

    const handleEditName = async (id, newName) => {
        await db.diningTables.update(id, { name: newName });
    };

    const handleAddTable = async () => {
        if (activeZone === 'salle') {
            // Find first empty cell
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    const key = `${r}-${c}`;
                    if (!gridMap[key]) {
                        // Found empty slot
                        // Generate name: Find max number in existing tables to increment?
                        // Simple approach: "Table X"
                        const newName = `T-${salleCount + 1 + Math.floor(Math.random() * 10)}`;
                        await db.diningTables.add({
                            id: uid(),
                            name: newName,
                            status: 'free',
                            seats: 4,
                            zone: 'salle',
                            row: r,
                            col: c,
                            type: 'table'
                        });
                        return;
                    }
                }
            }
            alert("La grille est pleine !");
        } else {
            // Terrasse
            const newName = `Terrasse ${terrasseCount + 1}`;
            await db.diningTables.add({
                id: uid(),
                name: newName,
                status: 'free',
                seats: 4,
                zone: 'terrasse',
                type: 'table'
            });
        }
    };

    const handleTrashDrop = async (e) => {
        e.preventDefault();
        if (!dragItem) return;

        if (window.confirm(`Supprimer ${dragItem.name} ?`)) {
            await db.diningTables.delete(dragItem.id);
        }
        handleDragEnd();
    };

    // ── Render Grid (Salle only uses custom grid, Terrasse uses simple grid) ──
    const isSalle = activeZone === 'salle';

    const renderSalleGrid = () => {
        const cells = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const item = gridMap[`${r}-${c}`];
                cells.push(
                    <GridCell
                        key={`${r}-${c}`}
                        row={r}
                        col={c}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                    >
                        {item && (
                            <GridTable
                                item={item}
                                onClick={handleTableClick}
                                onDragStart={handleDragStart}
                                onEditName={handleEditName}
                            />
                        )}
                    </GridCell>
                );
            }
        }
        return cells;
    };

    // Terrasse: simple list of tables
    const renderTerrasseGrid = () => {
        const terrTables = zoneItems
            .filter(i => i.type === 'table' || !i.type)
            .sort((a, b) => {
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

        return terrTables.map(table => (
            <div
                key={table.id}
                className={`terrasse-table ${table.status}`}
                onClick={() => handleTableClick(table)}
            >
                <span className={`grid-item-dot ${table.status}`} />
                <span className="grid-item-label">{table.name.replace('Terrasse ', 'T')}</span>
            </div>
        ));
    };

    return (
        <div className="tables-layout" onDragEnd={handleDragEnd}>
            {/* ═══ Floor Plan ═══ */}
            <div className="floor-plan-panel">
                {/* Zone tabs */}
                <div className="floor-zone-tabs">
                    <button className={`floor-zone-tab ${activeZone === 'salle' ? 'active' : ''}`} onClick={() => setActiveZone('salle')}>
                        <IconBuilding size={18} />
                        {t('zoneSalle')}
                        <span className="zone-badge">{salleCount}</span>
                    </button>
                    <button className={`floor-zone-tab ${activeZone === 'terrasse' ? 'active' : ''}`} onClick={() => setActiveZone('terrasse')}>
                        <IconTreePalm size={18} />
                        {t('zoneTerrasse')}
                        <span className="zone-badge">{terrasseCount}</span>
                    </button>

                    {/* NEW: Add Table Button (Admin Only) */}
                    {user?.role === 'admin' && (
                        <div className="table-controls">
                            <button className="add-table-btn" onClick={handleAddTable} title="Ajouter une table">
                                <IconPlus size={16} />
                                <span>{lang === 'ar' ? 'إضافة' : 'Ajouter'}</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Grid */}
                <div className={`floor-grid ${isSalle ? 'salle-grid' : 'terrasse-grid'}`}>
                    {isSalle ? renderSalleGrid() : renderTerrasseGrid()}
                </div>

                {/* Legend bar */}
                <div className="floor-legend">
                    <div className="floor-legend-items">
                        <span className="floor-legend-item">
                            <IconCircle filled size={10} color="var(--green)" /> {lang === 'ar' ? 'حرة' : 'Libre'} <strong>{freeCount}</strong>
                        </span>
                        <span className="floor-legend-item">
                            <IconCircle filled size={10} color="var(--orange)" /> {lang === 'ar' ? 'مشغولة' : 'Occupée'} <strong>{occCount}</strong>
                        </span>
                    </div>
                    <div className="floor-legend-hint">
                        {lang === 'ar' ? 'اسحب للتحريك · انقر مرتين للتسمية' : 'Glisser pour déplacer · Double-clic pour renommer'}
                    </div>
                </div>

                {/* TRASH ZONE (Visible only when dragging) */}
                {user?.role === 'admin' && (
                    <div
                        className={`trash-zone ${isDragging ? 'visible' : ''} ${trashHover ? 'drag-over' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setTrashHover(true); }}
                        onDragLeave={() => setTrashHover(false)}
                        onDrop={handleTrashDrop}
                        title="Glisser ici pour supprimer"
                    >
                        <IconTrash size={24} />
                    </div>
                )}
            </div>
        </div>
    );
}
