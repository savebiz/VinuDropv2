
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MousePointer2, Zap, Target, Trophy, AlertTriangle, ArrowDown, Sparkles } from "lucide-react";
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { useTheme } from '@/components/ui/ThemeProvider';

interface HowToPlayModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HowToPlayModal = ({ isOpen, onClose }: HowToPlayModalProps) => {
    const { theme } = useTheme();
    const isDark = theme === 'cosmic';

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-lg"
                >
                    <Panel className={`relative flex flex - col gap - 4 max - h - [85vh] overflow - y - auto ${isDark ? 'border-white/20' : 'border-slate-200 shadow-2xl'} `}>
                        {/* Header */}
                        <div className="flex justify-between items-center -mb-2">
                            <h2 className={`text - xl font - bold ${isDark ? 'text-white' : 'text-slate-900'} `}>
                                How to Play
                            </h2>
                            <button onClick={onClose} className={`p - 1 rounded - full hover: bg - white / 10 ${isDark ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-900'} `}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Compact List */}
                        <div className="flex flex-col gap-3">
                            {/* Step 1: Drop & Merge */}
                            <div className={`p - 3 rounded - lg border flex gap - 3 items - center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} `}>
                                <div className={`w - 10 h - 10 shrink - 0 rounded - full flex items - center justify - center ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'} `}>
                                    <ArrowDown size={20} />
                                </div>
                                <div>
                                    <h3 className={`font - bold text - sm mb - 0.5 ${isDark ? 'text-white' : 'text-slate-900'} `}>Drop & Merge</h3>
                                    <p className={`text - xs leading - tight ${isDark ? 'text-white/70' : 'text-slate-600'} `}>
                                        Tap to drop orbs. Merge identical orbs to evolve them and score!
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: The Goal */}
                            <div className={`p - 3 rounded - lg border flex gap - 3 items - center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} `}>
                                <div className={`w - 10 h - 10 shrink - 0 rounded - full flex items - center justify - center ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'} `}>
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className={`font - bold text - sm mb - 0.5 ${isDark ? 'text-white' : 'text-slate-900'} `}>Reach Vinu Moon</h3>
                                    <p className={`text - xs leading - tight ${isDark ? 'text-white/70' : 'text-slate-600'} `}>
                                        Combine two Melons (Lvl 9) to create the legendary <b>Vinu Moon</b>!
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Power Ups */}
                            <div className={`p - 3 rounded - lg border flex gap - 3 items - center ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} `}>
                                <div className={`w - 10 h - 10 shrink - 0 rounded - full flex items - center justify - center ${isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'} `}>
                                    <Zap size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font - bold text - sm mb - 0.5 ${isDark ? 'text-white' : 'text-slate-900'} `}>Power-Ups</h3>
                                    <div className={`text - xs leading - tight ${isDark ? 'text-white/70' : 'text-slate-600'} `}>
                                        <span className="flex items-center gap-1">
                                            <Zap size={12} className="text-yellow-400" /> <b>Shake</b> to unscramble.
                                        </span>
                                        <span className="flex items-center gap-1 mt-0.5">
                                            <Target size={12} className="text-red-400" /> <b>Laser</b> to pop orbs.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Step 4: Game Over */}
                            <div className={`p - 3 rounded - lg border flex gap - 3 items - center ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} `}>
                                <div className={`w - 10 h - 10 shrink - 0 rounded - full flex items - center justify - center ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'} `}>
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <h3 className={`font - bold text - sm mb - 0.5 ${isDark ? 'text-red-200' : 'text-red-700'} `}>Game Over</h3>
                                    <p className={`text - xs leading - tight ${isDark ? 'text-red-200/70' : 'text-red-600/80'} `}>
                                        If orbs stack up and stay <b>on</b> the danger line for too long, the game ends!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-2 border-t border-white/10">
                            <Button onClick={onClose} variant="primary" className="w-full py-3 text-sm font-bold shadow-lg shadow-cyan-500/20">
                                Got it, Let's Play!
                            </Button>
                        </div>
                    </Panel>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
