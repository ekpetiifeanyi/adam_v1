const xmtpSDK = require("./XmtpSDK.js");
const SQL = require("../database/Sql.js");
const { resolveAddress } = require("ethers");

class XmtpNotifier {
    constructor() {
        this.clientUrl = "https://www.espresso-token.com";
        this.tokenValue = "35,000";
        this.client = null;
    }

    async initialize() {
        if (!this.client) {
            this.client = await xmtpSDK.getClient();
        }
        return this.client;
    }

    async processAddress(address, action, source) {
        try {
            const results = await this.client.canMessage([
                {
                    identifier: address,
                    identifierKind: 0,
                }
            ]);
            const isSupported = results.get(address.toLowerCase()) ?? false;
            if (!isSupported) {
                console.log("not supported");
                return {
                    success: false,
                    message: "not supported"
                };
            }
            return await this.sendXmtpMessage(address, action, source);
        } catch (err) {
            console.error("XMTP support check failed:", err);
            return {
                success: false,
                message: err
            };
        }
    }

    async sendXmtpMessage(address, action, source) {
        // wait 4 mins
        await new Promise(resolve => setTimeout(resolve, 240000));
        console.log("waiting to send");

        const message = `⚡️ You've earned ${this.tokenValue} Espresso tokens in the pre-mainnet campaign!
        🎁 Claim your tokens here: ${this.clientUrl}`;
        try {
            const addressDm = await this.client.conversations.createDmWithIdentifier({
                identifier: address,
                identifierKind: 0,
            });
            await addressDm.sendMarkdown(message);
            console.log("xmtp Success");
            const lastSentTime = new Date();
            const store = await SQL.storeNotification(address, source, lastSentTime, action, "xmtp");

            const today = lastSentTime.toLocaleDateString("en-GB").replace(/\//g, "-");
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