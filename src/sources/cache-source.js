const AddressCache = require("../cache/AddressCache");
const { validateAddress } = require("../utils/helpers");
const XmtpNotifier = require("../notifications/XmtpNotifier");

async function runFromCache() {
    const source = "address cache";

    const addresses = AddressCache.getAll();
    try {
        for (const [address, data] of addresses) {
            const result = validateAddress(data.last_sent_time);
            if (!result.allowed) {
                continue;
            }
            await XmtpNotifier.processAddress(address, "update address", source);
        }
    } catch (error) {
        console.log("run from cache error: ", error);
    }
}

module.exports = { runFromCache }
