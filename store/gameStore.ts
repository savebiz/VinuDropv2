import { create } from 'zustand';

interface GameState {
    score: number;
    bestScore: number;
    isGameOver: boolean;
    nextOrbLevel: number;
    gameId: string; // UUID for key-based remount

    setScore: (score: number) => void;
    addScore: (points: number) => void;
    setBestScore: (score: number) => void;
    setGameOver: (isOver: boolean) => void;
    setNextOrbLevel: (level: number) => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    score: 0,
    bestScore: 0,
    isGameOver: false,
    nextOrbLevel: 0,
    gameId: crypto.randomUUID(),

    setScore: (score) => set({ score }),
    addScore: (points) => set((state) => ({ score: state.score + points })),
    setBestScore: (score) => set({ bestScore: score }),
    setGameOver: (isOver) => set({ isGameOver: isOver }),
    setNextOrbLevel: (level) => set({ nextOrbLevel: level }),
    resetGame: () => set({
        score: 0,
        isGameOver: false,
        nextOrbLevel: Math.floor(Math.random() * 5), // Start with random small orb
        gameId: crypto.randomUUID(), // Force remount
    }),
}));
