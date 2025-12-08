const fs = require("fs");
const path = require("path");

// Manually load .env.local because dotenv is failing
const envPath = path.resolve(__dirname, ".env.local");
console.log("Loading env from:", envPath);

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    console.log("Read bytes:", envContent.length);

    // Try simple indexOf first
    const idx = envContent.indexOf("DEPLOYER_PRIVATE_KEY=");
    if (idx !== -1) {
        console.log("Key found at index:", idx);
        // Rough parse
        const remainder = envContent.substring(idx + "DEPLOYER_PRIVATE_KEY=".length);
        const endLine = remainder.indexOf("\n");
        let key = endLine === -1 ? remainder : remainder.substring(0, endLine);
        key = key.trim();
        if (key.length > 0) {
            process.env.DEPLOYER_PRIVATE_KEY = key;
            console.log("DEPLOYER_PRIVATE_KEY loaded manually (length " + key.length + ")");
        } else {
            console.error("Key found but empty value");
        }
    } else {
        console.error("DEPLOYER_PRIVATE_KEY string not found in file content");
    }
} else {
    console.error("File not found at", envPath);
}

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.19",
    networks: {
        vinu: {
            url: "https://vinuchain-rpc.com",
            chainId: 207,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        vinu_testnet: {
            url: "https://vinufoundation-rpc.com",
            chainId: 206,
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
    },
};
