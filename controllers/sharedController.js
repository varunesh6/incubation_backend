import DeveloperTask from '../models/DeveloperTask.js';

// @desc    Get review history for a startup
// @route   GET /api/shared/startups/:id/reviews
// @access  Private
export const getStartupReviews = async (req, res, next) => {
    try {
        const startup_id = req.params.id;

        const reviews = await DeveloperTask.find({ startup_id })
            .populate('startup_id', 'title')
            .populate('mentor_id', 'name')
            .populate('developer_id', 'name')
            .sort({ created_at: -1 })
            .lean();

        const formattedReviews = reviews.map(r => ({
            ...r,
            id: r._id,
            startup_title: r.startup_id ? r.startup_id.title : null,
            startup_id: r.startup_id ? r.startup_id._id : null,
            mentor_name: r.mentor_id ? r.mentor_id.name : null,
            mentor_id: r.mentor_id ? r.mentor_id._id : null,
            developer_name: r.developer_id ? r.developer_id.name : null,
            developer_id: r.developer_id ? r.developer_id._id : null
        }));

        res.status(200).json({ success: true, count: formattedReviews.length, data: formattedReviews });
    } catch (error) {
        next(error);
    }
};
