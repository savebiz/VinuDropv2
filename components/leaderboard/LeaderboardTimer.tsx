"use client";

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface LeaderboardTimerProps {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    isDark: boolean;
}

export const LeaderboardTimer: React.FC<LeaderboardTimerProps> = ({ period, isDark }) => {
    const [timeLeft, setTimeLeft] = useState("");

    const calculateTimeLeft = () => {
        const now = new Date();
        const utcNow = new Date(now.toUTCString().slice(0, -4)); // Hacky but works for UTC relative

        // Use true UTC timestamps
        const nowUTC = Date.now();
        const d = new Date();

        // Calculate Next Reset in UTC
        let nextReset = new Date();
        nextReset.setUTCHours(0, 0, 0, 0); // Reset to midnight UTC today

        if (period === 'daily') {
            nextReset.setUTCDate(nextReset.getUTCDate() + 1); // Tomorrow 00:00 UTC
        } else if (period === 'weekly') {
            // Find next Monday
            // Day 0 = Sunday, 1 = Monday ...
            const day = nextReset.getUTCDay();
            const diff = day === 0 ? 1 : 8 - day; // If Sunday(0), add 1. If Mon(1), add 7. 
            // Actually standard ISO week is Monday start. 
            // Postgres date_trunc('week') starts Monday 00:00.
            const daysUntilMonday = (7 - nextReset.getUTCDay() + 1) % 7 || 7;
            nextReset.setUTCDate(nextReset.getUTCDate() + daysUntilMonday);
        } else if (period === 'monthly') {
            nextReset.setUTCMonth(nextReset.getUTCMonth() + 1, 1); // 1st of next month
        } else if (period === 'yearly') {
            nextReset.setUTCFullYear(nextReset.getUTCFullYear() + 1, 0, 1); // Jan 1st next year
        }

        const diffMs = nextReset.getTime() - Date.now();

        if (diffMs <= 0) {
            return "Refresing...";
        }

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        setTimeLeft(calculateTimeLeft()); // Initial call

        return () => clearInterval(timer);
    }, [period]);

    return (
        <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full border transition-colors
            ${isDark
                ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-400'
                : 'bg-cyan-50 border-cyan-200 text-cyan-700'
            }`}
        >
            <Clock size={12} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
            <span className="opacity-70 uppercase tracking-wider mr-1">Resets in:</span>
            <span className="font-bold">{timeLeft}</span>
        </div>
    );
};
