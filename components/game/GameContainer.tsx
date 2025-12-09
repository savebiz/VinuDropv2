
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

import dynamic from "next/dynamic";

const ShopPanel = dynamic(() => import("@/components/shop/ShopPanel").then(mod => mod.ShopPanel), { ssr: false });
const FullLeaderboardModal = dynamic(() => import("@/components/leaderboard/FullLeaderboardModal"), { ssr: false });
import { useState } from "react";
import VFXLayer from "@/components/game/VFXLayer";
import { useScreenShake } from "@/hooks/useScreenShake";
import { MobileHUD } from "./MobileHUD";
import { useGameDimensions } from "@/hooks/useGameDimensions";
import { ErrorBoundary } from '@/components/utility/ErrorBoundary';


// import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { supabase } from "@/lib/supabaseClient";

import { useGameAudio } from "@/hooks/useGameAudio"; // Import hook

export default function GameContainer() {
    useHighScore(); // Fetch/Sync data

    const { startBGM } = useGameAudio(); // Get startBGM from singleton hook

    // --- GLOBAL AUDIO RESUME ---
    // User interaction is required to start audio context.
    // This listeners waits for ANY click/touch/key to start the BGM if it's not playing.
    React.useEffect(() => {
        const handleInteraction = () => {
            startBGM();
            // Remove listeners once audio is triggered
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
        }
    }, [startBGM]);
    // ---------------------------

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
    const { x, y } = useScreenShake();

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

    const containerRef = React.useRef<HTMLDivElement>(null);
    const { width } = useGameDimensions(containerRef);

    const [isMobile, setIsMobile] = useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // Toggle at 1024px for tablet/desktop split
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // MAIN LAYOUT RETURN
    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-slate-900 touch-none select-none flex flex-col items-center justify-center">

            {/* --- DESKTOP LAYOUT (Flex Row) --- */}
            {!isMobile && (
                <div className="flex items-center justify-center gap-8 w-full h-full p-4">

                    {/* LEFT PANEL */}
                    <div className="w-64 flex flex-col justify-center h-full max-h-[800px]">
                        <Panel className="flex flex-col gap-4">
                            <h2 className="text-sm uppercase tracking-wider opacity-70">Score</h2>
                            <div className="text-4xl font-bold font-mono">{score.toLocaleString()}</div>
                            <div className="text-xs opacity-50 mb-2">Best: {account ? highScore.toLocaleString() : 0}</div>
                            <ProfileModal />
                            <hr className="border-white/10 my-2" />
                            <Button onClick={() => setShowResetConfirm(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                                <RefreshCw size={18} /> Restart
                            </Button>
                            <DailyRewardButton />
                        </Panel>
                    </div>

                    {/* CENTRAL GAME JAR */}
                    <div className="relative h-full max-h-[75vh] aspect-[3/4] border-2 border-dashed border-white/5 bg-black/20 rounded-xl overflow-hidden shrink-0">
                        <ErrorBoundary>
                            <motion.div style={{ x, y }} className="relative w-full h-full">
                                <VFXLayer />
                                <PhysicsScene key={gameId} />
                            </motion.div>
                        </ErrorBoundary>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="w-64 flex flex-col justify-center h-full max-h-[800px]">
                        <Panel className="flex flex-col gap-6">
                            <div className="flex flex-col items-center gap-4">
                                <h2 className="text-sm uppercase tracking-wider opacity-70">Next</h2>
                                <div className="w-24 h-24 flex items-center justify-center bg-black/5 rounded-full relative">
                                    {useGameStore(state => state._hasHydrated) && (
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
                                    )}
                                </div>
                                <p className="font-bold min-h-[24px]">
                                    {useGameStore(state => state._hasHydrated) ? ORB_LEVELS[nextOrbLevel].name : ''}
                                </p>
                            </div>

                            <hr className="border-white/10" />

                            <div className="space-y-3">
                                <Button onClick={() => setShowShop(true)} variant="primary" className="w-full flex items-center justify-center gap-2">
                                    <ShoppingBag size={18} /> Shop
                                </Button>
                                <Button onClick={() => setShowLeaderboard(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                                    <BarChart2 size={18} /> Leaderboard
                                </Button>
                            </div>

                            {/* Inventory Mini-Bar */}
                            <div className="flex gap-2">
                                <InventoryButton
                                    icon={<Zap size={16} />}
                                    count={useGameStore((state) => state.shakes)}
                                    color="blue"
                                    onClick={() => {
                                        const { shakes, useShake, triggerShake } = useGameStore.getState();
                                        if (shakes > 0) {
                                            useShake();
                                            triggerShake();
                                        } else setShowShop(true);
                                    }}
                                />
                                <InventoryButton
                                    icon={<Target size={16} />}
                                    count={useGameStore((state) => state.strikes)}
                                    color="red"
                                    active={useGameStore((state) => state.laserMode)}
                                    onClick={() => {
                                        const { strikes, toggleLaserMode, laserMode } = useGameStore.getState();
                                        if (strikes > 0 || laserMode) toggleLaserMode();
                                        else setShowShop(true);
                                    }}
                                />
                            </div>
                        </Panel>
                    </div>

                </div>
            )}

            {/* --- MOBILE LAYOUT --- */}
            {isMobile && (
                <>
                    {/* Full screen Game Jar for Mobile */}
                    <div className="absolute inset-0 z-0">
                        <ErrorBoundary>
                            <motion.div style={{ x, y }} className="relative w-full h-full">
                                <VFXLayer />
                                <PhysicsScene key={gameId} />
                            </motion.div>
                        </ErrorBoundary>
                    </div>

                    <ErrorBoundary fallback={null}>
                        <MobileHUD
                            onOpenShop={() => setShowShop(true)}
                            onOpenLeaderboard={() => setShowLeaderboard(true)}
                        />
                    </ErrorBoundary>
                </>
            )}


            {/* --- MODALS & OVERLAYS --- */}
            <AnimatePresence>
                {isGameOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md"
                    >
                        <Panel className="max-w-xs text-center p-8 border-white/20 shadow-2xl">
                            <h2 className="text-4xl font-bold text-white mb-2">Game Over</h2>
                            <p className="text-xl text-cyan-300 mb-6">Score: {score}</p>
                            <Button onClick={resetGame} variant="primary" className="w-full mb-4">
                                Try Again
                            </Button>

                            <div className="pt-4 border-t border-white/10">
                                <Button onClick={() => setShowShop(true)} variant="secondary" className="w-full flex items-center justify-center gap-2 text-sm">
                                    <HeartPulse size={16} className="text-green-400" /> Use Revive
                                </Button>
                            </div>
                        </Panel>
                    </motion.div>
                )}
            </AnimatePresence>

            <FullLeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

            <ConfirmDialog
                isOpen={showResetConfirm}
                onClose={() => setShowResetConfirm(false)}
                onConfirm={handleConfirmReset}
                title="Restart Game?"
                description={`Are you sure? Your current score of ${score} will be submitted.`}
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
};


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
