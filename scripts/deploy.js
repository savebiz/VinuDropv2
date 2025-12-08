const hre = require("hardhat");

async function main() {
    console.log("Deploying VinuEconomy to VinuChain...");

    const VinuEconomy = await hre.ethers.getContractFactory("VinuEconomy");
    const vinuEconomy = await VinuEconomy.deploy();

    await vinuEconomy.waitForDeployment();

    const address = await vinuEconomy.getAddress();

    console.log("VinuEconomy deployed to:", address);
    console.log("Please update your frontend constants with this address.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
