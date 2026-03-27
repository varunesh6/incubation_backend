import mongoose from 'mongoose';

const mentorAssignmentSchema = new mongoose.Schema({
    startup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Startup', required: true },
    mentor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: { createdAt: 'assigned_at', updatedAt: false } });

export default mongoose.model('MentorAssignment', mentorAssignmentSchema);
