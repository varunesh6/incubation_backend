import pool from '../config/db.js';

// @desc    Get review history for a startup
// @route   GET /api/shared/startups/:id/reviews
// @access  Private
export const getStartupReviews = async (req, res, next) => {
    try {
        const startup_id = req.params.id;

        const query = `
            SELECT t.*, m.name as mentor_name, d.name as developer_name, s.title as startup_title
            FROM developer_tasks t
            JOIN startups s ON t.startup_id = s.id
            LEFT JOIN mentor_assignments ma ON s.id = ma.startup_id
            LEFT JOIN users m ON ma.mentor_id = m.id
            LEFT JOIN users d ON t.developer_id = d.id
            WHERE t.startup_id = ?
            ORDER BY t.created_at DESC
        `;

        const [reviews] = await pool.query(query, [startup_id]);

        res.status(200).json({ success: true, count: reviews.length, data: reviews });
    } catch (error) {
        next(error);
    }
};
