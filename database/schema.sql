CREATE DATABASE IF NOT EXISTS startup_incubation;
USE startup_incubation;

-- Users Table (Founder, Developer, Mentor, Admin)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Founder', 'Developer', 'Mentor', 'Admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Startups Table
CREATE TABLE IF NOT EXISTS   (
    id INT AUTO_INCREMENT PRIMARY KEY,
    founder_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    funding_required DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (founder_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Mentor Assignments Table
CREATE TABLE IF NOT EXISTS mentor_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    startup_id INT NOT NULL,
    mentor_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Applications Table (Developers applying to startups)
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    startup_id INT NOT NULL,
    developer_id INT NOT NULL,
    status ENUM('Applied', 'Accepted', 'Rejected') DEFAULT 'Applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
    FOREIGN KEY (developer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Progress Updates Table
CREATE TABLE IF NOT EXISTS progress_updates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    startup_id INT NOT NULL,
    developer_id INT,
    description TEXT NOT NULL,
    update_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
    FOREIGN KEY (developer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Funding Table
CREATE TABLE IF NOT EXISTS funding (
    id INT AUTO_INCREMENT PRIMARY KEY,
    startup_id INT NOT NULL,
    investor_name VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status ENUM('Committed', 'Received') DEFAULT 'Committed',
    funding_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE
);
