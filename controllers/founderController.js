import pool from '../config/db.js';

// @desc    Submit a new startup idea
// @route   POST /api/founder/startups
// @access  Private (Founder only)
export const submitStartup = async (req, res, next) => {
    try {
        const { title, description, category, funding_required } = req.body;
        const founder_id = req.user.id;

        if (!title || !description || !category) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const [result] = await pool.query(
            'INSERT INTO startups (founder_id, title, description, category, funding_required, status) VALUES (?, ?, ?, ?, ?, "Pending")',
            [founder_id, title, description, category, funding_required || 0.00]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId, title, status: 'Pending' }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get founder's startups
// @route   GET /api/founder/startups
// @access  Private (Founder only)
export const getMyStartups = async (req, res, next) => {
    try {
        const founder_id = req.user.id;
        const [startups] = await pool.query('SELECT * FROM startups WHERE founder_id = ? ORDER BY created_at DESC', [founder_id]);

        res.status(200).json({
            success: true,
            count: startups.length,
            data: startups
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a specific startup
// @route   PUT /api/founder/startups/:id
// @access  Private (Founder only)
export const updateStartup = async (req, res, next) => {
    try {
        const { title, description, category, funding_required } = req.body;
        const startup_id = req.params.id;
        const founder_id = req.user.id;

        // Check if startup exists and belongs to founder
        const [startups] = await pool.query('SELECT * FROM startups WHERE id = ? AND founder_id = ?', [startup_id, founder_id]);

        if (startups.length === 0) {
            return res.status(404).json({ success: false, message: 'Startup not found or unauthorized' });
        }

        await pool.query(
            'UPDATE startups SET title = COALESCE(?, title), description = COALESCE(?, description), category = COALESCE(?, category), funding_required = COALESCE(?, funding_required) WHERE id = ?',
            [title, description, category, funding_required, startup_id]
        );

        res.status(200).json({ success: true, message: 'Startup updated successfully' });
    } catch (error) {
        next(error);
    }
};
