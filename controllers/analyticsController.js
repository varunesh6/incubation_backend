import Startup from '../models/Startup.js';
import Funding from '../models/Funding.js';
import MentorAssignment from '../models/MentorAssignment.js';

// @desc    Get platform statistics
// @route   GET /api/analytics/stats
// @access  Private (Admin only)
export const getPlatformStats = async (req, res, next) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalStartups,
            startupStatuses,
            totalFundingAgg,
            activeMentorsCount
        ] = await Promise.all([
            Startup.countDocuments(),
            Startup.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
            Funding.aggregate([{ $match: { status: "Received" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
            MentorAssignment.distinct('mentor_id', { assigned_at: { $gt: thirtyDaysAgo } }).then(arr => arr.length)
        ]);

        const statuses = startupStatuses.reduce((acc, row) => {
            acc[row._id] = row.count;
            return acc;
        }, { Pending: 0, Approved: 0, Rejected: 0 });

        const totalFundingReceived = totalFundingAgg.length > 0 ? totalFundingAgg[0].total : 0;

        res.status(200).json({
            success: true,
            data: {
                totalStartups,
                approvedStartups: statuses.Approved || 0,
                rejectedStartups: statuses.Rejected || 0,
                pendingStartups: statuses.Pending || 0,
                totalFundingReceived,
                activeMentors: activeMentorsCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get funding over time for charts
// @route   GET /api/analytics/funding-trend
// @access  Private (Admin only)
export const getFundingTrend = async (req, res, next) => {
    try {
        const trends = await Funding.aggregate([
            { $match: { status: 'Received' } },
            { $group: { 
                _id: { $dateToString: { format: "%Y-%m", date: "$funding_date" } }, 
                total: { $sum: "$amount" } 
            } },
            { $sort: { _id: 1 } },
            { $limit: 12 },
            { $project: { month: "$_id", total: 1, _id: 0 } }
        ]);

        res.status(200).json({ success: true, data: trends });
    } catch (error) {
        next(error);
    }
};
