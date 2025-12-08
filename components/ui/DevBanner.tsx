"use client";

import React from "react";
import { activeChain } from "@/lib/chain";

export default function DevBanner() {
    if (!activeChain.testnet) return null;

    return (
        <div className="fixed top-0 left-0 right-0 h-8 bg-orange-500 text-black font-bold flex items-center justify-center z-[100] text-sm shadow-md">
            ⚠️ TEST MODE - Using Testnet VC & Staging DB
        </div>
    );
}
