import db from './db';

/**
 * Export all data from the database to a JSON object
 */
export const exportData = async () => {
    try {
        const tables = db.tables.map(table => table.name);
        const data = {};

        for (const tableName of tables) {
            data[tableName] = await db.table(tableName).toArray();
        }

        return {
            version: 1,
            timestamp: new Date().toISOString(),
            data: data
        };
    } catch (error) {
        console.error('Export failed:', error);
        throw new Error('Failed to export data');
    }
};

/**
 * Import data from a JSON object into the database
 * @param {Object} backupData The backup data object
 * @param {boolean} clearBeforeImport Whether to clear existing data before importing
 */
export const importData = async (backupData, clearBeforeImport = false) => {
    if (!backupData || !backupData.data) {
        throw new Error('Invalid backup file format');
    }

    try {
        await db.transaction('rw', db.tables, async () => {
            const tableNames = Object.keys(backupData.data);

            for (const tableName of tableNames) {
                if (db[tableName]) {
                    if (clearBeforeImport) {
                        await db[tableName].clear();
                    }

                    const rows = backupData.data[tableName];
                    if (rows && rows.length > 0) {
                        await db[tableName].bulkAdd(rows);
                    }
                }
            }
        });
        return true;
    } catch (error) {
        console.error('Import failed:', error);
        throw new Error('Failed to import data: ' + error.message);
    }
};

/**
 * Download data as a JSON file
 */
export const downloadBackup = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const date = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `masterpos_backup_${date}.json`;
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Hash a password string using SHA-256 (Web Crypto API)
 * @param {string} password The plain-text password
 * @returns {string} Hex-encoded hash
 */
export const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Reset all orders data (orders, orderItems, payments, syncQueue)
 * Also resets all dining tables to 'free'
 */
export const resetAllOrders = async () => {
    try {
        await db.transaction('rw', [db.orders, db.orderItems, db.payments, db.syncQueue, db.diningTables], async () => {
            await db.orders.clear();
            await db.orderItems.clear();
            if (db.payments) await db.payments.clear();
            if (db.syncQueue) await db.syncQueue.clear();
            // Reset all table statuses to free
            await db.diningTables.toCollection().modify({ status: 'free' });
        });
        return { success: true };
    } catch (error) {
        console.error('Reset orders failed:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Reset only today's orders (orders, orderItems, payments created today)
 * Also clears syncQueue and resets affected tables
 */
export const resetTodayOrders = async () => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayOrders = await db.orders
            .filter(o => new Date(o.createdAt) >= todayStart)
            .toArray();

        const todayOrderIds = todayOrders.map(o => o.id);
        const affectedTableIds = [...new Set(todayOrders.map(o => o.tableId).filter(Boolean))];

        await db.transaction('rw', [db.orders, db.orderItems, db.payments, db.syncQueue, db.diningTables], async () => {
            for (const orderId of todayOrderIds) {
                await db.orderItems.where('orderId').equals(orderId).delete();
            }
            await db.orders.bulkDelete(todayOrderIds);
            if (db.payments) {
                for (const orderId of todayOrderIds) {
                    await db.payments.where('orderId').equals(orderId).delete();
                }
            }
            // Clear sync queue entries
            if (db.syncQueue) await db.syncQueue.clear();
            // Reset affected tables to free
            for (const tableId of affectedTableIds) {
                await db.diningTables.update(tableId, { status: 'free' });
            }
        });

        return { success: true, count: todayOrderIds.length };
    } catch (error) {
        console.error('Reset today orders failed:', error);
        return { success: false, error: error.message };
    }
};
