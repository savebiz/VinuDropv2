import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { ShoppingBag, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ORB_LEVELS } from '@/lib/constants';
import { useActiveAccount } from 'thirdweb/react';

interface MobileBottomControlsProps {
    onOpenShop: () => void;
}

export const MobileBottomControls = ({ onOpenShop }: MobileBottomControlsProps) => {
    const { nextOrbLevel, highScore, _hasHydrated } = useGameStore();
    const account = useActiveAccount();

    const safeHighScore = (highScore !== undefined && highScore !== null) ? highScore : 0;
    const safeNextLevel = (nextOrbLevel !== undefined && nextOrbLevel !== null && nextOrbLevel >= 0) ? nextOrbLevel : 0;

    return (
        <div className="h-24 w-full bg-[#0f172a] border-t border-white/10 flex items-center justify-between px-6 pb-2 relative z-50 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">

            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 to-transparent pointer-events-none" />

            {/* Left: Best Score */}
            <div className="flex flex-col items-center gap-1 z-10 w-20">
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Best</div>
                <div className="flex items-center gap-1 text-yellow-400 font-bold font-mono text-sm bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                    <Trophy size={10} />
                    {account ? safeHighScore.toLocaleString() : 0}
                </div>
            </div>

            {/* Center: Next Orb (Highlighted) */}
            <div className="relative z-10 -mt-8 flex flex-col items-center">
                <div className="w-20 h-20 bg-[#1e293b] rounded-full border-4 border-[#0f172a] flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] relative">
                    <div className="absolute -top-6 text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-[#0f172a] px-2 py-0.5 rounded-full border border-white/10">
                        Next
                    </div>
                    {_hasHydrated && ORB_LEVELS && ORB_LEVELS[safeNextLevel] && (
                        <div
                            style={{
                                width: ORB_LEVELS[safeNextLevel].radius * 2 * 0.8,
                                height: ORB_LEVELS[safeNextLevel].radius * 2 * 0.8,
                                backgroundColor: ORB_LEVELS[safeNextLevel].color,
                                boxShadow: `0 0 15px ${ORB_LEVELS[safeNextLevel].color}`,
                                borderRadius: '50%'
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Right: Shop */}
            <div className="flex flex-col items-center gap-1 z-10 w-20">
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Shop</div>
                <Button onClick={onOpenShop} variant="primary" className="h-10 w-10 rounded-full p-0 flex items-center justify-center shadow-lg border border-cyan-400/30">
                    <ShoppingBag size={18} className="text-white" />
                </Button>
            </div>
        </div>
    );
};
