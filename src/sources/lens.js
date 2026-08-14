const axios = require("axios");
const https = require("https");

const agent = new https.Agent({
    family: 4,
    keepAlive: true,
});

class LensSource {
    constructor() {
        this.batchSize = 100;
        this.cursor = null;
        this.seenAddresses = new Set();
    }

    async run() {
        const addresses = new Set();
        while (addresses.size < this.batchSize) {
            const response = await this.fetchPosts(this.cursor);
            const posts = response?.posts?.items || [];

            if (!posts.length) {
                break;
            }

            for (const post of posts) {
                const address = post?.author?.address;
                if (this.isEthereumAddress(address) && !this.seenAddresses.has(address.toLowerCase())) {
                    const normalized = address.toLowerCase();
                    this.seenAddresses.add(normalized);
                    addresses.add(normalized);
                    if (addresses.size >= this.batchSize) {
                        break;
                    }
                }
            }
            this.cursor = response?.posts?.pageInfo?.next;
            if (!this.cursor) {
                break;
            }
        }
        return [...addresses];
    }

    async fetchPosts(cursor) {
        const query = `
        query Feed($cursor: Cursor) {
            posts(
                request: {
                    pageSize: FIFTY
                    cursor: $cursor
                }
            ) {
                items {
                    ... on Post {
                        author {
                            address
                        }
                    }
                }
                pageInfo {
                    next
                }
            }
        }`;

        try {
            const { data } = await axios.post("https://api.lens.xyz/graphql",
                {
                    query,
                    variables: { cursor }
                },
                {
                    httpsAgent: agent,
                    timeout: 15000,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json"
                    }
                }
            );

            if (data.errors) {
                console.dir(data.errors, { depth: null });
                return null;
            }
            return data.data;
        } catch (err) {
            console.error("Lens API:", err.response?.data || err.message);
            return null;
        }
    }

    isEthereumAddress(address) {
        return (typeof address === "string" && /^0x[a-fA-F0-9]{40}$/.test(address));
    }
}

module.exports = new LensSource();