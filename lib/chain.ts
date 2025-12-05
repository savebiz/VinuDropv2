import { defineChain } from "thirdweb";

export const vinuChain = defineChain({
    id: 207,
    name: "VinuChain",
    rpc: "https://vinuchain-rpc.com",
    nativeCurrency: {
        name: "VinuChain",
        symbol: "VC",
        decimals: 18,
    },
    blockExplorers: [
        {
            name: "VinuScan",
            url: "https://vinuscan.com",
        },
    ],
});
