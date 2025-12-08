const https = require('https');

const urls = [
    'https://vinufoundation-rpc.com',
    'https://vinuchain-rpc.com',
    'https://rpc.vinuchain.org',
    'https://vinufoundation-rpc.com/rpc',
    'https://testnet.vinuchain.com'
];

const data = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_chainId",
    params: [],
    id: 1
});

urls.forEach(urlStr => {
    try {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            port: 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            console.log(`${urlStr} -> STATUS: ${res.statusCode}`);
            if (res.statusCode === 200) {
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`${urlStr} -> BODY: ${chunk.substring(0, 100)}...`);
                });
            }
        });

        req.on('error', (e) => {
            console.error(`${urlStr} -> ERROR: ${e.message}`);
        });

        req.write(data);
        req.end();
    } catch (e) {
        console.error(`Invalid URL: ${urlStr}`);
    }
});
