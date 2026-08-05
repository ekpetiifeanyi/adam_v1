const localClient = require("./src/config/localClient");
const subscribePendingTransactions = require("./src/mempool/subscriber");
const eventBus = require("./src/core/eventBus");
require("./src/mempool/fetcher");
require("./src/mempool/classifier");
const AddressCache = require("./src/cache/AddressCache");
const initDb = require("./src/database/init");
const SQL = require("./src/database/Sql");
const XmtpNotifier = require("./src/notifications/XmtpNotifier");
const { keepServerAlive } = require("./src/utils/keep-server");

require("dotenv").config();

const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

// health check
app.get("/health", (req, res) => {
    res.json({
        success: true,
        timestamp: new Date().toISOString()
    });
});

// BOT
let processing = false;
async function bot() {
    eventBus.on("ethTransfer", async (tx) => {
        if (processing) return;
        processing = true;

        try {
            const participants = [
                { address: tx.from, role: "sender" },
                { address: tx.to, role: "receiver" }
            ];
            for (const { address, role } of participants) {
                if (!address) continue;
                const cached = AddressCache.get(address);
                if (cached) {
                    const result = validateAddress(cached.last_sent_time);
                    if (!result.allowed) {
                        continue;
                    }
                    await XmtpNotifier.sendXmtpMessage(address, role, tx.value, "update address");
                }
                else {
                    await XmtpNotifier.processAddress(address, role, tx.value, "new address");
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            processing = false;
        }
    });
    subscribePendingTransactions();
}

// Load all known addresses
async function loadAddressCache() {
    const result = await SQL.addresses();
    console.log(result.data);
    if (!result.success) {
        console.log(result.data);
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

// main
async function main() {
    await initDb.init();
    await loadAddressCache();
    //bot().catch(console.error);
    keepServerAlive(`http://${HOST}:${PORT}/health`, 10);

    app.listen(HOST, PORT, ()=>{
        console.log(`${HOST} listening on PORT: ${PORT}`);
    })
}

main();