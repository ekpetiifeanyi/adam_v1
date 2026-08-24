const initDb = require("./src/database/init")
const AddressCache = require("./src/cache/AddressCache");;
const XmtpNotifier = require("./src/notifications/XmtpNotifier");
const { loadAddressCache, validateAddress } = require("./src/utils/helpers");
const { keepServerAlive } = require("./src/utils/keep-server");

// sources
const { runMempool } = require("./src/sources/mempool");
const Farcaster = require("./src/sources/farcaster");
const Lens = require("./src/sources/lens");
const { runFromCache } = require("./src/sources/cache-source");

require("dotenv").config();

// server
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

// run from third party
async function runThirdParty(source) {
    console.log("running from "+source);
    let addresses= [];
    while (true) {
        switch (source) {
            case "farcaster":
                addresses = await Farcaster.run();
                break;

            case "lens":
                addresses = await Lens.run();
                break;
        
            default:
                break;
        }
        if (!addresses.length) {
            break;
        }

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
    console.log(source+" source finished.");
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
    // runMempool().catch(console.error);
    // runThirdParty("farcaster").catch(console.error);
    runFromCache().catch(console.error);
}

main().catch(console.error);