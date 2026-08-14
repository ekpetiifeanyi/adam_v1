const AddressCache = require("./src/cache/AddressCache");
const initDb = require("./src/database/init");
const SQL = require("./src/database/Sql");
const XmtpNotifier = require("./src/notifications/XmtpNotifier");
const { keepServerAlive } = require("./src/utils/keep-server");
const Farcaster = require("./src/sources/farcaster");
const Lens = require("./src/sources/lens");
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
async function bot(addresses, source) {
    console.log("running from "+ source);
    try {
        for (const address of addresses) {
            if (!address) continue;
            const cached = AddressCache.get(address);
            if (cached) {
                const result =  validateAddress(cached.last_sent_time);
                if (!result.allowed) {
                    continue;
                }
                await XmtpNotifier.sendXmtpMessage(address, "update address", source);
            }
            else {
                await XmtpNotifier.processAddress(address, "new address", source);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

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

// farcaster
async function runFarcaster() {
    while (true) {
        const addresses = await Farcaster.run();
        if (!addresses.length) {
            break;
        }
        await bot(addresses, "farcaster");
    }
    console.log("Farcaster source finished.");
}

// lens
async function runLens() {
    while (true) {
        const addresses = await Lens.run();
        if (!addresses.length) {
            break;
        }
        await bot(addresses, "lens");
    }
    console.log("lens source finished.");
}

// main
async function main() {
    await initDb.init();
    await loadAddressCache();
    app.listen(PORT, HOST, () => {
        console.log(`listening on ${HOST}:${PORT}`);
    });
    keepServerAlive(`http://${HOST}:${PORT}/health`, 10);
    await XmtpNotifier.initialize();
    // runFarcaster().catch(console.error);
    runLens().catch(console.error);
}

main().catch(console.error);