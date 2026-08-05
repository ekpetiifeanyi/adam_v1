// read-only. fetch data from Ethereum Mainnet.
const { createPublicClient, http } = require("viem");
const { mainnet } = require("viem/chains");
const { liveRpc } = require("../config/rpc");

const liveClient = createPublicClient({
    chain: mainnet,
    transport: http(liveRpc),
});

module.exports = liveClient;