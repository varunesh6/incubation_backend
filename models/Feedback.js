import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
    mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    review_type: { type: String, default: 'Weekly Review' },
    rating: { type: Number, default: 5 },
    comment: { type: String, required: true },
    document_url: { type: String, default: null },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Feedback', feedbackSchema);
