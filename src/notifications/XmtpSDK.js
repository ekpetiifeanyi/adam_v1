require("dotenv").config();

const { Client } = require("@xmtp/node-sdk");
const { Wallet, getBytes } = require("ethers");

class XmtpSDK {
    constructor() {
        this.client = null;
        this.signer = null;
    }
    // Returns an XMTP-compatible signer.
    getSigner() {
        if (this.signer) {
            return this.signer;
        }
        const privateKey = process.env.XMTP_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("XMTP_PRIVATE_KEY not found.");
        }
        const wallet = new Wallet(privateKey);
        this.signer = {
            type: "EOA",
            address: wallet.address,
            getIdentifier() {
                return {
                    identifier: wallet.address,
                    identifierKind: 0,
                };
            },
            async signMessage(message) {
                const signature = await wallet.signMessage(message);
                return getBytes(signature);
            },
            getChainId() {
                return BigInt(1);
            },
        };
        return this.signer;
    }

    // Initialize XMTP once.
    async initialize() {
        if (this.client) {
            return this.client;
        }
        const signer = this.getSigner();
        console.log("Initializing XMTP...");
        console.log("Bot Wallet:", signer.address);
        this.client = await Client.create(signer, {
            env: process.env.XMTP_ENV || "production",
        });
        console.log("XMTP initialized.");
        return this.client;
    }

    async getClient() {
        if (!this.client) {
            await this.initialize();
        }

        return this.client;
    }

    getAddress() {
        return this.getSigner().address;
    }
}

module.exports = new XmtpSDK();