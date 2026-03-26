import pool from '../config/db.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all startup submissions
// @route   GET /api/admin/startups
// @access  Private (Admin only)
export const getAllStartups = async (req, res, next) => {
    try {
        const query = `
            SELECT s.*, u.name as founder_name, m.name as mentor_name
            FROM startups s
            JOIN users u ON s.founder_id = u.id
            LEFT JOIN mentor_assignments ma ON s.id = ma.startup_id
            LEFT JOIN users m ON ma.mentor_id = m.id
            ORDER BY s.created_at DESC
        `;
        const [startups] = await pool.query(query);
        res.status(200).json({ success: true, count: startups.length, data: startups });
    } catch (error) {
        next(error);
    }
};

// @desc    Approve or Reject startup
// @route   PUT /api/admin/startups/:id/status
// @access  Private (Admin only)
export const updateStartupStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const startup_id = req.params.id;

        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const [result] = await pool.query('UPDATE startups SET status = ? WHERE id = ?', [status, startup_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }

        res.status(200).json({ success: true, message: `Startup ${status.toLowerCase()} successfully` });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign mentor to an approved startup
// @route   POST /api/admin/startups/:id/assign-mentor
// @access  Private (Admin only)
export const assignMentor = async (req, res, next) => {
    try {
        const { mentor_id } = req.body;
        const startup_id = req.params.id;

        // Check if startup is approved
        const [startups] = await pool.query('SELECT status FROM startups WHERE id = ?', [startup_id]);
        if (startups.length === 0 || startups[0].status !== 'Approved') {
            return res.status(400).json({ success: false, message: 'Startup must be approved before assigning a mentor' });
        }

        // Check if mentor exists and is actually a mentor
        const [mentors] = await pool.query('SELECT role FROM users WHERE id = ?', [mentor_id]);
        if (mentors.length === 0 || mentors[0].role !== 'Mentor') {
            return res.status(400).json({ success: false, message: 'Invalid mentor selected' });
        }

        // Assign mentor
        await pool.query('INSERT INTO mentor_assignments (startup_id, mentor_id) VALUES (?, ?)', [startup_id, mentor_id]);

        res.status(200).json({ success: true, message: 'Mentor assigned effectively' });
    } catch (error) {
        next(error);
    }
};

// @desc    Finalize project
// @route   PUT /api/admin/startups/:id/complete
// @access  Private (Admin only)
export const completeStartupProject = async (req, res, next) => {
    try {
        const startup_id = req.params.id;

        // Update the startup status to completed
        const [result] = await pool.query('UPDATE startups SET status = "Completed" WHERE id = ?', [startup_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }

        res.status(200).json({ success: true, message: 'Project finalized successfully' });
    } catch (error) {
        next(error);
    }
};
