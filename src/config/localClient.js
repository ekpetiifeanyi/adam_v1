// local client connects with alchemy http request via anvil
const { createPublicClient, http } = require("viem");
const { localRpc } = require("./rpc");

const localClient = createPublicClient({
    transport: http(localRpc),
});

module.exports = localClient;