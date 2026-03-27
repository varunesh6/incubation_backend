import mongoose from 'mongoose';

const fundingSchema = new mongoose.Schema({
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
    investor_name: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['Committed', 'Received'], default: 'Committed' },
    funding_date: { type: Date, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('Funding', fundingSchema);
