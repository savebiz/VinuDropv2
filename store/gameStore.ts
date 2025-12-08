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
    startTime: number; // For anti-cheat legacy validation

    // Audio
    isMuted: boolean;
    toggleMute: () => void;

    // Inventory
    shakes: number;
    strikes: number;
    reviveTrigger: number;

    // Daily Freebies
    freeShakes: number;
    freeStrikes: number;
    lastFreebieResetDate: string | null;

    // Tracks claim date per wallet address: { '0x123...': '2023-10-27' }
    lastDailyRewardClaimDate: Record<string, string>;

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

    // Freebie Actions
    checkDailyFreebieReset: () => void;
    consumeFreeShake: () => boolean;
    consumeFreeStrike: () => boolean;

    // Updated to accept address
    setLastDailyRewardClaimDate: (address: string, date: string) => void;

    // Shake
    shakeTrigger: number;
    shakeIntensity: number; // Add intensity
    triggerShake: (intensity?: number) => void;

    // Laser
    laserMode: boolean;
    toggleLaserMode: () => void;
    cursorMode?: 'default' | 'crosshair';
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
            shakeTrigger: 0,
            shakeIntensity: 0,
            savedOrbs: [],
            startTime: Date.now(),
            laserMode: false,
            cursorMode: 'default',
            isMuted: false,
            toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

            // Freebies Defaults
            freeShakes: 1,
            freeStrikes: 1,
            lastFreebieResetDate: null,
            lastDailyRewardClaimDate: {}, // Initialize as empty object

            setSavedOrbs: (orbs: SavedOrb[]) => set({ savedOrbs: orbs }),

            // ... actions ...
            setScore: (score) => set((state) => ({
                score,
                highScore: Math.max(Number(state.highScore) || 0, score)
            })),
            addScore: (points) => set((state) => {
                const newScore = state.score + points;
                return {
                    score: newScore,
                    highScore: Math.max(Number(state.highScore) || 0, newScore)
                };
            }),
            setHighScore: (score: number) => set((state) => ({
                highScore: Math.max(Number(state.highScore) || 0, score)
            })),
            setUsername: (name: string) => set({ username: name }),
            setGameOver: (isOver) => set({ isGameOver: isOver }),
            setNextOrbLevel: (level) => set({ nextOrbLevel: level }),
            resetGame: () => set({
                score: 0,
                isGameOver: false,
                nextOrbLevel: Math.floor(Math.random() * 5),
                gameId: crypto.randomUUID(),
                savedOrbs: [], // Clear persistence on reset
                startTime: Date.now(),
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

            // Freebie Logic
            checkDailyFreebieReset: () => {
                const today = new Date().toISOString().split('T')[0];
                const { lastFreebieResetDate } = get();

                if (lastFreebieResetDate !== today) {
                    set({
                        freeShakes: 1,
                        freeStrikes: 1,
                        lastFreebieResetDate: today
                    });
                }
            },
            consumeFreeShake: () => {
                const { freeShakes } = get();
                if (freeShakes > 0) {
                    set({ freeShakes: freeShakes - 1 });
                    return true;
                }
                return false;
            },
            consumeFreeStrike: () => {
                const { freeStrikes } = get();
                if (freeStrikes > 0) {
                    set({ freeStrikes: freeStrikes - 1 });
                    return true;
                }
                return false;
            },

            setLastDailyRewardClaimDate: (address: string, date: string) => set((state) => ({
                lastDailyRewardClaimDate: {
                    ...state.lastDailyRewardClaimDate,
                    [address]: date
                }
            })),

            triggerShake: (intensity = 1) => set({ shakeTrigger: Date.now(), shakeIntensity: intensity }),

            toggleLaserMode: () => set((state) => ({ laserMode: !state.laserMode, cursorMode: !state.laserMode ? 'crosshair' : 'default' })),
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
                freeShakes: state.freeShakes,
                freeStrikes: state.freeStrikes,
                lastFreebieResetDate: state.lastFreebieResetDate,
                lastDailyRewardClaimDate: state.lastDailyRewardClaimDate,
                savedOrbs: state.savedOrbs,
                isMuted: state.isMuted,
                nextOrbLevel: state.nextOrbLevel,
            }),
        }
    )
);
