import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { ShoppingBag, Trophy, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ORB_LEVELS } from '@/lib/constants';
import { useActiveAccount } from 'thirdweb/react';
import { useHaptic } from '@/hooks/useHaptic';
import { useTheme } from '@/components/ui/ThemeProvider';

interface MobileBottomControlsProps {
    onOpenShop: () => void;
}

export const MobileBottomControls = ({ onOpenShop }: MobileBottomControlsProps) => {
    const { nextOrbLevel, highScore, _hasHydrated, shakes, strikes, useShake, triggerShake, toggleLaserMode, laserMode } = useGameStore();
    const account = useActiveAccount();
    const { trigger } = useHaptic();
    const { theme } = useTheme();

    const isDark = theme === 'cosmic';

    const safeHighScore = (highScore !== undefined && highScore !== null) ? highScore : 0;
    const safeNextLevel = (nextOrbLevel !== undefined && nextOrbLevel !== null && nextOrbLevel >= 0) ? nextOrbLevel : 0;

    const handleShopClick = () => {
        trigger([10]);
        onOpenShop();
    };

    const handleShake = () => {
        if (shakes > 0) {
            trigger([20]);
            useShake();
            triggerShake();
        } else {
            trigger([10, 10]); // Error vibration
            onOpenShop();
        }
    };

    const handleLaser = () => {
        if (strikes > 0 || laserMode) {
            trigger([20]);
            toggleLaserMode();
        } else {
            trigger([10, 10]);
            onOpenShop();
        }
    };

    return (
        <div className={`h-20 w-full backdrop-blur-xl border-t flex items-center justify-between px-2 pb-2 relative z-50 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-colors duration-300
            ${isDark
                ? 'bg-slate-900/60 border-white/10'
                : 'bg-white/60 border-slate-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]'
            }`}
        >

            {/* Background Gradient/Glow */}
            <div className={`absolute inset-0 bg-gradient-to-t pointer-events-none transition-colors duration-300
                ${isDark
                    ? 'from-cyan-900/20 via-transparent to-transparent'
                    : 'from-cyan-100/40 via-transparent to-transparent'
                }`}
            />

            {/* 1. Best Score (Far Left) */}
            <div className="flex flex-col items-center gap-1 z-10 w-12">
                <div className={`text-[8px] uppercase font-bold tracking-wider transition-colors ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Best</div>
                <div className={`flex items-center justify-center gap-0.5 font-bold font-mono text-[10px] px-1.5 py-1 rounded-md border shadow-inner w-full transition-colors
                    ${isDark
                        ? 'bg-black/40 border-white/5 text-yellow-400'
                        : 'bg-white/50 border-slate-300 text-yellow-600'
                    }`}
                >
                    <Trophy size={9} />
                    <span>{account ? (safeHighScore > 9999 ? `${(safeHighScore / 1000).toFixed(1)}k` : safeHighScore) : 0}</span>
                </div>
            </div>

            {/* 2. Shake Button */}
            <div className="relative z-10">
                <Button
                    onClick={handleShake}
                    variant="secondary"
                    className={`h-9 w-9 p-0 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] border
                        ${isDark
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                            : 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200'
                        }`}
                >
                    <Zap size={16} fill="currentColor" />
                    {shakes > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-blue-600 text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-black">
                            {shakes}
                        </span>
                    )}
                </Button>
            </div>

            {/* 3. Center: Next Orb */}
            <div className="relative z-10 -mt-6 flex flex-col items-center group mx-1">
                {/* Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-400/30 transition-all duration-500" />

                <div className={`w-14 h-14 backdrop-blur-md rounded-full border-4 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] relative ring-1 transition-colors
                    ${isDark
                        ? 'bg-slate-900/80 border-slate-900 ring-white/10'
                        : 'bg-white/80 border-white ring-slate-200'
                    }`}
                >
                    {_hasHydrated && ORB_LEVELS && ORB_LEVELS[safeNextLevel] && (
                        <div
                            style={{
                                width: ORB_LEVELS[safeNextLevel].radius * 2 * 0.45,
                                height: ORB_LEVELS[safeNextLevel].radius * 2 * 0.45,
                                backgroundColor: ORB_LEVELS[safeNextLevel].color,
                                boxShadow: `inset 0 -2px 5px rgba(0,0,0,0.3), 0 0 15px ${ORB_LEVELS[safeNextLevel].color}`,
                                borderRadius: '50%'
                            }}
                            className="transition-transform duration-300 group-hover:scale-110"
                        />
                    )}
                </div>
                {/* Moved Label to BOTTOM */}
                <div className={`absolute -bottom-4 text-[8px] font-bold uppercase tracking-widest backdrop-blur px-2 py-0.5 rounded-full border shadow-lg transition-colors
                    ${isDark
                        ? 'bg-slate-900/90 text-cyan-400 border-cyan-500/30'
                        : 'bg-white/90 text-cyan-700 border-cyan-200'
                    }`}
                >
                    Next
                </div>
            </div>

            {/* 4. Laser Button */}
            <div className="relative z-10">
                <Button
                    onClick={handleLaser}
                    variant="secondary"
                    className={`h-9 w-9 p-0 rounded-full flex items-center justify-center border active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]
                         ${laserMode
                            ? 'bg-red-500 text-white border-red-500 animate-pulse'
                            : isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-600 border-red-200'
                        }`}
                >
                    <Target size={16} />
                    {strikes > 0 && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white text-red-600 text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-black">
                            {strikes}
                        </span>
                    )}
                </Button>
            </div>


            {/* 5. Right: Shop Button */}
            <div className="flex flex-col items-center gap-1 z-10 w-12">
                <div className={`text-[8px] uppercase font-bold tracking-wider transition-colors ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Shop</div>
                <Button
                    onClick={handleShopClick}
                    variant="primary"
                    className="h-9 w-9 p-0 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all"
                >
                    <ShoppingBag size={16} />
                </Button>
            </div>
        </div>
    );
};
