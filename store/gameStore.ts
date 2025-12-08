import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedOrb {
    x: number;
    y: number;
    radius: number;
    level: number; // Store the actual level index
}

interface GameState {
    score: number;
    highScore: number;
    username: string | null;
    isGameOver: boolean;
    nextOrbLevel: number;
    gameId: string;

    // Inventory
    shakes: number;
    strikes: number;
    reviveTrigger: number;

    // Strict Persistence
    savedOrbs: SavedOrb[];
    setSavedOrbs: (orbs: SavedOrb[]) => void;

    // Actions
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

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            // ... defaults ...
            score: 0,
            highScore: 0,
            username: null,
            isGameOver: false,
            nextOrbLevel: 0,
            gameId: crypto.randomUUID(),

            shakes: 0,
            strikes: 0,
            reviveTrigger: 0,
            savedOrbs: [],

            setSavedOrbs: (orbs) => set({ savedOrbs: orbs }),

            // ... actions ...
            setScore: (score) => set((state) => ({
                score,
                highScore: Math.max(state.highScore, score)
            })),
            addScore: (points) => set((state) => {
                const newScore = state.score + points;
                return {
                    score: newScore,
                    highScore: Math.max(state.highScore, newScore)
                };
            }),
            setHighScore: (score) => set({ highScore: score }),
            setUsername: (name) => set({ username: name }),
            setGameOver: (isOver) => set({ isGameOver: isOver }),
            setNextOrbLevel: (level) => set({ nextOrbLevel: level }),
            resetGame: () => set({
                score: 0,
                isGameOver: false,
                nextOrbLevel: Math.floor(Math.random() * 5),
                gameId: crypto.randomUUID(),
                savedOrbs: [], // Clear persistence on reset
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
        }),
        {
            name: 'vinu-drop-storage', // unique name
            partialize: (state) => ({
                // Only persist these fields
                score: state.score,
                highScore: state.highScore,
                username: state.username,
                shakes: state.shakes,
                strikes: state.strikes,
                savedOrbs: state.savedOrbs, // <--- PERSIST ORBS
            }),
        }
    )
);
