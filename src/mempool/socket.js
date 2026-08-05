// connect to ethereum blockchain using alchemy websocket url
const { liveWs } = require("../config/rpc");
const WebSocket = require("ws");

function connect() {
    const socket = new WebSocket(liveWs);
    socket.on("open", () => {
        console.log("WebSocket Connected");
    });

    socket.on("close", () => {
        console.log("WebSocket Closed");
    });

    socket.on("error", (err) => {
        console.error("WebSocket Error:", err);
    });
    return socket;
}

module.exports = connect;