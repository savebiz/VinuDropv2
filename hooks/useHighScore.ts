"use client";

import { useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useGameStore } from "@/store/gameStore";
import { supabase } from "@/lib/supabaseClient";

export function useHighScore() {
    const account = useActiveAccount();
    const { setHighScore, setUsername } = useGameStore();

    useEffect(() => {
        if (!account) {
            setHighScore(0);
            setUsername("");
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch High Score
                const { data: scoreData, error: scoreError } = await supabase
                    .from("game_scores")
                    .select("score")
                    .ilike("wallet_address", account.address)
                    .order("score", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (scoreData) {
                    setHighScore(scoreData.score);
                } else {
                    setHighScore(0);
                }

                // Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from("profiles")
                    .select("username")
                    .eq("wallet_address", account.address)
                    .single();

                if (profileData) {
                    setUsername(profileData.username);
                } else {
                    setUsername("");
                }

            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };

        fetchData();
    }, [account, setHighScore, setUsername]);
}
