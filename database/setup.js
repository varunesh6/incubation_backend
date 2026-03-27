import connectDB from '../config/db.js';

async function setupDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();

        console.log('MongoDB schema is handled automatically by Mongoose models.');
        console.log('Database connection verified successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
}

setupDatabase();
