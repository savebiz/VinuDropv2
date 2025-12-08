"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useTimeUntilUtcMidnight } from "@/hooks/useTimeUntilUtcMidnight";
import { supabase } from "@/lib/supabaseClient";
import { Gift, Loader2 } from "lucide-react";
import { useActiveAccount } from "thirdweb/react";
import { useGameStore } from "@/store/gameStore";

interface DailyRewardButtonProps {
    onRewardClaimed?: () => void;
}

export function DailyRewardButton({ onRewardClaimed }: DailyRewardButtonProps) {
    const account = useActiveAccount();
    const { formattedTime } = useTimeUntilUtcMidnight();
    const [loading, setLoading] = useState(false);
    const [jitterWait, setJitterWait] = useState(false);

    // Use persistent state instead of local state
    const {
        checkDailyFreebieReset,
        addShakes,
        addStrikes,
        lastDailyRewardClaimDate,
        setLastDailyRewardClaimDate
    } = useGameStore();

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

                // Grant Rewards (1 Shake, 1 Laser)
                addShakes(1);
                addStrikes(1);

                // Mark as claimed persistantly for this wallet
                setLastDailyRewardClaimDate(account.address, new Date().toISOString().split('T')[0]);

                if (onRewardClaimed) onRewardClaimed();
            } else {
                // Check if error is "Already claimed"
                // @ts-ignore
                const errorMessage = data.error || 'Unknown';

                if (errorMessage.includes("Already claimed") || errorMessage.includes("already claimed")) {
                    alert("Status: You have already claimed today's reward.");
                    // Update local state so button disables instantly and stays disabled
                    setLastDailyRewardClaimDate(account.address, new Date().toISOString().split('T')[0]);
                } else {
                    alert(`Claim Status: ${errorMessage}`);
                }
            }

        } catch (err: any) {
            console.error(err);
            alert("Failed to claim reward. Try again.");
        } finally {
            setLoading(false);
        }
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // Check if THIS account has claimed
    const hasClaimedLocally =
        account &&
        lastDailyRewardClaimDate &&
        lastDailyRewardClaimDate[account.address] === todayStr;

    const isReady = account && !hasClaimedLocally;

    // Check for timer reset
    // This is safe now because checkDailyFreebieReset checks the date internally.
    // So even if this fires on mount with "00:00:00", it won't reset unless the date actually changed.
    useEffect(() => {
        if (formattedTime === "00:00:00" || formattedTime === "0h 0m 0s") { // Check formats depending on hook output
            checkDailyFreebieReset();
        }
    }, [formattedTime, checkDailyFreebieReset]);

    // Force check on mount as well to handle "refresh" case
    useEffect(() => {
        checkDailyFreebieReset();
    }, [checkDailyFreebieReset]);

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
