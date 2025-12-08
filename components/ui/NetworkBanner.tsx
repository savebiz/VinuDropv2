"use client";

import { useActiveWalletChain, useSwitchActiveWalletChain, useDisconnect, useActiveWallet } from "thirdweb/react";
import { AlertCircle, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { activeChain as targetChain } from "@/lib/chain";
import { useState } from "react";

export default function NetworkBanner() {
    const activeChain = useActiveWalletChain();
    const switchChain = useSwitchActiveWalletChain();
    const { disconnect } = useDisconnect();
    const wallet = useActiveWallet();
    const [isSwitching, setIsSwitching] = useState(false);

    // If no chain is connected, or if we are already on the correct chain, don't show banner
    if (!activeChain || activeChain.id === targetChain.id) {
        return null;
    }

    const handleSwitch = async () => {
        setIsSwitching(true);
        try {
            await switchChain(targetChain);
        } catch (error: any) {
            console.error("Failed to switch network:", error);
            alert(`Failed to switch network: ${error.message || "Unknown error"}`);
        } finally {
            setIsSwitching(false);
        }
    };

    const handleDisconnect = () => {
        if (wallet) {
            disconnect(wallet);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-red-600 text-white w-full sticky top-0 z-[100] shadow-lg"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">
                            You are on the wrong network.
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSwitch}
                            disabled={isSwitching}
                            className="bg-white text-red-600 px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSwitching ? "Switching..." : `Switch to ${targetChain.name}`}
                        </button>

                        <button
                            onClick={handleDisconnect}
                            className="bg-red-800 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-red-900 transition-colors flex items-center gap-1"
                            title="Disconnect Wallet"
                        >
                            <LogOut className="w-4 h-4" />
                            Disconnect
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
