import { useCallback, useEffect } from 'react';
import { Howl } from 'howler';
import { SOUNDS } from '@/lib/assets';
import { useGameStore } from '@/store/gameStore';
import { audioSynth } from '@/lib/synth';

// --- Singleton State ---
const sounds = {
    drop: null as Howl | null,
    merge: null as Howl | null,
    gameover: null as Howl | null,
    bestScore: null as Howl | null,
    bgm: null as Howl | null
};

let isInitialized = false;

const initAudio = () => {
    if (isInitialized || typeof window === 'undefined') return;

    sounds.drop = new Howl({ src: [SOUNDS.DROP], volume: 0.5 });
    sounds.merge = new Howl({ src: [SOUNDS.MERGE], volume: 0.6 });
    sounds.gameover = new Howl({ src: [SOUNDS.GAMEOVER], volume: 0.7 });
    sounds.bestScore = new Howl({ src: [SOUNDS.BEST_SCORE], volume: 0.8 });

    // BGM
    sounds.bgm = new Howl({
        src: [SOUNDS.BGM],
        volume: 0.1, // Reduced to 0.1
        loop: true,
        html5: false, // Web Audio API for smooth looping
        autoplay: false
    });

    isInitialized = true;
};

export const useGameAudio = () => {
    const { isMuted } = useGameStore();

    // Initialize once on mount
    useEffect(() => {
        initAudio();
    }, []);

    // Sync global mute state
    useEffect(() => {
        Howler.mute(isMuted);
    }, [isMuted]);

    const startBGM = useCallback(() => {
        // Only start if initialized and not already playing
        if (sounds.bgm && !sounds.bgm.playing()) {
            sounds.bgm.play();
            sounds.bgm.fade(0, 0.1, 2000); // Fade to 0.1
        }
    }, []);

    const playDropSound = useCallback(() => {
        if (sounds.drop && sounds.drop.state() === 'loaded') {
            sounds.drop.play();
        } else {
            if (!isMuted) audioSynth.playDrop();
        }
    }, [isMuted]);

    const playMergeSound = useCallback((level: number) => {
        if (sounds.merge && sounds.merge.state() === 'loaded') {
            const rate = Math.max(0.5, 1.2 - (level * 0.05));
            const id = sounds.merge.play();
            sounds.merge.rate(rate, id);
        } else {
            if (!isMuted) audioSynth.playMerge();
        }
    }, [isMuted]);

    const playGameOverSound = useCallback(() => {
        if (sounds.gameover && sounds.gameover.state() === 'loaded') {
            sounds.gameover.play();
        } else {
            if (!isMuted) audioSynth.playGameOver();
        }
    }, [isMuted]);

    const playBestScoreSound = useCallback(() => {
        if (sounds.bestScore && sounds.bestScore.state() === 'loaded') {
            sounds.bestScore.play();
        } else {
            if (!isMuted) audioSynth.playBestScore();
        }
    }, [isMuted]);

    return {
        playDropSound,
        playMergeSound,
        playGameOverSound,
        playBestScoreSound,
        startBGM
    };
};
