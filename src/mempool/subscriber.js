const connect = require("./socket");
const eventBus = require("../core/eventBus");

function subscribePendingTransactions() {
    const socket = connect();

    socket.on("open", () => {
        console.log("Subscribing to pending transactions...");
        socket.send(JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_subscribe",
            params: [
                "newPendingTransactions"
            ]
        }));
    });

    socket.on("message", (data) => {
        const payload = JSON.parse(data);
        // Ignore subscription confirmation
        if (payload.id === 1 && payload.result) {
            console.log("Subscription ID:", payload.result);
            return;
        }
        // Ignore anything that's not a subscription notification
        if (payload.method !== "eth_subscription") return;
        // return pending transactions only
        const hash = payload.params.result;
        // emits to fetcher.js
        eventBus.emit("pendingTx", hash);
    });
}

module.exports = subscribePendingTransactions;