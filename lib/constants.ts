export const ORB_LEVELS = [
    { level: 0, name: "Cherry", radius: 20, color: "#FF2A2A", score: 10 },        // Red -> Vivid Red
    { level: 1, name: "Strawberry", radius: 30, color: "#FF007F", score: 20 },    // Red-Orange -> Neon Rose
    { level: 2, name: "Grape", radius: 40, color: "#9D00FF", score: 30 },         // Purple -> Electric Violet
    { level: 3, name: "Dekopon", radius: 50, color: "#FFD700", score: 40 },      // Amber -> Gold
    { level: 4, name: "Orange", radius: 60, color: "#FF6600", score: 50 },        // Orange -> Vibrant Orange
    { level: 5, name: "Apple", radius: 70, color: "#32CD32", score: 60 },         // Red -> Lime Green (Major distinction fix)
    { level: 6, name: "Pear", radius: 80, color: "#B4FF00", score: 70 },          // Yellow -> Neon Chartreuse
    { level: 7, name: "Peach", radius: 90, color: "#FF99CC", score: 80 },         // Pale Pink -> Soft Pink
    { level: 8, name: "Pineapple", radius: 100, color: "#FFFF33", score: 90 },    // Pale Yellow -> Bright Yellow
    { level: 9, name: "Melon", radius: 110, color: "#00FFCC", score: 100 },       // Pale Green -> Turquoise
    { level: 10, name: "Vinu Moon", radius: 120, color: "#E0FFFF", score: 110 },  // Cyan -> Cyan Glow
];

export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 800;
export const WALL_THICKNESS = 50;


export const GAME_OVER_TIME = 3000; // 3 seconds

export const VINU_ECONOMY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS || "0x71B167f10A1612D32C2788e1909f0c69133A4383";
