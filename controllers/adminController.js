import User from '../models/User.js';
import Startup from '../models/Startup.js';
import MentorAssignment from '../models/MentorAssignment.js';

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('name email role created_at').sort({ created_at: -1 }).lean();
        const formattedUsers = users.map(u => ({ ...u, id: u._id }));
        res.status(200).json({ success: true, count: formattedUsers.length, data: formattedUsers });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all startup submissions
// @route   GET /api/admin/startups
// @access  Private (Admin only)
export const getAllStartups = async (req, res, next) => {
    try {
        const startups = await Startup.find().sort({ created_at: -1 }).lean();
        
        for (let s of startups) {
            s.id = s._id;
            const founder = await User.findById(s.founder_id);
            s.founder_name = founder ? founder.name : null;
            
            const assignment = await MentorAssignment.findOne({ startup_id: s._id }).populate('mentor_id');
            s.mentor_name = (assignment && assignment.mentor_id) ? assignment.mentor_id.name : null;
        }

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

        const startup = await Startup.findByIdAndUpdate(startup_id, { status }, { new: true });

        if (!startup) {
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

        const startup = await Startup.findById(startup_id);
        if (!startup || startup.status !== 'Approved') {
            return res.status(400).json({ success: false, message: 'Startup must be approved before assigning a mentor' });
        }

        const mentor = await User.findById(mentor_id);
        if (!mentor || mentor.role !== 'Mentor') {
            return res.status(400).json({ success: false, message: 'Invalid mentor selected' });
        }

        const newAssignment = new MentorAssignment({ startup_id, mentor_id });
        await newAssignment.save();

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

        const startup = await Startup.findByIdAndUpdate(startup_id, { status: "Completed" }, { new: true });

        if (!startup) {
            return res.status(404).json({ success: false, message: 'Startup not found' });
        }

        res.status(200).json({ success: true, message: 'Project finalized successfully' });
    } catch (error) {
        next(error);
    }
};
