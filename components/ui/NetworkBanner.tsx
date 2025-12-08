"use client";

import { useActiveWalletChain, useSwitchActiveWalletChain } from "thirdweb/react";
import { defineChain } from "thirdweb";
import { AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Define VinuChain
const VINU_CHAIN = defineChain(207);

export default function NetworkBanner() {
    const activeChain = useActiveWalletChain();
    const switchChain = useSwitchActiveWalletChain();

    // If no chain is connected, or if we are already on VinuChain (207), don't show banner
    if (!activeChain || activeChain.id === 207) {
        return null;
    }

    const handleSwitch = async () => {
        try {
            await switchChain(VINU_CHAIN);
        } catch (error) {
            console.error("Failed to switch network:", error);
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
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">
                        You are on the wrong network.
                    </span>
                    <button
                        onClick={handleSwitch}
                        className="bg-white text-red-600 px-4 py-1 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors"
                    >
                        Switch to VinuChain
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
