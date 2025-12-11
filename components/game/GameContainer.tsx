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
import { RefreshCw, ShoppingBag, BarChart2, Zap, Target, HeartPulse, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HowToPlayModal } from "./HowToPlayModal";

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
    const account = useActiveAccount();
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
        hardResetGame,
        claimLegacyInventory,
        startTime,
        username
    } = useGameStore();

    const [showShop, setShowShop] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showHowToPlay, setShowHowToPlay] = useState(false);
    const [showSessionExpired, setShowSessionExpired] = useState(false);



    // Legacy Inventory Migration
    React.useEffect(() => {
        if (account?.address) {
            claimLegacyInventory(account.address);
        }
    }, [account, claimLegacyInventory]);

    // 48-Hour Session Limit Check
    React.useEffect(() => {
        const checkSession = () => {
            if (isGameOver) return;
            const diff = Date.now() - startTime;
            const hours48 = 48 * 60 * 60 * 1000;
            if (diff > hours48) {
                // Trigger Expire
                submitCurrentScore().then(() => {
                    hardResetGame();
                    setShowSessionExpired(true);
                });
            }
        };

        // Check on mount and interval
        checkSession();
        const interval = setInterval(checkSession, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [startTime, isGameOver, hardResetGame, account]);
    React.useEffect(() => {
        const hasSeen = localStorage.getItem('hasSeenHowToPlay_v2'); // v2 to force show again if logic changed
        if (!hasSeen) {
            setShowHowToPlay(true);
        }
    }, []);

    const handleCloseHowToPlay = () => {
        localStorage.setItem('hasSeenHowToPlay_v2', 'true');
        setShowHowToPlay(false);
    };

    const { theme } = useTheme();
    const isDark = theme === 'cosmic';

    // Screen Shake Hook
    const { x, y } = useScreenShake();

    // Play Again Safety
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);

    const submitCurrentScore = async () => {
        // ... (existing code, not modified in this chunk but needed for context if tool requires)
        // I will trust existing context match
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
            const { isWalletConnecting } = useGameStore.getState();
            if (score > 0 && !isGameOver && !isWalletConnecting) {
                e.preventDefault();
                e.returnValue = ''; // Trigger browser default warning
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [score, isGameOver]);

    const containerRef = React.useRef<HTMLDivElement>(null);
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

                            {/* Profile Button */}
                            <Button
                                variant="secondary"
                                onClick={() => setShowProfile(true)}
                                className="text-xs px-2 py-1 bg-white/5 border border-white/10 w-full mb-2 flex items-center justify-center gap-2"
                            >
                                {username ? `👤 ${username}` : "👤 Set Username"}
                            </Button>

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
                    {/* --- VIBE: Aurora Background (Mobile Only) --- */}
                    <div className="md:hidden absolute inset-0 pointer-events-none z-0 overflow-hidden">
                        <div className={`absolute -top-[20%] -left-[20%] w-[140%] h-[60%] blur-[80px] rounded-full animate-pulse transition-colors duration-1000
                            ${isDark ? 'bg-purple-900/30' : 'bg-rose-300/40'}`}
                        />
                        <div className={`absolute top-[40%] -right-[20%] w-[140%] h-[60%] blur-[80px] rounded-full animate-pulse delay-1000 transition-colors duration-1000
                            ${isDark ? 'bg-cyan-900/20' : 'bg-blue-200/40'}`}
                        />
                    </div>
                    {/* Top HUD (Relative Flex Item) */}
                    <div className="md:hidden w-full shrink-0 z-50">
                        <MobileTopHUD
                            onOpenLeaderboard={() => setShowLeaderboard(true)}
                            onOpenProfile={() => setShowProfile(true)}
                            onOpenHowToPlay={() => setShowHowToPlay(true)}
                        />
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
                            {/* ... Content Omitted for Brevity if unchanged ... */}
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
                                    count={useGameStore((state) => {
                                        const { walletInventory, legacyShakes } = state;
                                        if (account?.address && walletInventory[account.address]) {
                                            return walletInventory[account.address].freeShakes + walletInventory[account.address].paidShakes;
                                        }
                                        return legacyShakes;
                                    })}
                                    label="Shake"
                                    color="blue"
                                    className="flex-1 justify-center"
                                    onClick={() => {
                                        const { useShake, triggerShake, getInventory } = useGameStore.getState();
                                        const inv = getInventory(account?.address);
                                        if (inv.totalShakes > 0) {
                                            useShake(account?.address);
                                            triggerShake();
                                        } else setShowShop(true);
                                    }}
                                />
                                <InventoryButton
                                    icon={<Target size={18} />}
                                    count={useGameStore((state) => {
                                        const { walletInventory, legacyStrikes } = state;
                                        if (account?.address && walletInventory[account.address]) {
                                            return walletInventory[account.address].freeStrikes + walletInventory[account.address].paidStrikes;
                                        }
                                        return legacyStrikes;
                                    })}
                                    label="Laser"
                                    color="red"
                                    className="flex-1 justify-center"
                                    active={useGameStore((state) => state.laserMode)}
                                    onClick={() => {
                                        const { toggleLaserMode, laserMode, getInventory } = useGameStore.getState();
                                        const inv = getInventory(account?.address);
                                        if (inv.totalStrikes > 0 || laserMode) toggleLaserMode();
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
                                <Button onClick={() => setShowHowToPlay(true)} variant="secondary" className="w-full flex items-center justify-center gap-2">
                                    <HelpCircle size={18} /> How to Play
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
                        <Panel className={`max-w-xs text-center p-8 shadow-xl border ${isDark ? 'border-white/20' : 'border-slate-200'}`}>
                            <h2 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Game Over</h2>
                            <p className={`text-xl mb-6 font-mono font-bold ${isDark ? 'text-cyan-300' : 'text-cyan-600'}`}>Score: {score}</p>
                            <Button onClick={resetGame} variant="primary" className="w-full mb-4">
                                Try Again
                            </Button>

                            <div className={`pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                                <Button onClick={() => setShowShop(true)} variant="secondary" className="w-full flex items-center justify-center gap-2 text-sm">
                                    <HeartPulse size={16} className={isDark ? "text-green-400" : "text-green-600"} /> Use Revive
                                </Button>
                            </div>
                        </Panel>
                    </motion.div>
                )}
            </AnimatePresence>

            {showProfile && (
                <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
            )}

            {showLeaderboard && (
                <ErrorBoundary>
                    <FullLeaderboardModal isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
                </ErrorBoundary>
            )}

            <HowToPlayModal isOpen={showHowToPlay} onClose={handleCloseHowToPlay} />

            {/* --- MISSING MODALS RESTORED --- */}
            {showResetConfirm && (
                <ConfirmDialog
                    isOpen={showResetConfirm}
                    title="Restart Game?"
                    description="Current progress will be lost."
                    onConfirm={handleConfirmReset}
                    onClose={() => setShowResetConfirm(false)}
                    loading={resetting}
                />
            )}

            {showSessionExpired && (
                <ConfirmDialog
                    isOpen={showSessionExpired}
                    title="Session Expired"
                    description={`Your session exceeded 48 hours. To ensure fair play, your score of ${score} has been saved and the board has been reset.`}
                    onConfirm={() => setShowSessionExpired(false)}
                    onClose={() => setShowSessionExpired(false)}
                    loading={false}
                />
            )}

            <AnimatePresence>
                {showShop && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <div className="w-full max-w-md relative">
                            {/* Backdrop click to close */}
                            <div className="absolute inset-0" onClick={() => setShowShop(false)} />
                            <div className="relative z-10">
                                <ErrorBoundary>
                                    <ShopPanel onClose={() => setShowShop(false)} />
                                </ErrorBoundary>
                            </div>
                        </div>
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
