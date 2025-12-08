const fs = require('fs');
const path = require('path');
const envPath = path.resolve(process.cwd(), '.env.local');

const newAddress = "0x71B167f10A1612D32C2788e1909f0c69133A4383";

if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');

    // Check if key exists
    if (content.match(/NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS=/)) {
        content = content.replace(/NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS=.+/, `NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS=${newAddress}`);
    } else {
        content += `\nNEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS=${newAddress}\n`;
    }

    fs.writeFileSync(envPath, content, 'utf8');
    console.log("Updated .env.local with new contract address.");
} else {
    console.log(".env.local not found.");
}
