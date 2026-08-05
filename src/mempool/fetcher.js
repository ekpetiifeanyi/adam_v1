const eventBus = require("../core/eventBus");
const liveClient = require("../config/liveClient");

// pending transactions
eventBus.on("pendingTx", async (hash) => {
    try {
        const tx = await liveClient.getTransaction({
            hash,
        });
        if (!tx) return;
        // emits to index.js
        eventBus.emit("transaction", tx);
    } catch (err) {
        // A pending transaction may disappear before we fetch it.
        // That's normal, so ignore these errors for now.
    }
});