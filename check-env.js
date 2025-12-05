require("dotenv").config({ path: ".env.local" });

if (process.env.DEPLOYER_PRIVATE_KEY) {
    console.log("Key found (length: " + process.env.DEPLOYER_PRIVATE_KEY.length + ")");
} else {
    console.log("Key NOT found");
}
