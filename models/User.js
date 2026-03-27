import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Founder', 'Developer', 'Mentor', 'Admin'], required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

export default mongoose.model('User', userSchema);
