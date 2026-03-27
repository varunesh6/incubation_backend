import mongoose from 'mongoose';

const progressUpdateSchema = new mongoose.Schema({
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
    developer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    description: { type: String, required: true },
    update_date: { type: Date, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('ProgressUpdate', progressUpdateSchema);
