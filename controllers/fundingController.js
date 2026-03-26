import pool from '../config/db.js';

// @desc    Add funding record
// @route   POST /api/funding
// @access  Private (Admin only)
export const addFundingRecord = async (req, res, next) => {
    try {
        const { startup_id, investor_name, amount, status, date } = req.body;

        if (!startup_id || !investor_name || !amount || !date) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        await pool.query(
            'INSERT INTO funding (startup_id, investor_name, amount, status, funding_date) VALUES (?, ?, ?, ?, ?)',
            [startup_id, investor_name, amount, status || 'Committed', date]
        );

        res.status(201).json({ success: true, message: 'Funding record added successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    View funding by startup
// @route   GET /api/funding/startup/:id
// @access  Private (Admin potentially others, but let's restrict to Admin/Founder)
export const getFundingByStartup = async (req, res, next) => {
    try {
        const startup_id = req.params.id;
        const [funding] = await pool.query('SELECT * FROM funding WHERE startup_id = ? ORDER BY funding_date DESC', [startup_id]);
        res.status(200).json({ success: true, count: funding.length, data: funding });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate funding summary report
// @route   GET /api/funding/summary
// @access  Private (Admin only)
export const getFundingSummary = async (req, res, next) => {
    try {
        const query = `
            SELECT 
                s.title as startup_name,
                SUM(f.amount) as total_funding,
                COUNT(f.id) as number_of_investments
            FROM startups s
            LEFT JOIN funding f ON s.id = f.startup_id AND f.status = 'Received'
            GROUP BY s.id
            ORDER BY total_funding DESC
        `;
        const [summary] = await pool.query(query);

        const totalOverallQuery = `SELECT SUM(amount) as total_received FROM funding WHERE status = 'Received'`;
        const [totalOverall] = await pool.query(totalOverallQuery);

        res.status(200).json({
            success: true,
            data: {
                summary,
                totalOverall: totalOverall[0].total_received || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    View all funding records
// @route   GET /api/funding
// @access  Private (Admin only)
export const getAllFunding = async (req, res, next) => {
    try {
        const query = `
            SELECT f.*, s.title as startup_title 
            FROM funding f
            JOIN startups s ON f.startup_id = s.id
            ORDER BY f.funding_date DESC
        `;
        const [funding] = await pool.query(query);
        res.status(200).json({ success: true, count: funding.length, data: funding });
    } catch (error) {
        next(error);
    }
}
