import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DailyRewardButton } from '@/components/game/DailyRewardButton';

interface MobileTopHUDProps {
    onOpenLeaderboard: () => void;
}

export const MobileTopHUD = ({ onOpenLeaderboard }: MobileTopHUDProps) => {
    const { score } = useGameStore();

    // Safety checks for rendering
    const safeScore = (score !== undefined && score !== null) ? score : 0;

    return (
        <div className="w-full flex justify-between items-start p-2 z-40 bg-transparent">
            <div className="pointer-events-auto flex flex-col gap-1">
                <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 shadow-lg">
                    <span className="text-[9px] uppercase text-cyan-300 font-bold tracking-wider">Score</span>
                    <div className="text-xl font-mono font-bold text-white leading-none">
                        {safeScore.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="pointer-events-auto flex gap-2 items-start">
                {/* Daily Reward - Compact */}
                <div className="scale-75 origin-top-right -mr-2">
                    <DailyRewardButton />
                </div>

                <Button onClick={onOpenLeaderboard} variant="secondary" className="w-8 h-8 p-0 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/10">
                    <BarChart2 size={16} className="text-white" />
                </Button>
            </div>
        </div>
    );
};
