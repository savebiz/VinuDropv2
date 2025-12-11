import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BarChart2, Menu, RotateCw, User, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DailyRewardButton } from '@/components/game/DailyRewardButton';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/components/ui/ThemeProvider';

interface MobileTopHUDProps {
    onOpenLeaderboard: () => void;
    onOpenProfile: () => void;
    onOpenHowToPlay: () => void;
}

export const MobileTopHUD = ({ onOpenLeaderboard, onOpenProfile, onOpenHowToPlay }: MobileTopHUDProps) => {
    const { score, resetGame } = useGameStore();
    const [showMenu, setShowMenu] = useState(false);
    const { theme } = useTheme();

    // Safety checks for rendering
    const safeScore = (score !== undefined && score !== null) ? score : 0;

    const handleRestart = () => {
        if (confirm("Are you sure you want to restart?")) {
            resetGame();
            setShowMenu(false);
        }
    };

    const isDark = theme === 'cosmic';

    return (
        <div className={`w-full flex justify-between items-center p-2 z-40 backdrop-blur-xl border-b shadow-2xl transition-colors duration-300 relative
            ${isDark
                ? 'bg-slate-900/60 border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
                : 'bg-white/60 border-slate-200/50 shadow-[0_10px_40px_rgba(0,0,0,0.1)]'
            }`}
        >

            {/* Background Gradient/Glow - Subtle for Light Mode */}
            <div className={`absolute inset-0 bg-gradient-to-b pointer-events-none transition-colors duration-300
                ${isDark
                    ? 'from-cyan-900/20 via-transparent to-transparent'
                    : 'from-cyan-100/40 via-transparent to-transparent'
                }`}
            />

            <div className="pointer-events-auto flex flex-col gap-1 z-10">
                <div className={`px-3 py-1.5 rounded-xl border shadow-inner transition-colors duration-300
                    ${isDark
                        ? 'bg-black/20 border-white/5'
                        : 'bg-white/50 border-slate-200/50'
                    }`}
                >
                    <span className={`text-[9px] uppercase font-bold tracking-wider transition-colors
                        ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}
                    >
                        Score
                    </span>
                    <div className={`text-xl font-mono font-bold leading-none transition-colors
                        ${isDark ? 'text-white' : 'text-slate-900'}`}
                    >
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
                        className={`w-9 h-9 p-0 rounded-full flex items-center justify-center backdrop-blur-md active:scale-95 transition-all border
                            ${isDark
                                ? 'bg-black/40 border-white/10'
                                : 'bg-white/40 border-slate-200 text-slate-900'
                            }`}
                    >
                        {showMenu
                            ? <X size={18} className={isDark ? "text-white" : "text-slate-900"} />
                            : <Menu size={18} className={isDark ? "text-white" : "text-slate-900"} />
                        }
                    </Button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                                className={`absolute top-12 right-0 w-48 backdrop-blur-xl border rounded-xl shadow-2xl p-2 flex flex-col gap-1 z-50
                                    ${isDark
                                        ? 'bg-slate-900/90 border-white/10'
                                        : 'bg-white/90 border-slate-200 text-slate-900'
                                    }`}
                            >
                                <button
                                    onClick={handleRestart}
                                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm font-bold transition-colors text-left
                                        ${isDark
                                            ? 'hover:bg-white/10 text-white'
                                            : 'hover:bg-slate-100 text-slate-800'
                                        }`}
                                >
                                    <RotateCw size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                                    Restart Game
                                </button>
                                <div className={`h-px my-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                                <button
                                    onClick={() => { onOpenProfile(); setShowMenu(false); }}
                                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm font-bold transition-colors text-left
                                        ${isDark
                                            ? 'hover:bg-white/10 text-white'
                                            : 'hover:bg-slate-100 text-slate-800'
                                        }`}
                                >
                                    <User size={16} className={isDark ? "text-purple-400" : "text-purple-600"} />
                                    Set Username
                                </button>
                                <button
                                    onClick={() => { onOpenLeaderboard(); setShowMenu(false); }}
                                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm font-bold transition-colors text-left
                                        ${isDark
                                            ? 'hover:bg-white/10 text-white'
                                            : 'hover:bg-slate-100 text-slate-800'
                                        }`}
                                >
                                    <BarChart2 size={16} className={isDark ? "text-yellow-400" : "text-yellow-600"} />
                                    Leaderboard
                                </button>
                                <button
                                    onClick={() => { onOpenHowToPlay(); setShowMenu(false); }}
                                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-sm font-bold transition-colors text-left
                                        ${isDark
                                            ? 'hover:bg-white/10 text-white'
                                            : 'hover:bg-slate-100 text-slate-800'
                                        }`}
                                >
                                    <HelpCircle size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
                                    How to Play
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
