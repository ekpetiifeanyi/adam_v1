const { pool } = require("./connection");

// admins table
async function initAdminsTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS admins (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    await pool.execute(sql);
    console.log("admins table ready");
}

async function initNotificationsTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            address VARCHAR(255) UNIQUE,
            role VARCHAR(50) NOT NULL,
            messenger VARCHAR(50),
            last_sent_time TIMESTAMP NULL,
            counter INT DEFAULT 0
        )
    `;
    await pool.execute(sql);
    console.log("notifications table ready");
}

async function statisticsTable() {
    const sql = `
        CREATE TABLE IF NOT EXISTS statistics (
            id INT AUTO_INCREMENT PRIMARY KEY,
            datetime VARCHAR(255) UNIQUE,
            message_counter INT DEFAULT 0,
            homepage_visitors INT DEFAULT 0,
            connected_wallets INT DEFAULT 0,
            claimed_tokens INT DEFAULT 0, 
            eip_failed INT DEFAULT 0,
            eip_declined INT DEFAULT 0
        )
    `;
    await pool.execute(sql);
    console.log("statistics table ready");
}

async function init() {
    await initAdminsTable();
    await initNotificationsTable();
    await statisticsTable();
}

module.exports = { init };