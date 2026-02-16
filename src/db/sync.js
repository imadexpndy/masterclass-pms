import db from './db';

// Sync queue: push pending changes to a backend API when online
export async function addToSyncQueue(table, action, data) {
    await db.syncQueue.add({
        id: crypto.randomUUID(),
        table,
        action,
        data,
        timestamp: new Date().toISOString(),
        synced: false,
    });
}

export async function syncPendingChanges(apiBase) {
    if (!navigator.onLine) return { synced: 0 };

    const pending = await db.syncQueue.where('synced').equals(0).toArray();
    let synced = 0;

    for (const item of pending) {
        try {
            await fetch(`${apiBase}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            await db.syncQueue.update(item.id, { synced: true });
            synced++;
        } catch (err) {
            console.warn('Sync failed for', item.id, err);
            break; // stop on first failure, retry later
        }
    }

    return { synced, remaining: pending.length - synced };
}

export function setupAutoSync(apiBase, intervalMs = 30000) {
    // Sync when coming back online
    window.addEventListener('online', () => syncPendingChanges(apiBase));

    // Periodic sync
    setInterval(() => {
        if (navigator.onLine) syncPendingChanges(apiBase);
    }, intervalMs);
}
