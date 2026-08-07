const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// simple query wrapper
async function query(sql, params) {
    return pool.query(sql, params);
}

// keep database alive (safe ping)
async function keepDatabaseAlive() {
    try {
        await pool.query("SELECT 1");
    }
    catch (err) {
        console.error("Keep database alive failed:", err.message);
    }
}

module.exports = { pool, query, keepDatabaseAlive };