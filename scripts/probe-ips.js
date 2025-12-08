const http = require('http');
const https = require('https');

const ips = [
    '35.82.117.129',
    '54.148.248.251',
    '52.40.112.204',
    '35.82.73.164'
];

const data = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_chainId",
    params: [],
    id: 1
});

ips.forEach(ip => {
    // Try HTTP port 80
    const optionsHttp = {
        hostname: ip,
        port: 80,
        path: '/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length, 'Host': 'vinufoundation-rpc.com' }
    };

    const reqHttp = http.request(optionsHttp, (res) => {
        console.log(`HTTP ${ip}:80 -> STATUS: ${res.statusCode}`);
        if (res.statusCode === 200) {
            res.on('data', d => console.log(`HTTP ${ip} BODY: ${d}`));
        }
    });
    reqHttp.on('error', e => console.log(`HTTP ${ip} ERROR: ${e.message}`));
    reqHttp.write(data);
    reqHttp.end();

    // Try port 8545
    const options8545 = {
        hostname: ip,
        port: 8545,
        path: '/',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };
    const req8545 = http.request(options8545, (res) => {
        console.log(`HTTP ${ip}:8545 -> STATUS: ${res.statusCode}`);
        if (res.statusCode === 200) {
            res.on('data', d => console.log(`HTTP ${ip}:8545 BODY: ${d}`));
        }
    });
    req8545.on('error', e => { }); // Ignore connection refused
    req8545.write(data);
    req8545.end();
});
