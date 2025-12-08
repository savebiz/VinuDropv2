import { useState, useEffect } from 'react';

interface CountdownResult {
    formattedTime: string; // HH:MM:SS
    isReset: boolean;      // True if we passed midnight
    secondsRemaining: number;
}

export const useTimeUntilUtcMidnight = (): CountdownResult => {
    // Initialize state
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isMounted, setIsMounted] = useState(false);

    // Helper to calculate delta
    const calculateTimeLeft = () => {
        const now = new Date();
        // Use .getTime() to get current timestamp (synced to UTC epoch)
        const currentMs = now.getTime();

        // Calculate next UTC midnight
        const nextMidnight = new Date();
        // "24" hours wraps to the next day 00:00
        nextMidnight.setUTCHours(24, 0, 0, 0);

        const targetMs = nextMidnight.getTime();
        const delta = targetMs - currentMs;

        return Math.max(0, delta);
    };

    useEffect(() => {
        setIsMounted(true);
        // Initial calc
        setTimeLeft(calculateTimeLeft());

        // Set interval to update state
        const timerId = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
        }, 1000);

        // Cleanup to avoid memory leaks
        return () => clearInterval(timerId);
    }, []);

    // Format output
    const format = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Pad with leading zeros
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    // Prevent SSR mismatch by returning placeholder until mounted
    if (!isMounted) {
        return { formattedTime: "00:00:00", isReset: false, secondsRemaining: 0 };
    }

    return {
        formattedTime: format(timeLeft),
        isReset: timeLeft <= 0,
        secondsRemaining: Math.floor(timeLeft / 1000)
    };
};
