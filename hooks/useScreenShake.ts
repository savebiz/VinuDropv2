import { useEffect } from 'react';
import { useSpring } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';

export const useScreenShake = () => {
    const { shakeTrigger, shakeIntensity } = useGameStore();

    // We use springs for smooth recoil
    const x = useSpring(0, { stiffness: 300, damping: 10 });
    const y = useSpring(0, { stiffness: 300, damping: 10 });

    useEffect(() => {
        if (shakeTrigger === 0) return;

        // Intensity Multiplier
        // Small Merge ~ 1.5 -> Shake ~2-3px
        // Big Merge ~ 10 -> Shake ~15-20px
        const power = Math.min(shakeIntensity, 20);

        // Random direction kicks
        const kickX = (Math.random() - 0.5) * 2 * power;
        const kickY = (Math.random() - 0.5) * 2 * power;

        // Set value instantly
        x.set(kickX);
        y.set(kickY);

        // Then return to 0 (spring automatically handles animation)
        setTimeout(() => {
            x.set(0);
            y.set(0);
        }, 50);

    }, [shakeTrigger, shakeIntensity, x, y]);

    return { x, y };
};
