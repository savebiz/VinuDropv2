import { defineChain } from "thirdweb";

const vinuChainMainnet = defineChain({
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

const vinuChainTestnet = defineChain({
    id: 206,
    name: "VinuChain Testnet",
    rpc: "https://vinufoundation-rpc.com",
    nativeCurrency: {
        name: "VinuChain",
        symbol: "VC",
        decimals: 18,
    },
    blockExplorers: [
        {
            name: "VinuScan Testnet",
            url: "https://testnet.vinuscan.com",
        },
    ],
    testnet: true,
});

export const activeChain = process.env.NEXT_PUBLIC_CHAIN_ID === "206" ? vinuChainTestnet : vinuChainMainnet;

// Make sure to export default chain for backward compatibility if needed, or just export both
export { vinuChainMainnet, vinuChainTestnet };
// Deprecate the old export name to gently migrate, or just replace it. 
// The user asked to "Modify the chain setup to export both networks and a dynamic selection helper."
// The existing `vinuChain` export is used in other files. I should probably keep it or alias it to activeChain to avoid breaking imports immediately, 
// OR I should update the imports. The user instruction said "Create a constant activeChain".
// I will alias vinuChain to activeChain to be safe, but I will primarily export activeChain.
export const vinuChain = activeChain;
