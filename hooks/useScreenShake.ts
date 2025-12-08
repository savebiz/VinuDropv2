import { useEffect } from 'react';
import { useAnimation } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export const useScreenShake = () => {
    const { shakeTrigger } = useGameStore();
    const controls = useAnimation();

    useEffect(() => {
        if (shakeTrigger === 0) return;

        // "Very light" shake: uniform simple jitter
        // No physics springs, just a quick keyframe sequence
        controls.start({
            x: [0, -2, 2, -1, 1, 0],
            y: [0, -2, 2, 0],
            transition: { duration: 0.2 } // Fast snap
        });

    }, [shakeTrigger, controls]);

    // Return the controls to be passed to 'animate' prop
    return { controls };
};
