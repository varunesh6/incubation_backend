import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
    try {
        console.log('Connecting to MySQL...');
        // Connect without DB name first to create it if it doesn't exist
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'yourpassword',
            multipleStatements: true
        });

        console.log('Reading schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema script...');
        // Execute the complete script which includes CREATE DATABASE and USE startup_incubation
        await connection.query(schema);

        console.log('Database schema executed successfully!');
        await connection.end();
    } catch (error) {
        console.error('Database setup failed:', error);
    }
}

setupDatabase();
