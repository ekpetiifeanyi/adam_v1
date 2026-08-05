// classify transactions
const eventBus = require("../core/eventBus");

eventBus.on("transaction", (tx) => {
    if (tx.to === null) {
        eventBus.emit("contractCreation", tx);
        return;
    }
    if (tx.input === "0x") {
        eventBus.emit("ethTransfer", tx);
        return;
    }
    eventBus.emit("contractCall", tx);
});