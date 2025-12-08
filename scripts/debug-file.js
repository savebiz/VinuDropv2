const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env.local');

console.log("Checking path:", envPath);
if (fs.existsSync(envPath)) {
    console.log("File exists.");
    const stats = fs.statSync(envPath);
    console.log("Size:", stats.size);

    try {
        const content = fs.readFileSync(envPath, 'utf8');
        console.log("Read success. Length:", content.length);
        console.log("First 10 chars:", JSON.stringify(content.substring(0, 10)));

        // Check for specific key without logging value
        const match = content.match(/DEPLOYER_PRIVATE_KEY=(.+)/);
        if (match) {
            console.log("DEPLOYER_PRIVATE_KEY found in file regex.");
        } else {
            console.log("DEPLOYER_PRIVATE_KEY NOT found in file regex.");
        }
    } catch (e) {
        console.error("Error reading file:", e);
    }
} else {
    console.log("File does NOT exist.");
}
