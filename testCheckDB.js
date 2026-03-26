import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'startup_incubation',
});

async function run() {
    try {
        const [startups] = await pool.query('SELECT id, title, status FROM startups WHERE title LIKE "%AI%"');
        console.log("-- Startups --");
        console.table(startups);

        const startupIds = startups.map(s => s.id);
        if (startupIds.length > 0) {
            const [feedbacks] = await pool.query(`SELECT * FROM feedbacks WHERE startup_id IN (${startupIds.join(',')})`);
            console.log("-- Feedbacks --");
            console.table(feedbacks);
        }

        const [allFeedbacks] = await pool.query('SELECT id, startup_id, review_type, rating, created_at FROM feedbacks ORDER BY created_at DESC LIMIT 5');
        console.log("-- Latest Feedbacks in DB --");
        console.table(allFeedbacks);
    } catch (e) {
        console.error("SQL Error:", e.message);
    } finally {
        process.exit(0);
    }
}
run();
