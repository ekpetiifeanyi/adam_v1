const { pool } = require('./connection');
const AddressCache = require("../cache/AddressCache");

class SQL {
    // get address
    async addresses() {
        try {
            const [rows] = await pool.execute("SELECT * FROM notifications");
            if (rows.length === 0) {
                return {
                    success: false,
                    data: 0,
                }
            }
            return {
                success: true,
                data: rows,
            }
        } catch (err) {
            return {
                success: false,
                data: err.message,
            };
        }
    }

    // store notifications
    async storeNotification(address, role, lastSentTime, action, messenger) {
        if (action === "new address") {
            const [rows] = await pool.execute(`INSERT INTO notifications (address, role, last_sent_time, messenger, counter) 
                VALUES (?, ?, ?, ?, ?)`,  [address, role, lastSentTime, messenger, 1]);
            if (rows.affectedRows > 0) {
                // cache new address
                AddressCache.set(address, { last_sent_time: lastSentTime });
                return {
                    success: true,
                    message: "new address inserted",
                };
            }
        }
        else if (action === "update address") {
            const [rows] =  await pool.execute(`UPDATE notifications SET counter = counter + 1, last_sent_time = ? WHERE address = ?`, 
                [lastSentTime, address]);
            if (rows.affectedRows > 0) {
                // update address cache
                AddressCache.set(address, { last_sent_time: lastSentTime });
                return {
                    success: true,
                    message: "address updated",
                };
            }
        }
        return {
            success: false,
            message: "notification not stored",
        };
    }

    // update statistics
    async updateStatistics(datetime, column, increment = 1) {
        try {
            const sql = `INSERT INTO statistics (
                datetime, message_counter, homepage_visitors, connected_wallets, claimed_tokens, eip_failed, eip_declined)
                VALUES (?, 1, 0, 0, 0, 0, 0) ON DUPLICATE KEY UPDATE ${column} = ${column} + ?`;

            const [result] = await pool.execute(sql, [datetime, increment]);

            return {
                success: true,
                message: `${column} updated successfully.`,
            };
        } catch (error) {
            console.error("updateStatistics:", error);
            return {
                success: false,
                message: "Failed to update statistics.",
                error: error.message,
            };
        }
    }
}

module.exports = new SQL();