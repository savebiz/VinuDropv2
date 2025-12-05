import { create } from 'zustand';

interface GameState {
    score: number;
    highScore: number;
    username: string | null;
    isGameOver: boolean;
    nextOrbLevel: number;
    gameId: string; // UUID for key-based remount

    // Inventory
    shakes: number;
    strikes: number;
    reviveTrigger: number;

    setScore: (score: number) => void;
    addScore: (points: number) => void;
    setHighScore: (score: number) => void;
    setUsername: (name: string) => void;
    setGameOver: (isOver: boolean) => void;
    setNextOrbLevel: (level: number) => void;
    resetGame: () => void;

    // Inventory Actions
    addShakes: (amount: number) => void;
    useShake: () => boolean;
    addStrikes: (amount: number) => void;
    useStrike: () => boolean;
    triggerRevive: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
    score: 0,
    highScore: 0,
    username: null,
    isGameOver: false,
    nextOrbLevel: 0,
    gameId: crypto.randomUUID(),

    shakes: 0,
    strikes: 0,
    reviveTrigger: 0,

    setScore: (score) => set({ score }),
    addScore: (points) => set((state) => ({ score: state.score + points })),
    setHighScore: (score) => set({ highScore: score }),
    setUsername: (name) => set({ username: name }),
    setGameOver: (isOver) => set({ isGameOver: isOver }),
    setNextOrbLevel: (level) => set({ nextOrbLevel: level }),
    resetGame: () => set({
        score: 0,
        isGameOver: false,
        nextOrbLevel: Math.floor(Math.random() * 5), // Start with random small orb
        gameId: crypto.randomUUID(), // Force remount
    }),

    addShakes: (amount) => set((state) => ({ shakes: state.shakes + amount })),
    useShake: () => {
        const { shakes } = get();
        if (shakes > 0) {
            set({ shakes: shakes - 1 });
            return true;
        }
        return false;
    },
    addStrikes: (amount) => set((state) => ({ strikes: state.strikes + amount })),
    useStrike: () => {
        const { strikes } = get();
        if (strikes > 0) {
            set({ strikes: strikes - 1 });
            return true;
        }
        return false;
    },
    triggerRevive: () => set({ reviveTrigger: Date.now() }),
}));
