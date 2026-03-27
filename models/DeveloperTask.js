import mongoose from 'mongoose';

const developerTaskSchema = new mongoose.Schema({
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
    developer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: Date, required: true },
    review_type: { type: String, default: 'Weekly Review' },
    github_link: { type: String },
    work_completion_file: { type: String },
    status: { type: String, enum: ['Assigned', 'Submitted', 'Completed', 'Changes Requested'], default: 'Assigned' },
    feedback: { type: String },
    extension_requested: { type: Boolean, default: false },
    extension_reason: { type: String },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('DeveloperTask', developerTaskSchema);
