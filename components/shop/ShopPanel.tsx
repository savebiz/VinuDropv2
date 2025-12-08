

"use client";

import React from "react";
import { Panel } from "@/components/ui/Panel";
import { useGameStore } from "@/store/gameStore";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall, toWei } from "thirdweb";
import { VINU_ECONOMY_CONTRACT_ADDRESS } from "@/lib/constants";
import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { HeartPulse, Zap, Target } from "lucide-react";

const vinuchain = defineChain(207);

const contract = getContract({
    client,
    chain: vinuchain,
    address: VINU_ECONOMY_CONTRACT_ADDRESS,
});

export function ShopPanel() {
    const { addShakes, addStrikes, triggerRevive } = useGameStore();

    const buyItem = (itemName: string, price: string) => {
        return prepareContractCall({
            contract,
            method: "function buyItem(string item) payable",
            params: [itemName],
            value: toWei(price),
        });
    };

    return (
        <Panel className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                Shop <span className="text-xs font-normal opacity-50">(Support the Dev & Burn VC)</span>
            </h2>
            <div className="space-y-4">
                {/* Shake */}
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                            <Zap size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">Shake (x5)</h3>
                            <p className="text-xs opacity-70">Jolt the board to unstuck orbs.</p>
                        </div>
                    </div>
                    <TransactionButton
                        transaction={() => buyItem("shake", "200")}
                        onTransactionConfirmed={() => {
                            addShakes(5);
                            alert("Purchased 5 Shakes!");
                        }}
                        className="!bg-blue-600 !text-white !text-sm !py-2 !px-4 !min-w-[100px]"
                    >
                        200 VC
                    </TransactionButton>
                </div>

                {/* Precision Strike */}
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-500/20 p-2 rounded-lg text-red-400">
                            <Target size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">Precision Strike</h3>
                            <p className="text-xs opacity-70">Remove a single orb (Coming Soon).</p>
                        </div>
                    </div>
                    <TransactionButton
                        transaction={() => buyItem("strike", "1000")}
                        onTransactionConfirmed={() => {
                            addStrikes(1);
                            alert("Purchased 1 Precision Strike!");
                        }}
                        className="!bg-red-600 !text-white !text-sm !py-2 !px-4 !min-w-[100px]"
                    >
                        1000 VC
                    </TransactionButton>
                </div>

                {/* Revive */}
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-lg text-green-400">
                            <HeartPulse size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold">Halve Protocol</h3>
                            <p className="text-xs opacity-70">Remove top 50% of orbs. Instant.</p>
                        </div>
                    </div>
                    <TransactionButton
                        transaction={() => buyItem("revive", "500")}
                        onTransactionConfirmed={() => {
                            triggerRevive();
                            alert("Halve Protocol Activated!");
                        }}
                        className="!bg-green-600 !text-white !text-sm !py-2 !px-4 !min-w-[100px]"
                    >
                        500 VC
                    </TransactionButton>
                </div>
            </div>
        </Panel>
    );
}
