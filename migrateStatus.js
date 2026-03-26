import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'startup_incubation',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function run() {
    try {
        console.log("Altering startups table...");
        await pool.query("ALTER TABLE startups MODIFY COLUMN status ENUM('Pending', 'Approved', 'Rejected', 'Ongoing', 'Completed') DEFAULT 'Pending'");
        console.log("Success!");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
run();
