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
        const [rows] = await pool.query(`
            SELECT f.*, m.name as mentor_name
            FROM feedbacks f
            JOIN users m ON f.mentor_id = m.id
        `);
        console.table(rows);
    } catch (e) {
        console.error("SQL Error:", e.message);
    } finally {
        process.exit(0);
    }
}
run();
