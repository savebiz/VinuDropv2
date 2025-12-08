import { create } from 'zustand';

export type VFXType = 'EXPLOSION' | 'FLOATER' | 'FLASH';

export interface VFXEffect {
    id: string;
    type: VFXType;
    x: number;
    y: number;
    color?: string;
    text?: string;
    timestamp: number;
}

interface VFXState {
    effects: VFXEffect[];
    spawnEffect: (effect: Omit<VFXEffect, 'id' | 'timestamp'>) => void;
    removeEffect: (id: string) => void;
}

export const useVFXStore = create<VFXState>((set) => ({
    effects: [],
    spawnEffect: (effect) => set((state) => ({
        effects: [
            ...state.effects,
            {
                ...effect,
                id: crypto.randomUUID(),
                timestamp: Date.now()
            }
        ]
    })),
    removeEffect: (id) => set((state) => ({
        effects: state.effects.filter(e => e.id !== id)
    }))
}));
