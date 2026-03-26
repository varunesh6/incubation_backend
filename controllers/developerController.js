import pool from '../config/db.js';

// @desc    Get tasks assigned to me
// @route   GET /api/developer/tasks
// @access  Private (Developer only)
export const getMyTasks = async (req, res, next) => {
    try {
        let developer_id = req.user.id;

        // If a mentor is requesting to see a specific developer's dashboard/tasks
        if (req.user.role === 'Mentor' && req.query.developer_id) {
            developer_id = req.query.developer_id;
        } else if (req.user.role === 'Mentor') {
            // If mentor hits this route without a dev ID, just return empty to prevent errors or show all
            return res.status(200).json({ success: true, count: 0, data: [] });
        }

        const query = `
            SELECT t.*, s.title as startup_title, s.status as startup_status
            FROM developer_tasks t
            JOIN startups s ON t.startup_id = s.id
            WHERE t.developer_id = ?
            ORDER BY t.created_at DESC
        `;
        const [tasks] = await pool.query(query, [developer_id]);
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }
        next(error);
    }
};

// @desc    Submit task progress
// @route   PUT /api/developer/tasks/:id/submit
// @access  Private (Developer only)
export const submitTaskProgress = async (req, res, next) => {
    try {
        const task_id = req.params.id;
        const developer_id = req.user.id;
        const { github_link } = req.body;

        let work_completion_file = null;
        if (req.file) {
            work_completion_file = `/uploads/${req.file.filename}`;
        } else if (req.body.work_completion_file) {
            work_completion_file = req.body.work_completion_file; // Fallback to provided link
        }

        const [result] = await pool.query(
            'UPDATE developer_tasks SET status = "Submitted", github_link = ?, work_completion_file = ? WHERE id = ? AND developer_id = ?',
            [github_link, work_completion_file, task_id, developer_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Task submitted for mentor review successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Request an extension for a task
// @route   POST /api/developer/tasks/:id/extend
// @access  Private (Developer only)
export const requestExtension = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const task_id = req.params.id;
        const developer_id = req.user.id;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Please provide a reason for the extension' });
        }

        const [result] = await pool.query(
            'UPDATE developer_tasks SET extension_requested = true, extension_reason = ? WHERE id = ? AND developer_id = ? AND status != "Completed"',
            [reason, task_id, developer_id]
        );

        if (result.affectedRows === 0) {
            return res.status(400).json({ success: false, message: 'Task not found or already completed/unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Extension requested successfully' });
    } catch (error) {
        next(error);
    }
};
