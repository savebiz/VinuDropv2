"use client";

import React, { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { PayEmbed, useActiveAccount } from "thirdweb/react";
import { vinuChain } from "@/lib/chain";
import { client } from "@/app/client";

export function WalletGatewayModal({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'buy' | 'transfer'>('buy');
    const account = useActiveAccount();
    const walletAddress = account?.address || "";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Panel className="w-full max-w-lg relative">
                <button onClick={onClose} className="absolute top-4 right-4 opacity-50 hover:opacity-100">✕</button>

                <h2 className="text-2xl font-bold mb-6">Top Up Wallet</h2>

                <div className="flex gap-2 mb-6">
                    <Button
                        onClick={() => setActiveTab('buy')}
                        variant={activeTab === 'buy' ? 'primary' : 'secondary'}
                        className="flex-1"
                    >
                        Buy Crypto
                    </Button>
                    <Button
                        onClick={() => setActiveTab('transfer')}
                        variant={activeTab === 'transfer' ? 'primary' : 'secondary'}
                        className="flex-1"
                    >
                        Transfer
                    </Button>
                </div>

                <div className="min-h-[300px]">
                    {activeTab === 'buy' ? (
                        <div className="flex justify-center">
                            <PayEmbed
                                client={client}
                                payOptions={{
                                    prefillBuy: {
                                        chain: vinuChain,
                                        amount: "10",
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="text-center space-y-4 flex flex-col items-center">
                            <p className="text-slate-300">Scan to send VinuChain (VC)</p>

                            {/* QR Code Container - Forced White Background */}
                            <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
                                {walletAddress ? (
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${walletAddress}&bgcolor=ffffff&color=000000&margin=0`}
                                        alt="Wallet Address QR"
                                        className="w-48 h-48"
                                    />
                                ) : (
                                    <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-black/50 text-xs">
                                        Wallet not connected
                                    </div>
                                )}
                            </div>

                            <div className="w-full max-w-[250px]">
                                <p className="text-[10px] uppercase tracking-wider opacity-50 mb-1">Your Address</p>
                                <p className="font-mono text-xs bg-black/40 p-3 rounded-lg break-all border border-white/10 select-all">
                                    {walletAddress || "Please connect wallet"}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
}
