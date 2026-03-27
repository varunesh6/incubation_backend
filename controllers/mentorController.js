import Startup from '../models/Startup.js';
import MentorAssignment from '../models/MentorAssignment.js';
import Feedback from '../models/Feedback.js';
import ProgressUpdate from '../models/ProgressUpdate.js';
import User from '../models/User.js';
import DeveloperTask from '../models/DeveloperTask.js';

// @desc    Get assigned startups for mentor
// @route   GET /api/mentor/startups
// @access  Private (Mentor only)
export const getAssignedStartups = async (req, res, next) => {
    try {
        const mentor_id = req.user.id;
        
        const assignments = await MentorAssignment.find({ mentor_id }).populate('startup_id').lean();
        
        const startups = assignments
            .filter(a => a.startup_id)
            .map(a => ({
                ...a.startup_id,
                id: a.startup_id._id,
                assignment_id: a._id
            }));

        res.status(200).json({ success: true, count: startups.length, data: startups });
    } catch (error) {
        next(error);
    }
};

// @desc    Provide feedback
// @route   POST /api/mentor/startups/:id/feedback
// @access  Private (Mentor only)
export const provideFeedback = async (req, res, next) => {
    try {
        const { feedback, review_type = 'Weekly Review', rating = 5, mark_completed } = req.body;
        const startup_id = req.params.id;
        const mentor_id = req.user.id;

        const document_url = req.file ? `/uploads/${req.file.filename}` : null;

        const assignment = await MentorAssignment.findOne({ startup_id, mentor_id });
        if (!assignment) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        const newFeedback = new Feedback({
            startup_id,
            mentor_id,
            review_type,
            rating,
            comment: feedback,
            document_url
        });
        await newFeedback.save();

        const completed = mark_completed === 'true' || mark_completed === true;
        if (completed) {
            await Startup.findByIdAndUpdate(startup_id, { status: 'Completed' });
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

        const assignment = await MentorAssignment.findOne({ startup_id, mentor_id });
        if (!assignment) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        const progress = await ProgressUpdate.find({ startup_id }).sort({ created_at: -1 }).lean();
        const formattedProgress = progress.map(p => ({ ...p, id: p._id }));

        res.status(200).json({ success: true, count: formattedProgress.length, data: formattedProgress });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all developers in the system for task assignment
// @route   GET /api/mentor/developers
// @access  Private (Mentor only)
export const getDevelopers = async (req, res, next) => {
    try {
        const developers = await User.find({ role: 'Developer' })
            .select('name email')
            .sort({ name: 1 })
            .lean();

        const formatted = developers.map(d => ({ ...d, id: d._id }));
        res.status(200).json({ success: true, count: formatted.length, data: formatted });
    } catch (error) {
        next(error);
    }
};

// @desc    Assign a target/task to an accepted developer
// @route   POST /api/mentor/startups/:id/tasks
// @access  Private (Mentor only)
export const assignTaskToDeveloper = async (req, res, next) => {
    try {
        const { developer_id, title, description, deadline, review_type = 'Weekly Review' } = req.body;
        const startup_id = req.params.id;
        const mentor_id = req.user.id;

        const assignment = await MentorAssignment.findOne({ startup_id, mentor_id });
        if (!assignment) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        const existingTask = await DeveloperTask.findOne({ startup_id });
        let finalDeveloperId = developer_id;
        if (existingTask) {
            finalDeveloperId = existingTask.developer_id;
        }

        const newTask = new DeveloperTask({
            startup_id,
            developer_id: finalDeveloperId,
            mentor_id,
            title,
            description,
            deadline,
            review_type
        });
        await newTask.save();

        await Startup.findByIdAndUpdate(startup_id, { status: "Ongoing" });

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
        const tasks = await DeveloperTask.find({ mentor_id })
            .populate('startup_id', 'title')
            .populate('developer_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        const formattedTasks = tasks.map(t => ({
            ...t,
            id: t._id,
            startup_title: t.startup_id ? t.startup_id.title : null,
            startup_id: t.startup_id ? t.startup_id._id : null,
            developer_name: t.developer_id ? t.developer_id.name : null,
            developer_id: t.developer_id ? t.developer_id._id : null
        }));

        res.status(200).json({ success: true, count: formattedTasks.length, data: formattedTasks });
    } catch (error) {
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

        const task = await DeveloperTask.findOneAndUpdate(
            { _id: task_id, mentor_id },
            { status, feedback },
            { new: true }
        );

        if (!task) {
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

        const task = await DeveloperTask.findOne({ _id: task_id, mentor_id });
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found or unauthorized' });
        }

        if (approve) {
            const newFeedback = message && message.trim() !== '' ? `\n\n[Extension Approved]: ${message}` : '';
            task.deadline = new_deadline;
            task.extension_requested = false;
            task.extension_reason = undefined;
            task.feedback = (task.feedback || '') + newFeedback;
            await task.save();
        } else {
            const denialMessage = `\n\n[Extension Denied]: ${reason}`;
            task.extension_requested = false;
            task.feedback = (task.feedback || '') + denialMessage;
            await task.save();
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

        const assignment = await MentorAssignment.findOne({ startup_id, mentor_id });
        if (!assignment) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this startup' });
        }

        const startup = await Startup.findByIdAndUpdate(startup_id, { status: "Completed" }, { new: true });

        if (!startup) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }

        res.status(200).json({ success: true, message: 'Project marked as completed successfully' });
    } catch (error) {
        next(error);
    }
};
