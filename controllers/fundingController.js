import Funding from '../models/Funding.js';
import Startup from '../models/Startup.js';

// @desc    Add funding record
// @route   POST /api/funding
// @access  Private (Admin only)
export const addFundingRecord = async (req, res, next) => {
    try {
        const { startup_id, investor_name, amount, status, date } = req.body;

        if (!startup_id || !investor_name || !amount || !date) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        const newFunding = new Funding({
            startup_id,
            investor_name,
            amount,
            status: status || 'Committed',
            funding_date: date
        });

        await newFunding.save();

        res.status(201).json({ success: true, message: 'Funding record added successfully' });
    } catch (error) {
        next(error);
    }
};

// @desc    View funding by startup
// @route   GET /api/funding/startup/:id
// @access  Private (Admin potentially others, but let's restrict to Admin/Founder)
export const getFundingByStartup = async (req, res, next) => {
    try {
        const startup_id = req.params.id;
        const funding = await Funding.find({ startup_id }).sort({ funding_date: -1 }).lean();
        
        const formattedFunding = funding.map(f => ({ ...f, id: f._id }));
        res.status(200).json({ success: true, count: formattedFunding.length, data: formattedFunding });
    } catch (error) {
        next(error);
    }
};

// @desc    Generate funding summary report
// @route   GET /api/funding/summary
// @access  Private (Admin only)
export const getFundingSummary = async (req, res, next) => {
    try {
        const summary = await Startup.aggregate([
            {
                $lookup: {
                    from: "fundings",
                    localField: "_id",
                    foreignField: "startup_id",
                    as: "fundings"
                }
            },
            {
                $project: {
                    startup_name: "$title",
                    fundings: {
                        $filter: {
                            input: "$fundings",
                            as: "f",
                            cond: { $eq: ["$$f.status", "Received"] }
                        }
                    }
                }
            },
            {
                $project: {
                    startup_name: 1,
                    total_funding: { $sum: "$fundings.amount" },
                    number_of_investments: { $size: "$fundings" }
                }
            },
            { $sort: { total_funding: -1 } }
        ]);

        const totalOverallAgg = await Funding.aggregate([
            { $match: { status: 'Received' } },
            { $group: { _id: null, total_received: { $sum: "$amount" } } }
        ]);

        const totalOverall = totalOverallAgg.length > 0 ? totalOverallAgg[0].total_received : 0;

        res.status(200).json({
            success: true,
            data: {
                summary,
                totalOverall
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    View all funding records
// @route   GET /api/funding
// @access  Private (Admin only)
export const getAllFunding = async (req, res, next) => {
    try {
        const funding = await Funding.find()
            .populate('startup_id', 'title')
            .sort({ funding_date: -1 })
            .lean();

        const formattedFunding = funding.map(f => ({
            ...f,
            id: f._id,
            startup_title: f.startup_id ? f.startup_id.title : null,
            startup_id: f.startup_id ? f.startup_id._id : null
        }));

        res.status(200).json({ success: true, count: formattedFunding.length, data: formattedFunding });
    } catch (error) {
        next(error);
    }
};
