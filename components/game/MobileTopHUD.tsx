import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BarChart2, Menu, RotateCw, User, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DailyRewardButton } from '@/components/game/DailyRewardButton';
import { AnimatePresence, motion } from 'framer-motion';

interface MobileTopHUDProps {
    onOpenLeaderboard: () => void;
    onOpenProfile: () => void;
}

export const MobileTopHUD = ({ onOpenLeaderboard, onOpenProfile }: MobileTopHUDProps) => {
    const { score, resetGame } = useGameStore();
    const [showMenu, setShowMenu] = useState(false);

    // Safety checks for rendering
    const safeScore = (score !== undefined && score !== null) ? score : 0;

    const handleRestart = () => {
        if (confirm("Are you sure you want to restart?")) {
            resetGame();
            setShowMenu(false);
        }
    };

    return (
        <div className="w-full flex justify-between items-center p-2 z-40 bg-slate-900/60 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative">

            {/* Background Gradient/Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

            <div className="pointer-events-auto flex flex-col gap-1 z-10">
                <div className="bg-black/20 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner">
                    <span className="text-[9px] uppercase text-cyan-300 font-bold tracking-wider">Score</span>
                    <div className="text-xl font-mono font-bold text-white leading-none">
                        {safeScore.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="pointer-events-auto flex gap-4 items-center">
                {/* Daily Reward - Compact */}
                <div className="scale-75 origin-right -mr-2">
                    <DailyRewardButton />
                </div>

                {/* Hamburger Menu */}
                <div className="relative">
                    <Button
                        onClick={() => setShowMenu(!showMenu)}
                        variant="secondary"
                        className="w-9 h-9 p-0 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10 active:scale-95 transition-all"
                    >
                        {showMenu ? <X size={18} className="text-white" /> : <Menu size={18} className="text-white" />}
                    </Button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                className="absolute top-12 right-0 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50"
                            >
                                <button
                                    onClick={handleRestart}
                                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 text-white text-sm font-bold transition-colors text-left"
                                >
                                    <RotateCw size={16} className="text-cyan-400" />
                                    Restart Game
                                </button>
                                <div className="h-px bg-white/10 my-1" />
                                <button
                                    onClick={() => { onOpenProfile(); setShowMenu(false); }}
                                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 text-white text-sm font-bold transition-colors text-left"
                                >
                                    <User size={16} className="text-purple-400" />
                                    Set Username
                                </button>
                                <button
                                    onClick={() => { onOpenLeaderboard(); setShowMenu(false); }}
                                    className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-white/10 text-white text-sm font-bold transition-colors text-left"
                                >
                                    <BarChart2 size={16} className="text-yellow-400" />
                                    Leaderboard
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
