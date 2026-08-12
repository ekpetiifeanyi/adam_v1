const {
    NeynarAPIClient,
    Configuration
} = require("@neynar/nodejs-sdk");

const xmtpSDK = require("./src/notifications/XmtpSDK");

require("dotenv").config();

const neynar = new NeynarAPIClient(
    new Configuration({
        apiKey: process.env.NEYNAR_API_KEY
    })
);


async function getUsers() {

    const users = new Map();

    const searches = [
        "a",
        "e",
        "i",
        "o",
        "s"
    ];

    for (const query of searches) {

        console.log(`Searching: ${query}`);

        let cursor;

        for (let page = 0; page < 3; page++) {

            const response =
                await neynar.searchUser({
                    q: query,
                    limit: 10,
                    cursor
                });

            const result = response.result;

            if (!result?.users?.length) {
                break;
            }

            for (const user of result.users) {
                users.set(user.fid, user);
            }

            cursor = result.next?.cursor;

            if (!cursor) {
                break;
            }
        }
    }

    return [...users.values()];
}


function getAddresses(users) {

    const addresses = new Set();

    for (const user of users) {

        if (
            user.custody_address &&
            /^0x[a-fA-F0-9]{40}$/.test(
                user.custody_address
            )
        ) {
            addresses.add(
                user.custody_address
            );
        }

        const verified =
            user.verified_addresses?.eth_addresses || [];

        for (const address of verified) {

            if (
                /^0x[a-fA-F0-9]{40}$/.test(address)
            ) {
                addresses.add(address);
            }
        }
    }

    return [...addresses];
}


async function main() {

    console.log(
        "\nFetching Farcaster users..."
    );

    const users =
        await getUsers();

    console.log(
        `Users: ${users.length}`
    );


    const addresses =
        getAddresses(users);

    console.log(
        `ETH addresses: ${addresses.length}\n`
    );


    let supported = 0;


    for (const address of addresses) {

        const isXMTP =
            await processAddress(address);

        if (isXMTP) {

            supported++;

            console.log(
                `🔥 XMTP: ${address}`
            );

        } else {

            console.log(
                `NO:    ${address}`
            );
        }
    }


    console.log(
        "\n=============================="
    );

    console.log(
        `Addresses tested: ${addresses.length}`
    );

    console.log(
        `XMTP enabled:     ${supported}`
    );

    console.log(
        `Hit rate:         ${
            addresses.length
                ? (
                    supported /
                    addresses.length *
                    100
                ).toFixed(2)
                : "0.00"
        }%`
    );

    console.log(
        "=============================="
    );
}


async function processAddress(address) {

    try {

        const client =
            await xmtpSDK.getClient();

        const results =
            await client.canMessage([
                {
                    identifier: address,
                    identifierKind: 0,
                }
            ]);

        return (
            results.get(
                address.toLowerCase()
            ) ?? false
        );

    } catch (err) {

        console.error(
            "XMTP support check failed:",
            address,
            err.message
        );

        return false;
    }
}


main().catch(console.error);