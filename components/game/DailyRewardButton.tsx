"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useTimeUntilUtcMidnight } from "@/hooks/useTimeUntilUtcMidnight";
import { supabase } from "@/lib/supabaseClient";
import { Gift, Loader2 } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";

interface DailyRewardButtonProps {
    onRewardClaimed?: () => void;
}

export function DailyRewardButton({ onRewardClaimed }: DailyRewardButtonProps) {
    const account = useActiveAccount();
    const { formattedTime } = useTimeUntilUtcMidnight();
    const [loading, setLoading] = useState(false);
    const [jitterWait, setJitterWait] = useState(false);

    // We can't robustly know if they claimed without checking DB. 
    // For now, we rely on the RPC to tell us "Already Claimed" if they try.
    // Ideally we would fetch this on mount.
    const [lastClaimedDate, setLastClaimedDate] = useState<string | null>(null);

    const handleClaim = async () => {
        if (!account) return;

        setLoading(true);

        try {
            // Jitter for spam protection
            const jitterMs = Math.floor(Math.random() * 2000);
            if (jitterMs > 500) {
                setJitterWait(true);
                await new Promise(resolve => setTimeout(resolve, jitterMs));
                setJitterWait(false);
            }

            const { data, error } = await supabase.rpc('claim_daily_reward', {
                target_wallet: account.address
            });

            if (error) throw error;

            // @ts-ignore
            if (data && data.success) {
                // @ts-ignore
                const newStreak = data.new_streak;
                alert(`Daily Reward Claimed! Streak: ${newStreak} 🔥`);

                // Mark as claimed locally for this session
                setLastClaimedDate(new Date().toISOString().split('T')[0]);

                if (onRewardClaimed) onRewardClaimed();
            } else {
                // @ts-ignore
                alert(`Claim Status: ${data.error || 'Unknown'}`);
            }

        } catch (err: any) {
            console.error(err);
            alert("Failed to claim reward. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const hasClaimedLocally = lastClaimedDate === todayStr;
    const isReady = account && !hasClaimedLocally;

    return (
        <div className="flex flex-col items-center">
            <Button
                onClick={handleClaim}
                disabled={loading || !isReady}
                className={`flex items-center gap-2 ${!isReady ? 'opacity-50' : 'animate-pulse'}`}
                variant={!isReady ? "secondary" : "primary"}
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Gift size={16} />}
                {loading ? (jitterWait ? "Queuing..." : "Claiming...") : (hasClaimedLocally ? "Claimed" : "Daily Reward")}
            </Button>

            <div className="text-xs font-mono opacity-50 mt-1">
                Reset in: {formattedTime}
            </div>
        </div>
    );
}
