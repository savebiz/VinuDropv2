import { useCallback, useRef, useEffect } from 'react';
import { Howl } from 'howler';
import { SOUNDS } from '@/lib/assets';
import { useGameStore } from '@/store/gameStore';
import { audioSynth } from '@/lib/synth';

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
    useEffect(() => {
        if (!soundsRef.current.drop && typeof window !== 'undefined') {
            // We attempt to load sounds. If files missing, state will remain 'unloaded' or error out.
            soundsRef.current.drop = new Howl({ src: [SOUNDS.DROP], volume: 0.5, onLoadError: () => console.log("Drop sound missing, fallback to synth") });
            soundsRef.current.merge = new Howl({ src: [SOUNDS.MERGE], volume: 0.6, onLoadError: () => console.log("Merge sound missing, fallback to synth") });
            soundsRef.current.gameover = new Howl({ src: [SOUNDS.GAMEOVER], volume: 0.7, onLoadError: () => console.log("Gameover sound missing, fallback to synth") });
            soundsRef.current.bestScore = new Howl({ src: [SOUNDS.BEST_SCORE], volume: 0.8, onLoadError: () => console.log("Best Score sound missing, fallback to synth") });
        }
    }, []);

    const playDropSound = useCallback(() => {
        if (isMuted) return;

        // Fallback check: If howl exists but isn't loaded/ready, use Synth
        if (soundsRef.current.drop && soundsRef.current.drop.state() === 'loaded') {
            soundsRef.current.drop.play();
        } else {
            audioSynth.playDrop();
        }
    }, [isMuted]);

    const playMergeSound = useCallback((level: number) => {
        if (isMuted) return;

        if (soundsRef.current.merge && soundsRef.current.merge.state() === 'loaded') {
            const rate = Math.max(0.5, 1.2 - (level * 0.05));
            const id = soundsRef.current.merge.play();
            soundsRef.current.merge.rate(rate, id);
        } else {
            // Synth doesn't currently support pitch shifting per level in the basic version, 
            // but we call the generic merge sound. 
            audioSynth.playMerge();
        }
    }, [isMuted]);

    const playGameOverSound = useCallback(() => {
        if (isMuted) return;

        if (soundsRef.current.gameover && soundsRef.current.gameover.state() === 'loaded') {
            soundsRef.current.gameover.play();
        } else {
            audioSynth.playGameOver();
        }
    }, [isMuted]);

    const playBestScoreSound = useCallback(() => {
        if (isMuted) return;

        if (soundsRef.current.bestScore && soundsRef.current.bestScore.state() === 'loaded') {
            soundsRef.current.bestScore.play();
        } else {
            audioSynth.playBestScore();
        }
    }, [isMuted]);

    return {
        playDropSound,
        playMergeSound,
        playGameOverSound,
        playBestScoreSound
    };
};
