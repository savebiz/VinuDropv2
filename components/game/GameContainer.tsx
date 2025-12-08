
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
import { Trophy, RefreshCw, ShoppingBag, BarChart2, Zap, Target, HeartPulse, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ProfileModal from "@/components/ui/ProfileModal";
import { useHighScore } from "@/hooks/useHighScore";

import { ShopPanel } from "@/components/shop/ShopPanel";
import FullLeaderboardModal from "@/components/leaderboard/FullLeaderboardModal";
import { useState } from "react";
import VFXLayer from "@/components/game/VFXLayer";
import { useScreenShake } from "@/hooks/useScreenShake";


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
        startTime,
        username // Assuming username is in store now
    } = useGameStore();
    const { theme } = useTheme();

    const [showShop, setShowShop] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Screen Shake Hook
    const { controls } = useScreenShake();

    // Play Again Safety

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
                        wallet: account.address.toLowerCase(),
                        startTime,
                        endTime: Date.now()
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

                <Panel className="flex flex-col gap-8">
                    {/* Group 1: Game Controls */}
                    <div className={`flex flex-col gap-2 pb-6 border-b ${theme === 'cosmic' ? 'border-white/10' : 'border-black/20'}`}>
                        <Button onClick={() => setShowResetConfirm(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                            <RefreshCw size={18} /> Restart
                        </Button>
                        <DailyRewardButton />
                    </div>

                    {/* Group 2: Shop & Inventory */}
                    <div className={`flex flex-col gap-2 pb-6 border-b ${theme === 'cosmic' ? 'border-white/10' : 'border-black/20'}`}>
                        <Button onClick={() => setShowShop(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                            <ShoppingBag size={18} /> Shop
                        </Button>

                        <div className="flex gap-2 w-full">
                            {/* Shake Button */}
                            <InventoryButton
                                icon={<Zap size={18} />}
                                count={useGameStore((state) => state.shakes)}
                                label="Shake"
                                color="blue"
                                onClick={() => {
                                    const { shakes, useShake, triggerShake } = useGameStore.getState();
                                    if (shakes > 0) {
                                        useShake();
                                        triggerShake();
                                    } else {
                                        setShowShop(true);
                                    }
                                }}
                            />

                            {/* Laser Button */}
                            <InventoryButton
                                icon={<Target size={18} />}
                                count={useGameStore((state) => state.strikes)}
                                label="Laser"
                                color="red"
                                active={useGameStore((state) => state.laserMode)}
                                onClick={() => {
                                    const { strikes, toggleLaserMode, laserMode } = useGameStore.getState();
                                    if (strikes > 0 || laserMode) {
                                        toggleLaserMode();
                                    } else {
                                        setShowShop(true);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Group 3: Leaderboard */}
                    <div>
                        <Button onClick={() => setShowLeaderboard(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                            <BarChart2 size={18} /> Leaderboard
                        </Button>
                    </div>
                </Panel>
            </div>

            {/* Center: Game Board */}
            <div className="relative order-1 lg:order-2">
                <Panel className={theme === 'cosmic' ? "shadow-[0_0_30px_rgba(0,240,255,0.3)] p-1" : "shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] p-1"}>
                    {/* Shake Wrapper */}
                    <motion.div animate={controls} className="relative">
                        <VFXLayer />
                        {/* Key-Based Remount: This forces a fresh instance of PhysicsScene on gameId change */}
                        <PhysicsScene key={gameId} />
                    </motion.div>
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
                                {/* Revive Option */}
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-xs text-white/50 mb-2">Or continue playing?</p>
                                    <Button
                                        onClick={() => setShowShop(true)}
                                        variant="secondary"
                                        className="w-full flex items-center justify-center gap-2 text-sm py-2"
                                    >
                                        <HeartPulse size={16} className="text-green-400" />
                                        Buy Revive
                                    </Button>
                                </div>
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
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
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
            </div >

            {/* Modals */}
            < FullLeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

            < ConfirmDialog
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
                            <ShopPanel onClose={() => setShowShop(false)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}

function InventoryButton({ icon, count, label, color, onClick, active }: any) {
    const colors: any = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
        green: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
    };

    return (
        <button
            onClick={onClick}
            className={`
                relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all active:scale-95
                ${active ? 'bg-white/20 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : colors[color]}
            `}
        >
            {icon}
            <span className="font-bold text-sm">{label}</span>
            <span className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-white text-black text-xs font-bold rounded-full shadow-lg">
                {count}
            </span>
        </button>
    )
}
