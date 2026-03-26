import pool from '../config/db.js';

// @desc    Get platform statistics
// @route   GET /api/analytics/stats
// @access  Private (Admin only)
export const getPlatformStats = async (req, res, next) => {
    try {
        // Run queries in parallel for efficiency
        const [
            [totalStartups],
            [startupStatuses],
            [totalFunding],
            [activeMentors]
        ] = await Promise.all([
            pool.query('SELECT COUNT(*) as count FROM startups'),
            pool.query('SELECT status, COUNT(*) as count FROM startups GROUP BY status'),
            pool.query('SELECT SUM(amount) as total FROM funding WHERE status = "Received"'),
            pool.query(`
                SELECT COUNT(DISTINCT mentor_id) as count 
                FROM mentor_assignments 
                WHERE assigned_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
            `) // Active mentors (assigned to something in last 30 days) or just total mentors
        ]);

        const statuses = startupStatuses.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
        }, { Pending: 0, Approved: 0, Rejected: 0 });

        res.status(200).json({
            success: true,
            data: {
                totalStartups: totalStartups[0].count,
                approvedStartups: statuses.Approved,
                rejectedStartups: statuses.Rejected,
                pendingStartups: statuses.Pending,
                totalFundingReceived: totalFunding[0].total || 0,
                activeMentors: activeMentors[0].count
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get funding over time for charts
// @route   GET /api/analytics/funding-trend
// @access  Private (Admin only)
export const getFundingTrend = async (req, res, next) => {
    try {
        // Get funding grouped by month
        const query = `
            SELECT DATE_FORMAT(funding_date, '%Y-%m') as month, SUM(amount) as total
            FROM funding
            WHERE status = 'Received'
            GROUP BY month
            ORDER BY month ASC
            LIMIT 12
        `;
        const [trends] = await pool.query(query);
        res.status(200).json({ success: true, data: trends });
    } catch (error) {
        next(error);
    }
}
