import DeveloperTask from '../models/DeveloperTask.js';
import Startup from '../models/Startup.js';

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

        const tasks = await DeveloperTask.find({ developer_id })
            .populate('startup_id', 'title status')
            .sort({ created_at: -1 })
            .lean();

        const formattedTasks = tasks.map(t => ({
            ...t,
            id: t._id,
            startup_title: t.startup_id ? t.startup_id.title : null,
            startup_status: t.startup_id ? t.startup_id.status : null,
            startup_id: t.startup_id ? t.startup_id._id : null
        }));

        res.status(200).json({ success: true, count: formattedTasks.length, data: formattedTasks });
    } catch (error) {
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
            work_completion_file = req.body.work_completion_file;
        }

        const task = await DeveloperTask.findOneAndUpdate(
            { _id: task_id, developer_id },
            { status: 'Submitted', github_link, work_completion_file },
            { new: true }
        );

        if (!task) {
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

        const task = await DeveloperTask.findOneAndUpdate(
            { _id: task_id, developer_id, status: { $ne: 'Completed' } },
            { extension_requested: true, extension_reason: reason },
            { new: true }
        );

        if (!task) {
            return res.status(400).json({ success: false, message: 'Task not found or already completed/unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Extension requested successfully' });
    } catch (error) {
        next(error);
    }
};
