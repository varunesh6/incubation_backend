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
        await pool.query('ALTER TABLE feedbacks ADD COLUMN document_url VARCHAR(255) NULL');
        console.log("document_url added successfully.");
    } catch (e) {
        console.error("SQL Error:", e.message);
    } finally {
        process.exit(0);
    }
}
run();
