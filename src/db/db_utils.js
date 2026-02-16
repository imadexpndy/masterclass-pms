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
