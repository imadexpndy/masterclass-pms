import db from './db';

/**
 * Log a user activity to the audit trail
 * @param {string} userId - ID of the user
 * @param {string} userName - Name of the user (denormalized)
 * @param {string} action - Action type (login, logout, order_create, etc.)
 * @param {string} target - What was affected (item name, order ID, etc.)
 * @param {object|string} details - Optional extra info
 */
export const logActivity = async (userId, userName, action, target = '', details = '') => {
    try {
        await db.activityLog.add({
            userId: userId || 'system',
            userName: userName || 'System',
            action,
            target,
            details: typeof details === 'object' ? JSON.stringify(details) : details,
            timestamp: new Date().toISOString(),
        });
    } catch (e) {
        console.warn('Activity log failed:', e);
    }
};

/**
 * Get recent activity logs
 * @param {number} limit - Number of logs to fetch
 * @returns {Array} Recent logs, newest first
 */
export const getRecentLogs = async (limit = 100) => {
    return db.activityLog
        .orderBy('id')
        .reverse()
        .limit(limit)
        .toArray();
};

/**
 * Get all logs for a specific date range
 */
export const getLogsByDateRange = async (startDate, endDate) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return db.activityLog
        .where('timestamp')
        .between(start.toISOString(), end.toISOString())
        .reverse()
        .toArray();
};

/**
 * Clear all activity logs
 */
export const clearActivityLogs = async () => {
    await db.activityLog.clear();
};
