
"use client";

import React from "react";
import { useActiveAccount } from "thirdweb/react"; // Add this import
import { useGameStore } from "@/store/gameStore";
import PhysicsScene from "./PhysicsScene";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ORB_LEVELS } from "@/lib/constants";
import { useTheme } from "@/components/ui/ThemeProvider";
import { DailyRewardButton } from "@/components/game/DailyRewardButton";
import { Trophy, RefreshCw, ShoppingBag, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ProfileModal from "@/components/ui/ProfileModal";
import { useHighScore } from "@/hooks/useHighScore";

import { ShopPanel } from "@/components/shop/ShopPanel";
import FullLeaderboardModal from "@/components/leaderboard/FullLeaderboardModal";
import { useState } from "react";
import { X } from "lucide-react";

// import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { supabase } from "@/lib/supabaseClient";

export default function GameContainer() {
    useHighScore(); // Fetch/Sync data

    const {
        score,
        highScore,
        nextOrbLevel,
        isGameOver,
        gameId,
        resetGame,
        username // Assuming username is in store now
    } = useGameStore();
    const { theme } = useTheme();

    const [showShop, setShowShop] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Play Again Safety
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const account = useActiveAccount(); // Use Thirdweb account

    // Unified Score Submission Logic
    const submitCurrentScore = async () => {
        try {
            if (account && account.address && score > 0) {
                await fetch('/api/submit-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        score,
                        wallet: account.address.toLowerCase()
                    })
                });
            }
        } catch (e) {
            console.error("Score submission failed", e);
        }
    };

    // Auto-save on Game Over
    React.useEffect(() => {
        if (isGameOver && score > 0) {
            submitCurrentScore();
        }
    }, [isGameOver, score, account]);

    const handleConfirmReset = async () => {
        setResetting(true);
        try {
            await submitCurrentScore(); // Re-use logic
        } finally {
            resetGame();
            setResetting(false);
            setShowResetConfirm(false);
        }
    };

    // Warn on Refresh/Close if game is active
    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (score > 0 && !isGameOver) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser default warning
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [score, isGameOver]);

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center p-4 lg:p-8 max-w-7xl mx-auto">
            {/* Left Panel: Stats & Controls */}
            <div className="flex flex-col gap-4 w-full lg:w-64 order-2 lg:order-1">
                <Panel className="flex flex-col gap-2">
                    <h2 className="text-sm uppercase tracking-wider opacity-70">Score</h2>
                    <div className="text-4xl font-bold font-mono">{score.toLocaleString()}</div>
                    <div className="text-xs opacity-50 mb-2">Best: {highScore.toLocaleString()}</div>
                    <ProfileModal />
                </Panel>

                <Panel className="flex flex-col gap-4">
                    <Button onClick={() => setShowResetConfirm(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                        <RefreshCw size={18} /> Restart
                    </Button>
                    {/* Daily Reward Button */}
                    <div className="w-full pb-2 border-b border-white/10 mb-2">
                        <DailyRewardButton />
                    </div>

                    <Button onClick={() => setShowShop(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                        <ShoppingBag size={18} /> Shop
                    </Button>
                    <Button onClick={() => setShowLeaderboard(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                        <BarChart2 size={18} /> Leaderboard
                    </Button>
                </Panel>
            </div>

            {/* Center: Game Board */}
            <div className="relative order-1 lg:order-2">
                <Panel className={theme === 'cosmic' ? "shadow-[0_0_30px_rgba(0,240,255,0.3)] p-1" : "shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] p-1"}>
                    {/* Key-Based Remount: This forces a fresh instance of PhysicsScene on gameId change */}
                    <PhysicsScene key={gameId} />
                </Panel>

                {/* Game Over Overlay */}
                <AnimatePresence>
                    {isGameOver && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl"
                        >
                            <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
                                <h2 className="text-4xl font-bold text-white mb-2">Game Over</h2>
                                <p className="text-xl text-cyan-300 mb-6">Score: {score}</p>
                                <Button onClick={resetGame} variant="primary" className="w-full">
                                    Try Again
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Panel: Next Orb & Info */}
            <div className="flex flex-col gap-4 w-full lg:w-64 order-3">
                <Panel className="flex flex-col items-center gap-4">
                    <h2 className="text-sm uppercase tracking-wider opacity-70">Next</h2>
                    <div className="w-24 h-24 flex items-center justify-center bg-black/5 rounded-full relative">
                        <div
                            style={{
                                width: ORB_LEVELS[nextOrbLevel].radius * 2,
                                height: ORB_LEVELS[nextOrbLevel].radius * 2,
                                backgroundColor: ORB_LEVELS[nextOrbLevel].color,
                                borderRadius: '50%'
                            }}
                            className="shadow-lg"
                        />
                    </div>
                    <p className="font-bold">{ORB_LEVELS[nextOrbLevel].name}</p>
                </Panel>

                <Panel>
                    <h3 className="font-bold mb-2">How to Play</h3>
                    <ul className="text-sm opacity-70 list-disc list-inside space-y-1">
                        <li>Drop orbs to merge them</li>
                        <li>Match same colors</li>
                        <li>Don't cross the top line!</li>
                    </ul>
                </Panel>
            </div>

            {/* Modals */}
            <FullLeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleConfirmReset}
                title="Restart Game?"
                description={`Are you sure? Your current score of ${score} will be submitted before resetting.`}
                loading={resetting}
            />

            <AnimatePresence>
                {showShop && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <div className="relative w-full max-w-md">
                            <button onClick={() => setShowShop(false)} className="absolute -top-10 right-0 text-white hover:text-cyan-400">
                                <X size={32} />
                            </button>
                            <ShopPanel />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
