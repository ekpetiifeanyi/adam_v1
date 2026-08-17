const AddressCache = require("../cache/AddressCache");
const localClient = require("../config/localClient");
const subscribePendingTransactions = require("../mempool/subscriber");
const eventBus = require("../core/eventBus");
const XmtpNotifier = require("../notifications/XmtpNotifier");
require("../mempool/fetcher");
require("../mempool/classifier");
const { validateAddress } = require("../utils/helpers");

// mempool
let processing = false;
async function runMempool() {
    const source = "mempool";

    eventBus.on("ethTransfer", async (tx) => {
        if (processing) return;
        processing = true;
        try {
            const participants = [
                { address: tx.from},
                { address: tx.to }
            ];
            for (const { address } of participants) {
                if (!address) continue;
                const cached = AddressCache.get(address);
                if (cached) {
                    const result = validateAddress(cached.last_sent_time);
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
        } finally {
            processing = false;
        }
    });
    subscribePendingTransactions();
}

module.exports = { runMempool }
