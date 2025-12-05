"use client";

import React, { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";

interface LeaderboardEntry {
    rank: number;
    wallet: string;
    score: number;
}

export function LeaderboardPanel() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data for now, replace with API call later
        const mockData = Array.from({ length: 10 }).map((_, i) => ({
            rank: i + 1,
            wallet: `0x${Math.random().toString(16).slice(2, 10)}...`,
            score: Math.floor(10000 - i * 500),
        }));
        setEntries(mockData);
        setLoading(false);
    }, []);

    return (
        <Panel className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
            {loading ? (
                <div className="text-center p-4">Loading...</div>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <div key={entry.rank} className="flex justify-between items-center p-2 bg-white/5 rounded">
                            <span className="font-bold w-8">#{entry.rank}</span>
                            <span className="font-mono text-sm opacity-70">{entry.wallet}</span>
                            <span className="font-bold text-cyan-400">{entry.score.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
