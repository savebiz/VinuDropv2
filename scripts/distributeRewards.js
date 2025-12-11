const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Acting as owner:", deployer.address);

    // --- CONFIGURATION ---
    const CONTRACT_ADDRESS = "0x71B167f10A1612D32C2788e1909f0c69133A4383"; // <--- PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE
    const RECIPIENT_ADDRESS = "0x18F18dEA03ac23e964579315DeCb226c9BFaA966"; // <--- PASTE RECIPIENT ADDRESS HERE
    const PERCENTAGE = 100; // <--- PERCENTAGE TO DISTRIBUTE (0-100)
    // ---------------------

    if (!CONTRACT_ADDRESS || !RECIPIENT_ADDRESS) {
        console.error("Please set CONTRACT_ADDRESS and RECIPIENT_ADDRESS in the script.");
        process.exit(1);
    }

    const VinuEconomy = await hre.ethers.getContractFactory("VinuEconomy");
    const contract = VinuEconomy.attach(CONTRACT_ADDRESS);

    console.log(`Distributing ${PERCENTAGE}% of reward pool to ${RECIPIENT_ADDRESS}...`);

    const tx = await contract.distributeRewards(RECIPIENT_ADDRESS, PERCENTAGE);
    console.log("Transaction sent:", tx.hash);

    await tx.wait();
    console.log("Distribution confirmed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
