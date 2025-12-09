

"use client";

import React from "react";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { VINU_ECONOMY_CONTRACT_ADDRESS } from "@/lib/constants";
import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { HeartPulse, Zap, Target, X } from "lucide-react";
import { useTheme } from "@/components/ui/ThemeProvider";

const vinuchain = defineChain(207);

const contract = getContract({
    client,
    chain: vinuchain,
    address: VINU_ECONOMY_CONTRACT_ADDRESS,
});

interface ShopPanelProps {
    onClose?: () => void;
}

export function ShopPanel({ onClose }: ShopPanelProps) {
    const {
        addShakes,
        addStrikes,
        triggerRevive,
        freeShakes,
        freeStrikes,
        consumeFreeShake,
        consumeFreeStrike,
        isGameOver
    } = useGameStore();

    const { theme } = useTheme();
    const isDark = theme === 'cosmic';

    const buyItem = (itemName: string, price: string) => {
        return prepareContractCall({
            contract,
            method: "function buyItem(string item) payable",
            params: [itemName],
            value: toWei(price),
        });
    };

    return (
        <Panel className={`w-full max-w-md mx-auto relative transition-colors duration-300
            ${isDark ? '' : '!bg-white !border-slate-200 !shadow-2xl'}`}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Shop <span className={`text-xs font-normal ${isDark ? 'opacity-50' : 'text-slate-500'} `}>(Support the Dev & Burn VC)</span>
                </h2>
                {onClose && (
                    <button onClick={onClose} className={`transition-colors ${isDark ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>
                        <X size={24} />
                    </button>
                )}
            </div>
            <div className="space-y-4">
                {/* Shake - Disabled if Game Over */}
                <div className={`flex justify-between items-center p-3 rounded-lg border transition-all 
                    ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                    ${isGameOver ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Shake Reactor (x5)</h3>
                            <p className={`text-xs ${isDark ? 'opacity-70 text-white' : 'text-slate-500'}`}>Jolt the board to unstuck orbs.</p>
                        </div>
                    </div>
                    {freeShakes > 0 ? (
                        <button
                            disabled={isGameOver}
                            onClick={() => {
                                if (consumeFreeShake()) {
                                    addShakes(5);
                                    alert("Used Daily Free Shake! (Added 5 Shakes)");
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors min-w-[100px]"
                        >
                            Free (1/1)
                        </button>
                    ) : (
                        <TransactionButton
                            disabled={isGameOver}
                            transaction={() => buyItem("shake", "200")}
                            onTransactionConfirmed={() => {
                                addShakes(5);
                                alert("Purchased 5 Shakes!");
                            }}
                            className="!bg-blue-600 !text-white !text-sm !py-2 !px-4 !min-w-[100px]"
                        >
                            200 VC
                        </TransactionButton>
                    )}
                </div>

                {/* Precision Strike - Disabled if Game Over */}
                <div className={`flex justify-between items-center p-3 rounded-lg border transition-all 
                    ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                    ${isGameOver ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Precision Laser (x2)</h3>
                            <p className={`text-xs ${isDark ? 'opacity-70 text-white' : 'text-slate-500'}`}>Click to delete orb.</p>
                        </div>
                    </div>
                    {freeStrikes > 0 ? (
                        <button
                            disabled={isGameOver}
                            onClick={() => {
                                if (consumeFreeStrike()) {
                                    addStrikes(2);
                                    alert("Used Daily Free Laser! (Added 2 Lasers)");
                                }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors min-w-[100px]"
                        >
                            Free (1/1)
                        </button>
                    ) : (
                        <TransactionButton
                            disabled={isGameOver}
                            transaction={() => buyItem("strike", "250")}
                            onTransactionConfirmed={() => {
                                addStrikes(2);
                                alert("Purchased 2 Precision Lasers!");
                            }}
                            className="!bg-red-600 !text-white !text-sm !py-2 !px-4 !min-w-[100px]"
                        >
                            250 VC
                        </TransactionButton>
                    )}
                </div>

                {/* Revive - Disabled if Game Active (NOT Game Over) */}
                <div className={`flex justify-between items-center p-3 rounded-lg border transition-all 
                    ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                    ${!isGameOver ? 'opacity-40 grayscale pointer-events-none' : ''}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                            <HeartPulse size={20} />
                        </div>
                        <div>
                            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Revive Protocol</h3>
                            <p className={`text-xs ${isDark ? 'opacity-70 text-white' : 'text-slate-500'}`}>Remove top 50% of orbs. Instant.</p>
                        </div>
                    </div>
                    <TransactionButton
                        disabled={!isGameOver}
                        transaction={() => buyItem("revive", "1000")}
                        onTransactionConfirmed={() => {
                            triggerRevive();
                            alert("Revive Protocol Activated!");
                        }}
                        className="!bg-green-600 !text-white !text-sm !py-2 !px-4 !min-w-[100px]"
                    >
                        1000 VC
                    </TransactionButton>
                </div>
            </div>
        </Panel>
    );
}
