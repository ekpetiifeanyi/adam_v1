const AddressCache = require("../cache/AddressCache");
const SQL = require("../database/Sql");

// Load all known addresses
async function loadAddressCache() {
    const result = await SQL.addresses();
    if (!result.success) {
        return;
    }
    for (const row of result.data) {
        AddressCache.set(row.address, {
            last_sent_time: row.last_sent_time,
        });
    }
    console.log(`Loaded ${result.data.length} addresses into cache.`);
}

// Validate notification interval
function validateAddress(lastSentTime) {
    if (!lastSentTime) {
        return {
            allowed: true,
        };
    }
    const currentTime = Date.now();
    const lastSent = new Date(lastSentTime).getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if ((currentTime - lastSent) < oneWeek) {
        return {
            allowed: false,
        };
    }
    return {
        allowed: true,
    };
}

module.exports = { loadAddressCache, validateAddress }
