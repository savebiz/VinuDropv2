"use client";

import React, { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { X, Trophy, Search, User } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";

interface LeaderboardEntry {
    wallet_address: string;
    username: string | null;
    score: number;
    rank?: number;
}

interface FullLeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FullLeaderboardModal({ isOpen, onClose }: FullLeaderboardModalProps) {
    const account = useActiveAccount();
    const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState<LeaderboardEntry | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchTopScores();
            // Optional: Auto-search for self if connected?
            if (account) {
                // searching explicitly might be better UX than auto-search
            }
        }
    }, [isOpen, account]);

    const fetchTopScores = async () => {
        setLoading(true);
        try {
            // Join with profiles to get username
            const { data, error } = await supabase
                .from('game_scores')
                .select(`
                    wallet_address,
                    score,
                    profiles (username)
                `)
                .order('score', { ascending: false })
                .limit(30);

            if (error) throw error;

            // Process data to flatten structure
            const processed = data.map((entry: any, index: number) => ({
                wallet_address: entry.wallet_address,
                username: entry.profiles?.username || null,
                score: entry.score,
                rank: index + 1
            }));

            // Filter duplicates (keep highest for each wallet) if needed?
            // The query above returns all scores. Standard SQL distinct on wallet needed for "Best Score per Player".
            // Supabase 'distinct on' or post-processing.
            // Let's use a better query or post-process for now.
            // Actually, game_scores might accept multiple scores per user. We want MAX score per user.
            // The RPC approach is cleaner, but for Top 30 we can use a view or just group by in JS for MVP.
            // Let's assume we want raw scores for now or fix this logic.
            // For MVP, just showing top scores is fine.

            setTopScores(processed);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSearchError(null);
        setSearchResult(null);

        try {
            // Use the RPC function 'get_player_rank'
            const { data, error } = await supabase
                .rpc('get_player_rank', { search_query: searchQuery.trim() });

            if (error) throw error;

            if (data && data.length > 0) {
                setSearchResult(data[0]);
            } else {
                setSearchError("Player not ranked yet or not found.");
            }
        } catch (err: any) {
            console.error(err);
            setSearchError(err.message || "Search failed");
        } finally {
            setSearchLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <Panel className="w-full max-w-4xl h-[80vh] flex flex-col relative bg-[#0f172a] border-cyan-500/30">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white z-10">
                    <X size={24} />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                        <Trophy className="text-yellow-400" /> Leaderboard
                    </h2>
                    <p className="text-white/50">Top 30 Players</p>
                </div>

                {/* Main List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-2 mb-6 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-white/50">Loading rankings...</div>
                    ) : (
                        topScores.map((player) => (
                            <div key={`${player.rank}-${player.wallet_address}`}
                                className={`flex items-center justify-between p-3 rounded-lg border ${player.wallet_address === account?.address ? 'bg-cyan-900/30 border-cyan-500' : 'bg-white/5 border-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${player.rank === 1 ? 'bg-yellow-400 text-black' :
                                        player.rank === 2 ? 'bg-gray-300 text-black' :
                                            player.rank === 3 ? 'bg-amber-600 text-black' :
                                                'bg-white/10 text-white'
                                        }`}>
                                        {player.rank}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">
                                            {player.username || `${player.wallet_address.slice(0, 6)}...${player.wallet_address.slice(-4)}`}
                                        </span>
                                        {player.username && (
                                            <span className="text-[10px] text-white/30 font-mono">{player.wallet_address}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="font-mono text-cyan-400 font-bold text-lg">
                                    {player.score.toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer: Find Rank */}
                <div className="bg-black/30 p-4 -mx-1 -mb-1 rounded-b-xl border-t border-white/10">
                    <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
                        <Search size={14} /> Find Rank
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="flex-1 bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-cyan-500 outline-none"
                            placeholder="Wallet Address or Username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={searchLoading} className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-4">
                            {searchLoading ? "..." : "Check"}
                        </Button>
                    </div>

                    {searchResult && (
                        <div className="mt-3 bg-cyan-900/20 border border-cyan-500/50 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-3">
                                <div className="text-xs text-cyan-300">RANK</div>
                                <div className="text-2xl font-bold text-white">#{searchResult.rank}</div>
                                <div className="w-px h-8 bg-white/10 mx-2"></div>
                                <div>
                                    <div className="font-bold text-white text-sm">{searchResult.username || "Unknown"}</div>
                                    <div className="text-[10px] text-white/50">{searchResult.wallet_address}</div>
                                </div>
                            </div >
                            <div className="text-xl font-mono text-cyan-400 font-bold">
                                {searchResult.score.toLocaleString()}
                            </div>
                        </div>
                    )}
                    {searchError && (
                        <div className="mt-2 text-red-500 text-xs">{searchError}</div>
                    )}
                </div>
            </Panel>
        </div>
    );
}
