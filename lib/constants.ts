export const ORB_LEVELS = [
    { level: 0, name: "Cherry", radius: 20, color: "#FF0000", score: 10 },
    { level: 1, name: "Strawberry", radius: 30, color: "#FF4400", score: 20 },
    { level: 2, name: "Grape", radius: 40, color: "#8800FF", score: 30 },
    { level: 3, name: "Dekopon", radius: 50, color: "#FFAA00", score: 40 },
    { level: 4, name: "Orange", radius: 60, color: "#FF8800", score: 50 },
    { level: 5, name: "Apple", radius: 70, color: "#FF2222", score: 60 },
    { level: 6, name: "Pear", radius: 80, color: "#FFFF00", score: 70 },
    { level: 7, name: "Peach", radius: 90, color: "#FFCCCC", score: 80 },
    { level: 8, name: "Pineapple", radius: 100, color: "#FFFF88", score: 90 },
    { level: 9, name: "Melon", radius: 110, color: "#88FF88", score: 100 },
    { level: 10, name: "Vinu Moon", radius: 120, color: "#00FFFF", score: 110 },
];

export const GAME_WIDTH = 600;
export const GAME_HEIGHT = 800;
export const WALL_THICKNESS = 50;


export const GAME_OVER_TIME = 3000; // 3 seconds

export const VINU_ECONOMY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_ECONOMY_CONTRACT_ADDRESS || "0x71B167f10A1612D32C2788e1909f0c69133A4383";
