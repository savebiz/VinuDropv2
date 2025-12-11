"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { X, Trophy, Search, User, Calendar, Clock, Crown } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ui/ThemeProvider";

interface LeaderboardEntry {
    wallet_address: string;
    username: string | null;
    max_score: number;
    rank: number;
}

interface FullLeaderboardModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function FullLeaderboardModal({ isOpen, onClose }: FullLeaderboardModalProps) {
    const account = useActiveAccount();
    const { theme } = useTheme();
    const isDark = theme === 'cosmic';

    const [period, setPeriod] = useState<Period>('daily');
    const [topScores, setTopScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);

    // Responsive Placeholder Logic
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState<any | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    const fetchLeaderboard = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_leaderboard', { period });

            if (error) throw error;
            setTopScores(data || []);
        } catch (err) {
            console.error("Fetch leaderboard error:", err);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard();
        }
    }, [isOpen, fetchLeaderboard]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSearchError(null);
        setSearchResult(null);

        try {
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

    const tabs: { id: Period; label: string }[] = [
        { id: 'daily', label: 'Daily' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'monthly', label: 'Monthly' },
        { id: 'yearly', label: 'Yearly' },
    ];

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md transition-colors duration-300
            ${isDark ? 'bg-black/90' : 'bg-white/60'}`}
        >
            <Panel className={`w-full max-w-4xl h-[85vh] flex flex-col relative transition-all duration-300 border
                ${isDark
                    ? 'bg-[#0f172a] border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.1)]'
                    : 'bg-white border-slate-200 shadow-2xl text-slate-900'
                }`}
            >
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 z-10 transition-colors
                        ${isDark ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="text-center pt-6 pb-4">
                    <h2 className={`text-3xl font-bold flex items-center justify-center gap-2 mb-1
                        ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
                        <Trophy className={isDark ? "text-yellow-400 fill-yellow-400/20" : "text-yellow-500 fill-yellow-500/20"} />
                        <span className={isDark
                            ? "bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400"
                            : "text-slate-900"
                        }>
                            Leaderboard
                        </span>
                    </h2>
                    <p className={`text-sm font-medium ${isDark ? 'text-cyan-200/50' : 'text-slate-500'}`}>
                        Top Players & Champions
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center gap-2 mb-6 px-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setPeriod(tab.id)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${period === tab.id
                                ? 'bg-cyan-600 text-white shadow-lg scale-105'
                                : isDark
                                    ? 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main List */}
                <div className="flex-1 overflow-y-auto pr-2 px-4 space-y-2 mb-6 custom-scrollbar">
                    {loading ? (
                        <div className={`text-center py-20 animate-pulse flex flex-col items-center gap-2
                            ${isDark ? 'text-white/50' : 'text-slate-400'}`}
                        >
                            <Clock className="w-8 h-8 opacity-50" />
                            Loading rankings...
                        </div>
                    ) : topScores.length === 0 ? (
                        <div className={`text-center py-20 flex flex-col items-center gap-2
                            ${isDark ? 'text-white/50' : 'text-slate-400'}`}
                        >
                            <User className="w-8 h-8 opacity-20" />
                            No scores yet for this period.
                        </div>
                    ) : (
                        topScores.map((player) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={`${player.rank}-${player.wallet_address}`}
                                className={`flex items-center justify-between p-3 rounded-xl border relative overflow-hidden group 
                                    ${player.wallet_address === account?.address?.toLowerCase()
                                        ? isDark
                                            ? 'bg-cyan-900/40 border-cyan-500/50 shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]'
                                            : 'bg-cyan-50 border-cyan-200 shadow-sm'
                                        : isDark
                                            ? 'bg-white/5 border-white/5 hover:bg-white/10'
                                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                                    }`}
                            >
                                {/* Rank Badge */}
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg shadow-lg ${player.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black ring-2 ring-yellow-400/50' :
                                        player.rank === 2 ? 'bg-gradient-to-br from-gray-200 to-gray-500 text-black ring-2 ring-gray-400/50' :
                                            player.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white ring-2 ring-amber-600/50' :
                                                isDark ? 'bg-black/30 text-white/70 border border-white/10' : 'bg-white text-slate-700 border border-slate-300'
                                        }`}>
                                        {player.rank <= 3 && <Crown size={14} className={`absolute -top-2 ${isDark ? 'text-white' : 'text-black'}`} />}
                                        {player.rank}
                                    </div>

                                    <div className="flex flex-col">
                                        <span className={`font-bold text-lg ${player.rank <= 3
                                            ? (isDark ? 'text-white' : 'text-slate-900')
                                            : (isDark ? 'text-white/90' : 'text-slate-700')
                                            }`}>
                                            {player.username || "Anonymous Player"}
                                        </span>
                                        <span className={`text-[10px] font-mono tracking-wider
                                            ${isDark ? 'text-white/40' : 'text-slate-400'}`}
                                        >
                                            {player.wallet_address ? `${player.wallet_address.slice(0, 6)}...${player.wallet_address.slice(-4)}` : 'Unknown'}
                                        </span>
                                    </div>
                                </div>

                                <div className={`font-mono font-bold text-xl
                                    ${isDark
                                        ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]'
                                        : 'text-cyan-600'
                                    }`}
                                >
                                    {player.max_score.toLocaleString()}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Footer: Find Rank */}
                <div className={`p-4 -mx-1 -mb-1 rounded-b-xl border-t backdrop-blur-md transition-colors
                    ${isDark
                        ? 'bg-black/40 border-white/10'
                        : 'bg-slate-50/80 border-slate-200'
                    }`}
                >
                    <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2
                        ${isDark ? 'text-cyan-400/80' : 'text-cyan-700'}`}
                    >
                        <Search size={12} /> Find Player Rank
                    </h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className={`flex-1 rounded-lg p-3 text-sm focus:border-cyan-500 transition-colors outline-none font-mono border
                                ${isDark
                                    ? 'bg-black/50 border-white/10 text-white'
                                    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                                }`}
                            placeholder={isMobile ? "Wallet Add. or Username" : "Wallet Address or Username"}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={searchLoading}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-4 font-bold min-w-[80px]"
                        >
                            {searchLoading ? <RefreshCw className="animate-spin" size={16} /> : "Search"}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {searchResult && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className={`mt-4 border p-4 rounded-xl relative overflow-hidden
                                    ${isDark
                                        ? 'bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border-cyan-500/30'
                                        : 'bg-white border-cyan-200 shadow-md'
                                    }`}
                            >
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`text-[10px] uppercase tracking-wider mb-1
                                                ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}
                                            >
                                                Current Rank
                                            </div>
                                            <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                #{searchResult.rank}
                                            </div>
                                        </div>
                                        <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                                        <div>
                                            <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                {searchResult.username || "Unknown"}
                                            </div>
                                            <div className={`text-xs font-mono ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                                                {searchResult.wallet_address}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-[10px] uppercase tracking-wider mb-1
                                            ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}
                                        >
                                            High Score
                                        </div>
                                        <div className={`text-2xl font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                            {searchResult.max_score?.toLocaleString() || "0"}
                                        </div>
                                    </div>
                                </div>
                                {searchResult.points_to_top_30 > 0 ? (
                                    <div className={`mt-3 text-center text-xs rounded-full py-1 
                                        ${isDark
                                            ? 'text-yellow-300/80 bg-yellow-400/5'
                                            : 'text-yellow-700 bg-yellow-100'
                                        }`}
                                    >
                                        Need <b>{searchResult.points_to_top_30?.toLocaleString() || "0"}</b> more points to hit Top 30!
                                    </div>
                                ) : (
                                    <div className={`mt-3 text-center text-xs rounded-full py-1 
                                        ${isDark
                                            ? 'text-green-300/80 bg-green-400/5'
                                            : 'text-green-700 bg-green-100'
                                        }`}
                                    >
                                        🔥 You are in the Top 30!
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {searchError && (
                        <div className="mt-3 text-red-400 text-sm bg-red-900/20 border border-red-500/20 p-2 rounded-lg text-center">
                            {searchError}
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
}

// Helper for loading icon
function RefreshCw({ className, size }: { className?: string, size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
