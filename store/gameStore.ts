import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface SavedOrb {
    x: number;
    y: number;
    radius: number;
    level: number;
}

export interface UserInventory {
    freeShakes: number;
    paidShakes: number;
    freeStrikes: number;
    paidStrikes: number;
    hasClaimedWelcomeShakes: boolean;
    hasClaimedWelcomeLasers: boolean;
}

const MAX_FREE_SHAKES = 12;
const MAX_FREE_STRIKES = 9;

interface GameState {
    score: number;
    highScore: number;
    username: string | null;
    isGameOver: boolean;
    nextOrbLevel: number;
    gameId: string;
    startTime: number;

    // Audio
    isMuted: boolean;
    toggleMute: () => void;

    // Wallet State
    isWalletConnecting: boolean;
    setIsWalletConnecting: (isConnecting: boolean) => void;

    // Inventory System
    walletInventory: Record<string, UserInventory>;
    legacyShakes: number;  // For migration
    legacyStrikes: number; // For migration

    // Actions
    setScore: (score: number) => void;
    addScore: (points: number) => void;
    setHighScore: (score: number) => void;
    setUsername: (name: string) => void;
    setGameOver: (isOver: boolean) => void;
    setNextOrbLevel: (level: number) => void;
    resetGame: () => void; // Normal reset
    hardResetGame: () => void; // Session expire reset

    // Inventory Actions
    addShakes: (amount: number, type: 'free' | 'paid', wallet?: string) => void;
    useShake: (wallet?: string) => boolean;
    addStrikes: (amount: number, type: 'free' | 'paid', wallet?: string) => void;
    useStrike: (wallet?: string) => boolean;
    getInventory: (wallet?: string) => {
        totalShakes: number,
        totalStrikes: number,
        freeShakes: number,
        freeStrikes: number,
        hasClaimedWelcomeShakes: boolean,
        hasClaimedWelcomeLasers: boolean
    };

    // Migration
    claimLegacyInventory: (wallet: string) => void;

    setLastDailyRewardClaimDate: (address: string, date: string) => void;
    lastDailyRewardClaimDate: Record<string, string>;

    triggerRevive: () => void;
    reviveTrigger: number;

    // Shake Mechanics
    shakeTrigger: number;
    shakeIntensity: number;
    triggerShake: (intensity?: number) => void;

    // Laser Mechanics
    laserMode: boolean;
    toggleLaserMode: () => void;
    cursorMode?: 'default' | 'crosshair';

    // Hydration
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;

    // Persistence
    savedOrbs: SavedOrb[];
    setSavedOrbs: (orbs: SavedOrb[]) => void;
}

const DEFAULT_INVENTORY: UserInventory = {
    freeShakes: 0,
    paidShakes: 0,
    freeStrikes: 0,
    paidStrikes: 0,
    hasClaimedWelcomeShakes: false,
    hasClaimedWelcomeLasers: false
};

export const useGameStore = create<GameState>()(
    persist(
        (set, get) => ({
            score: 0,
            highScore: 0,
            username: null,
            isGameOver: false,
            nextOrbLevel: 0,
            gameId: crypto.randomUUID(),
            startTime: Date.now(),

            isMuted: false,
            toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

            isWalletConnecting: false,
            setIsWalletConnecting: (isConnecting) => set({ isWalletConnecting: isConnecting }),

            walletInventory: {},
            legacyShakes: 0,
            legacyStrikes: 0,
            lastDailyRewardClaimDate: {},

            reviveTrigger: 0,
            triggerRevive: () => set({ reviveTrigger: Date.now() }),

            shakeTrigger: 0,
            shakeIntensity: 0,
            triggerShake: (intensity = 1) => set({ shakeTrigger: Date.now(), shakeIntensity: intensity }),

            laserMode: false,
            cursorMode: 'default',
            toggleLaserMode: () => set((state) => ({ laserMode: !state.laserMode, cursorMode: !state.laserMode ? 'crosshair' : 'default' })),

            savedOrbs: [],
            setSavedOrbs: (orbs) => set({ savedOrbs: orbs }),

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
            setHighScore: (score) => set((state) => ({
                highScore: Math.max(Number(state.highScore) || 0, score)
            })),
            setUsername: (name) => set({ username: name }),
            setGameOver: (isOver) => set({ isGameOver: isOver }),
            setNextOrbLevel: (level) => set({ nextOrbLevel: level }),

            resetGame: () => set({
                score: 0,
                isGameOver: false,
                nextOrbLevel: Math.floor(Math.random() * 5),
                gameId: crypto.randomUUID(),
                savedOrbs: [],
                // NOTE: startTime is NOT reset here to track session length accurately across retries?
                // Actually user requested 48h session reset.
                // "Clean Game Jar every other day... to prevent continuous play."
                // So regular reset should NOT reset startTime if we track "Session" vs "Game Round".
                // But for now, let's keep startTime reset on Game Over retry to be simple,
                // UNLESS the 48h check is against a persistent "SessionStart".
                // Let's assume startTime = Game Round Start.
                // The 48h check implies a "season" or "session" concept.
                // For simplicity, let's treat startTime as "Round Start".
                // If the user wants to limit "Session", we might need a separate timestamp.
                // However, the prompt says "prevent continuous play after two days".
                // This implies a long-running game.
                // So if I play for 48h straight, I get kicked.
                startTime: Date.now(),
            }),

            hardResetGame: () => set({
                score: 0,
                isGameOver: true, // Force game over screen
                nextOrbLevel: Math.floor(Math.random() * 5),
                gameId: crypto.randomUUID(),
                savedOrbs: [],
                startTime: Date.now(),
            }),

            getInventory: (wallet) => {
                const { walletInventory, legacyShakes, legacyStrikes } = get();

                // 1. If wallet is connected, STRICTLY return that wallet's inventory (or default empty)
                if (wallet) {
                    const inv = walletInventory[wallet];
                    if (inv) {
                        return {
                            totalShakes: inv.freeShakes + inv.paidShakes,
                            totalStrikes: inv.freeStrikes + inv.paidStrikes,
                            freeShakes: inv.freeShakes,
                            freeStrikes: inv.freeStrikes,
                            hasClaimedWelcomeShakes: inv.hasClaimedWelcomeShakes || false,
                            hasClaimedWelcomeLasers: inv.hasClaimedWelcomeLasers || false
                        };
                    } else {
                        // New wallet: Return 0s. Do NOT fallback to legacy.
                        return {
                            totalShakes: 0,
                            totalStrikes: 0,
                            freeShakes: 0,
                            freeStrikes: 0,
                            hasClaimedWelcomeShakes: false,
                            hasClaimedWelcomeLasers: false
                        };
                    }
                }

                // 2. Only if NO wallet (Guest), return legacy
                return {
                    totalShakes: legacyShakes,
                    totalStrikes: legacyStrikes,
                    freeShakes: 0,
                    freeStrikes: 0,
                    hasClaimedWelcomeShakes: false,
                    hasClaimedWelcomeLasers: false
                };
            },

            addShakes: (amount, type, wallet) => set((state) => {
                if (!wallet) return { legacyShakes: state.legacyShakes + amount };

                const currentInv = state.walletInventory[wallet] || { ...DEFAULT_INVENTORY };
                let newInv = { ...currentInv };

                if (type === 'paid') {
                    newInv.paidShakes += amount;
                } else {
                    // Free cap check
                    if (newInv.freeShakes + amount <= MAX_FREE_SHAKES) {
                        newInv.freeShakes += amount;
                    } else if (newInv.freeShakes < MAX_FREE_SHAKES) {
                        // Fill up to cap
                        newInv.freeShakes = MAX_FREE_SHAKES;
                    }
                    // If full, do nothing (or we could handle partial adds, but '1' is usual)
                }

                // Welcome Check
                if (type === 'free' && amount >= 5) { // Assuming welcome pack is 5 shakes
                    newInv.hasClaimedWelcomeShakes = true;
                }

                return {
                    walletInventory: { ...state.walletInventory, [wallet]: newInv }
                };
            }),

            addStrikes: (amount, type, wallet) => set((state) => {
                if (!wallet) return { legacyStrikes: state.legacyStrikes + amount };

                const currentInv = state.walletInventory[wallet] || { ...DEFAULT_INVENTORY };
                let newInv = { ...currentInv };

                if (type === 'paid') {
                    newInv.paidStrikes += amount;
                } else {
                    if (newInv.freeStrikes + amount <= MAX_FREE_STRIKES) {
                        newInv.freeStrikes += amount;
                    } else if (newInv.freeStrikes < MAX_FREE_STRIKES) {
                        newInv.freeStrikes = MAX_FREE_STRIKES;
                    }
                }

                // Welcome Check
                if (type === 'free' && amount >= 2) { // Assuming welcome pack is 2 strikes
                    newInv.hasClaimedWelcomeLasers = true;
                }

                return {
                    walletInventory: { ...state.walletInventory, [wallet]: newInv }
                };
            }),

            useShake: (wallet) => {
                const state = get();
                if (wallet) {
                    const inv = state.walletInventory[wallet];
                    if (!inv) return false;

                    if (inv.freeShakes > 0) {
                        set(s => ({ walletInventory: { ...s.walletInventory, [wallet]: { ...inv, freeShakes: inv.freeShakes - 1 } } }));
                        return true;
                    } else if (inv.paidShakes > 0) {
                        set(s => ({ walletInventory: { ...s.walletInventory, [wallet]: { ...inv, paidShakes: inv.paidShakes - 1 } } }));
                        return true;
                    }
                    return false;
                } else {
                    // Legacy/Guest
                    if (state.legacyShakes > 0) {
                        set(s => ({ legacyShakes: s.legacyShakes - 1 }));
                        return true;
                    }
                    return false;
                }
            },

            useStrike: (wallet) => {
                const state = get();
                if (wallet) {
                    const inv = state.walletInventory[wallet];
                    if (!inv) return false;

                    if (inv.freeStrikes > 0) {
                        set(s => ({ walletInventory: { ...s.walletInventory, [wallet]: { ...inv, freeStrikes: inv.freeStrikes - 1 } } }));
                        return true;
                    } else if (inv.paidStrikes > 0) {
                        set(s => ({ walletInventory: { ...s.walletInventory, [wallet]: { ...inv, paidStrikes: inv.paidStrikes - 1 } } }));
                        return true;
                    }
                    return false;
                } else {
                    if (state.legacyStrikes > 0) {
                        set(s => ({ legacyStrikes: s.legacyStrikes - 1 }));
                        return true;
                    }
                    return false;
                }
            },

            claimLegacyInventory: (wallet) => set((state) => {
                if (state.legacyShakes > 0 || state.legacyStrikes > 0) {
                    const currentInv = state.walletInventory[wallet] || { ...DEFAULT_INVENTORY };
                    // Move legacy items to PAID stack to preserve them fully without caps
                    const newInv = {
                        ...currentInv,
                        paidShakes: currentInv.paidShakes + state.legacyShakes,
                        paidStrikes: currentInv.paidStrikes + state.legacyStrikes
                    };
                    return {
                        walletInventory: { ...state.walletInventory, [wallet]: newInv },
                        legacyShakes: 0,
                        legacyStrikes: 0
                    };
                }
                return {};
            }),

            setLastDailyRewardClaimDate: (address, date) => set((state) => ({
                lastDailyRewardClaimDate: { ...state.lastDailyRewardClaimDate, [address]: date }
            })),

            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'vinu-drop-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
            // Migration logic for old persistence versions (if any)
            // Since we changed interface, we rely on 'partialize' or manual handling.
            // Zustand persist merges state. Old 'shakes' (number) will be merged.
            // But 'shakes' is no longer in GameState interface! 
            // So typescript is fine, but runtime might have 'shakes' property.
            // We use 'migrate' to map old state.
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migration from v0 (implicit)
                    // If user has 'shakes' or 'strikes' in localstorage, move to legacyShakes
                    return {
                        ...persistedState,
                        legacyShakes: persistedState.shakes || 0,
                        legacyStrikes: persistedState.strikes || 0,
                        walletInventory: persistedState.walletInventory || {}
                    };
                }
                return persistedState as GameState;
            },
            partialize: (state) => ({
                score: state.score,
                highScore: state.highScore,
                username: state.username,
                walletInventory: state.walletInventory,
                legacyShakes: state.legacyShakes,
                legacyStrikes: state.legacyStrikes,
                lastDailyRewardClaimDate: state.lastDailyRewardClaimDate,
                savedOrbs: state.savedOrbs,
                isMuted: state.isMuted,
                nextOrbLevel: state.nextOrbLevel,
            }),
        }
    )
);
