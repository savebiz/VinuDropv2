export const GAME_WIDTH = 600; // Increased width for better gameplay
export const GAME_HEIGHT = 800; // Increased height
export const WALL_THICKNESS = 40;
export const GAME_OVER_TIME = 2000; // ms

// Define Orb Levels
export const ORB_LEVELS = [
    { radius: 20, score: 2, color: "#FF0000", img: "/assets/orb-0.png" },    // 0: Tiny Red
    { radius: 32, score: 4, color: "#FFA500", img: "/assets/orb-1.png" },    // 1: Small Orange
    { radius: 44, score: 8, color: "#800080", img: "/assets/orb-2.png" },    // 2: Medium Purple
    { radius: 56, score: 16, color: "#FFFF00", img: "/assets/orb-3.png" },   // 3: Medium Large Yellow
    { radius: 68, score: 32, color: "#FF4500", img: "/assets/orb-4.png" },   // 4: Large Orange
    { radius: 80, score: 64, color: "#FF0000", img: "/assets/orb-5.png" },   // 5: Large Red
    { radius: 95, score: 128, color: "#FFFF00", img: "/assets/orb-6.png" },  // 6: Giant Yellow
    { radius: 110, score: 256, color: "#FFC0CB", img: "/assets/orb-7.png" }, // 7: Giant Pink
    { radius: 125, score: 512, color: "#FFFF00", img: "/assets/orb-8.png" }, // 8: Massive Yellow
    { radius: 140, score: 1024, color: "#008000", img: "/assets/orb-9.png" },// 9: Massive Green
    { radius: 155, score: 2048, color: "#006400", img: "/assets/orb-10.png" },// 10: Vinu Ball
];

// Contract Address - Reads from env, falls back to hardcoded default (Testnet/Mainnet agnostic)
export const VINU_ECONOMY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS || "0x7b4a600e76F74e4Bd444C91AF248698A3C4DDe8e";
// Note: 0x7b4... is a fallback/placeholder. The env var should always be set.
