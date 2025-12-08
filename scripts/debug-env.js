require("dotenv").config({ path: ".env.local" });
console.log("DEPLOYER_PRIVATE_KEY present:", !!process.env.DEPLOYER_PRIVATE_KEY);
console.log("RPC URL:", "https://vinufoundation-rpc.com");
