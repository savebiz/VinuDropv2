"use client";

import { useCallback } from "react";

export const useHaptic = () => {
    const trigger = useCallback((pattern: number | number[] = 10) => {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }, []);

    return { trigger };
};
