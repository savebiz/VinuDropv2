"use client";

import React, { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { supabase } from "@/lib/supabaseClient";
import { Trophy, RefreshCcw } from "lucide-react";

interface LeaderboardEntry {
    rank: number;
    wallet_address: string;
    max_score: number;
}

export function LeaderboardPanel() {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('leaderboard_daily')
                .select('*')
                .limit(10); // Show top 10

            if (error) {
                console.error("Leaderboard fetch error:", error);
                // Fallback to empty if error (e.g. view not created yet)
                setEntries([]);
            } else {
                setEntries(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
        // Refresh every minute? Or just once.
    }, []);

    return (
        <Panel className="w-full max-w-md mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} /> Today's Top
                </h2>
                <button onClick={fetchLeaderboard} className="text-slate-500 hover:text-cyan-500">
                    <RefreshCcw size={16} />
                </button>
            </div>

            {loading ? (
                <div className="text-center p-8 text-slate-500 dark:text-white/50 animate-pulse">
                    Loading scores...
                </div>
            ) : entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 gap-3 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                    <Trophy className="text-slate-300 dark:text-white/20" size={48} />
                    <p className="text-center text-sm text-slate-500 dark:text-white/50">
                        No scores yet today.<br />Be the first to claim the throne!
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <div key={entry.rank} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-white/5 rounded hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <span className={`
                                    w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold
                                    ${entry.rank === 1 ? 'bg-yellow-400 text-black' :
                                        entry.rank === 2 ? 'bg-gray-300 text-black' :
                                            entry.rank === 3 ? 'bg-amber-600 text-white' :
                                                'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/50'}
                                `}>
                                    {entry.rank}
                                </span>
                                <span className="font-mono text-sm opacity-70 text-slate-900 dark:text-white">
                                    {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
                                </span>
                            </div>
                            <span className="font-bold text-cyan-600 dark:text-cyan-400">
                                {entry.max_score.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}
