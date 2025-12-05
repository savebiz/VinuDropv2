"use client";

import React, { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { PayEmbed } from "thirdweb/react";
import { vinuChain } from "@/lib/chain";
import { client } from "@/app/client"; // We need to create this client file

export function WalletGatewayModal({ onClose }: { onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'buy' | 'transfer'>('buy');

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
                        <div className="text-center space-y-4">
                            <p>Scan to transfer VC</p>
                            <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center text-black">
                                QR Code Placeholder
                            </div>
                            <p className="font-mono text-xs bg-black/20 p-2 rounded break-all">
                                0xYourWalletAddress...
                            </p>
                        </div>
                    )}
                </div>
            </Panel>
        </div>
    );
}
