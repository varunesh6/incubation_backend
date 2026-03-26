import pool from '../config/db.js';

// @desc    Get assigned startups for mentor
// @route   GET /api/mentor/startups
// @access  Private (Mentor only)
export const getAssignedStartups = async (req, res, next) => {
    try {
        const mentor_id = req.user.id;
        const query = `
            SELECT s.*, m.id as assignment_id
            FROM startups s
            JOIN mentor_assignments m ON s.id = m.startup_id
            WHERE m.mentor_id = ?
        `;
        const [startups] = await pool.query(query, [mentor_id]);
        res.status(200).json({ success: true, count: startups.length, data: startups });
    } catch (error) {
        next(error);
    }
};

// @desc    Provide feedback (Using mentor_assignments table to store latest feedback for simplicity or a separate feedbacks logic)
// @route   POST /api/mentor/startups/:id/feedback
// @access  Private (Mentor only)
export const provideFeedback = async (req, res, next) => {
    try {
        const { feedback, review_type = 'Weekly Review', rating = 5, mark_completed } = req.body;
        const startup_id = req.params.id;
        const mentor_id = req.user.id;

        // Ensure file was handled by multer if present
        const document_url = req.file ? `/uploads/${req.file.filename}` : null;

        // Verify assignment
        const [assignments] = await pool.query('SELECT * FROM mentor_assignments WHERE startup_id = ? AND mentor_id = ?', [startup_id, mentor_id]);
        if (assignments.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        // Create table supporting document_url
        await pool.query(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                startup_id INT NOT NULL,
                mentor_id INT NOT NULL,
                review_type VARCHAR(255) DEFAULT 'Weekly Review',
                rating INT DEFAULT 5,
                comment TEXT NOT NULL,
                document_url VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
                FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Check columns to ensure backwards compatibility individually
        try { await pool.query('ALTER TABLE feedbacks ADD COLUMN review_type VARCHAR(255) DEFAULT "Weekly Review"'); } catch (e) { /* ignore */ }
        try { await pool.query('ALTER TABLE feedbacks ADD COLUMN rating INT DEFAULT 5'); } catch (e) { /* ignore */ }
        try { await pool.query('ALTER TABLE feedbacks ADD COLUMN document_url VARCHAR(255) NULL'); } catch (e) { /* ignore */ }

        await pool.query('INSERT INTO feedbacks (startup_id, mentor_id, review_type, rating, comment, document_url) VALUES (?, ?, ?, ?, ?, ?)', [startup_id, mentor_id, review_type, rating, feedback, document_url]);

        const completed = mark_completed === 'true' || mark_completed === true;
        if (completed) {
            await pool.query('UPDATE startups SET status = "Completed" WHERE id = ?', [startup_id]);
        }

        res.status(201).json({ success: true, message: 'Feedback provided successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get startup progress updates
// @route   GET /api/mentor/startups/:id/progress
// @access  Private (Mentor only)
export const getStartupProgress = async (req, res, next) => {
    try {
        const startup_id = req.params.id;
        const mentor_id = req.user.id;

        // Verify assignment
        const [assignments] = await pool.query('SELECT * FROM mentor_assignments WHERE startup_id = ? AND mentor_id = ?', [startup_id, mentor_id]);
        if (assignments.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        const [progress] = await pool.query('SELECT * FROM progress_updates WHERE startup_id = ? ORDER BY created_at DESC', [startup_id]);
        res.status(200).json({ success: true, count: progress.length, data: progress });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all developers in the system for task assignment
// @route   GET /api/mentor/developers
// @access  Private (Mentor only)
export const getDevelopers = async (req, res, next) => {
    try {
        const query = `
            SELECT id, name, email 
            FROM users 
            WHERE role = 'Developer'
            ORDER BY name ASC
        `;
        const [developers] = await pool.query(query);
        res.status(200).json({ success: true, count: developers.length, data: developers });
    } catch (error) {
        next(error);
    }
};

// Shared utility to ensure table exists
export const ensureDeveloperTasksTable = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS developer_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            startup_id INT NOT NULL,
            developer_id INT NOT NULL,
            mentor_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            deadline DATE NOT NULL,
            review_type VARCHAR(255) DEFAULT 'Weekly Review',
            github_link VARCHAR(255),
            work_completion_file VARCHAR(255),
            status ENUM('Assigned', 'Submitted', 'Completed', 'Changes Requested') DEFAULT 'Assigned',
            feedback TEXT,
            extension_requested BOOLEAN DEFAULT false,
            extension_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
            FOREIGN KEY (developer_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
};

// @desc    Assign a target/task to an accepted developer
// @route   POST /api/mentor/startups/:id/tasks
// @access  Private (Mentor only)
export const assignTaskToDeveloper = async (req, res, next) => {
    try {
        const { developer_id, title, description, deadline, review_type = 'Weekly Review' } = req.body;
        const startup_id = req.params.id;
        const mentor_id = req.user.id;

        // Verify assignment to startup
        const [assignments] = await pool.query('SELECT * FROM mentor_assignments WHERE startup_id = ? AND mentor_id = ?', [startup_id, mentor_id]);
        if (assignments.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        // Schema update for developer tasks (Will create the new columns if they don't exist yet via ALTER)
        await ensureDeveloperTasksTable();

        try {
            await pool.query('ALTER TABLE developer_tasks ADD COLUMN review_type VARCHAR(255) DEFAULT "Weekly Review"');
            await pool.query('ALTER TABLE developer_tasks ADD COLUMN work_completion_file VARCHAR(255)');
        } catch (e) {
            // Columns likely already exist, ignore error from ALTER TABLE
        }

        // Check if startup already has a developer assigned via previous tasks
        const [existingTasks] = await pool.query('SELECT developer_id FROM developer_tasks WHERE startup_id = ? LIMIT 1', [startup_id]);
        
        let finalDeveloperId = developer_id;
        if (existingTasks.length > 0) {
            // Force the new task to use the already assigned developer
            finalDeveloperId = existingTasks[0].developer_id;
        }

        await pool.query(
            'INSERT INTO developer_tasks (startup_id, developer_id, mentor_id, title, description, deadline, review_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [startup_id, finalDeveloperId, mentor_id, title, description, deadline, review_type]
        );

        // Update the startup's status to 'Ongoing' since a developer is now working on it
        await pool.query(
            'UPDATE startups SET status = "Ongoing" WHERE id = ?',
            [startup_id]
        );

        res.status(201).json({ success: true, message: 'Target assigned to developer successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get tasks assigned by mentor
// @route   GET /api/mentor/tasks
// @access  Private (Mentor only)
export const getAssignedTasksForMentor = async (req, res, next) => {
    try {
        const mentor_id = req.user.id;
        const query = `
            SELECT t.*, s.title as startup_title, u.name as developer_name 
            FROM developer_tasks t
            JOIN startups s ON t.startup_id = s.id
            JOIN users u ON t.developer_id = u.id
            WHERE t.mentor_id = ?
            ORDER BY t.created_at DESC
        `;
        const [tasks] = await pool.query(query, [mentor_id]);
        res.status(200).json({ success: true, count: tasks.length, data: tasks });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(200).json({ success: true, count: 0, data: [] });
        }
        next(error);
    }
};

// @desc    Evaluate submitted task
// @route   PUT /api/mentor/tasks/:id/evaluate
// @access  Private (Mentor only)
export const evaluateTask = async (req, res, next) => {
    try {
        const task_id = req.params.id;
        const mentor_id = req.user.id;
        const { status, feedback } = req.body;

        if (!['Completed', 'Changes Requested'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid evaluation status' });
        }

        const [result] = await pool.query(
            'UPDATE developer_tasks SET status = ?, feedback = ? WHERE id = ? AND mentor_id = ?',
            [status, feedback, task_id, mentor_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Task evaluated successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    Handle Task Extension Request
// @route   PUT /api/mentor/tasks/:id/extension
// @access  Private (Mentor only)
export const handleTaskExtension = async (req, res, next) => {
    try {
        const task_id = req.params.id;
        const mentor_id = req.user.id;
        const { approve, new_deadline, reason, message } = req.body;

        if (approve && !new_deadline) {
            return res.status(400).json({ success: false, message: 'New deadline required for approval' });
        }

        if (!approve && !reason) {
            return res.status(400).json({ success: false, message: 'Reason required for denial' });
        }

        if (approve) {
            let feedbackUpdate = '';
            let params = [new_deadline, task_id, mentor_id];

            if (message && message.trim() !== '') {
                feedbackUpdate = ', feedback = CONCAT(IFNULL(feedback, ""), ?)';
                params = [new_deadline, `\n\n[Extension Approved]: ${message}`, task_id, mentor_id];
            }

            await pool.query(
                `UPDATE developer_tasks SET deadline = ?, extension_requested = false, extension_reason = NULL${feedbackUpdate} WHERE id = ? AND mentor_id = ?`,
                params
            );
        } else {
            const denialMessage = `\n\n[Extension Denied]: ${reason}`;
            await pool.query(
                'UPDATE developer_tasks SET extension_requested = false, feedback = CONCAT(IFNULL(feedback, ""), ?) WHERE id = ? AND mentor_id = ?',
                [denialMessage, task_id, mentor_id]
            );
        }

        res.status(200).json({ success: true, message: `Extension request ${approve ? 'approved' : 'denied'}` });
    } catch (error) {
        next(error);
    }
};

// @desc    Finalize startup project (Mark as Completed)
// @route   PATCH /api/mentor/startups/:id/status
// @access  Private (Mentor only)
export const finalizeStartup = async (req, res, next) => {
    try {
        const startup_id = req.params.id;
        const mentor_id = req.user.id;
        const { status } = req.body;

        if (status !== 'Completed') {
            return res.status(400).json({ success: false, message: 'Invalid status update for this endpoint' });
        }

        // Verify assignment
        const [assignments] = await pool.query('SELECT * FROM mentor_assignments WHERE startup_id = ? AND mentor_id = ?', [startup_id, mentor_id]);
        if (assignments.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        const [result] = await pool.query('UPDATE startups SET status = "Completed" WHERE id = ?', [startup_id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }

        res.status(200).json({ success: true, message: 'Project marked as completed successfully' });
    } catch (error) {
        next(error);
    }
};
