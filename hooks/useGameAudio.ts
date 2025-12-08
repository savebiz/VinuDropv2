import { useCallback, useRef } from 'react';
import { Howl } from 'howler';
import { SOUNDS } from '@/lib/assets';
import { useGameStore } from '@/store/gameStore';

export const useGameAudio = () => {
    const { isMuted } = useGameStore();

    // Cache Howl instances
    const soundsRef = useRef<{
        drop: Howl | null;
        merge: Howl | null;
        gameover: Howl | null;
        bestScore: Howl | null;
    }>({
        drop: null,
        merge: null,
        gameover: null,
        bestScore: null
    });

    // Initialize sounds lazily or once
    if (!soundsRef.current.drop) {
        if (typeof window !== 'undefined') {
            soundsRef.current.drop = new Howl({ src: [SOUNDS.DROP], volume: 0.5 });
            soundsRef.current.merge = new Howl({ src: [SOUNDS.MERGE], volume: 0.6 });
            soundsRef.current.gameover = new Howl({ src: [SOUNDS.GAMEOVER], volume: 0.7 });
            soundsRef.current.bestScore = new Howl({ src: [SOUNDS.BEST_SCORE], volume: 0.8 });
        }
    }

    const playDropSound = useCallback(() => {
        if (isMuted || !soundsRef.current.drop) return;
        soundsRef.current.drop.play();
    }, [isMuted]);

    const playMergeSound = useCallback((level: number) => {
        if (isMuted || !soundsRef.current.merge) return;

        // Pitch logic: Higher level = Lower pitch (heavier)
        // Rate = 1.2 - (level * 0.05)
        // Level 0 (Tiny) -> 1.2
        // Level 10 (Large) -> 0.7
        const rate = Math.max(0.5, 1.2 - (level * 0.05));

        const id = soundsRef.current.merge.play();
        soundsRef.current.merge.rate(rate, id);
    }, [isMuted]);

    const playGameOverSound = useCallback(() => {
        if (isMuted || !soundsRef.current.gameover) return;
        soundsRef.current.gameover.play();
    }, [isMuted]);

    const playBestScoreSound = useCallback(() => {
        if (isMuted || !soundsRef.current.bestScore) return;
        soundsRef.current.bestScore.play();
    }, [isMuted]);

    return {
        playDropSound,
        playMergeSound,
        playGameOverSound,
        playBestScoreSound
    };
};
