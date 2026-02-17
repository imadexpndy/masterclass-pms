import Dexie from 'dexie';

export const db = new Dexie('MasterClassPOS');

db.version(1).stores({
    users: 'id, name, role, active',
    categories: 'id, name, sortOrder',
    menuItems: 'id, categoryId, name, available, image',
    diningTables: 'id, name, status',
    orders: 'id, tableId, waiterId, status, createdAt, synced',
    orderItems: 'id, orderId, menuItemId, status',
    syncQueue: 'id, table, action, synced, timestamp',
    settings: 'key'
});

db.version(2).stores({
    diningTables: 'id, name, status, zone, seats',
    payments: 'id, orderId, method, createdAt'
}).upgrade(tx => {
    return tx.table('diningTables').toCollection().modify(t => {
        if (!t.zone) {
            // Tables 9-12 → terrasse, rest → salle
            const num = parseInt(t.name?.replace(/\D/g, ''));
            t.zone = (num >= 9 && num <= 12) ? 'terrasse' : 'salle';
        }
    });
});

db.version(3).stores({
    diningTables: 'id, name, status, zone, seats, x, y, width, height, shape, rotation'
});

db.version(4).stores({
    diningTables: 'id, name, status, zone, seats, row, col, type'
});

export default db;
