//RPC connection - Remote Procedure Call.
require("dotenv").config();

module.exports = {
    localRpc: process.env.LOCAL_RPC,
    liveRpc: process.env.LIVE_RPC,
    liveWs: process.env.LIVE_WS,
};