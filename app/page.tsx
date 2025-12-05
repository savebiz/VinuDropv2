"use client";

import React, { useState } from "react";
import { ThirdwebProvider, ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { vinuChain } from "@/lib/chain";
import { ThemeProvider, useTheme } from "@/components/ui/ThemeProvider";
import GameContainer from "@/components/game/GameContainer";
import { Button } from "@/components/ui/Button";
import NetworkBanner from "@/components/ui/NetworkBanner";
import { Moon, Sun } from "lucide-react";

function AppContent() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col">
      <NetworkBanner />
      {/* Header */}
      <header className="p-4 flex justify-between items-center z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center text-black font-bold text-xl shadow-[0_0_15px_cyan]">
            V
          </div>
          <h1 className="text-2xl font-bold tracking-tighter">VinuDrop</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button
            onClick={toggleTheme}
            variant="secondary"
            className="p-2 rounded-full w-10 h-10 flex items-center justify-center"
          >
            {theme === 'cosmic' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>

          <ConnectButton
            client={client}
            chain={vinuChain}
            connectButton={{
              label: "Connect Wallet",
              className: "!bg-cyan-600 !text-white !font-bold !rounded-xl"
            }}
            detailsButton={{
              className: "!bg-white/10 !backdrop-blur-md !border !border-white/10"
            }}
          />
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          {theme === 'cosmic' && (
            <>
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px]" />
            </>
          )}
        </div>

        <GameContainer />
      </main>

      <footer className="p-4 text-center text-xs opacity-50">
        Powered by VinuChain • Built with Next.js & Matter.js
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ThirdwebProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ThirdwebProvider>
  );
}
