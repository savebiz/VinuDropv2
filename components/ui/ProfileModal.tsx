"use client";

import { useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useGameStore } from "@/store/gameStore";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "./Button";
import { X } from "lucide-react";

export default function ProfileModal() {
    const account = useActiveAccount();
    const { username, setUsername } = useGameStore();

    const [isOpen, setIsOpen] = useState(false);
    const [inputName, setInputName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (username) {
            setInputName(username);
        }
    }, [username]);

    const saveProfile = async () => {
        if (!account) return;
        if (!inputName.trim()) {
            setError("Username cannot be empty");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert({
                    wallet_address: account.address,
                    username: inputName.trim(),
                    updated_at: new Date().toISOString()
                });

            if (upsertError) {
                // Check for uniqueness violation
                if (upsertError.code === '23505') {
                    throw new Error("Username already taken");
                }
                throw upsertError;
            }

            setUsername(inputName.trim());
            setIsOpen(false);
        } catch (err: any) {
            console.error("Error saving profile:", err);
            setError(err.message || "Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    if (!account) return null;

    return (
        <>
            <Button
                variant="secondary"
                onClick={() => setIsOpen(true)}
                className="text-xs px-2 py-1 bg-white/5 border border-white/10 w-full mb-2 flex items-center justify-center gap-2"
            >
                {username ? `👤 ${username}` : "👤 Set Username"}
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1b26] border border-cyan-500/30 p-6 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,255,255,0.1)] relative">
                        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <X size={20} />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2">Player Profile</h2>
                        <p className="text-white/60 text-sm mb-6">Set your username to appear on the leaderboard.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-cyan-400 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={inputName}
                                    onChange={(e) => setInputName(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="Enter username..."
                                    maxLength={15}
                                />
                                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                            </div>

                            <Button onClick={saveProfile} disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500">
                                {loading ? "Saving..." : "Save Profile"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
