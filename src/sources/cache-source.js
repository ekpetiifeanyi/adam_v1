const AddressCache = require("../cache/AddressCache");
const { validateAddress, sleep } = require("../utils/helpers");
const XmtpNotifier = require("../notifications/XmtpNotifier");
const { resolveAddress } = require("ethers");

async function runFromCache() {
    const source = "address cache";

    const addresses = AddressCache.getAll();
    try {
        for (const [address, data] of addresses) {
            const result = validateAddress(data.last_sent_time);
            if (!result.allowed) {
                continue;
            }
            console.log("waiting...");
            await sleep(240000);
            await XmtpNotifier.processAddress(address, "update address", source);
        }
    } catch (error) {
        console.log("run from cache error: ", error);
    }
}

module.exports = { runFromCache }
