"use client";

import React, { useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useGameStore } from "@/store/gameStore";
import PhysicsScene from "./PhysicsScene";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { ORB_LEVELS } from "@/lib/constants";
import { useTheme } from "@/components/ui/ThemeProvider";
import { DailyRewardButton } from "@/components/game/DailyRewardButton";
import { RefreshCw, ShoppingBag, BarChart2, Zap, Target, HeartPulse } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import ProfileModal from "@/components/ui/ProfileModal";
import { useHighScore } from "@/hooks/useHighScore";

import dynamic from "next/dynamic";

const ShopPanel = dynamic(() => import("@/components/shop/ShopPanel").then(mod => mod.ShopPanel), { ssr: false });
const FullLeaderboardModal = dynamic(() => import("@/components/leaderboard/FullLeaderboardModal"), { ssr: false });
import VFXLayer from "@/components/game/VFXLayer";
import { useScreenShake } from "@/hooks/useScreenShake";
import { MobileTopHUD } from "./MobileTopHUD";
import { MobileBottomControls } from "./MobileBottomControls";
import { useGameDimensions } from "@/hooks/useGameDimensions";
import { ErrorBoundary } from '@/components/utility/ErrorBoundary';
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useGameAudio } from "@/hooks/useGameAudio";

export default function GameContainer() {
    useHighScore(); // Fetch/Sync data

    const { startBGM } = useGameAudio(); // Get startBGM from singleton hook

    // --- GLOBAL AUDIO RESUME ---
    React.useEffect(() => {
        const handleInteraction = () => {
            startBGM();
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

    const {
        score,
        highScore,
        nextOrbLevel,
        isGameOver,
        gameId,
        resetGame,
        startTime,
    } = useGameStore();

    const [showShop, setShowShop] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    // Screen Shake Hook
    const { x, y } = useScreenShake();

    // Play Again Safety
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const account = useActiveAccount();

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
            await submitCurrentScore();
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
    // Measuring the container ref for the physics calculation.
    // Important: we apply ref to the inner game area now.
    useGameDimensions(containerRef);

    // MAIN LAYOUT RETURN
    return (
        <div className="relative w-full h-full overflow-hidden bg-transparent touch-none select-none flex flex-col items-center justify-center">

            {/* --- SINGLE UNIFIED LAYOUT (CSS Grid/Flex) --- */}
            <div className="flex flex-col md:flex-row items-center justify-center md:gap-8 w-full h-full md:p-4 relative">

                {/* LEFT PANEL (Desktop Only) */}
                <div className="hidden md:flex w-64 flex-col justify-center h-full max-h-[800px] z-20 pointer-events-none">
                    <div className="pointer-events-auto w-full">
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
                </div>

                {/* CENTRAL GAME AREA (Unified) */}
                <div
                    className="
                        relative flex flex-col items-center
                        w-full h-full 
                        md:w-auto md:h-full md:max-h-[75vh] md:aspect-[3/4] 
                        md:bg-black/20 md:border-2 md:border-dashed md:border-white/5 md:rounded-xl md:overflow-hidden md:shrink-0
                        transition-all duration-300
                    "
                >
                    {/* --- VIBE: Aurora Background (Mobile Only) --- */}
                    <div className="md:hidden absolute inset-0 pointer-events-none z-0 overflow-hidden">
                        <div className="absolute -top-[20%] -left-[20%] w-[140%] h-[60%] bg-purple-900/30 blur-[80px] rounded-full animate-pulse" />
                        <div className="absolute top-[40%] -right-[20%] w-[140%] h-[60%] bg-cyan-900/20 blur-[80px] rounded-full animate-pulse delay-1000" />
                    </div>
                    {/* Top HUD (Relative Flex Item) */}
                    <div className="md:hidden w-full shrink-0 z-50">
                        <MobileTopHUD onOpenLeaderboard={() => setShowLeaderboard(true)} />
                    </div>

                    {/* PHYSICS CANVAS WRAPPER (This is what determines Game Width/Height) */}
                    <div ref={containerRef} className="relative flex-1 w-full min-h-0 overflow-hidden md:flex-none md:h-full md:w-full">
                        <ErrorBoundary>
                            <motion.div style={{ x, y }} className="relative w-full h-full">
                                <VFXLayer />
                                <PhysicsScene key={gameId} />
                            </motion.div>
                        </ErrorBoundary>
                    </div>

                    {/* Bottom Controls (Mobile Only Bar) */}
                    <div className="md:hidden shrink-0 z-50 w-full">
                        <ErrorBoundary fallback={null}>
                            <MobileBottomControls onOpenShop={() => setShowShop(true)} />
                        </ErrorBoundary>
                    </div>

                </div>

                {/* RIGHT PANEL (Desktop Only) */}
                <div className="hidden md:flex w-64 flex-col justify-center h-full max-h-[800px] z-20 pointer-events-none">
                    <div className="pointer-events-auto w-full">
                        <Panel className="flex flex-col gap-6">
                            <div className="flex flex-col items-center gap-4">
                                <h2 className="text-sm uppercase tracking-wider opacity-70">Next</h2>
                                <div className="w-24 h-24 flex items-center justify-center bg-black/5 rounded-full relative">
                                    {useGameStore(state => state._hasHydrated) && ORB_LEVELS[nextOrbLevel] && (
                                        <div
                                            style={{
                                                width: ORB_LEVELS[nextOrbLevel].radius * 2 * 0.75, // Scale down 0.75x
                                                height: ORB_LEVELS[nextOrbLevel].radius * 2 * 0.75,
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

                            <div className="flex gap-2 w-full">
                                <InventoryButton
                                    icon={<Zap size={18} />}
                                    count={useGameStore((state) => state.shakes)}
                                    label="Shake"
                                    color="blue"
                                    className="flex-1 justify-center"
                                    onClick={() => {
                                        const { shakes, useShake, triggerShake } = useGameStore.getState();
                                        if (shakes > 0) {
                                            useShake();
                                            triggerShake();
                                        } else setShowShop(true);
                                    }}
                                />
                                <InventoryButton
                                    icon={<Target size={18} />}
                                    count={useGameStore((state) => state.strikes)}
                                    label="Laser"
                                    color="red"
                                    className="flex-1 justify-center"
                                    active={useGameStore((state) => state.laserMode)}
                                    onClick={() => {
                                        const { strikes, toggleLaserMode, laserMode } = useGameStore.getState();
                                        if (strikes > 0 || laserMode) toggleLaserMode();
                                        else setShowShop(true);
                                    }}
                                />
                            </div>

                            <div className="flex flex-col gap-3 w-full">
                                <Button onClick={() => setShowShop(true)} variant="primary" className="w-full flex items-center justify-center gap-2">
                                    <ShoppingBag size={18} /> Shop
                                </Button>

                                <div className="px-2">
                                    <hr className="border-white/10" />
                                </div>

                                <Button onClick={() => setShowLeaderboard(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                                    <BarChart2 size={18} /> Leaderboard
                                </Button>
                            </div>
                        </Panel>
                    </div>
                </div>

            </div>


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

            {showLeaderboard && (
                <FullLeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
            )}

            {showResetConfirm && (
                <ConfirmDialog
                    isOpen={showResetConfirm}
                    onClose={() => setShowResetConfirm(false)}
                    onConfirm={handleConfirmReset}
                    title="Restart Game?"
                    description={`Are you sure? Your current score of ${score} will be submitted.`}
                    loading={resetting}
                />
            )}

            <AnimatePresence>
                {showShop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4"
                    >
                        {/* Mobile: Slide Up Sheet, Desktop: Scale/Fade Modal */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0, scale: 1 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: "100%", opacity: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full md:w-full max-w-md bg-slate-900 md:bg-transparent rounded-t-2xl md:rounded-none overflow-hidden md:overflow-visible"
                            // Override for Desktop to behave like a normal modal
                            style={{
                                // We can use direct style or better yet, conditional variants.
                                // But CSS classes handle layout. Framer handles transform.
                                // Let's use a media query aware component or just simple variants?
                                // Simplified approach: The animation above is 'Sheet-like'.
                                // For desktop, we can override slightly or just accept the slide up is 'okay' 
                                // OR we ideally use separate variants.
                            }}
                        >
                            {/* Drag Handle for Mobile */}
                            <div className="md:hidden w-full flex flex-col items-center pt-3 pb-2 gap-1" onClick={() => setShowShop(false)}>
                                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                                <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Close</div>
                            </div>


                            <ShopPanel onClose={() => setShowShop(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div >
    );
};


function InventoryButton({ icon, count, label, color, onClick, active, className }: any) {
    const colors: any = {
        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30',
        red: 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30',
        green: 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
    };

    const activeColors: any = {
        blue: 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]',
        red: 'bg-red-500 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]',
        green: 'bg-green-500 border-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]'
    };

    return (
        <button
            onClick={onClick}
            className={`
                relative flex items-center gap-2 px-3 py-3 rounded-lg border transition-all active:scale-95
                ${active ? activeColors[color] : colors[color]}
                ${className}
            `}
        >
            {icon}
            <span className="font-bold text-sm tracking-wide">{label}</span>
            <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center bg-white text-black text-xs font-bold rounded-full shadow-lg ring-2 ring-black/20">
                {count}
            </span>
        </button>
    )
}
