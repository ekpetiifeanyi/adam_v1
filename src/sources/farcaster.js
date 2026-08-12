const { NeynarAPIClient, Configuration } = require("@neynar/nodejs-sdk");
require("dotenv").config();

const neynar = new NeynarAPIClient(
    new Configuration({
        apiKey: process.env.NEYNAR_API_KEY
    })
);

// get addresses from farcaster
class FarcasterSource {
    constructor() {
        this.batchSize = 100;
        this.searches = [
            "a", "e", "i", "o", "s", "c", "m", "n", "r", "t", "l", "d", "p",
            "b", "g", "f", "h", "j", "k", "q", "u", "v", "w", "x", "y","z"
        ];
        this.searchIndex = 0;
        this.cursor = undefined;
        this.addresses = [];
        this.seenAddresses = new Set();
        this.finished = false;
    }

    // get next batch of addresses
    async run() {
        if (this.finished) {
            return [];
        }

        while (this.addresses.length < this.batchSize) {
            if (this.searchIndex >= this.searches.length) {
                this.finished = true;
                break;
            }
            const query = this.searches[this.searchIndex];
            const response =await this.fetchUsers(query, this.cursor);
            const result = response.result;
            const users = result?.users || [];

            if (!users.length) {
                this.searchIndex++;
                this.cursor = undefined;
                continue;
            }

            const addresses = this.extractAddresses(users);
            for (const address of addresses) {
                if (this.seenAddresses.has(address)) {
                    continue;
                }
                this.seenAddresses.add(address);
                this.addresses.push(address);
            }

            // next page
            this.cursor = result.next?.cursor;
            if (!this.cursor) {
                this.searchIndex++;
                this.cursor = undefined;
            }
        }
        const batch = this.addresses.splice(0, this.batchSize);
        return batch;
    }

    // fetch users
    async fetchUsers(query, cursor) {
        const params = {q: query, limit: 10};
        if (cursor) {
            params.cursor = cursor;
        }
        try {
            return await neynar.searchUser(params);
        } catch (err) {
            console.error("Farcaster API error:", err.message);
            throw err;
        }
    }

    // extract ethereum address
    extractAddresses(users) {
        const addresses = new Set();
        for (const user of users) {
            // custody address
            if (this.isEthereumAddress(user.custody_address)) {
                addresses.add(
                    user.custody_address.toLowerCase()
                );
            }

            // verified ETH addresses
            const verified = user.verified_addresses?.eth_addresses || [];
            for (const address of verified) {
                if (this.isEthereumAddress(address)) {
                    addresses.add(
                        address.toLowerCase()
                    );
                }
            }
        }
        return [...addresses];
    }

    // address validation
    isEthereumAddress(address) {
        return (typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address));
    }
}

module.exports = new FarcasterSource();