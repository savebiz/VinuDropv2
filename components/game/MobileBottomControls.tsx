import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { ShoppingBag, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ORB_LEVELS } from '@/lib/constants';
import { useActiveAccount } from 'thirdweb/react';
import { useHaptic } from '@/hooks/useHaptic';

interface MobileBottomControlsProps {
    onOpenShop: () => void;
}

export const MobileBottomControls = ({ onOpenShop }: MobileBottomControlsProps) => {
    const { nextOrbLevel, highScore, _hasHydrated } = useGameStore();
    const account = useActiveAccount();
    const { trigger } = useHaptic();

    const safeHighScore = (highScore !== undefined && highScore !== null) ? highScore : 0;
    const safeNextLevel = (nextOrbLevel !== undefined && nextOrbLevel !== null && nextOrbLevel >= 0) ? nextOrbLevel : 0;

    const handleShopClick = () => {
        trigger([10]);
        onOpenShop();
    };

    return (
        <div className="h-24 w-full bg-slate-900/60 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-8 pb-4 relative z-50 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">

            {/* Background Gradient/Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-transparent to-transparent pointer-events-none" />

            {/* Left: Best Score */}
            <div className="flex flex-col items-center gap-1 z-10 w-20">
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Best</div>
                <div className="flex items-center gap-1 text-yellow-400 font-bold font-mono text-sm bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 shadow-inner">
                    <Trophy size={12} />
                    {account ? safeHighScore.toLocaleString() : 0}
                </div>
            </div>

            {/* Center: Next Orb (Highlighted) */}
            <div className="relative z-10 -mt-10 flex flex-col items-center group">
                {/* Glow behind orb */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-400/30 transition-all duration-500" />

                <div className="w-20 h-20 bg-slate-900/80 backdrop-blur-md rounded-full border-4 border-slate-900 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] relative ring-1 ring-white/10">
                    <div className="absolute -top-7 text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full border border-cyan-500/30 shadow-lg">
                        Next
                    </div>
                    {_hasHydrated && ORB_LEVELS && ORB_LEVELS[safeNextLevel] && (
                        <div
                            style={{
                                width: ORB_LEVELS[safeNextLevel].radius * 2 * 0.8,
                                height: ORB_LEVELS[safeNextLevel].radius * 2 * 0.8,
                                backgroundColor: ORB_LEVELS[safeNextLevel].color,
                                boxShadow: `inset 0 -2px 5px rgba(0,0,0,0.3), 0 0 15px ${ORB_LEVELS[safeNextLevel].color}`,
                                borderRadius: '50%'
                            }}
                            className="transition-transform duration-300 group-hover:scale-110"
                        />
                    )}
                </div>
            </div>

            {/* Right: Shop Button */}
            <div className="flex flex-col items-center gap-1 z-10 w-20">
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Shop</div>
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
