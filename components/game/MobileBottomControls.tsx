import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { ShoppingBag, Trophy, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ORB_LEVELS } from '@/lib/constants';
import { useActiveAccount } from 'thirdweb/react';
import { useHaptic } from '@/hooks/useHaptic';

interface MobileBottomControlsProps {
    onOpenShop: () => void;
}

export const MobileBottomControls = ({ onOpenShop }: MobileBottomControlsProps) => {
    const { nextOrbLevel, highScore, _hasHydrated, shakes, strikes, useShake, triggerShake, toggleLaserMode, laserMode } = useGameStore();
    const account = useActiveAccount();
    const { trigger } = useHaptic();

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
        <div className="h-24 w-full bg-slate-900/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-4 pb-4 relative z-50 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">

            {/* Background Gradient/Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

            {/* 1. Best Score (Far Left) */}
            <div className="flex flex-col items-center gap-1 z-10 w-14">
                <div className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Best</div>
                <div className="flex items-center justify-center gap-1 text-yellow-400 font-bold font-mono text-xs bg-black/40 px-2 py-1 rounded-md border border-white/5 shadow-inner w-full">
                    <Trophy size={10} />
                    <span>{account ? (safeHighScore > 9999 ? `${(safeHighScore / 1000).toFixed(1)}k` : safeHighScore) : 0}</span>
                </div>
            </div>

            {/* 2. Shake Button */}
            <div className="relative z-10">
                <Button
                    onClick={handleShake}
                    variant="secondary"
                    className="h-10 w-10 p-0 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400 border border-blue-500/30 active:scale-95 transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                    <Zap size={18} fill="currentColor" />
                    {shakes > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-blue-600 text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-black">
                            {shakes}
                        </span>
                    )}
                </Button>
            </div>

            {/* 3. Center: Next Orb */}
            <div className="relative z-10 -mt-8 flex flex-col items-center group mx-2">
                {/* Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-400/30 transition-all duration-500" />

                <div className="w-16 h-16 bg-slate-900/80 backdrop-blur-md rounded-full border-4 border-slate-900 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] relative ring-1 ring-white/10">
                    {_hasHydrated && ORB_LEVELS && ORB_LEVELS[safeNextLevel] && (
                        <div
                            style={{
                                width: ORB_LEVELS[safeNextLevel].radius * 2 * 0.55,
                                height: ORB_LEVELS[safeNextLevel].radius * 2 * 0.55,
                                backgroundColor: ORB_LEVELS[safeNextLevel].color,
                                boxShadow: `inset 0 -2px 5px rgba(0,0,0,0.3), 0 0 15px ${ORB_LEVELS[safeNextLevel].color}`,
                                borderRadius: '50%'
                            }}
                            className="transition-transform duration-300 group-hover:scale-110"
                        />
                    )}
                </div>
                {/* Moved Label to BOTTOM */}
                <div className="absolute -bottom-5 text-[9px] font-bold text-cyan-400 uppercase tracking-widest bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded-full border border-cyan-500/30 shadow-lg">
                    Next
                </div>
            </div>

            {/* 4. Laser Button */}
            <div className="relative z-10">
                <Button
                    onClick={handleLaser}
                    variant="secondary"
                    className={`h-10 w-10 p-0 rounded-full flex items-center justify-center border active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]
                         ${laserMode
                            ? 'bg-red-500 text-white border-red-500 animate-pulse'
                            : 'bg-red-500/20 text-red-400 border-red-500/30'}`}
                >
                    <Target size={18} />
                    {strikes > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-red-600 text-[10px] font-bold flex items-center justify-center rounded-full ring-2 ring-black">
                            {strikes}
                        </span>
                    )}
                </Button>
            </div>


            {/* 5. Right: Shop Button */}
            <div className="flex flex-col items-center gap-1 z-10 w-14">
                <div className="text-[9px] text-white/50 uppercase font-bold tracking-wider">Shop</div>
                <Button
                    onClick={handleShopClick}
                    variant="primary"
                    className="h-10 w-10 p-0 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:scale-105 active:scale-95 transition-all"
                >
                    <ShoppingBag size={18} />
                </Button>
            </div>
        </div>
    );
};
