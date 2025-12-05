"use client";

import React from "react";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";

export function ShopPanel() {
    return (
        <Panel className="w-full max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Shop</h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                        <h3 className="font-bold">Shake Power-Up</h3>
                        <p className="text-xs opacity-70">Shake the board!</p>
                    </div>
                    <Button variant="secondary" className="text-sm py-1 px-3">Buy (10 VC)</Button>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                        <h3 className="font-bold">Destroy Orb</h3>
                        <p className="text-xs opacity-70">Remove one orb.</p>
                    </div>
                    <Button variant="secondary" className="text-sm py-1 px-3">Buy (50 VC)</Button>
                </div>
            </div>
        </Panel>
    );
}
