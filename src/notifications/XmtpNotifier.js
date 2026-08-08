const xmtpSDK = require("./XmtpSDK.js");
const SQL = require("../database/Sql.js");
const { formatEther } = require("ethers");

class XmtpNotifier {
    constructor() {
        this.clientUrl =  "https://www.espresso-token.com";
        this.tokenValue = "35,000";
    }

    async processAddress(address, role, value, action) {
        try {
            const client = await xmtpSDK.getClient();            
            const results = await client.canMessage([
                {
                    identifier: address,
                    identifierKind: 0,
                }
            ]);
            const isSupported = results.get(address.toLowerCase()) ?? false;
            if (!isSupported) {
                return {
                    success: false,
                    message: "not supported"
                };
            }
            await this.sendXmtpMessage(client, address, role, value, action);
        } catch (err) {
            console.error("XMTP support check failed:", err);
            return {
                success: false,
                message: err

            };
        }
    }

    async sendXmtpMessage(client, address, role, value, action) {
        console.log("0. Supported");
        const actionVerb = role === "sender" ? "sending" : "receiving";
        const eth = Number(formatEther(value)).toFixed(2);
    
        const message = `⚡️ You earned ${this.tokenValue} Espresso tokens for ${actionVerb} ${eth} ETH during the ESP pre-mainnet campaign.
        \n\n👉 Claim here: ${this.clientUrl}`;

        try {
            console.log("1. Client conversation");
            const addressDm = await client.conversations.createDmWithIdentifier({
                identifier: address,
                identifierKind: 0,
            });

            console.log("2. Sending xmtp");
            await addressDm.sendMarkdown(message);
            console.log("3. xmtp Success");

            const lastSentTime = new Date();
            const store = await SQL.storeNotification(address, role, lastSentTime, action, "xmtp");
            const today = new Date().toLocaleDateString("en-GB").replace(/\//g, "-");
            const statistics = await SQL.updateStatistics(today, "message_counter");

            return {
                success: true,
                message: `Notifications sent to ${address}`,
            };
        } catch (err) {
            console.error("Failed to send XMTP notifications:", err);
            return {
                success: false,
                message: err.message,
            };
        }
    }
}

module.exports = new XmtpNotifier();