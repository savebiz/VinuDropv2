"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useActiveAccount } from "thirdweb/react";
import { useGameStore } from "@/store/gameStore";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "./Button";
import { X } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const account = useActiveAccount();
    const { username, setUsername } = useGameStore();
    const { theme } = useTheme();

    const [inputName, setInputName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDark = theme === 'cosmic';

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
            onClose();
        } catch (err: any) {
            console.error("Error saving profile:", err);
            setError(err.message || "Failed to save profile");
        } finally {
            setLoading(false);
        }
    };

    if (!account) return null;
    if (!isOpen) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={`fixed inset-0 z-[160] flex items-center justify-center backdrop-blur-sm p-4 transition-colors duration-300
            ${isDark ? 'bg-black/80' : 'bg-white/60'}`}
        >
            <div className={`border p-6 rounded-2xl w-full max-w-md relative transition-all duration-300
                ${isDark
                    ? 'bg-[#1a1b26] border-cyan-500/30 shadow-[0_0_50px_rgba(0,255,255,0.1)]'
                    : 'bg-white border-slate-200 shadow-2xl text-slate-900'
                }`}
            >
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 transition-colors
                        ${isDark ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                >
                    <X size={20} />
                </button>

                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Player Profile
                </h2>
                <p className={`text-sm mb-6 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                    Set your username to appear on the leaderboard.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className={`block text-xs uppercase font-bold mb-1 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            className={`w-full rounded-lg p-3 focus:outline-none focus:border-cyan-500 transition-colors border
                                ${isDark
                                    ? 'bg-black/40 border-white/10 text-white'
                                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                                }`}
                            placeholder="Enter username..."
                            maxLength={15}
                        />
                        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
                    </div>

                    <Button onClick={saveProfile} disabled={loading} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                        {loading ? "Saving..." : "Save Profile"}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
