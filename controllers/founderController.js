import Startup from '../models/Startup.js';

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

        const newStartup = new Startup({
            founder_id,
            title,
            description,
            category,
            funding_required: funding_required || 0.00,
            status: 'Pending'
        });

        const result = await newStartup.save();

        res.status(201).json({
            success: true,
            data: { id: result._id, title, status: 'Pending' }
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
        const startups = await Startup.find({ founder_id }).sort({ created_at: -1 }).lean();

        const formattedStartups = startups.map(s => ({ ...s, id: s._id }));

        res.status(200).json({
            success: true,
            count: formattedStartups.length,
            data: formattedStartups
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

        const updateFields = {};
        if (title !== undefined) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (category !== undefined) updateFields.category = category;
        if (funding_required !== undefined) updateFields.funding_required = funding_required;

        const startup = await Startup.findOneAndUpdate(
            { _id: startup_id, founder_id },
            { $set: updateFields },
            { new: true }
        );

        if (!startup) {
            return res.status(404).json({ success: false, message: 'Startup not found or unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Startup updated successfully' });
    } catch (error) {
        next(error);
    }
};
