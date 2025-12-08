import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Settings, BarChart2, ShoppingBag, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ORB_LEVELS } from '@/lib/constants';
import { useActiveAccount } from 'thirdweb/react';
import { DailyRewardButton } from '@/components/game/DailyRewardButton';

interface MobileHUDProps {
    onOpenShop: () => void;
    onOpenLeaderboard: () => void;
    // We can expand this with more props if needed (e.g., settings)
}

export const MobileHUD = ({ onOpenShop, onOpenLeaderboard }: MobileHUDProps) => {
    const { score, nextOrbLevel, highScore, _hasHydrated } = useGameStore();
    const account = useActiveAccount();

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-50">
            {/* Top Row: Score & Utility */}
            <div className="flex justify-between items-start">
                <div className="pointer-events-auto flex flex-col gap-1">
                    <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                        <span className="text-[10px] uppercase text-cyan-300 font-bold tracking-wider">Score</span>
                        <div className="text-2xl font-mono font-bold text-white leading-none">
                            {score.toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="pointer-events-auto flex gap-2">
                    {/* Daily Reward - Compact */}
                    <div className="scale-90 origin-top-right">
                        <DailyRewardButton />
                    </div>

                    <Button onClick={onOpenLeaderboard} variant="secondary" className="w-10 h-10 p-0 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10">
                        <BarChart2 size={20} className="text-white" />
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Controls & Next Orb */}
            <div className="flex justify-between items-end">
                {/* High Score (Left Bottom) */}
                <div className="pointer-events-auto bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 mx-1 mb-1">
                    <span className="text-[10px] text-yellow-500 font-bold flex items-center gap-1">
                        <Trophy size={10} /> BEST: {account ? highScore.toLocaleString() : 0}
                    </span>
                </div>

                {/* Center: Next Orb Indicator */}
                <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-1 drop-shadow-md">Next</div>
                    <div className="w-16 h-16 bg-black/30 backdrop-blur-sm rounded-full border border-white/10 flex items-center justify-center shadow-2xl ring-2 ring-white/5">
                        {_hasHydrated && ORB_LEVELS[nextOrbLevel] && (
                            <div
                                style={{
                                    width: ORB_LEVELS[nextOrbLevel].radius * 2 * 0.8, // Slightly scaled down for HUD
                                    height: ORB_LEVELS[nextOrbLevel].radius * 2 * 0.8,
                                    backgroundColor: ORB_LEVELS[nextOrbLevel].color,
                                    boxShadow: `0 0 10px ${ORB_LEVELS[nextOrbLevel].color}`,
                                    borderRadius: '50%'
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Right Bottom: Shop */}
                <div className="pointer-events-auto pb-1">
                    <Button onClick={onOpenShop} variant="primary" className="h-12 w-12 rounded-full p-0 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] border-2 border-cyan-400/50 relative overflow-visible group">
                        <ShoppingBag size={24} className="text-white drop-shadow-md group-active:scale-95 transition-transform" />
                        {/* Notification dot example */}
                        {/* <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border border-black"></span> */}
                    </Button>
                </div>
            </div>
        </div>
    );
};
