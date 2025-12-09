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
        <div className="absolute top-0 left-0 right-0 pointer-events-none flex justify-between items-start p-4 z-40">
            <div className="pointer-events-auto flex flex-col gap-1">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-lg">
                    <span className="text-[10px] uppercase text-cyan-300 font-bold tracking-wider">Score</span>
                    <div className="text-2xl font-mono font-bold text-white leading-none">
                        {safeScore.toLocaleString()}
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
    );
};
