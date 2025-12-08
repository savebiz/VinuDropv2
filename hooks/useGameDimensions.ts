import { useState, useEffect, RefObject } from 'react';

export const useGameDimensions = (containerRef: RefObject<HTMLElement | null>) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1 });

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                // Cap DPr at 2 for performance
                const dpr = Math.min(window.devicePixelRatio || 1, 2);

                setDimensions({
                    width,
                    height,
                    scale: dpr
                });
            }
        });

        resizeObserver.observe(containerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [containerRef]);

    return dimensions;
};
