import mongoose from 'mongoose';

const startupSchema = new mongoose.Schema({
    founder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    funding_required: { type: Number, default: 0.00, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Startup', startupSchema);
