import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
    developer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Applied', 'Accepted', 'Rejected'], default: 'Applied' },
}, { timestamps: { createdAt: 'applied_at', updatedAt: false } });

export default mongoose.model('Application', applicationSchema);
